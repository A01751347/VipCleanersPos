import 'server-only';
import type { PoolClient } from 'pg';
import { query, queryOne, withTransaction, BusinessError, NotFoundError } from './client';

export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste' | 'merma' | 'devolucion';

export interface MovimientoInput {
  productoId: number;
  tipo: TipoMovimiento;
  /** Para 'ajuste' es el stock final deseado; en el resto, la cantidad movida. */
  cantidad: number;
  ordenId?: number | null;
  empleadoId: number;
  motivo?: string | null;
}

/**
 * Registra un movimiento y actualiza las existencias, en un solo paso.
 *
 * Esta función existía pero nadie la llamaba: no había ruta de inventario, así
 * que `inventario_movimientos` estaba siempre vacía y no había forma de
 * resurtir. Las ventas descontaban con un UPDATE suelto que, sin existencia
 * suficiente, afectaba cero filas y no reportaba nada — sobreventa silenciosa.
 */
export async function registrarMovimiento(
  input: MovimientoInput,
  client?: PoolClient
): Promise<{ stockAnterior: number; stockNuevo: number; movimientoId: number }> {
  const ejecutar = async (c: PoolClient) => {
    const producto = await queryOne<{ stock: number; nombre: string }>(
      `SELECT stock, nombre FROM productos WHERE producto_id = $1 FOR UPDATE`,
      [input.productoId],
      c
    );
    if (!producto) throw new NotFoundError(`El producto ${input.productoId} no existe.`);

    const stockAnterior = producto.stock;
    const cantidad = Math.trunc(input.cantidad);
    if (cantidad < 0) throw new BusinessError('La cantidad no puede ser negativa.');

    let stockNuevo: number;
    switch (input.tipo) {
      case 'entrada':
      case 'devolucion':
        stockNuevo = stockAnterior + cantidad;
        break;
      case 'salida':
      case 'merma':
        stockNuevo = stockAnterior - cantidad;
        break;
      case 'ajuste':
        stockNuevo = cantidad;
        break;
      default:
        throw new BusinessError(`Tipo de movimiento no válido: ${input.tipo}`);
    }

    if (stockNuevo < 0) {
      throw new BusinessError(
        `Sin existencia suficiente de "${producto.nombre}": quedan ${stockAnterior}, se piden ${cantidad}.`
      );
    }

    const mov = await queryOne<{ movimiento_id: number }>(
      `INSERT INTO inventario_movimientos (
         producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
         orden_id, empleado_id, motivo
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING movimiento_id`,
      [
        input.productoId,
        input.tipo,
        cantidad,
        stockAnterior,
        stockNuevo,
        input.ordenId ?? null,
        input.empleadoId,
        input.motivo ?? null,
      ],
      c
    );

    await query(`UPDATE productos SET stock = $2 WHERE producto_id = $1`, [
      input.productoId,
      stockNuevo,
    ], c);

    return { stockAnterior, stockNuevo, movimientoId: mov!.movimiento_id };
  };

  return client ? ejecutar(client) : withTransaction(ejecutar);
}

export interface FiltrosInventario {
  categoriaId?: number | null;
  soloStockBajo?: boolean;
  busqueda?: string | null;
  incluirInactivos?: boolean;
  pagina?: number;
  porPagina?: number;
}

export async function getInventario(filtros: FiltrosInventario = {}) {
  const pagina = Math.max(1, Math.trunc(filtros.pagina ?? 1));
  const porPagina = Math.min(200, Math.max(1, Math.trunc(filtros.porPagina ?? 20)));
  const offset = (pagina - 1) * porPagina;

  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (!filtros.incluirInactivos) condiciones.push('activo');
  if (filtros.categoriaId) {
    valores.push(filtros.categoriaId);
    condiciones.push(`categoria_id = $${valores.length}`);
  }
  if (filtros.soloStockBajo) condiciones.push('stock <= stock_minimo');
  if (filtros.busqueda?.trim()) {
    valores.push(`%${filtros.busqueda.trim()}%`);
    condiciones.push(`(nombre ILIKE $${valores.length} OR codigo_barras ILIKE $${valores.length})`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM vw_inventario_actual ${where}`,
    valores
  );

  const productos = await query(
    `SELECT * FROM vw_inventario_actual ${where}
     ORDER BY categoria, producto_nombre
     LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, porPagina, offset]
  );

  const [resumen] = await query<{
    valor_total: number;
    bajos: number;
    agotados: number;
  }>(
    `SELECT COALESCE(SUM(valor_inventario), 0)::numeric AS valor_total,
            COUNT(*) FILTER (WHERE stock_bajo AND NOT agotado)::int AS bajos,
            COUNT(*) FILTER (WHERE agotado)::int AS agotados
     FROM vw_inventario_actual WHERE activo`
  );

  return {
    productos,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
    resumen,
  };
}

export interface FiltrosMovimientos {
  productoId?: number | null;
  tipo?: TipoMovimiento | null;
  desde?: string | null;
  hasta?: string | null;
  pagina?: number;
  porPagina?: number;
}

export async function getMovimientos(filtros: FiltrosMovimientos = {}) {
  const pagina = Math.max(1, Math.trunc(filtros.pagina ?? 1));
  const porPagina = Math.min(200, Math.max(1, Math.trunc(filtros.porPagina ?? 25)));
  const offset = (pagina - 1) * porPagina;

  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (filtros.productoId) {
    valores.push(filtros.productoId);
    condiciones.push(`producto_id = $${valores.length}`);
  }
  if (filtros.tipo) {
    valores.push(filtros.tipo);
    condiciones.push(`tipo_movimiento = $${valores.length}`);
  }
  if (filtros.desde) {
    valores.push(filtros.desde);
    condiciones.push(`fecha_movimiento >= $${valores.length}::date`);
  }
  if (filtros.hasta) {
    valores.push(filtros.hasta);
    condiciones.push(`fecha_movimiento < ($${valores.length}::date + interval '1 day')`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM vw_movimientos_inventario ${where}`,
    valores
  );

  const movimientos = await query(
    `SELECT * FROM vw_movimientos_inventario ${where}
     ORDER BY fecha_movimiento DESC
     LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, porPagina, offset]
  );

  return {
    movimientos,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}
