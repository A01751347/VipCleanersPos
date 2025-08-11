import { executeQuery } from './connection';
import { getServiceById } from './services';

// Función para crear una nueva orden
export async function createOrder(
  clienteId: number,
  empleadoId: number,
  reservacionId: number | null,
  fechaEntregaEstimada: Date,
  notas: string | null
) {
  // Usar el procedimiento almacenado CrearOrden
  const query = `
    CALL CrearOrden(?, ?, ?, ?, ?,?,? @orden_id, @codigo_orden);
    SELECT @orden_id, @codigo_orden;
  `;
  
  const [result] = await executeQuery<any[]>({
    query,
    values: [
      clienteId, 
      empleadoId, 
      reservacionId, 
      fechaEntregaEstimada, 
      notas
    ]
  });
  
  // Extraer el ID y código de orden de las variables OUT
  const { '@orden_id': ordenId, '@codigo_orden': codigoOrden } = result[0];
  
  return { 
    id: ordenId, 
    code: codigoOrden 
  };
}

// Función para cambiar el estado de una orden
export async function changeOrderStatus(
  ordenId: number,
  estadoId: number,
  empleadoId: number,
  comentario: string | null
) {
  try {
    // Verificar que la orden existe
    const orderExists = await executeQuery<any[]>({
      query: 'SELECT orden_id FROM ordenes WHERE orden_id = ?',
      values: [ordenId]
    });

    if (orderExists.length === 0) {
      throw new Error(`Orden ${ordenId} no encontrada`);
    }

    // Verificar que el estado existe
    const stateExists = await executeQuery<any[]>({
      query: 'SELECT estado_id, nombre FROM estados_servicio WHERE estado_id = ?',
      values: [estadoId]
    });

    if (stateExists.length === 0) {
      throw new Error(`Estado ${estadoId} no encontrado`);
    }

    // Intentar usar el procedimiento almacenado CambiarEstadoOrden
    try {
      const query = `CALL CambiarEstadoOrden(?, ?, ?, ?);`;
      
      await executeQuery({
        query,
        values: [ordenId, estadoId, empleadoId, comentario]
      });

    } catch (procError) {
      console.error('Error con procedimiento almacenado, intentando método manual:', procError);
      
      // Método manual como fallback
      await executeQuery({
        query: `
          UPDATE ordenes 
          SET estado_actual_id = ?, fecha_actualizacion = NOW() 
          WHERE orden_id = ?
        `,
        values: [estadoId, ordenId]
      });

      // Insertar manualmente en el historial
      await executeQuery({
        query: `
          INSERT INTO historial_estados (orden_id, estado_id, empleado_id, comentario, fecha_cambio)
          VALUES (?, ?, ?, ?, NOW())
        `,
        values: [ordenId, estadoId, empleadoId, comentario]
      });
    }
    
    // Verificar que se registró en el historial
    const historyCheck = await executeQuery<any[]>({
      query: `
        SELECT h.*, e.nombre as estado_nombre 
        FROM historial_estados h 
        JOIN estados_servicio e ON h.estado_id = e.estado_id 
        WHERE h.orden_id = ? 
        ORDER BY h.fecha_cambio DESC 
        LIMIT 1
      `,
      values: [ordenId]
    });

    return true;
  } catch (error) {
    console.error('Error en changeOrderStatus:', error);
    throw error;
  }
}

// Función para obtener una orden por su código
export async function getOrderByCode(code: string) {
  const query = `
    SELECT * FROM vw_ordenes_detalle
    WHERE codigo_orden = ?
  `;
  
  const result = await executeQuery<any[]>({
    query,
    values: [code]
  });
  
  if (result.length === 0) {
    return null;
  }
  
  
  // Obtener detalles de servicios
  const servicios = await executeQuery({
    query: `
      SELECT * FROM vw_detalles_orden_servicios
      WHERE orden_id = ?
    `,
    values: [result[0].orden_id]
  });
  
  // Obtener detalles de productos
  const productos = await executeQuery({
    query: `
      SELECT * FROM vw_detalles_orden_productos
      WHERE orden_id = ?
    `,
    values: [result[0].orden_id]
  });

  const direccion = await executeQuery({
    query: `
      SELECT * FROM direcciones
      WHERE direccion_id = ?
    `,
    values: [result[0].direccion_id]
  });
  
  // Obtener historial de estados
  const estados = await executeQuery({
    query: `
      SELECT * FROM vw_historial_estados
      WHERE orden_id = ?
      ORDER BY fecha_cambio DESC
    `,
    values: [result[0].orden_id]
  });
  
  return {
    ...result[0],
    servicios,
    productos,
    estados,
    direccion
  };
}


// Función para crear orden POS
export async function createPosOrder({
  clienteId,
  empleadoId,
  servicios = [],
  productos = [],
  requiereIdentificacion = false,
  tieneIdentificacionRegistrada = false,
  fechaEntregaEstimada,
  metodoPago,
  monto,
  notasOrder = null,
  subtotal,
  iva,
  total
}: {
  clienteId: number;
  empleadoId: number;
  servicios: {
    servicioId: number;
    cantidad: number;
    modeloId?: number | null;
    marca?: string | null;
    modelo?: string | null;
    descripcion?: string | null;
    talla?: string| null;
    color?: string | null;
  }[];
  productos: {
    productoId: number;
    cantidad: number;
  }[];
  requiereIdentificacion?: boolean;
  tieneIdentificacionRegistrada?: boolean;
  fechaEntregaEstimada: Date;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mercado_pago';
  monto: number;
  notasOrder?: string | null;
  subtotal: number;
  iva: number;
  total: number;
}) {

  // 1. Crear la orden principal
  await executeQuery({
    query: `CALL CrearOrden(?, ?, NULL, ?, ?,?,?, @orden_id, @codigo_orden)`,
    values: [clienteId, empleadoId, fechaEntregaEstimada, notasOrder, "ORD", 1]
  });
  
  const [orderResult] = await executeQuery<any>({
    query: `SELECT @orden_id as orden_id, @codigo_orden as codigo_orden`,
    values: []
  });
  
  const ordenId = orderResult.orden_id;
  const codigoOrden = orderResult.codigo_orden;

  // 2. Insertar servicios
  for (const servicio of servicios) {
    const servicioInfo = await getServiceById(servicio.servicioId);
    if (!servicioInfo) {
      throw new Error(`Servicio con ID ${servicio.servicioId} no encontrado`);
    }

    const precioUnitario = servicioInfo.precio ?? 0;

    if (servicio.marca || servicio.modelo || servicio.descripcion) {
      // Servicio con detalles de calzado - crear registros individuales
      for (let i = 0; i < servicio.cantidad; i++) {
        await executeQuery({
          query: `
            INSERT INTO detalles_orden_servicios (
  orden_id, servicio_id, cantidad, precio_unitario, descuento, subtotal,
  modelo_id, marca, modelo, talla, color, descripcion_calzado
) VALUES (?, ?, 1, ?, 0.00, ?, ?, ?, ?, ?, ?, ?)
          `,
          values: [
            ordenId, servicio.servicioId, precioUnitario, precioUnitario,
            servicio.modeloId ?? null, servicio.marca?.trim() || null,
            servicio.modelo?.trim() || null, servicio.talla?.trim() || null,   
            servicio.color?.trim() || null,   servicio.descripcion?.trim() || null
          ]
        });
      }
    } else {
      // Servicio genérico
      const subtotalServicio = precioUnitario * servicio.cantidad;
      await executeQuery({
        query: `
          INSERT INTO detalles_orden_servicios (
            orden_id, servicio_id, cantidad, precio_unitario, descuento, subtotal,
            modelo_id, marca, modelo, talla, color, descripcion_calzado
          ) VALUES (?, ?, ?, ?, 0.00, ?, NULL, NULL, NULL, NULL, NULL, NULL)
        `,
        values: [ordenId, servicio.servicioId, servicio.cantidad, precioUnitario, subtotalServicio]
      });
    }
  }

  // 3. Insertar productos
  for (const producto of productos) {
    const productoInfo = await executeQuery<any[]>({
      query: 'SELECT * FROM productos WHERE producto_id = ?',
      values: [producto.productoId]
    });
    
    if (productoInfo.length === 0) {
      throw new Error(`Producto con ID ${producto.productoId} no encontrado`);
    }
    
    const precioUnitario = productoInfo[0].precio ?? 0;
    const subtotalProducto = precioUnitario * producto.cantidad;
    
    await executeQuery({
      query: `
        INSERT INTO detalles_orden_productos (
          orden_id, producto_id, cantidad, precio_unitario, descuento, subtotal
        ) VALUES (?, ?, ?, ?, 0.00, ?)
      `,
      values: [ordenId, producto.productoId, producto.cantidad, precioUnitario, subtotalProducto]
    });
    
    // Reducir stock
    await executeQuery({
      query: `UPDATE productos SET stock = stock - ? WHERE producto_id = ? AND stock >= ?`,
      values: [producto.cantidad, producto.productoId, producto.cantidad]
    });
  }
  
  await executeQuery({
    query: `
      UPDATE ordenes
      SET 
        subtotal = ?,
        impuestos = ?,
        total = ?,
        requiere_identificacion = ?,
        tiene_identificacion_registrada = ?,
        metodo_pago = ?,
        estado_pago = ?
      WHERE orden_id = ?
    `,
    values: [
      subtotal,
      iva,
      total,
      requiereIdentificacion ? 1 : 0,
      tieneIdentificacionRegistrada ? 1 : 0,
      metodoPago,
      'pendiente',
      ordenId
    ]
  });

  // 5. Registrar pago
  if (monto > 0) {
    await executeQuery({
      query: `CALL RegistrarPago(?, ?, ?, NULL, NULL, ?, @pago_id);`,
      values: [ordenId, monto, metodoPago, empleadoId]
    });
  }
  
  return { ordenId, codigoOrden };
}

// Obtener órdenes con filtros avanzados (para panel admin)
export async function getOrders({

  
  page = 1,
  pageSize = 10,
  estadoId = null,
  estadoPago = null,
  fechaInicio = null,
  fechaFin = null,
  searchQuery = null,
  empleadoId = null
}: {
  page?: number;
  pageSize?: number;
  estadoId?: string[] | string | null;
  estadoPago?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  searchQuery?: string | null;
  empleadoId?: number | null;
}) {

  const estadoIdList = Array.isArray(estadoId)
  ? estadoId.map(id => parseInt(id))
  : estadoId
    ? [parseInt(estadoId)]
    : [];


  const pageSafeValue = parseInt(String(page), 10) || 1;
  const pageSizeSafeValue = parseInt(String(pageSize), 10) || 10;
  const offset = (pageSafeValue - 1) * pageSizeSafeValue;
  
  let query = `
    SELECT * FROM vw_ordenes_detalle
    WHERE 1=1
  `;
  
  const queryParams: any[] = [];
  
  if (estadoIdList.length > 0) {
  const placeholders = estadoIdList.map(() => '?').join(', ');
  query += ` AND estado_actual_id IN (${placeholders})`;
  queryParams.push(...estadoIdList);
}

  
  
  if (estadoPago) {
    query += ` AND estado_pago = ?`;
    queryParams.push(estadoPago);
  }
  
  if (fechaInicio) {
    query += ` AND fecha_recepcion >= ?`;
    queryParams.push(fechaInicio);
  }
  
  if (fechaFin) {
    query += ` AND fecha_recepcion <= ?`;
    queryParams.push(fechaFin);
  }
  
  if (searchQuery) {
    query += ` AND (codigo_orden LIKE ? OR cliente_nombre LIKE ? OR cliente_apellidos LIKE ? OR cliente_telefono LIKE ?)`;
    const searchParam = `%${searchQuery}%`;
    queryParams.push(searchParam, searchParam, searchParam, searchParam);
  }
  
  if (empleadoId) {
    query += ` AND (empleado_recepcion_id = ? OR empleado_entrega_id = ?)`;
    queryParams.push(empleadoId, empleadoId);
  }
  
  // Contar total de registros para paginación
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  
  const [countResult] = await executeQuery<[{total: number}]>({
    query: countQuery,
    values: queryParams
  });
  
  query += ` ORDER BY fecha_recepcion DESC LIMIT ${pageSizeSafeValue} OFFSET ${offset}`;
  
  try {
    const orders = await executeQuery<any[]>({
      query,
      values: queryParams
    });
    
    return {
      orders,
      total: countResult.total,
      page: pageSafeValue,
      pageSize: pageSizeSafeValue,
      totalPages: Math.ceil(countResult.total / pageSizeSafeValue)
    };
  } catch (error) {
    console.error('Error específico en la consulta de órdenes:', error);
    throw error;
  }
}

// Obtener detalle completo de una orden por ID
// Obtener detalle completo de una orden por ID
export async function getOrderById(orderId: number) {
  // Obtener datos de la orden
  const orderQuery = `SELECT * FROM vw_ordenes_detalle WHERE orden_id = ?`;
  
  const [order] = await executeQuery<any[]>({
    query: orderQuery,
    values: [orderId]
  });
  
  if (!order) return null;
  
  // Obtener servicios de la orden
  const servicesQuery = `SELECT * FROM vw_detalles_orden_servicios WHERE orden_id = ?`;
  
  const services = await executeQuery<any[]>({
    query: servicesQuery,
    values: [orderId]
  });
  
  // Obtener productos de la orden
  const productsQuery = `SELECT * FROM vw_detalles_orden_productos WHERE orden_id = ?`;
  
  const products = await executeQuery<any[]>({
    query: productsQuery,
    values: [orderId]
  });
  
  // Obtener historial de estados
  const historyQuery = `SELECT * FROM vw_historial_estados WHERE orden_id = ? ORDER BY fecha_cambio DESC`;
  
  const history = await executeQuery<any[]>({
    query: historyQuery,
    values: [orderId]
  });
  
  // Obtener pagos
  const paymentsQuery = `
    SELECT p.*, e.nombre as empleado_nombre, e.apellidos as empleado_apellidos
    FROM pagos p
    JOIN empleados e ON p.empleado_id = e.empleado_id
    WHERE p.orden_id = ?
    ORDER BY p.fecha_pago DESC
  `;
  
  const payments = await executeQuery<any[]>({
    query: paymentsQuery,
    values: [orderId]
  });
  
  // Obtener imágenes asociadas
  const imagesQuery = `
    SELECT *
    FROM archivos_media
    WHERE entidad_tipo = 'orden' AND entidad_id = ?
    ORDER BY tipo, fecha_creacion DESC
  `;
  
  const images = await executeQuery<any[]>({
    query: imagesQuery,
    values: [orderId]
  });

  // **AGREGAR: Obtener datos de la dirección**
  let direccion = [];
  if (order.direccion_id) {
    const direccionQuery = `
      SELECT *
      FROM direcciones
      WHERE direccion_id = ?
    `;
    
    direccion = await executeQuery<any[]>({
      query: direccionQuery,
      values: [order.direccion_id]
    });
  }
  
  return {
    ...order,
    servicios: services,
    productos: products,
    historial: history,
    pagos: payments,
    imagenes: images,
    direccion: direccion  // Agregar la dirección al resultado
  };
}

// Función para actualizar la ubicación de almacenamiento de un par de tenis
export async function updateShoeStorageLocation(
  ordenId: number,
  detalleServicioId: number,
  cajaAlmacenamiento: string,
  codigoUbicacion: string,
  notasEspeciales: string | null = null,
  empleadoId: number
) {
  // 1. Actualizar la ubicación en la tabla de detalles_orden_servicios
  const updateQuery = `
    UPDATE detalles_orden_servicios
    SET 
      caja_almacenamiento = ?,
      codigo_ubicacion = ?,
      notas_especiales = ?
    WHERE 
      detalle_servicio_id = ? 
      AND orden_id = ?
  `;
  
  await executeQuery({
    query: updateQuery,
    values: [
      cajaAlmacenamiento,
      codigoUbicacion,
      notasEspeciales,
      detalleServicioId,
      ordenId
    ]
  });
  
  // 2. Registrar el evento en historial_ubicaciones (si existe esta tabla)
  try {
    const logQuery = `
      INSERT INTO historial_ubicaciones (
        detalle_servicio_id,
        orden_id,
        caja_almacenamiento,
        codigo_ubicacion,
        notas,
        empleado_id,
        fecha_asignacion
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await executeQuery({
      query: logQuery,
      values: [
        detalleServicioId,
        ordenId,
        cajaAlmacenamiento,
        codigoUbicacion,
        notasEspeciales,
        empleadoId
      ]
    });
  } catch (err) {
    // Si la tabla no existe, ignora el error pero registra la advertencia
    console.warn('No se pudo registrar en historial_ubicaciones:', err);
  }
  
  return true;
}