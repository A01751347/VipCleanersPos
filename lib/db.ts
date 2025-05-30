
import 'server-only';
import mysql from 'mysql2/promise';

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  timezone: '-06:00', 
});

// Configure timezone for each connection using callback-style query
pool.on('connection', (connection) => {
  // Use callback-style query for connection event (not promise-based)
  connection.query("SET time_zone = '-06:00'", (err: any) => {
    if (err) {
      console.error('Error configurando zona horaria en conexión:', err);
    }
  });
});

export async function executeQuery<T>({
  query,
  values,
}: {
  query: string;
  values?: unknown[];
}): Promise<T> {
  try {
    const [result] = await pool.execute(query, values);
    return result as T;
  } catch (err) {
    console.error('Database query error:', err);
    throw new Error('Database error');
  }
}
// Clientes

// Función para crear un nuevo cliente
export async function createClient(
  nombre: string,
  apellidos: string,
  telefono: string,
  email: string,
  direccion?: string,
  codigo_postal?: string,
  ciudad?: string,
  estado?: string
) {
  const query = `
    INSERT INTO clientes (
      nombre, apellidos, telefono, email, direccion, codigo_postal, ciudad, estado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await executeQuery<any>({
    query,
    values: [nombre, apellidos, telefono, email, direccion, codigo_postal, ciudad, estado]
  });
  
  return result.insertId;
}

// Función para obtener un cliente por ID
export async function getClientById(clientId: number) {
  const query = `
    SELECT * FROM clientes
    WHERE cliente_id = ?
  `;
  
  const result = await executeQuery<any[]>({
    query,
    values: [clientId]
  });
  
  return result.length > 0 ? result[0] : null;
}

// Función para obtener un cliente por email
export async function getClientByEmail(email: string) {
  const query = `
    SELECT * FROM clientes
    WHERE email = ?
    LIMIT 1
  `;

  const result = await executeQuery<any[]>({
    query,
    values: [email.toLowerCase().trim()]
  });

  return result.length > 0 ? result[0] : null;
}

// Buscar clientes con paginación y filtros
export async function searchClients({
  searchQuery = '',
  page = 1,
  pageSize = 10
}) {
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT 
      c.*,
      (SELECT COUNT(*) FROM ordenes WHERE cliente_id = c.cliente_id) as total_ordenes,
      (SELECT SUM(total) FROM ordenes WHERE cliente_id = c.cliente_id) as total_gastado
    FROM clientes c
    WHERE 1=1
  `;
  
  const queryParams: any[] = [];
  
  if (searchQuery) {
    query += `
      AND (
        c.nombre LIKE ? OR
        c.apellidos LIKE ? OR
        c.telefono LIKE ? OR
        c.email LIKE ?
      )
    `;
    const searchParam = `%${searchQuery}%`;
    queryParams.push(searchParam, searchParam, searchParam, searchParam);
  }
  
  // Contar total de registros para paginación
  const countQuery = query.replace('c.*,\n      (SELECT COUNT(*) FROM ordenes WHERE cliente_id = c.cliente_id) as total_ordenes', 'COUNT(*) as total');
  
  const [countResult] = await executeQuery<[{total: number}]>({
    query: countQuery,
    values: queryParams
  });
  
  const clients = await executeQuery<any[]>({
    query,
    values: queryParams
  });
  
  return {
    clients,
    total: countResult.total,
    page,
    pageSize,
    totalPages: Math.ceil(countResult.total / pageSize)
  };
}

// Obtener cliente por ID con sus direcciones y últimas órdenes
export async function getClientDetails(clientId: number) {
  // Obtener datos del cliente
  const clientQuery = `
    SELECT c.*,
      (SELECT COUNT(*) FROM ordenes WHERE cliente_id = c.cliente_id) as total_ordenes,
      (SELECT SUM(total) FROM ordenes WHERE cliente_id = c.cliente_id) as total_gastado
    FROM clientes c
    WHERE c.cliente_id = ?
  `;
  
  const [client] = await executeQuery<any[]>({
    query: clientQuery,
    values: [clientId]
  });
  
  if (!client) return null;
  
  // Obtener direcciones del cliente
  const addressesQuery = `
    SELECT * FROM direcciones
    WHERE cliente_id = ? AND activo = TRUE
    ORDER BY tipo ASC
  `;
  
  const addresses = await executeQuery<any[]>({
    query: addressesQuery,
    values: [clientId]
  });
  
  // Obtener últimas órdenes
  const ordersQuery = `
    SELECT o.*, es.nombre as estado_nombre, es.color as estado_color
    FROM ordenes o
    JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
    WHERE o.cliente_id = ?
    ORDER BY o.fecha_creacion DESC
    LIMIT 5
  `;
  
  const orders = await executeQuery<any[]>({
    query: ordersQuery,
    values: [clientId]
  });
  
  return {
    ...client,
    direcciones: addresses,
    ultimas_ordenes: orders
  };
}

// Actualizar datos de cliente
export async function updateClient(
  clientId: number,
  nombre: string,
  apellidos: string,
  telefono: string,
  email: string,
  direccion: string | null,
  codigo_postal: string | null,
  ciudad: string | null,
  estado: string | null
) {
  const query = `
    UPDATE clientes
    SET nombre = ?,
        apellidos = ?,
        telefono = ?,
        email = ?,
        direccion = ?,
        codigo_postal = ?,
        ciudad = ?,
        estado = ?,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE cliente_id = ?
  `;
  
  await executeQuery({
    query,
    values: [
      nombre, apellidos, telefono, email, 
      direccion, codigo_postal, ciudad, estado, 
      clientId
    ]
  });
  
  return true;
}

// Buscar cliente por teléfono o email (para búsqueda rápida en el POS)
export async function findClientByPhoneOrEmail(search: string) {
  const query = `
    SELECT * FROM clientes
    WHERE telefono = ? OR email = ?
    LIMIT 1
  `;
  
  const result = await executeQuery<any[]>({
    query,
    values: [search, search]
  });
  
  return result.length > 0 ? result[0] : null;
}


// Brands & Kicks

// Función para obtener marcas
export async function getBrands(onlyActive: boolean = true) {
  const query = `
    SELECT * FROM marcas
    ${onlyActive ? 'WHERE activo = TRUE' : ''}
    ORDER BY nombre ASC
  `;
  
  return executeQuery({
    query,
    values: []
  });
}

// Función para obtener modelos de calzado por marca
export async function getModelsByBrand(brandId: number, onlyActive: boolean = true) {
  const query = `
    SELECT * FROM modelos_calzado
    WHERE marca_id = ? ${onlyActive ? 'AND activo = TRUE' : ''}
    ORDER BY nombre ASC
  `;
  
  return executeQuery({
    query,
    values: [brandId]
  });
}


// Reservaciones

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

// Función para obtener servicios
export async function getServices(onlyActive: boolean = true) {
  const query = `
    SELECT * FROM servicios
    ${onlyActive ? 'WHERE activo = TRUE' : ''}
    ORDER BY precio ASC
  `;
  
  return executeQuery({
    query,
    values: []
  });
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
    WHERE r.activo = TRUE
    ORDER BY r.fecha_creacion DESC
    LIMIT 5
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


// Mensajes y preguntas 

// Función para obtener todos los mensajes de contacto con paginación y filtros
export async function getMessages({
  page = 1,
  pageSize = 10,
  filter = 'all',
  searchQuery = '',
  startDate = '',
  endDate = '',
  sortField = 'fecha_creacion',
  sortDirection = 'desc'
}: {
  page?: number;
  pageSize?: number;
  filter?: 'all' | 'unread' | 'read' | 'starred' | 'archived';
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortDirection?: string;
}) {
  const offset = (page - 1) * pageSize;
  const validSortFields = ['nombre', 'email', 'asunto', 'fecha_creacion'];
  const validSortDirections = ['asc', 'desc'];
  
  // Validación de parámetros de ordenamiento
  if (!validSortFields.includes(sortField)) {
    sortField = 'fecha_creacion';
  }
  
  if (!validSortDirections.includes(sortDirection)) {
    sortDirection = 'desc';
  }
  
  // Construir la consulta base con los nombres correctos de la nueva tabla
  let query = `
    SELECT 
      mensaje_id as id,
      nombre as name,
      email,
      asunto as subject,
      mensaje as message,
      esta_leido as is_read,
      esta_destacado as is_starred,
      esta_archivado as is_archived,
      fecha_creacion as created_at
    FROM mensajes_contacto
    WHERE 1=1
  `;
  
  // Arreglo para almacenar valores para consulta preparada
  const queryValues: any[] = [];
  
  // Aplicar filtros
  if (searchQuery) {
    query += `
      AND (
        nombre LIKE ? OR
        email LIKE ? OR
        asunto LIKE ? OR
        mensaje LIKE ?
      )
    `;
    const searchParam = `%${searchQuery}%`;
    queryValues.push(searchParam, searchParam, searchParam, searchParam);
  }
  
  // Filtrar por estado de lectura
  if (filter === 'unread') {
    query += ` AND esta_leido = FALSE`;
  } else if (filter === 'read') {
    query += ` AND esta_leido = TRUE`;
  } else if (filter === 'starred') {
    query += ` AND esta_destacado = TRUE`;
  } else if (filter === 'archived') {
    query += ` AND esta_archivado = TRUE`;
  }
  
  if (startDate) {
    query += ` AND DATE(fecha_creacion) >= ?`;
    queryValues.push(startDate);
  }
  
  if (endDate) {
    query += ` AND DATE(fecha_creacion) <= ?`;
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
    messages: result,
    total: countResult[0].total,
    page,
    pageSize,
    totalPages: Math.ceil(countResult[0].total / pageSize)
  };
}

// Función para obtener los mensajes más recientes
export async function getRecentMessages(limit = 3) {
  const query = `
    SELECT 
      mensaje_id as id,
      nombre as name,
      email,
      asunto as subject,
      LEFT(mensaje, 100) as message_preview,
      mensaje as message,
      esta_leido as is_read,
      esta_destacado as is_starred,
      esta_archivado as is_archived,
      fecha_creacion as created_at
    FROM mensajes_contacto
    WHERE esta_archivado = FALSE
    ORDER BY fecha_creacion DESC
    LIMIT 3
  `;
  
  return executeQuery<Array<Record<string, unknown>>>({
    query,
    values: []  // Pasamos un array vacío ya que el límite está directamente en la consulta
  });
}

// Función para marcar un mensaje como leído/no leído
export async function updateMessageReadStatus(id: number, isRead: boolean) {
  const query = `
    UPDATE mensajes_contacto
    SET esta_leido = ?
    WHERE mensaje_id = ?
  `;
  
  return executeQuery({
    query,
    values: [isRead, id]
  });
}

// Función para destacar/quitar destacado de un mensaje
export async function updateMessageStarredStatus(id: number, isStarred: boolean) {
  const query = `
    UPDATE mensajes_contacto
    SET esta_destacado = ?
    WHERE mensaje_id = ?
  `;
  
  return executeQuery({
    query,
    values: [isStarred, id]
  });
}

// Función para archivar/desarchivar un mensaje
export async function updateMessageArchivedStatus(id: number, isArchived: boolean) {
  const query = `
    UPDATE mensajes_contacto
    SET esta_archivado = ?
    WHERE mensaje_id = ?
  `;
  
  return executeQuery({
    query,
    values: [isArchived, id]
  });
}

// Función para marcar todos los mensajes como leídos
export async function markAllMessagesAsRead() {
  const query = `
    UPDATE mensajes_contacto
    SET esta_leido = TRUE
    WHERE esta_leido = FALSE
  `;
  
  return executeQuery({
    query,
    values: []
  });
}

// Función para obtener un mensaje por ID
export async function getMessageById(id: number) {
  const query = `
    SELECT 
      mensaje_id as id,
      nombre as name,
      email,
      asunto as subject,
      mensaje as message,
      esta_leido as is_read,
      esta_destacado as is_starred,
      esta_archivado as is_archived,
      fecha_creacion as created_at
    FROM mensajes_contacto
    WHERE mensaje_id = ?
  `;
  
  const result = await executeQuery<any[]>({
    query,
    values: [id]
  });
  
  return result.length > 0 ? result[0] : null;
}

// Función para crear un nuevo mensaje de contacto
export async function createContactMessage(
  nombre: string,
  email: string,
  asunto: string,
  mensaje: string
) {
  const query = `
    INSERT INTO mensajes_contacto (
      nombre, email, asunto, mensaje, fecha_creacion
    ) VALUES (?, ?, ?, ?, NOW())
  `;
  
  const result = await executeQuery<any>({
    query,
    values: [nombre, email, asunto, mensaje]
  });
  
  return result.insertId;
}

export async function saveMessageReply({
  originalMessageId,
  employeeId,
  replyMessage,
  sentByEmail = true
}: {
  originalMessageId: number;
  employeeId: number | null;
  replyMessage: string;
  sentByEmail?: boolean;
}) {
  // ✅ VERSIÓN CORREGIDA - Usar empleado_id correctamente
  const query = `
    INSERT INTO respuestas_mensajes (
      mensaje_original_id, 
      empleado_id, 
      mensaje_respuesta, 
      enviado_por_email,
      fecha_respuesta
    ) VALUES (?, ?, ?, ?, NOW())
  `;
  
  const result = await executeQuery<any>({
    query,
    values: [originalMessageId, employeeId, replyMessage, sentByEmail ? 1 : 0]
  });
  
  return result.insertId;
}

// Función para obtener todas las respuestas de un mensaje
export async function getMessageReplies(messageId: number) {
  const query = `
    SELECT 
      r.*,
      e.nombre as empleado_nombre,
      e.apellidos as empleado_apellidos
    FROM respuestas_mensajes r
    LEFT JOIN empleados e ON r.empleado_id = e.empleado_id
    WHERE r.mensaje_original_id = ?
    ORDER BY r.fecha_respuesta DESC
  `;
  
  return executeQuery<any[]>({
    query,
    values: [messageId]
  });
}

// Función para obtener un mensaje con sus respuestas
export async function getMessageWithReplies(messageId: number) {
  // Obtener el mensaje original
  const message = await getMessageById(messageId);
  
  if (!message) return null;
  
  // Obtener las respuestas
  const replies = await getMessageReplies(messageId);
  
  return {
    ...message,
    replies
  };
}

// Función para marcar un mensaje como respondido
export async function markMessageAsReplied(messageId: number) {
  const query = `
    UPDATE mensajes_contacto
    SET respondido = TRUE, fecha_respuesta = NOW()
    WHERE mensaje_id = ?
  `;
  
  return executeQuery({
    query,
    values: [messageId]
  });
}

// Función para obtener estadísticas de mensajes usando el procedimiento almacenado
export async function getMessageStats() {
  try {
    // Llamar al procedimiento almacenado
    const result = await executeQuery<any[]>({
      query: 'CALL ObtenerEstadisticasMensajesProc()',
      values: []
    });
    
    // El procedimiento devuelve los datos en el primer elemento del array
    const stats = result[0][0] || {};
    
    // Parsear el JSON si es necesario
    let estadisticas;
    if (typeof stats.estadisticas === 'string') {
      estadisticas = JSON.parse(stats.estadisticas);
    } else {
      estadisticas = stats.estadisticas || {};
    }
    
    return {
      total_mensajes: estadisticas.total_mensajes || 0,
      no_leidos: estadisticas.no_leidos || 0,
      respondidos: estadisticas.respondidos || 0,
      sin_responder: estadisticas.sin_responder || 0,
      destacados: estadisticas.destacados || 0,
      archivados: estadisticas.archivados || 0,
      promedio_respuesta_horas: estadisticas.promedio_respuesta_horas || 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    // Fallback en caso de error
    return {
      total_mensajes: 0,
      no_leidos: 0,
      respondidos: 0,
      sin_responder: 0,
      destacados: 0,
      archivados: 0,
      promedio_respuesta_horas: 0
    };
  }
}


// Ordenes

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
    CALL CrearOrden(?, ?, ?, ?, ?, @orden_id, @codigo_orden);
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
    estados
  };
}

// Recolección

// Función para crear una nueva dirección
export async function createAddress(
  clienteId: number,
  tipo: 'domicilio' | 'pickup' | 'facturacion' | 'otro',
  calle: string,
  numeroExterior: string,
  numeroInterior: string | null,
  colonia: string | null,
  delegacionMunicipio: string | null,
  ciudad: string,
  estado: string,
  codigoPostal: string,
  alias: string | null = null,
  telefonoContacto: string | null = null,
  destinatario: string | null = null,
  instrucciones: string | null = null,
  ventanaHoraInicio: string | null = null,
  ventanaHoraFin: string | null = null
) {
  // Usar el procedimiento almacenado CrearDireccion
  const query = `
    CALL CrearDireccion(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @direccion_id);
    SELECT @direccion_id;
  `;
  
  const [result] = await executeQuery<any[]>({
    query,
    values: [
      clienteId,
      tipo,
      alias,
      calle,
      numeroExterior,
      numeroInterior,
      colonia,
      delegacionMunicipio,
      ciudad,
      estado,
      'México', // país por defecto
      codigoPostal,
      null, // latitud (se actualizaría después con geocoding)
      null, // longitud (se actualizaría después con geocoding)
      telefonoContacto,
      destinatario,
      instrucciones,
      ventanaHoraInicio,
      ventanaHoraFin
    ]
  });
  
  // Extraer el ID de dirección de la variable OUT
  const { '@direccion_id': direccionId } = result[0];
  
  return direccionId;
}

// Función para obtener direcciones de un cliente
export async function getClientAddresses(clienteId: number) {
  const query = `
    SELECT * FROM direcciones
    WHERE cliente_id = ? AND activo = TRUE
    ORDER BY tipo ASC
  `;
  
  return executeQuery({
    query,
    values: [clienteId]
  });
}

// Servicios y productos
export async function createService({
  nombre,
  descripcion,
  precio,
  tiempo_estimado_minutos = null,
  requiere_identificacion = false,
  activo = true
}: {
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_estimado_minutos?: number | null;
  requiere_identificacion?: boolean;
  activo?: boolean;
}) {
  const query = `
    INSERT INTO servicios (
      nombre, descripcion, precio, tiempo_estimado_minutos, 
      requiere_identificacion, activo
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const result = await executeQuery<any>({
    query,
    values: [
      nombre.trim(),
      descripcion.trim(),
      precio,
      tiempo_estimado_minutos,
      requiere_identificacion ? 1 : 0,
      activo ? 1 : 0
    ]
  });
  
  return result.insertId;
}

// Actualizar un servicio existente
export async function updateService(
  serviceId: number,
  {
    nombre,
    descripcion,
    precio,
    tiempo_estimado_minutos = null,
    requiere_identificacion = false,
    activo = true
  }: {
    nombre: string;
    descripcion: string;
    precio: number;
    tiempo_estimado_minutos?: number | null;
    requiere_identificacion?: boolean;
    activo?: boolean;
  }
) {
  const query = `
    UPDATE servicios 
    SET nombre = ?, descripcion = ?, precio = ?, tiempo_estimado_minutos = ?, 
        requiere_identificacion = ?, activo = ?, fecha_actualizacion = NOW()
    WHERE servicio_id = ?
  `;
  
  await executeQuery({
    query,
    values: [
      nombre.trim(),
      descripcion.trim(),
      precio,
      tiempo_estimado_minutos,
      requiere_identificacion ? 1 : 0,
      activo ? 1 : 0,
      serviceId
    ]
  });
  
  return true;
}

// Activar/desactivar servicio
export async function toggleServiceStatus(serviceId: number, activo: boolean) {
  const query = `
    UPDATE servicios 
    SET activo = ?, fecha_actualizacion = NOW()
    WHERE servicio_id = ?
  `;
  
  await executeQuery({
    query,
    values: [activo ? 1 : 0, serviceId]
  });
  
  return true;
}

// Verificar si un servicio está en uso

// Función mejorada para isServiceInUse (asegurar que existe)
export async function isServiceInUse(serviceId: number): Promise<boolean> {
  const query = `
    SELECT COUNT(*) as count 
    FROM detalles_orden_servicios 
    WHERE servicio_id = ?
  `;
  
  const [result] = await executeQuery<[{count: number}]>({
    query,
    values: [serviceId]
  });
  
  return result.count > 0;
}
// Crear un nuevo producto
export async function createProduct({
  nombre,
  descripcion = null,
  precio,
  categoria_id,
  codigo_barras = null,
  stock = 0,
  stock_minimo = 0,
  activo = true
}: {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  categoria_id: number;
  codigo_barras?: string | null;
  stock?: number;
  stock_minimo?: number;
  activo?: boolean;
}) {
  const query = `
    INSERT INTO productos (
      nombre, descripcion, precio, categoria_id, codigo_barras,
      stock, stock_minimo, activo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await executeQuery<any>({
    query,
    values: [
      nombre.trim(),
      descripcion?.trim() || null,
      precio,
      categoria_id,
      codigo_barras?.trim() || null,
      stock,
      stock_minimo,
      activo ? 1 : 0
    ]
  });
  
  return result.insertId;
}

// Actualizar un producto existente
export async function updateProduct(
  productId: number,
  {
    nombre,
    descripcion = null,
    precio,
    costo = 0,
    categoria_id,
    codigo_barras = null,
    stock = 0,
    stock_minimo = 0,
    activo = true
  }: {
    nombre: string;
    descripcion?: string | null;
    precio: number;
    costo?: number;
    categoria_id: number;
    codigo_barras?: string | null;
    stock?: number;
    stock_minimo?: number;
    activo?: boolean;
  }
) {
  const query = `
    UPDATE productos 
    SET nombre = ?, descripcion = ?, precio = ?, costo = ?, categoria_id = ?, 
        codigo_barras = ?, stock = ?, stock_minimo = ?, activo = ?,
        fecha_actualizacion = NOW()
    WHERE producto_id = ?
  `;
  
  await executeQuery({
    query,
    values: [
      nombre.trim(),
      descripcion?.trim() || null,
      precio,
      costo,
      categoria_id,
      codigo_barras?.trim() || null,
      stock,
      stock_minimo,
      activo ? 1 : 0,
      productId
    ]
  });
  
  return true;
}

// Función faltante para getProductById (debe ser importada en los archivos API)
export async function getProductById(productId: number) {
  const query = `
    SELECT p.*, c.nombre as categoria_nombre
    FROM productos p
    LEFT JOIN categorias_productos c ON p.categoria_id = c.categoria_id
    WHERE p.producto_id = ?
  `;
  
  const result = await executeQuery<any[]>({
    query,
    values: [productId]
  });
  
  return result.length > 0 ? result[0] : null;
}

// Función mejorada para isProductInUse (asegurar que existe)
export async function isProductInUse(productId: number): Promise<boolean> {
  const query = `
    SELECT COUNT(*) as count 
    FROM detalles_orden_productos 
    WHERE producto_id = ?
  `;
  
  const [result] = await executeQuery<[{count: number}]>({
    query,
    values: [productId]
  });
  
  return result.count > 0;
}

// Función mejorada para barcodeExists (asegurar que funciona correctamente)
export async function barcodeExists(codigo_barras: string, excludeProductId?: number): Promise<boolean> {
  let query = `
    SELECT producto_id FROM productos WHERE codigo_barras = ?
  `;
  const values: any[] = [codigo_barras];
  
  if (excludeProductId !== undefined && excludeProductId !== null) {
    query += ` AND producto_id != ?`;
    values.push(excludeProductId);
  }
  
  const result = await executeQuery<any[]>({
    query,
    values
  });
  
  return result.length > 0;
}



// Función mejorada para categoryExists (asegurar que existe)
export async function categoryExists(categoryId: number): Promise<boolean> {
  const query = `
    SELECT categoria_id FROM categorias_productos 
    WHERE categoria_id = ? AND activo = TRUE
  `;
  
  const result = await executeQuery<any[]>({
    query,
    values: [categoryId]
  });
  
  return result.length > 0;
}
// Obtener productos con stock bajo
export async function getLowStockProducts() {
  const query = `
    SELECT p.*, c.nombre as categoria_nombre
    FROM productos p
    JOIN categorias_productos c ON p.categoria_id = c.categoria_id
    WHERE p.stock <= p.stock_minimo AND p.activo = TRUE
    ORDER BY p.stock ASC
  `;
  
  return executeQuery<any[]>({
    query,
    values: []
  });
}

// Obtener productos agotados
export async function getOutOfStockProducts() {
  const query = `
    SELECT p.*, c.nombre as categoria_nombre
    FROM productos p
    JOIN categorias_productos c ON p.categoria_id = c.categoria_id
    WHERE p.stock <= 0 AND p.activo = TRUE
    ORDER BY p.nombre ASC
  `;
  
  return executeQuery<any[]>({
    query,
    values: []
  });
}

// CATEGORÍAS - Funciones adicionales

// Crear una nueva categoría de producto
export async function createProductCategory({
  nombre,
  descripcion = null,
  activo = true
}: {
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}) {
  const query = `
    INSERT INTO categorias_productos (nombre, descripcion, activo)
    VALUES (?, ?, ?)
  `;
  
  const result = await executeQuery<any>({
    query,
    values: [
      nombre.trim(),
      descripcion?.trim() || null,
      activo ? 1 : 0
    ]
  });
  
  return result.insertId;
}



// Actualizar una categoría de producto
export async function updateProductCategory(
  categoryId: number,
  {
    nombre,
    descripcion = null,
    activo = true
  }: {
    nombre: string;
    descripcion?: string | null;
    activo?: boolean;
  }
) {
  const query = `
    UPDATE categorias_productos 
    SET nombre = ?, descripcion = ?, activo = ?, fecha_actualizacion = NOW()
    WHERE categoria_id = ?
  `;
  
  await executeQuery({
    query,
    values: [
      nombre.trim(),
      descripcion?.trim() || null,
      activo ? 1 : 0,
      categoryId
    ]
  });
  
  return true;
}

// Obtener una categoría por ID
export async function getProductCategoryById(categoryId: number) {
  const query = `
    SELECT * FROM categorias_productos WHERE categoria_id = ?
  `;
  
  const result = await executeQuery<any[]>({
    query,
    values: [categoryId]
  });
  
  return result.length > 0 ? result[0] : null;
}

// Verificar si una categoría está en uso
export async function isProductCategoryInUse(categoryId: number) {
  const query = `
    SELECT COUNT(*) as count 
    FROM productos 
    WHERE categoria_id = ?
  `;
  
  const [result] = await executeQuery<[{count: number}]>({
    query,
    values: [categoryId]
  });
  
  return result.count > 0;
}

// Obtener todos los servicios disponibles
export async function getAllServices(onlyActive: boolean = true) {
  const query = `
    SELECT * FROM servicios
    ${onlyActive ? 'WHERE activo = TRUE' : ''}
    ORDER BY precio ASC
  `;
  
  return executeQuery<any[]>({
    query,
    values: []
  });
}

// Obtener un servicio por ID
export async function getServiceById(serviceId: number) {
  const query = `SELECT * FROM servicios WHERE servicio_id = ?`;
  
  const result = await executeQuery<any[]>({
    query,
    values: [serviceId]
  });
  
  return result.length > 0 ? result[0] : null;
}

// Obtener todas las categorías de productos
export async function getAllProductCategories(onlyActive: boolean = true) {
  const query = `
    SELECT * FROM categorias_productos
    ${onlyActive ? 'WHERE activo = TRUE' : ''}
    ORDER BY nombre ASC
  `;
  
  return executeQuery<any[]>({
    query,
    values: []
  });
}

// Obtener productos por categoría
export async function getProductsByCategory(categoryId: number, onlyActive: boolean = true) {
  const query = `
    SELECT p.*, 
      CASE 
        WHEN p.stock <= 0 THEN 'Agotado'
        WHEN p.stock < p.stock_minimo THEN 'Bajo'
        ELSE 'Disponible'
      END as estado_stock
    FROM productos p
    WHERE p.categoria_id = ? ${onlyActive ? 'AND p.activo = TRUE' : ''}
    ORDER BY p.nombre ASC
  `;
  
  return executeQuery<any[]>({
    query,
    values: [categoryId]
  });
}

// Buscar productos por nombre o código de barras
export async function searchProducts(searchTerm: string, onlyActive: boolean = true) {
  const query = `
    SELECT p.*, 
      c.nombre as categoria_nombre,
      CASE 
        WHEN p.stock <= 0 THEN 'Agotado'
        WHEN p.stock < p.stock_minimo THEN 'Bajo'
        ELSE 'Disponible'
      END as estado_stock
    FROM productos p
    JOIN categorias_productos c ON p.categoria_id = c.categoria_id
    WHERE (p.nombre LIKE ? OR p.codigo_barras LIKE ?) ${onlyActive ? 'AND p.activo = TRUE' : ''}
    ORDER BY p.nombre ASC
    LIMIT 20
  `;
  
  const searchParam = `%${searchTerm}%`;
  
  return executeQuery<any[]>({
    query,
    values: [searchParam, searchParam]
  });
}

// Verificar disponibilidad de stock
export async function checkProductStock(productId: number, quantity: number) {
  const query = `
    SELECT 
      producto_id, 
      stock,
      CASE WHEN stock >= ? THEN TRUE ELSE FALSE END as disponible
    FROM productos
    WHERE producto_id = ?
  `;
  
  const result = await executeQuery<any[]>({
    query,
    values: [quantity, productId]
  });
  
  if (result.length === 0) return { exists: false, available: false };
  
  return { 
    exists: true, 
    available: result[0].disponible === 1,
    currentStock: result[0].stock
  };
}

// Ordenes Pos
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
  // ✅ ESTOS SON LOS TOTALES CORRECTOS QUE VIENEN DEL FRONTEND
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
  subtotal: number;  // ✅ INCLUYE SERVICIOS + PRODUCTOS
  iva: number;       // ✅ 16% DEL SUBTOTAL TOTAL
  total: number;     // ✅ SUBTOTAL + IVA
}) {

  // 1. Crear la orden principal
  await executeQuery({
    query: `CALL CrearOrden(?, ?, NULL, ?, ?, @orden_id, @codigo_orden)`,
    values: [clienteId, empleadoId, fechaEntregaEstimada, notasOrder]
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
              modelo_id, marca, modelo, descripcion_calzado
            ) VALUES (?, ?, 1, ?, 0.00, ?, ?, ?, ?, ?)
          `,
          values: [
            ordenId, servicio.servicioId, precioUnitario, precioUnitario,
            servicio.modeloId ?? null, servicio.marca?.trim() || null,
            servicio.modelo?.trim() || null, servicio.descripcion?.trim() || null
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
            modelo_id, marca, modelo, descripcion_calzado
          ) VALUES (?, ?, ?, ?, 0.00, ?, NULL, NULL, NULL, NULL)
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
      subtotal, // ✅ YA INCLUYE SERVICIOS + PRODUCTOS
      iva,      // ✅ 16% DEL SUBTOTAL TOTAL
      total,    // ✅ SUBTOTAL + IVA
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
  estadoId?: number | null;
  estadoPago?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  searchQuery?: string | null;
  empleadoId?: number | null;
}) {
  // Asegúrate de que page y pageSize sean números enteros
  const pageSafeValue = parseInt(String(page), 10) || 1;
  const pageSizeSafeValue = parseInt(String(pageSize), 10) || 10;
  const offset = (pageSafeValue - 1) * pageSizeSafeValue;
  
  let query = `
    SELECT * FROM vw_ordenes_detalle
    WHERE 1=1
  `;
  
  const queryParams: any[] = [];
  
  if (estadoId) {
    query += ` AND estado_actual_id = ?`;
    queryParams.push(estadoId);
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
  
  // MODIFICACIÓN CLAVE: En lugar de parámetros, usar valores directamente en la consulta
  query += ` ORDER BY fecha_recepcion DESC LIMIT ${pageSizeSafeValue} OFFSET ${offset}`;
  
  try {
    const orders = await executeQuery<any[]>({
      query,
      values: queryParams  // Ya no incluimos los parámetros de LIMIT y OFFSET
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
  
  return {
    ...order,
    servicios: services,
    productos: products,
    historial: history,
    pagos: payments,
    imagenes: images
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
  
  // 2. Registrar el evento en historial_ubicaciones (si existe esta tabla en tu esquema)
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
// Pagos

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
  empleadoId: number;
}) {
  const query = `
    CALL RegistrarPago(?, ?, ?, ?, ?, ?, @pago_id);
    SELECT @pago_id as pago_id;
  `;
  
  const [result] = await executeQuery<any>({
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
  
  return {
    pagoId: result[0].pago_id
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

// Inventario

// Obtener estado actual del inventario
export async function getInventory({
  categoryId = null,
  onlyLowStock = false,
  searchQuery = null,
  page = 1,
  pageSize = 20
}: {
  categoryId?: number | null;
  onlyLowStock?: boolean;
  searchQuery?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT * FROM vw_inventario_actual
    WHERE 1=1
  `;

  const queryParams: any[] = [];

  if (categoryId !== null && categoryId !== undefined) {
    query += ` AND categoria_id = ?`;
    queryParams.push(categoryId);
  }

  if (onlyLowStock) {
    query += ` AND (stock <= stock_minimo)`;
  }

  if (searchQuery !== null && searchQuery !== undefined && searchQuery !== '') {
    query += ` AND (nombre LIKE ? OR codigo_barras LIKE ?)`;
    const searchParam = `%${searchQuery}%`;
    queryParams.push(searchParam, searchParam);
  }

  // Contar total de registros
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const [countResult] = await executeQuery<[{ total: number }]>({
    query: countQuery,
    values: queryParams
  });

  // Interpolamos LIMIT y OFFSET como números (seguros)
  query += ` ORDER BY categoria, producto_nombre ASC LIMIT ${pageSize} OFFSET ${offset}`;

  const products = await executeQuery<any[]>({
    query,
    values: queryParams
  });

  return {
    products,
    total: countResult.total,
    page,
    pageSize,
    totalPages: Math.ceil(countResult.total / pageSize)
  };
}



// Registrar movimiento de inventario (entrada, salida, ajuste)
export async function registerInventoryMovement({
  productoId,
  tipoMovimiento,
  cantidad,
  ordenId = null,
  empleadoId,
  motivo = null
}: {
  productoId: number;
  tipoMovimiento: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  ordenId?: number | null;
  empleadoId: number;
  motivo?: string | null;
}) {
  // Primero obtenemos el stock actual
  const [stockResult] = await executeQuery<[{stock: number}]>({
    query: `SELECT stock FROM productos WHERE producto_id = ?`,
    values: [productoId]
  });
  
  if (!stockResult) {
    throw new Error('Producto no encontrado');
  }
  
  const stockAnterior = stockResult.stock;
  
  // Calculamos el nuevo stock
  let stockNuevo;
  
  if (tipoMovimiento === 'entrada') {
    stockNuevo = stockAnterior + cantidad;
  } else if (tipoMovimiento === 'salida') {
    stockNuevo = stockAnterior - cantidad;
    
    if (stockNuevo < 0) {
      throw new Error('Stock insuficiente');
    }
  } else {
    stockNuevo = cantidad; // En caso de ajuste, se establece directamente
  }
  
  // Registrar el movimiento
  const movementQuery = `
    INSERT INTO inventario_movimientos (
      producto_id, 
      tipo_movimiento, 
      cantidad, 
      stock_anterior, 
      stock_nuevo, 
      orden_id, 
      empleado_id, 
      motivo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  await executeQuery({
    query: movementQuery,
    values: [
      productoId,
      tipoMovimiento,
      cantidad,
      stockAnterior,
      stockNuevo,
      ordenId,
      empleadoId,
      motivo
    ]
  });
  
  // Actualizar el stock en la tabla de productos
  await executeQuery({
    query: `UPDATE productos SET stock = ? WHERE producto_id = ?`,
    values: [stockNuevo, productoId]
  });
  
  return {
    stockAnterior,
    stockNuevo
  };
}

// Obtener historial de movimientos de inventario
export async function getInventoryMovements({
  productoId = null,
  tipoMovimiento = null,
  fechaInicio = null,
  fechaFin = null,
  empleadoId = null,
  page = 1,
  pageSize = 20
}: {
  productoId?: number | null;
  tipoMovimiento?: 'entrada' | 'salida' | 'ajuste' | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  empleadoId?: number | null;
  page?: number;
  pageSize?: number;
}) {
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT * FROM vw_movimientos_inventario
    WHERE 1=1
  `;
  
  const queryParams: any[] = [];
  
  if (productoId) {
    query += ` AND producto_id = ?`;
    queryParams.push(productoId);
  }
  
  if (tipoMovimiento) {
    query += ` AND tipo_movimiento = ?`;
    queryParams.push(tipoMovimiento);
  }
  
  if (fechaInicio) {
    query += ` AND fecha_movimiento >= ?`;
    queryParams.push(fechaInicio);
  }
  
  if (fechaFin) {
    query += ` AND fecha_movimiento <= ?`;
    queryParams.push(fechaFin);
  }
  
  if (empleadoId) {
    query += ` AND empleado_id = ?`;
    queryParams.push(empleadoId);
  }
  
  // Contar total de registros para paginación
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  
  const [countResult] = await executeQuery<[{total: number}]>({
    query: countQuery,
    values: queryParams
  });
  
  // Añadir límite y ordenamiento
  query += ` ORDER BY fecha_movimiento DESC LIMIT ? OFFSET ?`;
  queryParams.push(pageSize, offset);
  
  const movements = await executeQuery<any[]>({
    query,
    values: queryParams
  });
  
  return {
    movements,
    total: countResult.total,
    page,
    pageSize,
    totalPages: Math.ceil(countResult.total / pageSize)
  };
}

// Reportes y Estadisticas

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
  // lib/db.ts (continuación de funciones para reportes)

  // Resumen de inventario (continuación)
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

// Imagenes de los tenis

// Registrar un nuevo archivo de media
export async function registerMediaFile({
  tipo,
  entidadTipo,
  entidadId,
  nombreArchivo,
  extension,
  tamano,
  s3Bucket,
  s3Key,
  s3Url,
  descripcion = null,
  esPublico = false,
  empleadoId
}: {
  tipo: 'calzado_entrada' | 'calzado_salida' | 'identificacion' | 'otro';
  entidadTipo: 'orden' | 'cliente' | 'empleado' | 'producto' | 'servicio' | 'marca';
  entidadId: number;
  nombreArchivo: string;
  extension: string;
  tamano: number;
  s3Bucket: string;
  s3Key: string;
  s3Url: string;
  descripcion?: string | null;
  esPublico?: boolean;
  empleadoId: number;
}) {
  // Usar el procedimiento almacenado RegistrarArchivoMedia
  const query = `
    CALL RegistrarArchivoMedia(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @archivo_id);
    SELECT @archivo_id as archivo_id;
  `;
  
  const [result] = await executeQuery<any>({
    query,
    values: [
      tipo,
      entidadTipo,
      entidadId,
      nombreArchivo,
      extension,
      tamano,
      s3Bucket,
      s3Key,
      s3Url,
      descripcion,
      esPublico ? 1 : 0,
      empleadoId
    ]
  });
  
  return {
    archivoId: result[0].archivo_id
  };
}

// Obtener archivos de media por entidad
export async function getMediaFiles(entidadTipo: string, entidadId: number) {
  const query = `
    SELECT * FROM archivos_media
    WHERE entidad_tipo = ? AND entidad_id = ?
    ORDER BY tipo, fecha_creacion DESC
  `;
  
  return executeQuery<any[]>({
    query,
    values: [entidadTipo, entidadId]
  });
}

// Registrar imagen de identificación para una orden
export async function registerIdentificationImage({
  ordenId,
  nombreArchivo,
  extension,
  tamano,
  s3Bucket,
  s3Key,
  s3Url,
  empleadoId
}: {
  ordenId: number;
  nombreArchivo: string;
  extension: string;
  tamano: number;
  s3Bucket: string;
  s3Key: string;
  s3Url: string;
  empleadoId: number;
}) {
  // Registrar el archivo y marcar la orden como con identificación
  const result = await registerMediaFile({
    tipo: 'identificacion',
    entidadTipo: 'orden',
    entidadId: ordenId,
    nombreArchivo,
    extension,
    tamano,
    s3Bucket,
    s3Key,
    s3Url,
    descripcion: 'Identificación para orden',
    esPublico: false,
    empleadoId
  });
  
  // Actualizar el estado de identificación en la orden
  await executeQuery({
    query: `
      UPDATE ordenes 
      SET tiene_identificacion_registrada = TRUE 
      WHERE orden_id = ?
    `,
    values: [ordenId]
  });
  
  return result;
}

// Empleados

// Obtener todos los empleados activos
export async function getActiveEmployees() {
  const query = `
    SELECT 
      empleado_id, 
      nombre, 
      apellidos, 
      telefono, 
      email, 
      puesto
    FROM empleados
    WHERE activo = TRUE
    ORDER BY nombre, apellidos
  `;
  
  return executeQuery<any[]>({
    query,
    values: []
  });
}

// Obtener detalles de un empleado
export async function getEmployeeById(empleadoId: number) {
  const query = `
    SELECT * FROM empleados
    WHERE empleado_id = ?
  `;
  
  const [employee] = await executeQuery<any[]>({
    query,
    values: [empleadoId]
  });
  
  if (!employee) return null;
  
  // Obtener usuario asociado si existe
  if (employee.usuario_id) {
    const userQuery = `
      SELECT usuario_id, email, rol, activo
      FROM usuarios
      WHERE usuario_id = ?
    `;
    
    const [user] = await executeQuery<any[]>({
      query: userQuery,
      values: [employee.usuario_id]
    });
    
    if (user) {
      employee.usuario = user;
    }
  }
  
  return employee;
}

// Buscar empleado por email
export async function getEmployeeByEmail(email: string) {
  const query = `
    SELECT e.* 
    FROM empleados e
    JOIN usuarios u ON e.usuario_id = u.usuario_id
    WHERE u.email = ?
  `;
  
  const [employee] = await executeQuery<any[]>({
    query,
    values: [email]
  });
  
  return employee || null;
}

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

// Agregar estas funciones al final de tu archivo lib/db.ts

// Configuración del sistema

// Obtener una configuración por clave
export async function getConfigValue(clave: string): Promise<string | null> {
  try {
    const result = await executeQuery<any[]>({
      query: 'SELECT valor FROM configuracion WHERE clave = ?',
      values: [clave]
    });
    
    return result.length > 0 ? result[0].valor : null;
  } catch (error) {
    console.error(`Error obteniendo configuración ${clave}:`, error);
    return null;
  }
}

// Obtener múltiples configuraciones por claves
export async function getConfigValues(claves: string[]): Promise<{[key: string]: string}> {
  try {
    const placeholders = claves.map(() => '?').join(',');
    const result = await executeQuery<any[]>({
      query: `SELECT clave, valor FROM configuracion WHERE clave IN (${placeholders})`,
      values: claves
    });
    
    const config: {[key: string]: string} = {};
    result.forEach(row => {
      config[row.clave] = row.valor;
    });
    
    return config;
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    return {};
  }
}

// Actualizar o crear una configuración
export async function setConfigValue(clave: string, valor: string, descripcion?: string): Promise<void> {
  try {
    // Verificar si la configuración ya existe
    const existing = await executeQuery<any[]>({
      query: 'SELECT config_id FROM configuracion WHERE clave = ?',
      values: [clave]
    });
    
    if (existing.length > 0) {
      // Actualizar configuración existente
      await executeQuery({
        query: 'UPDATE configuracion SET valor = ?, fecha_actualizacion = NOW() WHERE clave = ?',
        values: [valor, clave]
      });
    } else {
      // Crear nueva configuración
      const desc = descripcion || `Configuración para ${clave}`;
      await executeQuery({
        query: 'INSERT INTO configuracion (clave, valor, descripcion, fecha_creacion, fecha_actualizacion) VALUES (?, ?, ?, NOW(), NOW())',
        values: [clave, valor, desc]
      });
    }
  } catch (error) {
    console.error(`Error actualizando configuración ${clave}:`, error);
    throw error;
  }
}

// Obtener todas las configuraciones organizadas
export async function getAllSettings() {
  try {
    const settings = await executeQuery<any[]>({
      query: 'SELECT clave, valor, descripcion FROM configuracion ORDER BY clave',
      values: []
    });
    
    const organizedSettings = {
      business: {} as any,
      system: {} as any,
      pricing: {} as any
    };
    
    // Mapear configuraciones a las categorías apropiadas
    settings.forEach((setting) => {
      const { clave, valor } = setting;
      
      switch (clave) {
        // Configuración del negocio
        case 'nombre_empresa':
          organizedSettings.business.nombre_negocio = valor;
          break;
        case 'telefono_contacto':
          organizedSettings.business.telefono = valor;
          break;
        case 'email_contacto':
          organizedSettings.business.email = valor;
          break;
        case 'direccion_empresa':
          organizedSettings.business.direccion = valor;
          break;
        case 'website_empresa':
          organizedSettings.business.website = valor;
          break;
        case 'horario_atencion':
          // Extraer horarios de apertura y cierre del texto
          const horarioMatch = valor.match(/(\d{1,2}):(\d{2})\s*a\s*(\d{1,2}):(\d{2})/);
          if (horarioMatch) {
            organizedSettings.business.horario_apertura = `${horarioMatch[1].padStart(2, '0')}:${horarioMatch[2]}`;
            organizedSettings.business.horario_cierre = `${horarioMatch[3].padStart(2, '0')}:${horarioMatch[4]}`;
          } else {
            organizedSettings.business.horario_apertura = '10:00';
            organizedSettings.business.horario_cierre = '18:00';
          }
          // Extraer días de operación del texto
          if (valor.includes('Domingo a Sábado')) {
            organizedSettings.business.dias_operacion = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
          } else if (valor.includes('Lunes a Sábado')) {
            organizedSettings.business.dias_operacion = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
          } else {
            organizedSettings.business.dias_operacion = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
          }
          break;
        
        // Configuración de precios
        case 'iva_porcentaje':
          organizedSettings.pricing.iva_porcentaje = parseFloat(valor);
          break;
        case 'precio_minimo_requiere_id':
          organizedSettings.pricing.precio_minimo_id = parseFloat(valor);
          break;
        case 'descuento_maximo':
          organizedSettings.pricing.descuento_maximo = parseFloat(valor);
          break;
        case 'precio_delivery':
          organizedSettings.pricing.precio_delivery = parseFloat(valor);
          break;
        case 'tiempo_gracia_minutos':
          organizedSettings.pricing.tiempo_gracia_minutos = parseInt(valor);
          break;
        case 'propina_sugerida':
          try {
            organizedSettings.pricing.propina_sugerida = JSON.parse(valor);
          } catch {
            organizedSettings.pricing.propina_sugerida = [10, 15, 20];
          }
          break;
        
        // Configuraciones del sistema
        case 'notificaciones_email':
          organizedSettings.system.notificaciones_email = valor === 'true';
          break;
        case 'notificaciones_sms':
          organizedSettings.system.notificaciones_sms = valor === 'true';
          break;
        case 'backup_automatico':
          organizedSettings.system.backup_automatico = valor === 'true';
          break;
        case 'retencion_datos_dias':
          organizedSettings.system.retencion_datos_dias = parseInt(valor);
          break;
        case 'impresora_tickets':
          organizedSettings.system.impresora_tickets = valor;
          break;
        case 'formato_fecha':
          organizedSettings.system.formato_fecha = valor;
          break;
        case 'idioma':
          organizedSettings.system.idioma = valor;
          break;
        case 'tema_oscuro':
          organizedSettings.system.tema_oscuro = valor === 'true';
          break;
        
        default:
          break;
      }
    });
    
    // Establecer valores por defecto para configuraciones faltantes
    const defaultSettings = {
      business: {
        nombre_negocio: organizedSettings.business.nombre_negocio || 'VipCleaners',
        direccion: organizedSettings.business.direccion || '',
        telefono: organizedSettings.business.telefono || '',
        email: organizedSettings.business.email || '',
        website: organizedSettings.business.website || '',
        horario_apertura: organizedSettings.business.horario_apertura || '10:00',
        horario_cierre: organizedSettings.business.horario_cierre || '18:00',
        dias_operacion: organizedSettings.business.dias_operacion || ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
        moneda: 'MXN',
        timezone: 'America/Mexico_City',
        logo_url: ''
      },
      system: {
        notificaciones_email: organizedSettings.system.notificaciones_email ?? true,
        notificaciones_sms: organizedSettings.system.notificaciones_sms ?? false,
        backup_automatico: organizedSettings.system.backup_automatico ?? true,
        retencion_datos_dias: organizedSettings.system.retencion_datos_dias || 365,
        impresora_tickets: organizedSettings.system.impresora_tickets || '',
        formato_fecha: organizedSettings.system.formato_fecha || 'DD/MM/YYYY',
        idioma: organizedSettings.system.idioma || 'es',
        tema_oscuro: organizedSettings.system.tema_oscuro ?? false
      },
      pricing: {
        iva_porcentaje: organizedSettings.pricing.iva_porcentaje || 16,
        descuento_maximo: organizedSettings.pricing.descuento_maximo || 50,
        propina_sugerida: organizedSettings.pricing.propina_sugerida || [10, 15, 20],
        precio_delivery: organizedSettings.pricing.precio_delivery || 50,
        tiempo_gracia_minutos: organizedSettings.pricing.tiempo_gracia_minutos || 15,
        precio_minimo_id: organizedSettings.pricing.precio_minimo_id || 1000
      }
    };
    
    return defaultSettings;
  } catch (error) {
    console.error('Error obteniendo todas las configuraciones:', error);
    throw error;
  }
}

// Actualizar múltiples configuraciones
export async function updateSettings(settings: {
  business?: any;
  system?: any;
  pricing?: any;
}): Promise<void> {
  try {
    // Actualizar configuraciones del negocio
    if (settings.business) {
      const { business } = settings;
      
      if (business.nombre_negocio) {
        await setConfigValue('nombre_empresa', business.nombre_negocio, 'Nombre de la empresa');
      }
      if (business.telefono) {
        await setConfigValue('telefono_contacto', business.telefono, 'Teléfono de contacto principal');
      }
      if (business.email) {
        await setConfigValue('email_contacto', business.email, 'Email de contacto principal');
      }
      if (business.direccion) {
        await setConfigValue('direccion_empresa', business.direccion, 'Dirección física de la empresa');
      }
      if (business.website) {
        await setConfigValue('website_empresa', business.website, 'Sitio web de la empresa');
      }
      
      // Crear string de horario de atención
      if (business.horario_apertura && business.horario_cierre && business.dias_operacion) {
        const diasArray = business.dias_operacion;
        let diasTexto = 'Lunes a Viernes';
        
        if (diasArray.includes('sabado') && diasArray.includes('domingo')) {
          diasTexto = 'Domingo a Sábado';
        } else if (diasArray.includes('sabado')) {
          diasTexto = 'Lunes a Sábado';
        }
        
        const horarioTexto = `${diasTexto} de ${business.horario_apertura} a ${business.horario_cierre}`;
        await setConfigValue('horario_atencion', horarioTexto, 'Horario de atención al público');
      }
    }
    
    // Actualizar configuraciones de precios
    if (settings.pricing) {
      const { pricing } = settings;
      
      if (pricing.iva_porcentaje !== undefined) {
        await setConfigValue('iva_porcentaje', pricing.iva_porcentaje.toString(), 'Porcentaje de IVA aplicable');
      }
      if (pricing.precio_minimo_id !== undefined) {
        await setConfigValue('precio_minimo_requiere_id', pricing.precio_minimo_id.toString(), 'Precio mínimo a partir del cual se requiere identificación');
      }
      if (pricing.descuento_maximo !== undefined) {
        await setConfigValue('descuento_maximo', pricing.descuento_maximo.toString(), 'Descuento máximo permitido');
      }
      if (pricing.precio_delivery !== undefined) {
        await setConfigValue('precio_delivery', pricing.precio_delivery.toString(), 'Precio del servicio de delivery');
      }
      if (pricing.tiempo_gracia_minutos !== undefined) {
        await setConfigValue('tiempo_gracia_minutos', pricing.tiempo_gracia_minutos.toString(), 'Tiempo de gracia en minutos');
      }
      if (pricing.propina_sugerida) {
        await setConfigValue('propina_sugerida', JSON.stringify(pricing.propina_sugerida), 'Porcentajes sugeridos para propinas');
      }
    }
    
    // Actualizar configuraciones del sistema
    if (settings.system) {
      const { system } = settings;
      
      if (system.notificaciones_email !== undefined) {
        await setConfigValue('notificaciones_email', system.notificaciones_email.toString(), 'Habilitar notificaciones por email');
      }
      if (system.notificaciones_sms !== undefined) {
        await setConfigValue('notificaciones_sms', system.notificaciones_sms.toString(), 'Habilitar notificaciones por SMS');
      }
      if (system.backup_automatico !== undefined) {
        await setConfigValue('backup_automatico', system.backup_automatico.toString(), 'Habilitar respaldo automático');
      }
      if (system.retencion_datos_dias !== undefined) {
        await setConfigValue('retencion_datos_dias', system.retencion_datos_dias.toString(), 'Días de retención de datos');
      }
      if (system.impresora_tickets !== undefined) {
        await setConfigValue('impresora_tickets', system.impresora_tickets, 'Impresora para tickets');
      }
      if (system.formato_fecha !== undefined) {
        await setConfigValue('formato_fecha', system.formato_fecha, 'Formato de fecha del sistema');
      }
      if (system.idioma !== undefined) {
        await setConfigValue('idioma', system.idioma, 'Idioma del sistema');
      }
      if (system.tema_oscuro !== undefined) {
        await setConfigValue('tema_oscuro', system.tema_oscuro.toString(), 'Habilitar tema oscuro');
      }
    }
  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    throw error;
  }
}

// Función helper para obtener configuraciones específicas que se usan frecuentemente
export async function getBusinessConfig() {
  const keys = ['nombre_empresa', 'telefono_contacto', 'email_contacto', 'direccion_empresa', 'horario_atencion'];
  return await getConfigValues(keys);
}

export async function getPricingConfig() {
  const keys = ['iva_porcentaje', 'precio_minimo_requiere_id', 'descuento_maximo', 'precio_delivery'];
  return await getConfigValues(keys);
}

export async function getSystemConfig() {
  const keys = ['notificaciones_email', 'backup_automatico', 'formato_fecha', 'idioma'];
  return await getConfigValues(keys);
}

// ===============================================
// FUNCIONES ADICIONALES PARA lib/db.ts
// Agregar estas funciones al final del archivo
// ===============================================

// Función para asignar ubicaciones de almacenamiento
export async function assignStorageLocations(
  locations: {
    detalleServicioId: number;
    ordenId: number;
    cajaAlmacenamiento: string;
    codigoUbicacion: string;
    notasEspeciales?: string;
    empleadoId: number;
  }[]
): Promise<void> {
  try {
    // Procesar cada ubicación
    for (const location of locations) {
      await executeQuery({
        query: `CALL AsignarUbicacionAlmacenamiento(?, ?, ?, ?, ?, ?)`,
        values: [
          location.detalleServicioId,
          location.ordenId,
          location.cajaAlmacenamiento,
          location.codigoUbicacion,
          location.notasEspeciales || null,
          location.empleadoId
        ]
      });
    }
  } catch (error) {
    console.error('Error asignando ubicaciones:', error);
    throw error;
  }
}

// Función para buscar tenis por ubicación
export async function searchShoesByLocation(busqueda: string) {
  try {
    const result = await executeQuery<any[]>({
      query: `CALL BuscarTenisPorUbicacion(?)`,
      values: [busqueda]
    });
    
    // Los procedimientos almacenados devuelven un array anidado
    return result[0] || [];
  } catch (error) {
    console.error('Error buscando por ubicación:', error);
    throw error;
  }
}

// Función para obtener el mapa de ubicaciones
export async function getStorageLocationMap() {
  try {
    const result = await executeQuery<any[]>({
      query: `SELECT * FROM vw_mapa_ubicaciones ORDER BY caja_almacenamiento, codigo_ubicacion`,
      values: []
    });
    
    return result;
  } catch (error) {
    console.error('Error obteniendo mapa de ubicaciones:', error);
    throw error;
  }
}

// Función para obtener servicios pendientes de ubicación
export async function getServicesWithoutLocation(ordenId?: number) {
  let query = `
    SELECT 
      dos.detalle_servicio_id,
      dos.orden_id,
      o.codigo_orden,
      s.nombre AS servicio_nombre,
      dos.marca,
      dos.modelo,
      dos.descripcion_calzado,
      dos.cantidad,
      CONCAT(c.nombre, ' ', c.apellidos) AS cliente,
      c.telefono,
      o.fecha_recepcion,
      es.nombre AS estado_orden
    FROM detalles_orden_servicios dos
    JOIN ordenes o ON dos.orden_id = o.orden_id
    JOIN clientes c ON o.cliente_id = c.cliente_id
    JOIN servicios s ON dos.servicio_id = s.servicio_id
    JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
    WHERE 
      dos.caja_almacenamiento IS NULL 
      AND dos.codigo_ubicacion IS NULL
      AND (dos.marca IS NOT NULL OR dos.modelo IS NOT NULL)
      AND es.nombre != 'Entregado'
  `;
  
  const values: any[] = [];
  
  if (ordenId) {
    query += ` AND dos.orden_id = ?`;
    values.push(ordenId);
  }
  
  query += ` ORDER BY o.fecha_recepcion DESC`;
  
  try {
    const result = await executeQuery<any[]>({
      query,
      values
    });
    
    return result;
  } catch (error) {
    console.error('Error obteniendo servicios sin ubicación:', error);
    throw error;
  }
}

// Función para generar código de ubicación automático
export async function generateLocationCode(caja: string): Promise<string> {
  try {
    const result = await executeQuery<any[]>({
      query: `SELECT GenerarCodigoUbicacion(?) as codigo`,
      values: [caja]
    });
    
    return result[0]?.codigo || '';
  } catch (error) {
    console.error('Error generando código de ubicación:', error);
    throw error;
  }
}

// Función para obtener historial de ubicaciones de un par de tenis
export async function getLocationHistory(detalleServicioId: number) {
  try {
    const result = await executeQuery<any[]>({
      query: `
        SELECT 
          hu.*,
          CONCAT(e.nombre, ' ', e.apellidos) AS empleado_nombre,
          o.codigo_orden
        FROM historial_ubicaciones hu
        JOIN empleados e ON hu.empleado_id = e.empleado_id
        JOIN ordenes o ON hu.orden_id = o.orden_id
        WHERE hu.detalle_servicio_id = ?
        ORDER BY hu.fecha_asignacion DESC
      `,
      values: [detalleServicioId]
    });
    
    return result;
  } catch (error) {
    console.error('Error obteniendo historial de ubicaciones:', error);
    throw error;
  }
}

// Función para obtener estadísticas de almacenamiento
export async function getStorageStatistics() {
  try {
    // Total de pares almacenados
    const [totalStored] = await executeQuery<[{total: number}]>({
      query: `
        SELECT COUNT(*) as total
        FROM detalles_orden_servicios dos
        JOIN ordenes o ON dos.orden_id = o.orden_id
        JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
        WHERE 
          dos.caja_almacenamiento IS NOT NULL 
          AND dos.codigo_ubicacion IS NOT NULL
          AND es.nombre != 'Entregado'
      `,
      values: []
    });
    
    // Pares sin ubicación asignada
    const [pendingLocation] = await executeQuery<[{total: number}]>({
      query: `
        SELECT COUNT(*) as total
        FROM detalles_orden_servicios dos
        JOIN ordenes o ON dos.orden_id = o.orden_id
        JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
        WHERE 
          (dos.caja_almacenamiento IS NULL OR dos.codigo_ubicacion IS NULL)
          AND (dos.marca IS NOT NULL OR dos.modelo IS NOT NULL)
          AND es.nombre != 'Entregado'
      `,
      values: []
    });
    
    // Tiempo promedio de almacenamiento
    const [avgStorageTime] = await executeQuery<[{promedio: number}]>({
      query: `
        SELECT AVG(TIMESTAMPDIFF(DAY, dos.fecha_almacenamiento, NOW())) as promedio
        FROM detalles_orden_servicios dos
        JOIN ordenes o ON dos.orden_id = o.orden_id
        JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
        WHERE 
          dos.fecha_almacenamiento IS NOT NULL
          AND es.nombre != 'Entregado'
      `,
      values: []
    });
    
    // Cajas más utilizadas
    const topBoxes = await executeQuery<any[]>({
      query: `
        SELECT 
          caja_almacenamiento,
          COUNT(*) as total_pares
        FROM detalles_orden_servicios dos
        JOIN ordenes o ON dos.orden_id = o.orden_id
        JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
        WHERE 
          dos.caja_almacenamiento IS NOT NULL
          AND es.nombre != 'Entregado'
        GROUP BY caja_almacenamiento
        ORDER BY total_pares DESC
        LIMIT 5
      `,
      values: []
    });
    
    return {
      totalAlmacenados: totalStored.total,
      pendientesUbicacion: pendingLocation.total,
      tiempoPromedioAlmacenamiento: Math.round(avgStorageTime.promedio || 0),
      cajasMasUtilizadas: topBoxes
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de almacenamiento:', error);
    throw error;
  }
}

// Función actualizada para crear orden POS con soporte para ubicaciones
export async function createPosOrderWithLocations({
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
  total,
  ubicaciones = [] // Nuevo parámetro para ubicaciones
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
  ubicaciones?: {
    tempId: string;
    cajaAlmacenamiento: string;
    codigoUbicacion: string;
    notasEspeciales?: string;
  }[];
}) {
  try {
    // Crear la orden principal usando la función existente
    const { ordenId, codigoOrden } = await createPosOrder({
      clienteId,
      empleadoId,
      servicios,
      productos,
      requiereIdentificacion,
      tieneIdentificacionRegistrada,
      fechaEntregaEstimada,
      metodoPago,
      monto,
      notasOrder,
      subtotal,
      iva,
      total
    });
    
    // Si hay ubicaciones especificadas, asignarlas
    if (ubicaciones.length > 0) {
      // Obtener los detalles de servicios recién creados
      const serviciosCreados = await executeQuery<any[]>({
        query: `
          SELECT detalle_servicio_id, marca, modelo, descripcion_calzado
          FROM detalles_orden_servicios 
          WHERE orden_id = ? AND (marca IS NOT NULL OR modelo IS NOT NULL)
        `,
        values: [ordenId]
      });
      
      // Mapear ubicaciones con los servicios creados (esto requiere lógica adicional)
      // Por ahora, asumimos que las ubicaciones están en el mismo orden que los servicios
      const ubicacionesParaAsignar = [];
      
      for (let i = 0; i < Math.min(ubicaciones.length, serviciosCreados.length); i++) {
        ubicacionesParaAsignar.push({
          detalleServicioId: serviciosCreados[i].detalle_servicio_id,
          ordenId,
          cajaAlmacenamiento: ubicaciones[i].cajaAlmacenamiento,
          codigoUbicacion: ubicaciones[i].codigoUbicacion,
          notasEspeciales: ubicaciones[i].notasEspeciales,
          empleadoId
        });
      }
      
      // Asignar las ubicaciones
      if (ubicacionesParaAsignar.length > 0) {
        await assignStorageLocations(ubicacionesParaAsignar);
      }
    }
    
    return { ordenId, codigoOrden };
  } catch (error) {
    console.error('Error creando orden POS con ubicaciones:', error);
    throw error;
  }
}