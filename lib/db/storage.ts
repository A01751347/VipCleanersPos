import 'server-only';
import { query, queryOne, withTransaction, BusinessError, NotFoundError } from './client';
import { formatearCodigoUbicacion } from './codes';

export interface AsignacionUbicacion {
  detalleServicioId: number;
  ordenId: number;
  cajaAlmacenamiento: string;
  codigoUbicacion?: string | null;
  notasEspeciales?: string | null;
}

/**
 * Asigna ubicaciones físicas a pares, en una sola transacción.
 *
 * La unicidad la garantiza un índice parcial en la base
 * (`ux_ubicacion_ocupada`), no una consulta previa: dos empleados asignando el
 * mismo código a la vez ahora chocan contra la restricción en lugar de pisarse.
 * Y como la ubicación se libera al entregar, los códigos se reutilizan.
 */
export async function asignarUbicaciones(
  asignaciones: AsignacionUbicacion[],
  empleadoId: number
): Promise<Array<{ detalleServicioId: number; codigoUbicacion: string }>> {
  if (!asignaciones.length) throw new BusinessError('No se recibieron ubicaciones.');

  const codigos = asignaciones.map((a) => a.codigoUbicacion?.trim()).filter(Boolean) as string[];
  const duplicados = codigos.filter((c, i) => codigos.indexOf(c) !== i);
  if (duplicados.length) {
    throw new BusinessError(`Códigos repetidos en la solicitud: ${[...new Set(duplicados)].join(', ')}`);
  }

  return withTransaction(async (client) => {
    const resultado: Array<{ detalleServicioId: number; codigoUbicacion: string }> = [];

    for (const a of asignaciones) {
      const caja = a.cajaAlmacenamiento?.trim().toUpperCase();
      if (!caja) throw new BusinessError('Falta la caja de almacenamiento.');

      const detalle = await queryOne<{ codigo_ubicacion: string | null; cancelada: boolean }>(
        `SELECT d.codigo_ubicacion, o.cancelada
         FROM detalles_orden_servicios d
         JOIN ordenes o ON o.orden_id = d.orden_id
         WHERE d.detalle_servicio_id = $1 AND d.orden_id = $2
         FOR UPDATE OF d`,
        [a.detalleServicioId, a.ordenId],
        client
      );
      if (!detalle) {
        throw new NotFoundError(
          `No se encontró el par ${a.detalleServicioId} en la orden ${a.ordenId}.`
        );
      }
      if (detalle.cancelada) throw new BusinessError('La orden está cancelada.');

      const codigo = a.codigoUbicacion?.trim().toUpperCase()
        ?? (await siguienteCodigoLibre(caja, client));

      await query(
        `UPDATE detalles_orden_servicios SET
           caja_almacenamiento = $2, codigo_ubicacion = $3,
           notas_especiales = COALESCE($4, notas_especiales)
         WHERE detalle_servicio_id = $1`,
        [a.detalleServicioId, caja, codigo, a.notasEspeciales?.trim() || null],
        client
      );

      await query(
        `INSERT INTO historial_ubicaciones (
           detalle_servicio_id, orden_id, caja_almacenamiento, codigo_ubicacion,
           notas, accion, empleado_id
         ) VALUES ($1,$2,$3,$4,$5,'asignada',$6)`,
        [a.detalleServicioId, a.ordenId, caja, codigo, a.notasEspeciales?.trim() || null, empleadoId],
        client
      );

      resultado.push({ detalleServicioId: a.detalleServicioId, codigoUbicacion: codigo });
    }

    return resultado;
  });
}

/** Siguiente consecutivo libre dentro de una caja. */
export async function siguienteCodigoLibre(caja: string, client?: any): Promise<string> {
  const cajaNorm = caja.trim().toUpperCase();
  const fila = await queryOne<{ siguiente: number }>(
    `SELECT COALESCE(MAX(
              NULLIF(regexp_replace(codigo_ubicacion, '^.*-', ''), '')::int
            ), 0) + 1 AS siguiente
     FROM detalles_orden_servicios
     WHERE caja_almacenamiento = $1
       AND codigo_ubicacion ~ ('^' || $1 || '-[0-9]+$')`,
    [cajaNorm],
    client
  );
  return formatearCodigoUbicacion(cajaNorm, fila?.siguiente ?? 1);
}

export async function getMapaUbicaciones() {
  return query(
    `SELECT * FROM vw_mapa_ubicaciones ORDER BY caja_almacenamiento, codigo_ubicacion`
  );
}

export async function buscarPorUbicacion(termino: string) {
  const t = `%${(termino ?? '').trim()}%`;
  return query(
    `SELECT * FROM vw_mapa_ubicaciones
     WHERE codigo_ubicacion ILIKE $1 OR caja_almacenamiento ILIKE $1
        OR codigo_orden ILIKE $1 OR marca ILIKE $1 OR modelo ILIKE $1
        OR cliente ILIKE $1 OR cliente_telefono ILIKE $1
     ORDER BY caja_almacenamiento, codigo_ubicacion LIMIT 200`,
    [t]
  );
}

/** Pares que aún no tienen lugar asignado. */
export async function getPendientesDeUbicacion(ordenId?: number | null) {
  const valores: unknown[] = [];
  let filtro = '';
  if (ordenId) {
    valores.push(ordenId);
    filtro = `AND d.orden_id = $${valores.length}`;
  }

  return query(
    `SELECT d.detalle_servicio_id, d.orden_id, o.codigo_orden,
            s.nombre AS servicio_nombre,
            d.marca, d.modelo, d.talla, d.color, d.descripcion_calzado, d.cantidad,
            NULLIF(TRIM(CONCAT_WS(' ', c.nombre, c.apellidos)), '') AS cliente,
            c.telefono, o.fecha_recepcion, es.nombre AS estado_orden
     FROM detalles_orden_servicios d
     JOIN ordenes o           ON o.orden_id = d.orden_id
     JOIN clientes c          ON c.cliente_id = o.cliente_id
     JOIN servicios s         ON s.servicio_id = d.servicio_id
     JOIN estados_servicio es ON es.estado_id = o.estado_actual_id
     WHERE d.codigo_ubicacion IS NULL
       AND (d.marca IS NOT NULL OR d.modelo IS NOT NULL OR d.descripcion_calzado IS NOT NULL)
       AND NOT o.cancelada AND NOT es.es_final
       ${filtro}
     ORDER BY o.fecha_recepcion DESC`,
    valores
  );
}

export async function getEstadisticasAlmacen() {
  const [stats] = await query<any>(
    `SELECT
       COUNT(*) FILTER (WHERE d.codigo_ubicacion IS NOT NULL)::int AS pares_ubicados,
       COUNT(*) FILTER (WHERE d.codigo_ubicacion IS NULL)::int     AS pares_sin_ubicar,
       COUNT(DISTINCT d.caja_almacenamiento)::int                  AS cajas_en_uso,
       COUNT(*) FILTER (
         WHERE d.codigo_ubicacion IS NOT NULL
           AND o.fecha_entrega_estimada < now()
       )::int AS pares_retrasados
     FROM detalles_orden_servicios d
     JOIN ordenes o           ON o.orden_id = d.orden_id
     JOIN estados_servicio es ON es.estado_id = o.estado_actual_id
     WHERE NOT o.cancelada AND NOT es.es_final`
  );

  const porCaja = await query(
    `SELECT caja_almacenamiento AS caja, COUNT(*)::int AS ocupados
     FROM detalles_orden_servicios
     WHERE codigo_ubicacion IS NOT NULL
     GROUP BY caja_almacenamiento ORDER BY caja_almacenamiento`
  );

  return { ...stats, porCaja };
}

/** Mueve un par a otra ubicación, dejando rastro del cambio. */
export async function moverPar(args: {
  detalleServicioId: number;
  cajaAlmacenamiento: string;
  codigoUbicacion?: string | null;
  notasEspeciales?: string | null;
  empleadoId: number;
}) {
  const detalle = await queryOne<{ orden_id: number }>(
    `SELECT orden_id FROM detalles_orden_servicios WHERE detalle_servicio_id = $1`,
    [args.detalleServicioId]
  );
  if (!detalle) throw new NotFoundError('El par no existe.');

  // Se libera primero para que el índice único no choque consigo mismo.
  await query(
    `UPDATE detalles_orden_servicios
     SET caja_almacenamiento = NULL, codigo_ubicacion = NULL
     WHERE detalle_servicio_id = $1`,
    [args.detalleServicioId]
  );

  const [resultado] = await asignarUbicaciones(
    [
      {
        detalleServicioId: args.detalleServicioId,
        ordenId: detalle.orden_id,
        cajaAlmacenamiento: args.cajaAlmacenamiento,
        codigoUbicacion: args.codigoUbicacion,
        notasEspeciales: args.notasEspeciales,
      },
    ],
    args.empleadoId
  );
  return resultado;
}

export async function getHistorialUbicaciones(detalleServicioId: number) {
  return query(
    `SELECT h.*, NULLIF(TRIM(CONCAT_WS(' ', e.nombre, e.apellidos)), '') AS empleado_nombre,
            o.codigo_orden
     FROM historial_ubicaciones h
     LEFT JOIN empleados e ON e.empleado_id = h.empleado_id
     JOIN ordenes o        ON o.orden_id = h.orden_id
     WHERE h.detalle_servicio_id = $1
     ORDER BY h.fecha_asignacion DESC`,
    [detalleServicioId]
  );
}
