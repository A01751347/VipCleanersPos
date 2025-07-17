import { executeQuery } from './connection';

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