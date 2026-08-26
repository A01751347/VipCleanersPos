import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getMensajePorId, NotFoundError } from '@/lib/db';

interface Ctx { params: Promise<{ id: string }> }

export const GET = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireActor();
  const { id } = await ctx.params;
  const mensaje = await getMensajePorId(parseInt(id, 10));
  if (!mensaje) throw new NotFoundError('El mensaje no existe.');
  return NextResponse.json({ success: true, message: mensaje, mensaje });
});
