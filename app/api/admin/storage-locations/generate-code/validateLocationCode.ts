import { executeQuery } from '@/lib/db';

export async function validateLocationCode(codigo: string): Promise<{
  valido: boolean;
  disponible: boolean;
  mensaje: string;
  sugerencias?: string[];
}> {
  try {
    if (!codigo || codigo.trim().length === 0) {
      return {
        valido: false,
        disponible: false,
        mensaje: 'El código no puede estar vacío'
      };
    }

    const codigoTrimmed = codigo.trim().toUpperCase();
    const formatoRegex = /^EST[A-Z]-F\d+-P\d+(-\d+)?$/;

    if (!formatoRegex.test(codigoTrimmed)) {
      return {
        valido: false,
        disponible: false,
        mensaje: 'Formato inválido. Use: EST[LETRA]-F[NUMERO]-P[POSICION]',
        sugerencias: ['ESTA-F1-P1', 'ESTB-F2-P3', 'ESTC-F1-P2']
      };
    }

    const codigoEnUso = await executeQuery<any[]>({
      query: `
        SELECT 
          dos.detalle_servicio_id,
          o.codigo_orden,
          CONCAT(c.nombre, ' ', c.apellidos) as cliente,
          es.nombre as estado
        FROM detalles_orden_servicios dos
        JOIN ordenes o ON dos.orden_id = o.orden_id
        JOIN clientes c ON o.cliente_id = c.cliente_id
        JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
        WHERE dos.codigo_ubicacion = ? AND es.nombre != 'Entregado'
      `,
      values: [codigoTrimmed]
    });

    if (codigoEnUso.length > 0) {
      const uso = codigoEnUso[0];
      return {
        valido: true,
        disponible: false,
        mensaje: `Código en uso por orden ${uso.codigo_orden} (${uso.cliente}, ${uso.estado})`
      };
    }

    return {
      valido: true,
      disponible: true,
      mensaje: 'Código disponible'
    };

  } catch (error) {
    console.error('Error validando código:', error);
    return {
      valido: false,
      disponible: false,
      mensaje: 'Error al validar el código'
    };
  }
}
