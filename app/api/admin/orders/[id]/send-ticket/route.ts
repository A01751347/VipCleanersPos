import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getOrdenPorId, NotFoundError, BusinessError } from '@/lib/db';
import { sendOrderTicketEmail } from '@/lib/email';

interface Ctx { params: Promise<{ id: string }> }

export const POST = rutaProtegida(async (request: NextRequest, ctx: Ctx) => {
  await requireActor();
  const { id } = await ctx.params;
  const orden = await getOrdenPorId(parseInt(id, 10));
  if (!orden) throw new NotFoundError('La orden no existe.');

  const body = await request.json().catch(() => ({}));
  const destino = String(body?.email ?? (orden as any).cliente_email ?? '').trim();
  if (!destino) throw new BusinessError('El cliente no tiene correo registrado.');

  const resultado = await sendOrderTicketEmail({
    order: { ...orden, cliente_email: destino },
    includeImages: body?.includeImages === true,
    customMessage: body?.customMessage ?? null,
    sendCopy: body?.sendCopy === true,
    copyEmail: body?.copyEmail ?? null,
  });

  if (!resultado?.success) {
    throw new BusinessError(`No se pudo enviar el ticket: ${resultado?.error ?? 'error'}`, 502);
  }
  return NextResponse.json({ success: true, message: `Ticket enviado a ${destino}.` });
});
