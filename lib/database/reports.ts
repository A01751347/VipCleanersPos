import { executeQuery } from './connection';

// Obtener estadísticas del dashboard
export async function getDashboardStats() {
  // Ventas por mes
  const monthlySalesQuery = `
    SELECT * FROM vw_estadisticas_ventas_mensuales
    ORDER BY anio_mes DESC
    LIMIT 12
  `;
  
  const monthlySales = await executeQuery<any[]>({
    query: monthlySalesQuery,
    values: []
  });
  
  // Servicios más populares
  const popularServicesQuery = `
    SELECT * FROM vw_servicios_populares
    LIMIT 5
  `;
  
  const popularServices = await executeQuery<any[]>({
    query: popularServicesQuery,
    values: []
  });
  
  // Productos más vendidos
  const popularProductsQuery = `
    SELECT * FROM vw_productos_populares
    LIMIT 5
  `;
  
  const popularProducts = await executeQuery<any[]>({
    query: popularProductsQuery,
    values: []
  });
  
  // Órdenes con entrega hoy
  const todayDeliveriesQuery = `
    SELECT * FROM vw_ordenes_entrega_hoy
  `;
  
  const todayDeliveries = await executeQuery<any[]>({
    query: todayDeliveriesQuery,
    values: []
  });
  
  // Órdenes pendientes de identificación
  const pendingIdOrdersQuery = `
    SELECT * FROM vw_ordenes_id_pendiente
    LIMIT 5
  `;
  
  const pendingIdOrders = await executeQuery<any[]>({
    query: pendingIdOrdersQuery,
    values: []
  });
  
  // Resumen de inventario
  const inventorySummaryQuery = `
    SELECT 
      COUNT(*) as total_productos,
      SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END) as productos_agotados,
      SUM(CASE WHEN stock < stock_minimo AND stock > 0 THEN 1 ELSE 0 END) as productos_bajo_stock,
      SUM(CASE WHEN stock >= stock_minimo THEN 1 ELSE 0 END) as productos_ok
    FROM productos
    WHERE activo = TRUE
  `;
  
  const [inventorySummary] = await executeQuery<any[]>({
    query: inventorySummaryQuery,
    values: []
  });
  
  // Métricas generales
  const metricsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM ordenes WHERE DATE(fecha_recepcion) = CURDATE()) as ordenes_hoy,
      (SELECT SUM(total) FROM ordenes WHERE DATE(fecha_recepcion) = CURDATE()) as ventas_hoy,
      (SELECT COUNT(*) FROM ordenes WHERE MONTH(fecha_recepcion) = MONTH(CURDATE()) AND YEAR(fecha_recepcion) = YEAR(CURDATE())) as ordenes_mes,
      (SELECT SUM(total) FROM ordenes WHERE MONTH(fecha_recepcion) = MONTH(CURDATE()) AND YEAR(fecha_recepcion) = YEAR(CURDATE())) as ventas_mes,
      (SELECT COUNT(*) FROM clientes) as total_clientes,
      (SELECT COUNT(DISTINCT cliente_id) FROM ordenes WHERE MONTH(fecha_recepcion) = MONTH(CURDATE()) AND YEAR(fecha_recepcion) = YEAR(CURDATE())) as clientes_activos_mes
  `;
  
  const [metrics] = await executeQuery<any[]>({
    query: metricsQuery,
    values: []
  });
  
  // Estadísticas adicionales para el dashboard
  const dashboardStatsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM reservaciones WHERE activo = TRUE) as totalBookings,
      (SELECT COUNT(*) FROM mensajes_contacto WHERE esta_leido = FALSE) as pendingMessages,
      (SELECT IFNULL(SUM(total), 0) FROM ordenes WHERE MONTH(fecha_recepcion) = MONTH(CURDATE()) AND YEAR(fecha_recepcion) = YEAR(CURDATE())) as monthlySales,
      (SELECT COUNT(DISTINCT cliente_id) FROM ordenes WHERE MONTH(fecha_recepcion) = MONTH(CURDATE()) AND YEAR(fecha_recepcion) = YEAR(CURDATE())) as activeClients
  `;
  
  const [dashboardStats] = await executeQuery<any[]>({
    query: dashboardStatsQuery,
    values: []
  });

  return {
    // Estadísticas principales para el dashboard
    totalBookings: dashboardStats.totalBookings || 0,
    pendingMessages: dashboardStats.pendingMessages || 0,
    monthlySales: dashboardStats.monthlySales || 0,
    activeClients: dashboardStats.activeClients || 0,
    
    // Datos detallados para otros reportes
    ventas_mensuales: monthlySales,
    servicios_populares: popularServices,
    productos_populares: popularProducts,
    entregas_hoy: todayDeliveries,
    ordenes_id_pendiente: pendingIdOrders,
    resumen_inventario: inventorySummary,
    metricas: metrics
  };
}

// Obtener reporte de ventas por período
export async function getSalesReport({
  startDate,
  endDate,
  groupBy = 'day'
}: {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}) {
  let groupFormat;
  
  switch (groupBy) {
    case 'day':
      groupFormat = '%Y-%m-%d';
      break;
    case 'week':
      groupFormat = '%Y-%u'; // Año-Semana
      break;
    case 'month':
      groupFormat = '%Y-%m'; // Año-Mes
      break;
    default:
      groupFormat = '%Y-%m-%d';
  }
  
  const query = `
    SELECT 
      DATE_FORMAT(fecha_recepcion, ?) as periodo,
      COUNT(*) as total_ordenes,
      SUM(subtotal) as subtotal,
      SUM(impuestos) as impuestos,
      SUM(descuento) as descuentos,
      SUM(total) as total
    FROM ordenes
    WHERE fecha_recepcion BETWEEN ? AND ?
    GROUP BY periodo
    ORDER BY periodo
  `;
  
  const orders = await executeQuery<any[]>({
    query,
    values: [groupFormat, startDate, endDate]
  });
  
  // Obtener desglose por método de pago
  const paymentMethodQuery = `
    SELECT 
      metodo_pago,
      COUNT(*) as total_ordenes,
      SUM(total) as total
    FROM ordenes
    WHERE fecha_recepcion BETWEEN ? AND ?
    GROUP BY metodo_pago
  `;
  
  const paymentMethods = await executeQuery<any[]>({
    query: paymentMethodQuery,
    values: [startDate, endDate]
  });
  
  // Obtener desglose por servicio
  const servicesQuery = `
    SELECT 
      s.nombre as servicio,
      COUNT(dos.detalle_servicio_id) as cantidad,
      SUM(dos.subtotal) as total
    FROM detalles_orden_servicios dos
    JOIN servicios s ON dos.servicio_id = s.servicio_id
    JOIN ordenes o ON dos.orden_id = o.orden_id
    WHERE o.fecha_recepcion BETWEEN ? AND ?
    GROUP BY s.servicio_id, s.nombre
    ORDER BY total DESC
  `;
  
  const services = await executeQuery<any[]>({
    query: servicesQuery,
    values: [startDate, endDate]
  });
  
  // Obtener desglose por producto
  const productsQuery = `
    SELECT 
      p.nombre as producto,
      SUM(dop.cantidad) as cantidad,
      SUM(dop.subtotal) as total
    FROM detalles_orden_productos dop
    JOIN productos p ON dop.producto_id = p.producto_id
    JOIN ordenes o ON dop.orden_id = o.orden_id
    WHERE o.fecha_recepcion BETWEEN ? AND ?
    GROUP BY p.producto_id, p.nombre
    ORDER BY total DESC
  `;
  
  const products = await executeQuery<any[]>({
    query: productsQuery,
    values: [startDate, endDate]
  });
  
  return {
    por_periodo: orders,
    por_metodo_pago: paymentMethods,
    por_servicio: services,
    por_producto: products
  };
}

// Obtener reporte de desempeño de empleados
export async function getEmployeePerformanceReport({
  startDate,
  endDate
}: {
  startDate: string;
  endDate: string;
}) {
  const query = `
    SELECT 
        empleado_id,
        nombre_completo,
        puesto,
        SUM(total_ordenes_recibidas) as total_ordenes_recibidas,
        SUM(total_ordenes_entregadas) as total_ordenes_entregadas, 
        SUM(monto_total_recibido) as monto_total_recibido,
        SUM(total_pagos_procesados) as total_pagos_procesados,
        SUM(monto_total_pagos) as monto_total_pagos,
        -- Calcular ticket promedio
        CASE 
            WHEN SUM(total_ordenes_recibidas) > 0 
            THEN SUM(monto_total_recibido) / SUM(total_ordenes_recibidas)
            ELSE 0 
        END as ticket_promedio
    FROM vw_reporte_empleados
    WHERE (
        fecha_recepcion BETWEEN ? AND ?
        OR fecha_entrega_estimada BETWEEN ? AND ?
        OR fecha_pago BETWEEN ? AND ?
    )
    GROUP BY empleado_id, nombre_completo, puesto
    HAVING (
        SUM(total_ordenes_recibidas) > 0 
        OR SUM(total_ordenes_entregadas) > 0 
        OR SUM(total_pagos_procesados) > 0
    )
    ORDER BY SUM(monto_total_recibido) DESC
  `;
  
  const employees = await executeQuery<any[]>({
    query,
    values: [startDate, endDate, startDate, endDate, startDate, endDate]
  });
  
  return {
    empleados: employees
  };
}

// Obtener reporte de clientes frecuentes
export async function getTopCustomersReport({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const query = `
  SELECT 
    c.cliente_id,
    c.nombre,
    c.apellidos,
    c.telefono,
    c.email,
    COUNT(o.orden_id) as total_ordenes,
    SUM(o.total) as monto_total,
    MAX(o.fecha_recepcion) as ultima_visita,
    c.puntos_fidelidad
  FROM clientes c
  JOIN ordenes o ON c.cliente_id = o.cliente_id
  WHERE o.fecha_recepcion BETWEEN ? AND ?
  GROUP BY c.cliente_id, c.nombre, c.apellidos, c.telefono, c.email, c.puntos_fidelidad
  ORDER BY monto_total DESC
  LIMIT 10
`;

const customers = await executeQuery<any[]>({
  query,
  values: [startDate, endDate]
});
  
  return {
    clientes: customers
  };
}

export async function getWeeklySalesData() {
  try {
    // Query que replica exactamente la lógica del SQL inicial
    // Genera exactamente 7 filas, una por cada día de la última semana
    const currentWeekQuery = `
      WITH date_range AS (
        SELECT DATE_SUB(CURDATE(), INTERVAL 6 DAY) + INTERVAL n DAY as fecha
        FROM (
          SELECT 0 as n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL 
          SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
        ) numbers
      )
      SELECT 
        dr.fecha as date,
        DAYNAME(dr.fecha) as day_name,
        DAYOFWEEK(dr.fecha) as day_number,
        COALESCE(COUNT(o.orden_id), 0) as orders,
        COALESCE(SUM(CASE 
          WHEN o.total IS NOT NULL AND o.total > 0 THEN o.total 
          ELSE (o.subtotal + COALESCE(o.impuestos, 0) - COALESCE(o.descuento, 0))
        END), 0) as sales
      FROM date_range dr
      LEFT JOIN ordenes o ON DATE(o.fecha_recepcion) = dr.fecha 
        AND o.estado_pago = 'pagado'
      GROUP BY dr.fecha, DAYNAME(dr.fecha), DAYOFWEEK(dr.fecha)
      ORDER BY dr.fecha ASC
    `;
    
    const currentWeekData = await executeQuery<any[]>({
      query: currentWeekQuery,
      values: []
    });
    
    // Obtener ventas de la semana anterior para comparación
    const previousWeekQuery = `
      SELECT 
        COALESCE(SUM(CASE 
          WHEN total IS NOT NULL AND total > 0 THEN total 
          ELSE (subtotal + COALESCE(impuestos, 0) - COALESCE(descuento, 0))
        END), 0) as total_sales
      FROM ordenes 
      WHERE DATE(fecha_recepcion) >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
        AND DATE(fecha_recepcion) <= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND estado_pago = 'pagado'
    `;
    
    const [previousWeekData] = await executeQuery<any[]>({
      query: previousWeekQuery,
      values: []
    });
    
    // Mapear los nombres de días de inglés a español
    const dayNameMap: { [key: string]: string } = {
      'Sunday': 'Domingo',
      'Monday': 'Lunes',
      'Tuesday': 'Martes',
      'Wednesday': 'Miércoles',
      'Thursday': 'Jueves',
      'Friday': 'Viernes',
      'Saturday': 'Sábado'
    };
    
    // Transformar los datos garantizando exactamente 7 días
    const last7Days = currentWeekData.map(dayData => {
      const spanishDayName = dayNameMap[dayData.day_name] || dayData.day_name;
      
      return {
        day: spanishDayName.substring(0, 3), // Abreviatura del día
        dayName: spanishDayName,
        sales: parseFloat(dayData.sales) || 0,
        orders: parseInt(dayData.orders) || 0,
        date: dayData.date,
        dayNumber: dayData.day_number
      };
    });
    
    // Verificar que tenemos exactamente 7 días
    if (last7Days.length !== 7) {
      console.warn(`Se esperaban 7 días pero se obtuvieron ${last7Days.length}`);
    }
    
    // Calcular totales
    const totalSales = last7Days.reduce((sum, day) => sum + day.sales, 0);
    const totalOrders = last7Days.reduce((sum, day) => sum + day.orders, 0);
    
    // Calcular crecimiento vs semana anterior
    const previousTotalSales = previousWeekData ? parseFloat(previousWeekData.total_sales || '0') : 0;
    const weekGrowth = previousTotalSales > 0 
      ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 
      : totalSales > 0 ? 100 : 0;
    
    // Encontrar el mejor día
    const bestDay = last7Days.reduce((best, current) => 
      current.sales > best.sales ? current : best
    , last7Days[0]);
    
    return {
      data: last7Days,
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      weekGrowth: Math.round(weekGrowth * 10) / 10,
      bestDay: {
        day: bestDay.dayName,
        sales: Math.round(bestDay.sales * 100) / 100
      }
    };
    
  } catch (error) {
    console.error('Error getting weekly sales data:', error);
    throw error;
  }
}