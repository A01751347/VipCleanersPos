import 'server-only';
import type { NextRequest } from 'next/server';
import { query } from '../db/client';
import { BusinessError } from '../db/client';

/**
 * Límite de peticiones respaldado por PostgreSQL.
 *
 * No había ninguno: se podía adivinar la contraseña de administrador sin
 * límite, enumerar códigos de orden, y escribir a la base desde internet sin
 * tope. Se resuelve en la propia base para no depender de un servicio externo
 * ni de memoria del proceso, que en serverless no se comparte entre instancias.
 */
export interface ResultadoLimite {
  permitido: boolean;
  restantes: number;
  reintentarEn: number; // segundos
}

export async function consumirLimite(
  llave: string,
  maximo: number,
  ventanaSegundos: number
): Promise<ResultadoLimite> {
  try {
    const filas = await query<{ golpes: number; reintentar_en: number }>(
      `INSERT INTO rate_limit (bucket, golpes, ventana_fin)
       VALUES ($1, 1, now() + ($3 || ' seconds')::interval)
       ON CONFLICT (bucket) DO UPDATE SET
         golpes = CASE
           WHEN rate_limit.ventana_fin < now() THEN 1
           ELSE rate_limit.golpes + 1
         END,
         ventana_fin = CASE
           WHEN rate_limit.ventana_fin < now()
             THEN now() + ($3 || ' seconds')::interval
           ELSE rate_limit.ventana_fin
         END
       RETURNING golpes,
                 GREATEST(0, CEIL(EXTRACT(EPOCH FROM (ventana_fin - now()))))::int AS reintentar_en`,
      [llave, maximo, String(ventanaSegundos)]
    );

    const fila = filas[0];
    const golpes = fila?.golpes ?? 1;
    return {
      permitido: golpes <= maximo,
      restantes: Math.max(0, maximo - golpes),
      reintentarEn: fila?.reintentar_en ?? ventanaSegundos,
    };
  } catch (err) {
    // Si el limitador falla, no se bloquea el negocio: se registra y se deja
    // pasar. Un mostrador detenido cuesta más que una petición de más.
    console.error('[rate-limit] fallo, se permite la petición', err);
    return { permitido: true, restantes: maximo, reintentarEn: 0 };
  }
}

export function ipDe(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'desconocida';
}

/** Aplica el límite y lanza si se excedió. */
export async function aplicarLimite(
  request: NextRequest,
  nombre: string,
  maximo: number,
  ventanaSegundos: number,
  sufijo?: string
): Promise<void> {
  const llave = `${nombre}:${sufijo ?? ipDe(request)}`;
  const r = await consumirLimite(llave, maximo, ventanaSegundos);
  if (!r.permitido) {
    throw new BusinessError(
      `Demasiadas solicitudes. Intenta de nuevo en ${r.reintentarEn} segundos.`,
      429
    );
  }
}

/** Limpia buckets vencidos. Se llama de forma oportunista. */
export async function limpiarLimitesVencidos(): Promise<void> {
  await query(`DELETE FROM rate_limit WHERE ventana_fin < now() - interval '1 hour'`);
}
