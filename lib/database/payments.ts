import { executeQuery } from './connection';

// Registrar un nuevo pago para una orden existente
export async function registerPayment({
  ordenId,
  monto,
  metodo,
  referencia = null,
  terminalId = null,
  empleadoId
}: {
  ordenId: number;
  monto: number;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia' | 'mercado_pago';
  referencia?: string | null;
  terminalId?: string | null;
  empleadoId: number ;
}) {
  const query = `
    CALL RegistrarPago(?, ?, ?, ?, ?, 1, @pago_id);
    SELECT @pago_id as pago_id;
  `;

  // Usa executeQuery como siempre, pero sabiendo que vienen múltiples resultados
  const result = await executeQuery<any[][]>({
    query,
    values: [
      ordenId,
      monto,
      metodo,
      referencia,
      terminalId,
      empleadoId
    ]
  });

  // La segunda consulta (SELECT) estará en result[1]
  const pagoId = result?.[1]?.[0]?.pago_id;

  return {
    pagoId
  };
}

// Obtener todos los pagos de una orden
export async function getOrderPayments(ordenId: number) {
  const query = `
    SELECT p.*, e.nombre as empleado_nombre, e.apellidos as empleado_apellidos
    FROM pagos p
    JOIN empleados e ON p.empleado_id = e.empleado_id
    WHERE p.orden_id = ?
    ORDER BY p.fecha_pago DESC
  `;
  
  return executeQuery<any[]>({
    query,
    values: [ordenId]
  });
}

// Obtener resumen de pagos por método y fecha (para arqueo de caja)
export async function getPaymentsSummary(fecha: string | null = null, empleadoId: number | null = null) {
  let query = `
    SELECT 
      metodo,
      COUNT(*) as total_transacciones,
      SUM(monto) as monto_total
    FROM pagos
    WHERE estado = 'completado'
  `;
  
  const queryParams: any[] = [];
  
  if (fecha) {
    query += ` AND DATE(fecha_pago) = ?`;
    queryParams.push(fecha);
  }
  
  if (empleadoId) {
    query += ` AND empleado_id = ?`;
    queryParams.push(empleadoId);
  }
  
  query += ` GROUP BY metodo ORDER BY monto_total DESC`;
  
  const pagosPorMetodo = await executeQuery<any[]>({
    query,
    values: queryParams
  });
  
  // Obtener totales generales
  let totalQuery = `
    SELECT 
      COUNT(*) as total_transacciones,
      SUM(monto) as monto_total
    FROM pagos
    WHERE estado = 'completado'
  `;
  
  if (fecha) {
    totalQuery += ` AND DATE(fecha_pago) = ?`;
  }
  
  if (empleadoId) {
    totalQuery += ` AND empleado_id = ?`;
  }
  
  const [totales] = await executeQuery<any[]>({
    query: totalQuery,
    values: queryParams
  });
  
  return {
    por_metodo: pagosPorMetodo,
    totales
  };
}

// Obtener información necesaria para el arqueo de caja
export async function getCashRegisterReport(fecha: string, empleadoId: number = 0) {
  // Pagos recibidos en el día - usando el total de la orden, no el monto recibido
  const paymentsQuery = `
    SELECT 
      p.pago_id,
      p.orden_id,
      p.metodo,
      p.referencia,
      p.fecha_pago,
      p.monto as monto_recibido,
      o.total as monto_orden,
      -- El monto real que se debe considerar es el total de la orden
      o.total as monto,
      o.codigo_orden,
      CONCAT(c.nombre, ' ', c.apellidos) as cliente,
      CONCAT(e.nombre, ' ', e.apellidos) as empleado,
      -- Información adicional útil para el arqueo
      CASE 
        WHEN p.metodo = 'efectivo' AND p.monto > o.total 
        THEN p.monto - o.total 
        ELSE 0 
      END as cambio_dado
    FROM pagos p
    JOIN ordenes o ON p.orden_id = o.orden_id
    JOIN clientes c ON o.cliente_id = c.cliente_id
    JOIN empleados e ON p.empleado_id = e.empleado_id
    WHERE DATE(p.fecha_pago) = ?
    ${empleadoId ? 'AND p.empleado_id = ?' : ''}
    ORDER BY p.fecha_pago DESC
  `;
  
  const queryParams = empleadoId ? [fecha, empleadoId] : [fecha];
  
  const payments = await executeQuery<any[]>({
    query: paymentsQuery,
    values: queryParams
  });
  
  // Resumen por método de pago - usando el total de la orden
  const summaryQuery = `
    SELECT 
      p.metodo,
      COUNT(*) as total_transacciones,
      SUM(o.total) as monto_total,
      -- Información adicional para efectivo
      CASE 
        WHEN p.metodo = 'efectivo' 
        THEN SUM(p.monto) - SUM(o.total)
        ELSE 0 
      END as total_cambio_dado,
      CASE 
        WHEN p.metodo = 'efectivo' 
        THEN SUM(p.monto)
        ELSE SUM(o.total)
      END as monto_fisico_recibido
    FROM pagos p
    JOIN ordenes o ON p.orden_id = o.orden_id
    WHERE DATE(p.fecha_pago) = ?
    ${empleadoId ? 'AND p.empleado_id = ?' : ''}
    GROUP BY p.metodo
    ORDER BY monto_total DESC
  `;
  
  const summary = await executeQuery<any[]>({
    query: summaryQuery,
    values: queryParams
  });
  
  // Total del día - usando el total de las órdenes
  const totalQuery = `
    SELECT 
      SUM(o.total) as total,
      SUM(CASE WHEN p.metodo = 'efectivo' THEN p.monto ELSE o.total END) as total_fisico_recibido,
      SUM(CASE WHEN p.metodo = 'efectivo' AND p.monto > o.total THEN p.monto - o.total ELSE 0 END) as total_cambio_dado
    FROM pagos p
    JOIN ordenes o ON p.orden_id = o.orden_id
    WHERE DATE(p.fecha_pago) = ?
    ${empleadoId ? 'AND p.empleado_id = ?' : ''}
  `;
  
  const [totalResult] = await executeQuery<any[]>({
    query: totalQuery,
    values: queryParams
  });
  
  return {
    pagos: payments,
    resumen_por_metodo: summary,
    total: totalResult?.total || 0,
    total_fisico_recibido: totalResult?.total_fisico_recibido || 0,
    total_cambio_dado: totalResult?.total_cambio_dado || 0
  };
}