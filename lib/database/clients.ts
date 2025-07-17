import { executeQuery } from './connection';

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