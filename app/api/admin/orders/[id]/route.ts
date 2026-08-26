import { NextRequest, NextResponse } from 'next/server';
import { requireActor, requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { getOrdenPorId, cancelarOrden, NotFoundError, BusinessError } from '@/lib/db';

interface Ctx { params: Promise<{ id: string }> }

export const GET = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireActor();
  const { id } = await ctx.params;
  const ordenId = parseInt(id, 10);
  if (!Number.isInteger(ordenId)) throw new BusinessError('Id de orden inválido.');

  const orden = await getOrdenPorId(ordenId);
  if (!orden) throw new NotFoundError('La orden no existe.');
  return NextResponse.json({ success: true, order: orden, orden });
});

/** Cancelar una orden. Sólo administradores: mueve dinero e inventario. */
export const DELETE = rutaProtegida(async (request: NextRequest, ctx: Ctx) => {
  const actor = await requireAdmin();
  const { id } = await ctx.params;
  const ordenId = parseInt(id, 10);
  if (!Number.isInteger(ordenId)) throw new BusinessError('Id de orden inválido.');

  const body = await request.json().catch(() => ({}));
  const motivo = String(body?.motivo ?? '').trim();

  const resultado = await cancelarOrden(ordenId, actor.empleadoId, motivo);
  return NextResponse.json({
    success: true,
    ...resultado,
    message:
      resultado.montoPagado > 0
        ? `Orden cancelada. Hay ${resultado.montoPagado.toFixed(2)} pagados pendientes de reembolso.`
        : 'Orden cancelada.',
  });
});
