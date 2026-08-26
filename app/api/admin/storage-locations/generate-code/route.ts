import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { siguienteCodigoLibre, BusinessError } from '@/lib/db';

export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const caja = request.nextUrl.searchParams.get('caja')?.trim();
  if (!caja) throw new BusinessError('Indica la caja de almacenamiento.');
  return NextResponse.json({ success: true, codigo: await siguienteCodigoLibre(caja) });
});
