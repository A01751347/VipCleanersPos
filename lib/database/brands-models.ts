import { executeQuery } from './connection';

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