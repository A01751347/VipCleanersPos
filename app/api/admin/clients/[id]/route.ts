import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getClientePorId, getOrdenes, NotFoundError } from '@/lib/db';

interface Ctx { params: Promise<{ id: string }> }

export const GET = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireActor();
  const { id } = await ctx.params;
  const clienteId = parseInt(id, 10);

  const cliente = await getClientePorId(clienteId);
  if (!cliente) throw new NotFoundError('El cliente no existe.');

  const { ordenes } = await getOrdenes({ porPagina: 50, incluirCanceladas: true });
  const suyas = (ordenes as any[]).filter((o) => o.cliente_id === clienteId);

  return NextResponse.json({ success: true, cliente, client: cliente, ordenes: suyas });
});
