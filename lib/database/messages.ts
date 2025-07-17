import { executeQuery } from './connection';

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
    values: []
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