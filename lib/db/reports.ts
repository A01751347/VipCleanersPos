import 'server-only';
import { query } from './client';
import { getZonaHoraria } from './config';

export async function getEstadisticasDashboard() {
  const tz = await getZonaHoraria();
  const [stats] = await query<any>(
    `SELECT
       (SELECT COUNT(*) FROM ordenes WHERE NOT cancelada)::int AS total_ordenes,
       (SELECT COUNT(*) FROM ordenes
         WHERE NOT cancelada AND (fecha_recepcion AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date)::int AS ordenes_hoy,
       (SELECT COUNT(*) FROM ordenes o
         JOIN estados_servicio e ON e.estado_id = o.estado_actual_id
         WHERE NOT o.cancelada AND NOT e.es_final)::int AS ordenes_activas,
       (SELECT COUNT(*) FROM ordenes o
         JOIN estados_servicio e ON e.estado_id = o.estado_actual_id
         WHERE NOT o.cancelada AND NOT e.es_final
           AND o.fecha_entrega_estimada < now())::int AS ordenes_retrasadas,
       (SELECT COALESCE(SUM(monto), 0) FROM pagos
         WHERE estado = 'completado'
           AND (fecha_pago AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date)::numeric AS ingresos_hoy,
       (SELECT COALESCE(SUM(monto), 0) FROM pagos
         WHERE estado = 'completado'
           AND (fecha_pago AT TIME ZONE $1) >= date_trunc('month', now() AT TIME ZONE $1))::numeric AS ingresos_mes,
       (SELECT COALESCE(SUM(total - COALESCE((
           SELECT SUM(monto) FROM pagos p
           WHERE p.orden_id = o.orden_id AND p.estado = 'completado'), 0)), 0)
         FROM ordenes o WHERE NOT o.cancelada AND o.estado_pago <> 'pagado')::numeric AS por_cobrar,
       (SELECT COUNT(*) FROM clientes WHERE activo)::int AS total_clientes,
       (SELECT COUNT(*) FROM clientes
         WHERE (fecha_creacion AT TIME ZONE $1) >= date_trunc('month', now() AT TIME ZONE $1))::int AS clientes_nuevos_mes,
       (SELECT COUNT(*) FROM mensajes_contacto WHERE NOT esta_leido)::int AS mensajes_sin_leer,
       (SELECT COUNT(*) FROM productos WHERE activo AND stock <= stock_minimo)::int AS productos_stock_bajo,
       (SELECT COUNT(*) FROM detalles_orden_servicios d
         JOIN ordenes o ON o.orden_id = d.orden_id
         JOIN estados_servicio e ON e.estado_id = o.estado_actual_id
         WHERE d.codigo_ubicacion IS NULL AND NOT o.cancelada AND NOT e.es_final
           AND (d.marca IS NOT NULL OR d.modelo IS NOT NULL))::int AS pares_sin_ubicar`,
    [tz]
  );

  const [serviciosPopulares, productosPopulares, entregasHoy, idPendiente] = await Promise.all([
    query(`SELECT * FROM vw_servicios_populares LIMIT 5`),
    query(`SELECT * FROM vw_productos_populares LIMIT 5`),
    query(`SELECT * FROM vw_ordenes_entrega_hoy LIMIT 20`),
    query(`SELECT * FROM vw_ordenes_id_pendiente LIMIT 10`),
  ]);

  return {
    ...stats,
    serviciosPopulares,
    productosPopulares,
    entregasHoy,
    identificacionPendiente: idPendiente,
  };
}

/** Ventas por día de los últimos N días, con los días sin ventas en cero. */
export async function getVentasSemanales(dias = 7) {
  const tz = await getZonaHoraria();
  return query(
    `WITH hoy AS (SELECT (now() AT TIME ZONE $2)::date AS d)
     SELECT s.dia::date                    AS fecha,
            to_char(s.dia, 'TMDy')         AS etiqueta,
            COALESCE(v.ordenes, 0)::int    AS ordenes,
            COALESCE(v.total, 0)::numeric  AS total
     FROM hoy,
          generate_series(hoy.d - ($1::int - 1), hoy.d, interval '1 day') AS s(dia)
     LEFT JOIN (
       SELECT (fecha_recepcion AT TIME ZONE $2)::date AS dia,
              COUNT(*) AS ordenes, SUM(total) AS total
       FROM ordenes WHERE NOT cancelada
       GROUP BY 1
     ) v ON v.dia = s.dia::date
     ORDER BY s.dia`,
    [dias, tz]
  );
}

export type Agrupacion = 'day' | 'week' | 'month';

export async function getReporteVentas(args: {
  desde: string; hasta: string; agrupacion?: Agrupacion;
}) {
  const unidad = args.agrupacion === 'month' ? 'month' : args.agrupacion === 'week' ? 'week' : 'day';
  const tz = await getZonaHoraria();

  const porPeriodo = await query(
    `SELECT date_trunc($3, fecha_recepcion AT TIME ZONE $4)::date AS periodo,
            COUNT(*)::int                          AS ordenes,
            COALESCE(SUM(subtotal), 0)::numeric    AS subtotal,
            COALESCE(SUM(descuento), 0)::numeric   AS descuento,
            COALESCE(SUM(impuestos), 0)::numeric   AS impuestos,
            COALESCE(SUM(total), 0)::numeric       AS total,
            COALESCE(AVG(total), 0)::numeric       AS ticket_promedio
     FROM ordenes
     WHERE NOT cancelada
       AND (fecha_recepcion AT TIME ZONE $4)::date BETWEEN $1::date AND $2::date
     GROUP BY 1 ORDER BY 1`,
    [args.desde, args.hasta, unidad, tz]
  );

  const porServicio = await query(
    `SELECT s.nombre AS servicio, COUNT(*)::int AS pares,
            COALESCE(SUM(d.subtotal), 0)::numeric AS total
     FROM detalles_orden_servicios d
     JOIN servicios s ON s.servicio_id = d.servicio_id
     JOIN ordenes o   ON o.orden_id = d.orden_id
     WHERE NOT o.cancelada
       AND (o.fecha_recepcion AT TIME ZONE $3)::date BETWEEN $1::date AND $2::date
     GROUP BY s.nombre ORDER BY total DESC`,
    [args.desde, args.hasta, tz]
  );

  const porProducto = await query(
    `SELECT p.nombre AS producto, COALESCE(SUM(d.cantidad), 0)::int AS unidades,
            COALESCE(SUM(d.subtotal), 0)::numeric AS total
     FROM detalles_orden_productos d
     JOIN productos p ON p.producto_id = d.producto_id
     JOIN ordenes o   ON o.orden_id = d.orden_id
     WHERE NOT o.cancelada
       AND (o.fecha_recepcion AT TIME ZONE $3)::date BETWEEN $1::date AND $2::date
     GROUP BY p.nombre ORDER BY total DESC`,
    [args.desde, args.hasta, tz]
  );

  const [totales] = await query<any>(
    `SELECT COUNT(*)::int AS ordenes,
            COALESCE(SUM(subtotal), 0)::numeric  AS subtotal,
            COALESCE(SUM(descuento), 0)::numeric AS descuento,
            COALESCE(SUM(impuestos), 0)::numeric AS impuestos,
            COALESCE(SUM(total), 0)::numeric     AS total,
            COALESCE(AVG(total), 0)::numeric     AS ticket_promedio
     FROM ordenes
     WHERE NOT cancelada
       AND (fecha_recepcion AT TIME ZONE $3)::date BETWEEN $1::date AND $2::date`,
    [args.desde, args.hasta, tz]
  );

  return { porPeriodo, porServicio, porProducto, totales, desde: args.desde, hasta: args.hasta };
}

export async function getReporteEmpleados(args: { desde: string; hasta: string }) {
  const tz = await getZonaHoraria();
  return query(
    `SELECT e.empleado_id,
            NULLIF(TRIM(CONCAT_WS(' ', e.nombre, e.apellidos)), '') AS empleado,
            e.puesto,
            COALESCE(o.ordenes, 0)::int        AS ordenes_recibidas,
            COALESCE(o.total, 0)::numeric      AS total_vendido,
            COALESCE(p.pagos, 0)::int          AS pagos_registrados,
            COALESCE(p.monto, 0)::numeric      AS monto_cobrado,
            COALESCE(h.cambios, 0)::int        AS cambios_de_estado
     FROM empleados e
     LEFT JOIN (
       SELECT empleado_recepcion_id AS eid, COUNT(*) AS ordenes, SUM(total) AS total
       FROM ordenes WHERE NOT cancelada
         AND (fecha_recepcion AT TIME ZONE $3)::date BETWEEN $1::date AND $2::date
       GROUP BY 1
     ) o ON o.eid = e.empleado_id
     LEFT JOIN (
       SELECT empleado_id AS eid, COUNT(*) AS pagos, SUM(monto) AS monto
       FROM pagos WHERE estado = 'completado'
         AND (fecha_pago AT TIME ZONE $3)::date BETWEEN $1::date AND $2::date
       GROUP BY 1
     ) p ON p.eid = e.empleado_id
     LEFT JOIN (
       SELECT empleado_id AS eid, COUNT(*) AS cambios
       FROM historial_estados
       WHERE (fecha_cambio AT TIME ZONE $3)::date BETWEEN $1::date AND $2::date
       GROUP BY 1
     ) h ON h.eid = e.empleado_id
     WHERE e.activo
     ORDER BY total_vendido DESC`,
    [args.desde, args.hasta, tz]
  );
}

export async function getMejoresClientes(args: { desde: string; hasta: string; limite?: number }) {
  const tz = await getZonaHoraria();
  return query(
    `SELECT c.cliente_id,
            NULLIF(TRIM(CONCAT_WS(' ', c.nombre, c.apellidos)), '') AS cliente,
            c.telefono, c.email,
            COUNT(o.orden_id)::int                 AS ordenes,
            COALESCE(SUM(o.total), 0)::numeric     AS total_gastado,
            COALESCE(AVG(o.total), 0)::numeric     AS ticket_promedio,
            MAX(o.fecha_recepcion)                 AS ultima_orden
     FROM clientes c
     JOIN ordenes o ON o.cliente_id = c.cliente_id AND NOT o.cancelada
     WHERE (o.fecha_recepcion AT TIME ZONE $4)::date BETWEEN $1::date AND $2::date
     GROUP BY c.cliente_id, c.nombre, c.apellidos, c.telefono, c.email
     ORDER BY total_gastado DESC
     LIMIT $3`,
    [args.desde, args.hasta, args.limite ?? 20, tz]
  );
}
