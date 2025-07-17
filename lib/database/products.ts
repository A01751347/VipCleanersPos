import { executeQuery } from './connection';

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

// Obtener un producto por ID
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

// Verificar si un producto está en uso
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

// Verificar si existe un código de barras
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

// Verificar si existe una categoría
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