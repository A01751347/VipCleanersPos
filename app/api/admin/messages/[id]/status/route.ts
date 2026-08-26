import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { actualizarEstadoMensaje } from '@/lib/db';

interface Ctx { params: Promise<{ id: string }> }

export const PUT = rutaProtegida(async (request: NextRequest, ctx: Ctx) => {
  await requireActor();
  const { id } = await ctx.params;
  const body = await request.json();
  await actualizarEstadoMensaje(parseInt(id, 10), {
    leido: body?.isRead ?? body?.leido,
    destacado: body?.isStarred ?? body?.destacado,
    archivado: body?.isArchived ?? body?.archivado,
  });
  return NextResponse.json({ success: true });
});

export const PATCH = PUT;
