import { executeQuery } from './connection';

// Función para reparar historial de estados faltante
export async function repairMissingOrderHistory() {
  try {
    // Buscar órdenes que no tienen historial de estados
    const ordersWithoutHistory = await executeQuery<any[]>({
      query: `
        SELECT o.orden_id, o.estado_actual_id, o.empleado_recepcion_id, o.fecha_creacion
        FROM ordenes o
        LEFT JOIN historial_estados h ON o.orden_id = h.orden_id
        WHERE h.orden_id IS NULL
      `,
      values: []
    });

    for (const order of ordersWithoutHistory) {
      // Insertar el estado inicial
      await executeQuery({
        query: `
          INSERT INTO historial_estados (orden_id, estado_id, empleado_id, comentario, fecha_cambio)
          VALUES (?, ?, ?, 'Estado inicial (reparado automáticamente)', ?)
        `,
        values: [
          order.orden_id,
          order.estado_actual_id,
          order.empleado_recepcion_id,
          order.fecha_creacion
        ]
      });
    }

    return { reparadas: ordersWithoutHistory.length };
  } catch (error) {
    console.error('Error reparando historial de órdenes:', error);
    throw error;
  }
}

// Función para verificar integridad del historial de estados
export async function checkOrderHistoryIntegrity(orderId?: number) {
  try {
    let query = `
      SELECT 
        o.orden_id,
        o.codigo_orden,
        o.estado_actual_id,
        e.nombre as estado_actual_nombre,
        (SELECT COUNT(*) FROM historial_estados WHERE orden_id = o.orden_id) as total_estados_historial,
        (SELECT MAX(fecha_cambio) FROM historial_estados WHERE orden_id = o.orden_id) as ultimo_cambio
      FROM ordenes o
      JOIN estados_servicio e ON o.estado_actual_id = e.estado_id
    `;
    
    const values: any[] = [];
    
    if (orderId) {
      query += ` WHERE o.orden_id = ?`;
      values.push(orderId);
    }

    query += ` ORDER BY o.orden_id DESC LIMIT 10`;

    const orders = await executeQuery<any[]>({
      query,
      values
    });

    return orders;
  } catch (error) {
    console.error('Error verificando integridad del historial:', error);
    throw error;
  }
}

// Función para crear orden desde reservación con validaciones mejoradas
export async function createOrderFromReservation(
  clienteId: number,
  empleadoId: number,
  reservacionId: number,
  fechaEntregaEstimada: Date,
  notas: string | null
) {
  try {
    // 1. Validar que el cliente existe
    const clienteExists = await executeQuery<any[]>({
      query: 'SELECT cliente_id FROM clientes WHERE cliente_id = ?',
      values: [clienteId]
    });

    if (clienteExists.length === 0) {
      throw new Error(`Cliente con ID ${clienteId} no encontrado`);
    }

    // 2. Validar que el empleado existe
    const empleadoExists = await executeQuery<any[]>({
      query: 'SELECT empleado_id, nombre, apellidos FROM empleados WHERE empleado_id = ? AND activo = TRUE',
      values: [empleadoId]
    });

    if (empleadoExists.length === 0) {
      throw new Error(`Empleado con ID ${empleadoId} no encontrado o no está activo`);
    }

    // 3. Validar que la reservación existe
    const reservacionExists = await executeQuery<any[]>({
      query: 'SELECT reservacion_id FROM reservaciones WHERE reservacion_id = ?',
      values: [reservacionId]
    });

    if (reservacionExists.length === 0) {
      throw new Error(`Reservación con ID ${reservacionId} no encontrada`);
    }

    // 4. Validar que el estado inicial existe (normalmente ID = 1)
    const estadoInicial = await executeQuery<any[]>({
      query: 'SELECT estado_id FROM estados_servicio WHERE estado_id = 1',
      values: []
    });

    if (estadoInicial.length === 0) {
      throw new Error('Estado inicial no encontrado en la base de datos');
    }

    // 5. Generar código de orden único
    const codigoOrden = generateTransferOrderCode();

    // 6. Insertar la orden directamente
    const result = await executeQuery<any>({
      query: `
        INSERT INTO ordenes (
          codigo_orden,
          cliente_id,
          empleado_recepcion_id,
          reservacion_id,
          fecha_recepcion,
          fecha_entrega_estimada,
          subtotal,
          descuento,
          impuestos,
          total,
          estado_actual_id,
          estado_pago,
          requiere_identificacion,
          tiene_identificacion_registrada,
          notas,
          fecha_creacion,
          fecha_actualizacion
        ) VALUES (?, ?, ?, ?, NOW(), ?, 0.00, 0.00, 0.00, 0.00, 1, 'pendiente', FALSE, FALSE, ?, NOW(), NOW())
      `,
      values: [
        codigoOrden,
        clienteId,
        empleadoExists[0].empleado_id,
        reservacionId,
        fechaEntregaEstimada,
        notas
      ]
    });

    const ordenId = result.insertId;

    if (!ordenId) {
      throw new Error('No se pudo obtener el ID de la orden creada');
    }

    // 7. Crear entrada inicial en historial de estados
    await executeQuery({
      query: `
        INSERT INTO historial_estados (orden_id, estado_id, empleado_id, comentario, fecha_cambio)
        VALUES (?, 1, ?, 'Orden creada desde transferencia de reservación', NOW())
      `,
      values: [ordenId, empleadoExists[0].empleado_id]
    });

    return {
      id: ordenId,
      code: codigoOrden
    };
  } catch (error) {
    console.error('Error creando orden desde reservación:', error);
    throw error;
  }
}

// Función helper específica para códigos de órdenes transferidas
function generateTransferOrderCode(): string {
  const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
  const random = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 caracteres aleatorios
  return `ORD${timestamp}${random}`;
}

// Función para transferir reservación a orden mejorada
export async function transferReservationToOrder(
  reservacionId: number,
  empleadoId: number,
  notasAdicionales: string | null = null
) {
  try {
    // Importar la función desde reservations.ts para evitar dependencias circulares
    const { getReservationWithDetails } = await import('./reservation');
    const { createOrder } = await import('./orders');
    
    // Obtener datos de la reservación
    const reservacion = await getReservationWithDetails(reservacionId);
    
    if (!reservacion) {
      throw new Error('Reservación no encontrada');
    }

    if (!reservacion.is_active) {
      throw new Error('La reservación no está activa');
    }

    if (reservacion.status === 'completed') {
      throw new Error('La reservación ya ha sido procesada');
    }

    // Crear la orden basada en la reservación
    const fechaEntregaEstimada = reservacion.estimated_delivery 
      ? new Date(reservacion.estimated_delivery)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const notasCombinadas = [
      `Transferido desde reservación: ${reservacion.booking_reference}`,
      reservacion.notes && `Notas originales: ${reservacion.notes}`,
      notasAdicionales && `Notas adicionales: ${notasAdicionales}`
    ].filter(Boolean).join('\n');

    const { id: ordenId, code: codigoOrden } = await createOrder(
      reservacion.cliente_id,
      empleadoId,
      reservacionId,
      fechaEntregaEstimada,
      notasCombinadas
    );

    // Agregar el servicio a la orden
    const precioServicio = reservacion.service_price || 0;
    
    await executeQuery({
      query: `
        INSERT INTO detalles_orden_servicios (
          orden_id, 
          servicio_id, 
          cantidad, 
          precio_unitario, 
          descuento, 
          subtotal,
          modelo_id,
          marca,
          modelo,
          descripcion_calzado
        ) VALUES (?, ?, 1, ?, 0.00, ?, ?, ?, ?, ?)
      `,
      values: [
        ordenId,
        reservacion.servicio_id,
        precioServicio,
        precioServicio,
        reservacion.modelo_id || null,
        reservacion.marca || null,
        reservacion.modelo || null,
        reservacion.shoes_description || null
      ]
    });

    // Calcular totales
    const subtotal = precioServicio;
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    // Actualizar la orden con los totales y código de reservación
    await executeQuery({
      query: `
        UPDATE ordenes 
        SET 
          subtotal = ?, 
          impuestos = ?, 
          total = ?, 
          estado_pago = 'pendiente',
          codigo_reservacion = ?
        WHERE orden_id = ?
      `,
      values: [subtotal, iva, total, reservacion.booking_reference, ordenId]
    });

    // Marcar la reservación como transferida
    await executeQuery({
      query: `
        UPDATE reservaciones 
        SET 
          estado = 'transferida_a_orden', 
          orden_id = ?,
          fecha_actualizacion = NOW()
        WHERE reservacion_id = ?
      `,
      values: [ordenId, reservacionId]
    });

    return { 
      ordenId, 
      codigoOrden, 
      total: Math.round(total * 100) / 100,
      codigoReservacion: reservacion.booking_reference
    };

  } catch (error) {
    console.error('Error transfiriendo reservación a orden:', error);
    throw error;
  }
}

// Función para obtener orden por código de reservación (para tracking)
export async function getOrderByBookingReference(bookingReference: string) {
  try {
    const query = `
      SELECT 
        o.*,
        c.nombre as cliente_nombre,
        c.apellidos as cliente_apellidos,
        c.telefono as cliente_telefono,
        c.email as cliente_email,
        es.nombre as estado_nombre,
        es.descripcion as estado_descripcion,
        es.color as estado_color
      FROM ordenes o
      JOIN clientes c ON o.cliente_id = c.cliente_id
      JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
      WHERE o.codigo_reservacion = ?
    `;
    
    const result = await executeQuery<any[]>({
      query,
      values: [bookingReference]
    });
    
    if (result.length === 0) {
      return null;
    }

    const order = result[0];
    
    // Obtener servicios de la orden
    const servicios = await executeQuery<any[]>({
      query: `
        SELECT 
          dos.*,
          s.nombre as servicio_nombre,
          s.descripcion as servicio_descripcion
        FROM detalles_orden_servicios dos
        JOIN servicios s ON dos.servicio_id = s.servicio_id
        WHERE dos.orden_id = ?
      `,
      values: [order.orden_id]
    });

    // Obtener historial de estados
    const historial = await executeQuery<any[]>({
      query: `
        SELECT 
          h.*,
          es.nombre as estado_nombre,
          es.descripcion as estado_descripcion,
          es.color as estado_color,
          COALESCE(CONCAT(e.nombre, ' ', e.apellidos), 'Sistema') as empleado_nombre
        FROM historial_estados h
        JOIN estados_servicio es ON h.estado_id = es.estado_id
        LEFT JOIN empleados e ON h.empleado_id = e.empleado_id
        WHERE h.orden_id = ?
        ORDER BY h.fecha_cambio DESC
      `,
      values: [order.orden_id]
    });

    return {
      ...order,
      servicios,
      historial,
      tipo: 'orden'
    };

  } catch (error) {
    console.error('Error obteniendo orden por código de reservación:', error);
    return null;
  }
}