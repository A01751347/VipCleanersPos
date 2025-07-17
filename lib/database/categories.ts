import { executeQuery } from './connection';

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