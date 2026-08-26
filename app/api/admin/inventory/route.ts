import { NextRequest, NextResponse } from 'next/server';
import { requireActor, requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { getInventario, getMovimientos, registrarMovimiento } from '@/lib/db';
import { validar, movimientoSchema } from '@/lib/validation/schemas';

/**
 * Inventario y movimientos.
 *
 * No existía ninguna ruta de inventario: `registrarMovimiento` estaba escrita
 * pero nadie la llamaba, la bitácora estaba siempre vacía y no había forma de
 * recibir mercancía. La única manera de subir existencias era editar el campo
 * a mano en la ficha del producto, sin dejar rastro.
 */
export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const sp = request.nextUrl.searchParams;

  if (sp.get('movimientos') === 'true') {
    const resultado = await getMovimientos({
      productoId: sp.get('productoId') ? parseInt(sp.get('productoId')!, 10) : null,
      tipo: (sp.get('tipo') as any) ?? null,
      desde: sp.get('desde'),
      hasta: sp.get('hasta'),
      pagina: parseInt(sp.get('page') ?? '1', 10),
      porPagina: parseInt(sp.get('pageSize') ?? '25', 10),
    });
    return NextResponse.json({ success: true, ...resultado });
  }

  const resultado = await getInventario({
    categoriaId: sp.get('categoryId') ? parseInt(sp.get('categoryId')!, 10) : null,
    soloStockBajo: sp.get('lowStock') === 'true',
    busqueda: sp.get('searchQuery') ?? sp.get('search'),
    pagina: parseInt(sp.get('page') ?? '1', 10),
    porPagina: parseInt(sp.get('pageSize') ?? '20', 10),
  });
  return NextResponse.json({ success: true, ...resultado, products: resultado.productos });
});

export const POST = rutaProtegida(async (request: NextRequest) => {
  // Ajustes y mermas mueven el valor del inventario: sólo administradores.
  const actor = await requireAdmin();
  const datos = validar(movimientoSchema, await request.json());

  const resultado = await registrarMovimiento({
    productoId: datos.productoId,
    tipo: datos.tipo,
    cantidad: datos.cantidad,
    empleadoId: actor.empleadoId,
    motivo: datos.motivo,
  });

  return NextResponse.json(
    { success: true, ...resultado, message: 'Movimiento registrado.' },
    { status: 201 }
  );
});
