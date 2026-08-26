import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getInventario } from '@/lib/db';
import { aCsv } from '@/lib/csv';

/** Exportación de inventario. El botón del panel apuntaba aquí y daba 404. */
export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const sp = request.nextUrl.searchParams;

  const { productos } = await getInventario({
    categoriaId: sp.get('category') ? parseInt(sp.get('category')!, 10) : null,
    soloStockBajo: sp.get('lowStock') === 'true',
    busqueda: sp.get('search'),
    porPagina: 10_000,
  });

  const csv = aCsv(productos as Record<string, unknown>[], [
    ['producto_id', 'ID'],
    ['nombre', 'Producto'],
    ['categoria', 'Categoría'],
    ['codigo_barras', 'Código de barras'],
    ['stock', 'Existencia'],
    ['stock_minimo', 'Mínimo'],
    ['precio', 'Precio'],
    ['costo', 'Costo'],
    ['valor_inventario', 'Valor'],
  ]);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inventario_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});
