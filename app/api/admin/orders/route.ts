import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getOrdenes } from '@/lib/db';

export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const sp = request.nextUrl.searchParams;

  const estadoIds = (sp.get('estadoId') ?? sp.get('status') ?? '')
    .split(',')
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isInteger(n));

  const resultado = await getOrdenes({
    pagina: parseInt(sp.get('page') ?? '1', 10),
    porPagina: parseInt(sp.get('pageSize') ?? '10', 10),
    estadoIds: estadoIds.length ? estadoIds : undefined,
    estadoPago: sp.get('estadoPago'),
    origen: (sp.get('origen') as 'pos' | 'online' | null) ?? null,
    desde: sp.get('startDate'),
    hasta: sp.get('endDate'),
    busqueda: sp.get('search'),
    empleadoId: sp.get('empleadoId') ? parseInt(sp.get('empleadoId')!, 10) : null,
    incluirCanceladas: sp.get('incluirCanceladas') === 'true',
  });

  return NextResponse.json(resultado);
});
