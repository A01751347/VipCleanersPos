import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { alternarServicio, NotFoundError } from '@/lib/db';

interface Ctx { params: Promise<{ id: string }> }

export const PATCH = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const servicio = await alternarServicio(parseInt(id, 10));
  if (!servicio) throw new NotFoundError('El servicio no existe.');
  return NextResponse.json({ success: true, servicio });
});

export const PUT = PATCH;
