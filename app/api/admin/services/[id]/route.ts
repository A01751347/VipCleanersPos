import { NextRequest, NextResponse } from 'next/server';
import { requireActor, requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { getServicioPorId, actualizarServicio, NotFoundError } from '@/lib/db';

interface Ctx { params: Promise<{ id: string }> }

export const GET = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireActor();
  const { id } = await ctx.params;
  const servicio = await getServicioPorId(parseInt(id, 10));
  if (!servicio) throw new NotFoundError('El servicio no existe.');
  return NextResponse.json({ success: true, servicio });
});

export const PUT = rutaProtegida(async (request: NextRequest, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const servicio = await actualizarServicio(parseInt(id, 10), await request.json());
  if (!servicio) throw new NotFoundError('El servicio no existe.');
  return NextResponse.json({ success: true, servicio });
});
