import { NextRequest, NextResponse } from 'next/server';
import { requireActor, requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { getProductos, crearProducto, getCategorias, registrarMovimiento } from '@/lib/db';

export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const sp = request.nextUrl.searchParams;

  if (sp.get('categories') === 'true') {
    const categorias = await getCategorias(true);
    return NextResponse.json({ success: true, categories: categorias, categorias });
  }

  const resultado = await getProductos({
    categoriaId: sp.get('categoryId') ? parseInt(sp.get('categoryId')!, 10) : null,
    busqueda: sp.get('search') ?? sp.get('searchQuery'),
    soloActivos: sp.get('all') !== 'true',
    pagina: parseInt(sp.get('page') ?? '1', 10),
    porPagina: parseInt(sp.get('pageSize') ?? '50', 10),
  });
  return NextResponse.json({ success: true, ...resultado });
});

export const POST = rutaProtegida(async (request: NextRequest) => {
  const actor = await requireAdmin();
  const body = await request.json();
  const stockInicial = Math.max(0, parseInt(String(body?.stock ?? 0), 10) || 0);

  const producto = await crearProducto({ ...body, stock: 0 });

  // El stock inicial entra como movimiento, para que exista bitácora desde el
  // primer día en vez de un número puesto a mano.
  if (stockInicial > 0) {
    await registrarMovimiento({
      productoId: (producto as any).producto_id,
      tipo: 'entrada',
      cantidad: stockInicial,
      empleadoId: actor.empleadoId,
      motivo: 'Existencia inicial al dar de alta el producto',
    });
  }

  return NextResponse.json({ success: true, producto }, { status: 201 });
});
