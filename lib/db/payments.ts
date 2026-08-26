import 'server-only';
import { query, queryOne, withTransaction, BusinessError, NotFoundError } from './client';
import { registrarPagoInterno, recalcularEstadoPago, type DatosPago } from './orders';
import { aCentavos, aPesos } from './money';
import { getZonaHoraria } from './config';

export async function registrarPago(args: {
  ordenId: number;
  empleadoId: number;
  pago: DatosPago;
}) {
  return withTransaction(async (client) => {
    const pagoId = await registrarPagoInterno(client, {
      ordenId: args.ordenId,
      empleadoId: args.empleadoId,
      pago: args.pago,
    });
    return { pagoId };
  });
}

/**
 * Reembolso: se registra como un pago negativo que apunta al original, en vez
 * de borrar o modificar el pago existente. Así el histórico queda intacto y
 * auditable.
 */
export async function reembolsarPago(args: {
  pagoId: number;
  empleadoId: number;
  monto?: number | null;
  motivo: string;
}) {
  if (!args.motivo?.trim()) throw new BusinessError('Se requiere un motivo para el reembolso.');

  return withTransaction(async (client) => {
    const original = await queryOne<{
      pago_id: number; orden_id: number; monto: number; metodo: string; estado: string;
    }>(
      `SELECT pago_id, orden_id, monto, metodo, estado FROM pagos
       WHERE pago_id = $1 FOR UPDATE`,
      [args.pagoId],
      client
    );
    if (!original) throw new NotFoundError(`El pago ${args.pagoId} no existe.`);
    if (original.estado !== 'completado') {
      throw new BusinessError('Sólo se pueden reembolsar pagos completados.');
    }

    const [{ reembolsado }] = await query<{ reembolsado: number }>(
      `SELECT COALESCE(SUM(ABS(monto)), 0)::numeric AS reembolsado
       FROM pagos WHERE pago_original_id = $1 AND estado = 'completado'`,
      [args.pagoId],
      client
    );

    const disponible = aCentavos(original.monto) - aCentavos(reembolsado);
    const montoCentavos = args.monto != null ? aCentavos(args.monto) : disponible;

    if (montoCentavos <= 0) throw new BusinessError('El monto del reembolso debe ser mayor a cero.');
    if (montoCentavos > disponible) {
      throw new BusinessError(
        `El reembolso excede lo disponible (${aPesos(disponible).toFixed(2)}).`
      );
    }

    const fila = await queryOne<{ pago_id: number }>(
      `INSERT INTO pagos (orden_id, monto, metodo, empleado_id, estado,
                          pago_original_id, motivo, corte_id)
       VALUES ($1, $2, $3::metodo_pago, $4, 'completado', $5, $6,
               (SELECT corte_id FROM cortes_caja
                 WHERE empleado_id = $4 AND estado = 'abierto' LIMIT 1))
       RETURNING pago_id`,
      [
        original.orden_id,
        -aPesos(montoCentavos),
        original.metodo,
        args.empleadoId,
        args.pagoId,
        args.motivo.trim(),
      ],
      client
    );

    await recalcularEstadoPago(client, original.orden_id);
    return { pagoId: fila!.pago_id, monto: aPesos(montoCentavos) };
  });
}

export async function getPagosDeOrden(ordenId: number) {
  return query(
    `SELECT p.*, NULLIF(TRIM(CONCAT_WS(' ', e.nombre, e.apellidos)), '') AS empleado_nombre
     FROM pagos p LEFT JOIN empleados e ON e.empleado_id = p.empleado_id
     WHERE p.orden_id = $1 ORDER BY p.fecha_pago DESC`,
    [ordenId]
  );
}

// =============================================================================
// Corte de caja
// =============================================================================

export async function abrirCaja(empleadoId: number, fondoInicial: number, notas?: string | null) {
  const abierta = await queryOne(
    `SELECT corte_id FROM cortes_caja WHERE empleado_id = $1 AND estado = 'abierto'`,
    [empleadoId]
  );
  if (abierta) throw new BusinessError('Ya tienes una caja abierta. Ciérrala antes de abrir otra.');

  return queryOne(
    `INSERT INTO cortes_caja (empleado_id, fondo_inicial, notas)
     VALUES ($1,$2,$3) RETURNING *`,
    [empleadoId, fondoInicial, notas ?? null]
  );
}

export async function getCajaAbierta(empleadoId: number) {
  return queryOne(
    `SELECT * FROM cortes_caja WHERE empleado_id = $1 AND estado = 'abierto'`,
    [empleadoId]
  );
}

/**
 * Cierra la caja comparando el efectivo contado contra el esperado.
 *
 * El reporte anterior sumaba `o.total` sobre el JOIN de pagos con órdenes: una
 * orden con dos pagos parciales contaba su total dos veces, y no filtraba por
 * estado, así que los reembolsos también sumaban como venta. Aquí se suma
 * `pagos.monto`, que es el importe realmente aplicado, una vez por pago.
 */
export async function cerrarCaja(args: {
  corteId: number;
  empleadoId: number;
  efectivoDeclarado: number;
  notas?: string | null;
}) {
  return withTransaction(async (client) => {
    const corte = await queryOne<{
      corte_id: number; empleado_id: number; estado: string; fondo_inicial: number;
    }>(
      `SELECT corte_id, empleado_id, estado, fondo_inicial FROM cortes_caja
       WHERE corte_id = $1 FOR UPDATE`,
      [args.corteId],
      client
    );
    if (!corte) throw new NotFoundError('El corte no existe.');
    if (corte.estado !== 'abierto') throw new BusinessError('Ese corte ya está cerrado.');

    const [totales] = await query<{ efectivo: number }>(
      `SELECT COALESCE(SUM(monto), 0)::numeric AS efectivo
       FROM pagos
       WHERE corte_id = $1 AND estado = 'completado' AND metodo = 'efectivo'`,
      [args.corteId],
      client
    );

    const esperadoCentavos = aCentavos(corte.fondo_inicial) + aCentavos(totales.efectivo);
    const declaradoCentavos = aCentavos(args.efectivoDeclarado);
    const diferenciaCentavos = declaradoCentavos - esperadoCentavos;

    const cerrado = await queryOne(
      `UPDATE cortes_caja SET
         estado = 'cerrado', cerrado_en = now(), cerrado_por = $2,
         efectivo_declarado = $3, efectivo_esperado = $4, diferencia = $5,
         notas = COALESCE($6, notas)
       WHERE corte_id = $1 RETURNING *`,
      [
        args.corteId,
        args.empleadoId,
        aPesos(declaradoCentavos),
        aPesos(esperadoCentavos),
        aPesos(diferenciaCentavos),
        args.notas ?? null,
      ],
      client
    );

    return cerrado;
  });
}

export async function getResumenCaja(corteId: number) {
  const corte = await queryOne(
    `SELECT c.*, NULLIF(TRIM(CONCAT_WS(' ', e.nombre, e.apellidos)), '') AS empleado_nombre
     FROM cortes_caja c LEFT JOIN empleados e ON e.empleado_id = c.empleado_id
     WHERE c.corte_id = $1`,
    [corteId]
  );
  if (!corte) return null;

  const porMetodo = await query(
    `SELECT metodo,
            COUNT(*)::int AS transacciones,
            COALESCE(SUM(monto), 0)::numeric AS monto,
            COALESCE(SUM(efectivo_recibido), 0)::numeric AS efectivo_recibido,
            COALESCE(SUM(cambio_entregado), 0)::numeric AS cambio_entregado
     FROM pagos WHERE corte_id = $1 AND estado = 'completado'
     GROUP BY metodo ORDER BY monto DESC`,
    [corteId]
  );

  const movimientos = await query(
    `SELECT p.pago_id, p.monto, p.metodo, p.fecha_pago, p.motivo,
            p.pago_original_id IS NOT NULL AS es_reembolso,
            o.codigo_orden,
            NULLIF(TRIM(CONCAT_WS(' ', c.nombre, c.apellidos)), '') AS cliente
     FROM pagos p
     JOIN ordenes o  ON o.orden_id = p.orden_id
     JOIN clientes c ON c.cliente_id = o.cliente_id
     WHERE p.corte_id = $1 AND p.estado = 'completado'
     ORDER BY p.fecha_pago DESC`,
    [corteId]
  );

  return { corte, porMetodo, movimientos };
}

/** Resumen de cobros de un día, independiente de los cortes. */
export async function getResumenDia(fecha: string, empleadoId?: number | null) {
  // El día se delimita en la zona del negocio, no en la del servidor: con la
  // base en UTC, un cobro de las 8 de la noche caía en el día siguiente.
  const tz = await getZonaHoraria();
  const valores: unknown[] = [fecha, tz];
  let filtroEmpleado = '';
  if (empleadoId) {
    valores.push(empleadoId);
    filtroEmpleado = `AND p.empleado_id = $${valores.length}`;
  }

  const porMetodo = await query(
    `SELECT p.metodo,
            COUNT(*)::int AS transacciones,
            COALESCE(SUM(p.monto), 0)::numeric AS monto
     FROM pagos p
     WHERE (p.fecha_pago AT TIME ZONE $2)::date = $1::date
       AND p.estado = 'completado' ${filtroEmpleado}
     GROUP BY p.metodo ORDER BY monto DESC`,
    valores
  );

  const [totales] = await query<{ total: number; transacciones: number; reembolsos: number }>(
    `SELECT COALESCE(SUM(p.monto), 0)::numeric AS total,
            COUNT(*)::int AS transacciones,
            COALESCE(SUM(ABS(p.monto)) FILTER (WHERE p.monto < 0), 0)::numeric AS reembolsos
     FROM pagos p
     WHERE (p.fecha_pago AT TIME ZONE $2)::date = $1::date
       AND p.estado = 'completado' ${filtroEmpleado}`,
    valores
  );

  const pagos = await query(
    `SELECT p.pago_id, p.monto, p.efectivo_recibido, p.cambio_entregado, p.metodo,
            p.referencia, p.fecha_pago, p.motivo,
            p.pago_original_id IS NOT NULL AS es_reembolso,
            o.codigo_orden, o.total AS total_orden,
            NULLIF(TRIM(CONCAT_WS(' ', c.nombre, c.apellidos)), '')   AS cliente,
            NULLIF(TRIM(CONCAT_WS(' ', e.nombre, e.apellidos)), '')   AS empleado
     FROM pagos p
     JOIN ordenes o   ON o.orden_id = p.orden_id
     JOIN clientes c  ON c.cliente_id = o.cliente_id
     LEFT JOIN empleados e ON e.empleado_id = p.empleado_id
     WHERE (p.fecha_pago AT TIME ZONE $2)::date = $1::date
       AND p.estado = 'completado' ${filtroEmpleado}
     ORDER BY p.fecha_pago DESC`,
    valores
  );

  return { fecha, porMetodo, totales, pagos };
}

export async function getCortes(opciones: { desde?: string | null; hasta?: string | null } = {}) {
  const condiciones: string[] = [];
  const valores: unknown[] = [];
  if (opciones.desde) {
    valores.push(opciones.desde);
    condiciones.push(`c.abierto_en >= $${valores.length}::date`);
  }
  if (opciones.hasta) {
    valores.push(opciones.hasta);
    condiciones.push(`c.abierto_en < ($${valores.length}::date + interval '1 day')`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  return query(
    `SELECT c.*, NULLIF(TRIM(CONCAT_WS(' ', e.nombre, e.apellidos)), '') AS empleado_nombre
     FROM cortes_caja c LEFT JOIN empleados e ON e.empleado_id = c.empleado_id
     ${where} ORDER BY c.abierto_en DESC LIMIT 100`,
    valores
  );
}
