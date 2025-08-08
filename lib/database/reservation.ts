import { executeQuery } from './connection';

// Función para crear una nueva reservación
export async function createReservation(
  clienteId: number,
  servicioId: number,
  modeloId: number | null,
  marca: string | null,
  modelo: string | null,
  descripcionCalzado: string | null,
  fechaReservacion: Date,
  fechaEntregaEstimada: Date,
  notas: string | null,
  direccionId: number | null = null,
  requierePickup: boolean = false,
  fechaSolicitudPickup: Date | null = null
) {
  // Usar el procedimiento almacenado CrearReservacion
  const query = `
    CALL CrearReservacion(?, ?, ?, ?, ?, ?, ?, ?, ?, @reservacion_id, @codigo_reservacion);
    SELECT @reservacion_id, @codigo_reservacion;
  `;
  
  const [result] = await executeQuery<any[]>({
    query,
    values: [
      clienteId, 
      servicioId, 
      modeloId, 
      marca, 
      modelo, 
      descripcionCalzado, 
      fechaReservacion, 
      fechaEntregaEstimada, 
      notas
    ]
  });
  
  // Extraer el ID y código de reservación de las variables OUT
  const { '@reservacion_id': reservacionId, '@codigo_reservacion': codigoReservacion } = result[0];
  
  // Si se requiere pickup, actualizar con datos de dirección
  if (requierePickup && direccionId) {
    await executeQuery({
      query: `
        UPDATE reservaciones 
        SET direccion_id = ?, 
            requiere_pickup = TRUE,
            fecha_solicitud_pickup = ?
        WHERE reservacion_id = ?
      `,
      values: [direccionId, fechaSolicitudPickup, reservacionId]
    });
  }
  
  return { 
    id: reservacionId, 
    code: codigoReservacion 
  };
}

// Función mejorada para crear reservación con pickup
export async function createReservationWithPickup(
  clienteId: number,
  servicioId: number,
  modeloId: number | null,
  marca: string | null,
  modelo: string | null,
  descripcionCalzado: string | null,
  fechaReservacion: Date,
  fechaEntregaEstimada: Date,
  notas: string | null,
  direccionId: number | null = null,
  requierePickup: boolean = false,
  fechaSolicitudPickup: Date | null = null,
  costoPickup: number = 0,
  zonaPickup: string | null = null
) {
  try {
    // Primero crear la reservación básica
    const { id, code } = await createReservation(
      clienteId,
      servicioId,
      modeloId,
      marca,
      modelo,
      descripcionCalzado,
      fechaReservacion,
      fechaEntregaEstimada,
      notas,
      direccionId,
      requierePickup,
      fechaSolicitudPickup
    );

    // Si hay pickup, actualizar con información adicional
    if (requierePickup) {
      await executeQuery({
        query: `
          UPDATE reservaciones 
          SET costo_pickup = ?, zona_pickup = ?
          WHERE reservacion_id = ?
        `,
        values: [costoPickup, zonaPickup, id]
      });
    }

    return { id, code };
  } catch (error) {
    console.error('Error creando reservación con pickup:', error);
    throw error;
  }
}

// Función para obtener una reservación por su código
export async function getReservationByCode(code: string) {
  const query = `
    SELECT 
      r.*,
      c.nombre as cliente_nombre,
      c.apellidos as cliente_apellidos,
      c.telefono as cliente_telefono,
      c.email as cliente_email,
      s.nombre as servicio_nombre,
      s.precio as servicio_precio,
      m.nombre as modelo_nombre,
      ma.nombre as marca_nombre
    FROM reservaciones r
    JOIN clientes c ON r.cliente_id = c.cliente_id
    JOIN servicios s ON r.servicio_id = s.servicio_id
    LEFT JOIN modelos_calzado m ON r.modelo_id = m.modelo_id
    LEFT JOIN marcas ma ON m.marca_id = ma.marca_id
    WHERE r.codigo_reservacion = ?
  `;
  
  const result = await executeQuery<any[]>({
    query,
    values: [code]
  });
  
  return result.length > 0 ? result[0] : null;
}

// Función para obtener reservación con detalles completos incluyendo dirección
export async function getReservationWithDetails(reservacionId: number) {
  try {
    const query = `
      SELECT 
        r.reservacion_id as id,
        r.codigo_reservacion as booking_reference,
        r.cliente_id,
        c.nombre as client_name,
        c.apellidos as client_lastname,
        CONCAT(c.nombre, ' ', c.apellidos) as full_name,
        c.email as client_email,
        c.telefono as client_phone,
        r.servicio_id,
        s.nombre as service_name,
        s.precio as service_price,
        s.descripcion as service_description,
        s.tiempo_estimado_minutos as service_duration,
        r.modelo_id,
        m.nombre as modelo_nombre,
        ma.nombre as marca_nombre,
        r.marca,
        r.modelo,
        r.descripcion_calzado as shoes_description,
        r.fecha_reservacion as booking_date,
        r.fecha_entrega_estimada as estimated_delivery,
        r.notas as notes,
        r.activo as is_active,
        r.estado as status_raw,
        CASE 
          WHEN r.activo = FALSE THEN 'cancelled'
          WHEN r.estado = 'completada' THEN 'completed'
          WHEN r.fecha_reservacion > NOW() THEN 'pending'
          ELSE 'pending'
        END as status,
        r.fecha_creacion as created_at,
        r.fecha_actualizacion as updated_at,
        d.calle,
        d.numero_exterior,
        d.numero_interior,
        d.colonia,
        d.municipio_delegacion,
        d.ciudad,
        d.estado,
        d.codigo_postal,
        d.telefono_contacto,
        d.destinatario,
        d.instrucciones_entrega,
        d.ventana_hora_inicio,
        d.ventana_hora_fin
      FROM reservaciones r
      JOIN clientes c ON r.cliente_id = c.cliente_id
      JOIN servicios s ON r.servicio_id = s.servicio_id
      LEFT JOIN modelos_calzado m ON r.modelo_id = m.modelo_id
      LEFT JOIN marcas ma ON m.marca_id = ma.marca_id
      LEFT JOIN direcciones d ON r.direccion_id = d.direccion_id
      WHERE r.reservacion_id = ?
    `;
    
    const result = await executeQuery<any[]>({
      query,
      values: [reservacionId]
    });
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error obteniendo reservación con detalles:', error);
    throw error;
  }
}

// Función para obtener reservación por código con detalles completos
export async function getReservationByCodeWithDetails(code: string) {
  try {
    const query = `
      SELECT 
        r.*,
        c.nombre as cliente_nombre,
        c.apellidos as cliente_apellidos,
        c.telefono as cliente_telefono,
        c.email as cliente_email,
        s.nombre as servicio_nombre,
        s.precio as servicio_precio,
        s.descripcion as servicio_descripcion,
        s.tiempo_estimado_minutos,
        m.nombre as modelo_nombre,
        ma.nombre as marca_nombre,
        d.calle,
        d.numero_exterior,
        d.numero_interior,
        d.colonia,
        d.municipio_delegacion,
        d.ciudad,
        d.estado,
        d.codigo_postal,
        d.telefono_contacto,
        d.destinatario,
        d.instrucciones_entrega,
        d.ventana_hora_inicio,
        d.ventana_hora_fin
      FROM reservaciones r
      JOIN clientes c ON r.cliente_id = c.cliente_id
      JOIN servicios s ON r.servicio_id = s.servicio_id
      LEFT JOIN modelos_calzado m ON r.modelo_id = m.modelo_id
      LEFT JOIN marcas ma ON m.marca_id = ma.marca_id
      LEFT JOIN direcciones d ON r.direccion_id = d.direccion_id
      WHERE r.codigo_reservacion = ?
    `;
    
    const result = await executeQuery<any[]>({
      query,
      values: [code]
    });
    
    if (result.length === 0) return null;

    const reservation = result[0];
    
    // Agregar información formateada de dirección si existe
    if (reservation.calle) {
      reservation.direccion_completa = `${reservation.calle} ${reservation.numero_exterior}${
        reservation.numero_interior ? ` ${reservation.numero_interior}` : ''
      }, ${reservation.colonia}, ${reservation.ciudad}, ${reservation.estado} ${reservation.codigo_postal}`;
    }

    return reservation;
  } catch (error) {
    console.error('Error obteniendo reservación por código:', error);
    throw error;
  }
}

// Función para generar un código único de reservación
export function generateBookingReference(): string {
  // Llamar al procedimiento almacenado para generar código
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'RES';
  // Añadir 6 caracteres aleatorios
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Función para obtener las reservaciones más recientes
export async function getBookings({
  page = 1,
  pageSize = 10,
  status = [],
  searchQuery = '',
  startDate = '',
  endDate = '',
  sortField = 'fecha_creacion',
  sortDirection = 'desc'
}: {
  page?: number;
  pageSize?: number;
  status?: string[];
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortDirection?: string;
}) {
  const offset = (page - 1) * pageSize;
  const validSortFields = ['r.codigo_reservacion', 'r.fecha_reservacion', 'r.fecha_creacion'];
  const validSortDirections = ['asc', 'desc'];
  
  if (!validSortFields.includes(`r.${sortField}`)) {
    sortField = 'r.fecha_creacion';
  } else {
    sortField = `r.${sortField}`;
  }
  
  if (!validSortDirections.includes(sortDirection)) {
    sortDirection = 'desc';
  }
  
  // Validación de parámetros de ordenamiento
  if (!validSortFields.includes(sortField)) {
    sortField = 'fecha_creacion';
  }
  
  if (!validSortDirections.includes(sortDirection)) {
    sortDirection = 'desc';
  }
  
  // Construir la consulta base
  let query = `
    SELECT 
      r.reservacion_id as id,
      r.codigo_reservacion as booking_reference,
      CONCAT(c.nombre, ' ', c.apellidos) as full_name,
      c.email,
      s.nombre as service_type,
      r.marca,
      r.modelo,
      r.descripcion_calzado as shoes_type,
      CASE 
        WHEN r.activo = FALSE THEN 'cancelled'
        WHEN r.estado = 'completada' THEN 'completed'
        WHEN r.fecha_reservacion > NOW() THEN 'pending'
        ELSE 'pending'
      END as status,
      DATE_FORMAT(r.fecha_reservacion, '%Y-%m-%d') as booking_date,
      r.fecha_creacion as created_at
    FROM reservaciones r
    JOIN clientes c ON r.cliente_id = c.cliente_id
    JOIN servicios s ON r.servicio_id = s.servicio_id
    WHERE 1=1
  `;
  
  // Arreglo para almacenar valores para consulta preparada
  const queryValues: any[] = [];
  
  // Aplicar filtros
  if (searchQuery) {
    query += `
      AND (
        c.nombre LIKE ? OR
        c.apellidos LIKE ? OR
        c.email LIKE ? OR
        r.codigo_reservacion LIKE ? OR
        s.nombre LIKE ?
      )
    `;
    const searchParam = `%${searchQuery}%`;
    queryValues.push(searchParam, searchParam, searchParam, searchParam, searchParam);
  }
  
  // Filtrar por estado
  if (status && status.length > 0) {
    const statusConditions = status.map(() => {
      return `(
        CASE 
          WHEN r.activo = FALSE THEN 'cancelled'
          WHEN r.estado = 'completada' THEN 'completed'
          WHEN r.fecha_reservacion > NOW() THEN 'pending'
          ELSE 'pending'
        END) = ?
      `;
    }).join(' OR ');
    
    query += ` AND (${statusConditions})`;
    queryValues.push(...status);
  }
  
  if (startDate) {
    query += ` AND DATE(r.fecha_reservacion) >= ?`;
    queryValues.push(startDate);
  }
  
  if (endDate) {
    query += ` AND DATE(r.fecha_reservacion) <= ?`;
    queryValues.push(endDate);
  }
  
  // Consulta para contar el total de registros
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  
  // Aplicar ordenamiento y paginación
  query += ` ORDER BY ${sortField} ${sortDirection} LIMIT ${parseInt(pageSize.toString(), 10)} OFFSET ${parseInt(offset.toString(), 10)}`;
  
  // Ejecutar consulta para obtener el total
  const countResult = await executeQuery<[{total: number}]>({
    query: countQuery,
    values: queryValues
  });
  
  // Ejecutar consulta principal
  const result = await executeQuery<Array<Record<string, unknown>>>({
    query,
    values: queryValues
  });
  
  return {
    bookings: result,
    total: countResult[0].total,
    page,
    pageSize,
    totalPages: Math.ceil(countResult[0].total / pageSize)
  };
}

export async function getRecentBookings(limit = 5) {
  const query = `
    SELECT 
  o.orden_id AS id,
  o.codigo_orden AS booking_reference,
  CONCAT(c.nombre, ' ', c.apellidos) AS full_name,
  s.nombre AS service_type,
  o.fecha_recepcion AS booking_date,
  o.estado_actual_id AS status,
  o.fecha_creacion
FROM ordenes o
JOIN clientes c ON o.cliente_id = c.cliente_id
LEFT JOIN detalles_orden_servicios dos ON o.orden_id = dos.orden_id
LEFT JOIN servicios s ON dos.servicio_id = s.servicio_id
WHERE o.codigo_orden LIKE 'RES%'
GROUP BY o.orden_id
ORDER BY o.fecha_recepcion DESC
LIMIT 5;

  `;
  return executeQuery<Array<Record<string, unknown>>>({
    query
  });
}

// Función para obtener los detalles completos de una reservación
export async function getBookingById(id: number) {
  const query = `
    SELECT 
      r.reservacion_id as id,
      r.codigo_reservacion as booking_reference,
      r.cliente_id,
      c.nombre as client_name,
      c.apellidos as client_lastname,
      CONCAT(c.nombre, ' ', c.apellidos) as full_name,
      c.email as client_email,
      c.telefono as client_phone,
      c.direccion as client_address,
      c.ciudad as client_city,
      c.codigo_postal as client_postal_code,
      r.servicio_id,
      s.nombre as service_name,
      s.descripcion as service_description,
      s.precio as service_price,
      s.tiempo_estimado_minutos as service_duration,
      r.modelo_id,
      r.marca,
      r.modelo,
      r.descripcion_calzado as shoes_description,
      r.fecha_reservacion as booking_date,
      r.fecha_entrega_estimada as estimated_delivery,
      r.notas as notes,
      r.activo as is_active,
      r.estado as status_raw,
      CASE 
        WHEN r.activo = FALSE THEN 'cancelled'
        WHEN r.estado = 'completada' THEN 'completed'
        WHEN r.fecha_reservacion > NOW() THEN 'pending'
        ELSE 'pending'
      END as status,
      r.fecha_creacion as created_at,
      r.fecha_actualizacion as updated_at
    FROM reservaciones r
    JOIN clientes c ON r.cliente_id = c.cliente_id
    JOIN servicios s ON r.servicio_id = s.servicio_id
    WHERE r.reservacion_id = ?
  `;
  
  const result = await executeQuery<any[]>({
    query,
    values: [id]
  });
  
  return result.length > 0 ? result[0] : null;
}

// Función para actualizar el estado de una reservación
export async function updateBookingStatus(id: number, status: string, empleadoId?: number) {
  let query: string;
  let values: any[];
  
  if (status === 'cancelled') {
    query = `
      UPDATE reservaciones
      SET activo = FALSE,
          fecha_actualizacion = NOW()
      WHERE reservacion_id = ?
    `;
    values = [id];
  } else if (status === 'completed') {
    query = `
      UPDATE reservaciones
      SET estado = 'completada',
          fecha_actualizacion = NOW()
      WHERE reservacion_id = ?
    `;
    values = [id];
  } else {
    // Para otros estados, simplemente mantener activo = TRUE
    query = `
      UPDATE reservaciones
      SET activo = TRUE,
          fecha_actualizacion = NOW()
      WHERE reservacion_id = ?
    `;
    values = [id];
  }
  
  return executeQuery({
    query,
    values
  });
}