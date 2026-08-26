import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getMensajes } from '@/lib/db';

export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const sp = request.nextUrl.searchParams;
  const resultado = await getMensajes({
    filtro: (sp.get('filter') as any) ?? 'all',
    busqueda: sp.get('search'),
    desde: sp.get('startDate'),
    hasta: sp.get('endDate'),
    pagina: parseInt(sp.get('page') ?? '1', 10),
    porPagina: parseInt(sp.get('pageSize') ?? '20', 10),
    ordenarPor: sp.get('sortField') ?? 'fecha_creacion',
    direccion: sp.get('sortDirection') ?? 'desc',
  });
  return NextResponse.json({ success: true, ...resultado });
});
