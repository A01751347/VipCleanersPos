import 'server-only';
import { query, queryOne, BusinessError } from './client';

// ---------------------------------------------------------------- Servicios
export async function getServicios(soloActivos = true) {
  return query(
    `SELECT * FROM servicios ${soloActivos ? 'WHERE activo' : ''} ORDER BY nombre`
  );
}

export async function getServicioPorId(servicioId: number) {
  return queryOne(`SELECT * FROM servicios WHERE servicio_id = $1`, [servicioId]);
}

export async function crearServicio(input: {
  nombre: string;
  descripcion?: string;
  precio: number;
  tiempoEstimadoMinutos?: number;
  requiereIdentificacion?: boolean;
  imagenUrl?: string | null;
}) {
  if (!input.nombre?.trim()) throw new BusinessError('El nombre del servicio es obligatorio.');
  if (!(input.precio >= 0)) throw new BusinessError('El precio debe ser mayor o igual a cero.');
  return queryOne(
    `INSERT INTO servicios (nombre, descripcion, precio, tiempo_estimado_minutos,
                            requiere_identificacion, imagen_url)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      input.nombre.trim(),
      input.descripcion?.trim() ?? '',
      input.precio,
      input.tiempoEstimadoMinutos ?? 60,
      input.requiereIdentificacion ?? false,
      input.imagenUrl ?? null,
    ]
  );
}

export async function actualizarServicio(servicioId: number, input: Record<string, unknown>) {
  return queryOne(
    `UPDATE servicios SET
       nombre = COALESCE($2, nombre),
       descripcion = COALESCE($3, descripcion),
       precio = COALESCE($4, precio),
       tiempo_estimado_minutos = COALESCE($5, tiempo_estimado_minutos),
       requiere_identificacion = COALESCE($6, requiere_identificacion),
       imagen_url = COALESCE($7, imagen_url),
       activo = COALESCE($8, activo)
     WHERE servicio_id = $1 RETURNING *`,
    [
      servicioId,
      input.nombre ?? null,
      input.descripcion ?? null,
      input.precio ?? null,
      input.tiempo_estimado_minutos ?? null,
      input.requiere_identificacion ?? null,
      input.imagen_url ?? null,
      input.activo ?? null,
    ]
  );
}

export async function alternarServicio(servicioId: number) {
  return queryOne(
    `UPDATE servicios SET activo = NOT activo WHERE servicio_id = $1 RETURNING *`,
    [servicioId]
  );
}

// ---------------------------------------------------------------- Productos
export async function getProductos(opciones: {
  categoriaId?: number | null;
  busqueda?: string | null;
  soloActivos?: boolean;
  pagina?: number;
  porPagina?: number;
} = {}) {
  const pagina = Math.max(1, Math.trunc(opciones.pagina ?? 1));
  const porPagina = Math.min(200, Math.max(1, Math.trunc(opciones.porPagina ?? 50)));
  const offset = (pagina - 1) * porPagina;

  const condiciones: string[] = [];
  const valores: unknown[] = [];
  if (opciones.soloActivos !== false) condiciones.push('p.activo');
  if (opciones.categoriaId) {
    valores.push(opciones.categoriaId);
    condiciones.push(`p.categoria_id = $${valores.length}`);
  }
  if (opciones.busqueda?.trim()) {
    valores.push(`%${opciones.busqueda.trim()}%`);
    condiciones.push(`(p.nombre ILIKE $${valores.length} OR p.codigo_barras ILIKE $${valores.length})`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM productos p ${where}`,
    valores
  );

  const productos = await query(
    `SELECT p.*, c.nombre AS categoria_nombre
     FROM productos p JOIN categorias_productos c ON c.categoria_id = p.categoria_id
     ${where} ORDER BY p.nombre
     LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, porPagina, offset]
  );

  return { productos, products: productos, total, pagina, porPagina,
           totalPaginas: Math.max(1, Math.ceil(total / porPagina)) };
}

export async function getProductoPorId(productoId: number) {
  return queryOne(
    `SELECT p.*, c.nombre AS categoria_nombre
     FROM productos p JOIN categorias_productos c ON c.categoria_id = p.categoria_id
     WHERE p.producto_id = $1`,
    [productoId]
  );
}

export async function crearProducto(input: Record<string, any>) {
  if (!input.nombre?.trim()) throw new BusinessError('El nombre del producto es obligatorio.');
  if (!input.categoria_id) throw new BusinessError('La categoría es obligatoria.');
  return queryOne(
    `INSERT INTO productos (categoria_id, nombre, descripcion, precio, costo,
                            stock, stock_minimo, codigo_barras, imagen_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NULLIF($8,''),$9) RETURNING *`,
    [
      input.categoria_id,
      input.nombre.trim(),
      input.descripcion?.trim() ?? '',
      input.precio ?? 0,
      input.costo ?? 0,
      input.stock ?? 0,
      input.stock_minimo ?? 5,
      input.codigo_barras?.trim() ?? '',
      input.imagen_url ?? null,
    ]
  );
}

/**
 * Actualiza el producto SIN tocar las existencias: el stock sólo cambia por un
 * movimiento de inventario, para que siempre quede bitácora de quién y por qué.
 */
export async function actualizarProducto(productoId: number, input: Record<string, any>) {
  return queryOne(
    `UPDATE productos SET
       categoria_id = COALESCE($2, categoria_id),
       nombre = COALESCE($3, nombre),
       descripcion = COALESCE($4, descripcion),
       precio = COALESCE($5, precio),
       costo = COALESCE($6, costo),
       stock_minimo = COALESCE($7, stock_minimo),
       codigo_barras = COALESCE(NULLIF($8,''), codigo_barras),
       imagen_url = COALESCE($9, imagen_url),
       activo = COALESCE($10, activo)
     WHERE producto_id = $1 RETURNING *`,
    [
      productoId,
      input.categoria_id ?? null,
      input.nombre ?? null,
      input.descripcion ?? null,
      input.precio ?? null,
      input.costo ?? null,
      input.stock_minimo ?? null,
      input.codigo_barras ?? '',
      input.imagen_url ?? null,
      input.activo ?? null,
    ]
  );
}

export async function desactivarProducto(productoId: number) {
  return queryOne(
    `UPDATE productos SET activo = FALSE WHERE producto_id = $1 RETURNING producto_id`,
    [productoId]
  );
}

// -------------------------------------------------------------- Categorías
export async function getCategorias(soloActivas = true) {
  return query(
    `SELECT c.*, COUNT(p.producto_id)::int AS total_productos
     FROM categorias_productos c
     LEFT JOIN productos p ON p.categoria_id = c.categoria_id AND p.activo
     ${soloActivas ? 'WHERE c.activo' : ''}
     GROUP BY c.categoria_id ORDER BY c.nombre`
  );
}

// -------------------------------------------------------- Marcas y modelos
export async function getMarcas(soloActivas = true) {
  return query(`SELECT * FROM marcas ${soloActivas ? 'WHERE activo' : ''} ORDER BY nombre`);
}

export async function getModelosPorMarca(marcaId: number) {
  return query(
    `SELECT * FROM modelos_calzado WHERE marca_id = $1 AND activo ORDER BY nombre`,
    [marcaId]
  );
}

// ------------------------------------------------------- Zonas de cobertura
export async function getZonasCobertura() {
  return query(`SELECT * FROM zonas_cobertura WHERE activo ORDER BY cp_inicio`);
}

/**
 * Valida un código postal contra las zonas configuradas.
 * Antes las zonas y sus costos estaban escritos en el código de la ruta, así
 * que cambiar un precio de recolección exigía volver a desplegar.
 */
export async function validarZonaPickup(codigoPostal: string) {
  const cp = (codigoPostal ?? '').trim();
  if (!/^\d{5}$/.test(cp)) {
    return { disponible: false, zona: null, costo: 0, tiempo: '' };
  }
  const zona = await queryOne<{ nombre: string; costo: number; tiempo_estimado: string }>(
    `SELECT nombre, costo, tiempo_estimado FROM zonas_cobertura
     WHERE activo AND $1 BETWEEN cp_inicio AND cp_fin
     ORDER BY costo LIMIT 1`,
    [cp]
  );
  if (!zona) return { disponible: false, zona: null, costo: 0, tiempo: '' };
  return {
    disponible: true,
    zona: zona.nombre,
    costo: Number(zona.costo),
    tiempo: zona.tiempo_estimado,
  };
}

// ------------------------------------------------------------------ Estados
export async function getEstadosServicio() {
  return query(`SELECT * FROM estados_servicio WHERE activo ORDER BY orden`);
}
