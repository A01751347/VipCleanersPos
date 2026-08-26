import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getArchivosDeOrden, getArchivosDePar, BusinessError } from '@/lib/db';

export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const sp = request.nextUrl.searchParams;

  const detalleServicioId = sp.get('detalleServicioId');
  if (detalleServicioId) {
    const archivos = await getArchivosDePar(parseInt(detalleServicioId, 10));
    return NextResponse.json({ success: true, archivos });
  }

  const ordenId = sp.get('ordenId') ?? sp.get('entidadId');
  if (!ordenId) throw new BusinessError('Indica la orden o el par.');

  const archivos = await getArchivosDeOrden(parseInt(ordenId, 10));
  return NextResponse.json({ success: true, archivos, media: archivos });
});
