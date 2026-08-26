import { NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getEstadisticasMensajes } from '@/lib/db';

export const GET = rutaProtegida(async () => {
  await requireActor();
  const stats = await getEstadisticasMensajes();
  return NextResponse.json({ success: true, ...stats, stats });
});
