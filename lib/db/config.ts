import 'server-only';
import { query, queryOne, withTransaction, placeholders } from './client';

// La tabla es `configuracion_sistema`. El código anterior consultaba
// `configuracion`, que no existe: cada lectura fallaba y el catch devolvía
// valores por defecto en silencio, así que la pantalla de ajustes parecía
// funcionar pero no leía nada.
const TABLA = 'configuracion_sistema';

const CACHE_TTL_MS = 30_000;
let cache: { valores: Map<string, string>; expira: number } | null = null;

async function cargarTodo(): Promise<Map<string, string>> {
  if (cache && cache.expira > Date.now()) return cache.valores;
  const filas = await query<{ clave: string; valor: string }>(
    `SELECT clave, valor FROM ${TABLA}`
  );
  const valores = new Map(filas.map((f) => [f.clave, f.valor]));
  cache = { valores, expira: Date.now() + CACHE_TTL_MS };
  return valores;
}

export function invalidarCacheConfig(): void {
  cache = null;
}

export async function getConfig(clave: string): Promise<string | null> {
  const valores = await cargarTodo();
  return valores.get(clave) ?? null;
}

export async function getConfigNumero(clave: string, porDefecto: number): Promise<number> {
  const valor = await getConfig(clave);
  if (valor === null) return porDefecto;
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : porDefecto;
}

export async function getConfigBool(clave: string, porDefecto: boolean): Promise<boolean> {
  const valor = await getConfig(clave);
  if (valor === null) return porDefecto;
  return valor === 'true' || valor === '1';
}

export async function getConfigMultiple(claves: string[]): Promise<Record<string, string>> {
  if (claves.length === 0) return {};
  const valores = await cargarTodo();
  const salida: Record<string, string> = {};
  for (const clave of claves) {
    const v = valores.get(clave);
    if (v !== undefined) salida[clave] = v;
  }
  return salida;
}

export async function getTodaLaConfig(): Promise<Record<string, string>> {
  const valores = await cargarTodo();
  return Object.fromEntries(valores);
}

export async function setConfig(clave: string, valor: string, descripcion?: string): Promise<void> {
  await query(
    `INSERT INTO ${TABLA} (clave, valor, descripcion)
     VALUES ($1, $2, $3)
     ON CONFLICT (clave) DO UPDATE
       SET valor = EXCLUDED.valor,
           descripcion = COALESCE(EXCLUDED.descripcion, ${TABLA}.descripcion)`,
    [clave, valor, descripcion ?? null]
  );
  invalidarCacheConfig();
}

export async function setConfigMultiple(entradas: Record<string, string>): Promise<void> {
  const claves = Object.keys(entradas);
  if (claves.length === 0) return;
  await withTransaction(async (client) => {
    for (const clave of claves) {
      await query(
        `INSERT INTO ${TABLA} (clave, valor) VALUES ($1, $2)
         ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor`,
        [clave, entradas[clave]],
        client
      );
    }
  });
  invalidarCacheConfig();
}

/** Tasa de IVA vigente, en porcentaje (16 = 16%). */
export async function getTasaIva(): Promise<number> {
  return getConfigNumero('iva_porcentaje', 16);
}

/** Si los precios del catálogo ya llevan IVA incluido. */
export async function preciosIncluyenIva(): Promise<boolean> {
  return getConfigBool('precios_incluyen_iva', true);
}

/**
 * Zona horaria del negocio.
 *
 * Los reportes se anclan explícitamente a ella con `AT TIME ZONE`, en lugar de
 * confiar en la zona de la sesión de PostgreSQL. En producción la base suele
 * correr en UTC: sin esto, "las ventas de hoy" cambiarían de significado según
 * dónde esté alojada la base, y un corte hecho a las 8 de la noche caería en el
 * día siguiente.
 */
export async function getZonaHoraria(): Promise<string> {
  return (await getConfig('timezone')) ?? 'America/Mexico_City';
}
