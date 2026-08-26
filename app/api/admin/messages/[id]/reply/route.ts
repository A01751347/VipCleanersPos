import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getMensajePorId, registrarRespuesta, NotFoundError, BusinessError } from '@/lib/db';
import { sendMessageReplyEmail } from '@/lib/email';

interface Ctx { params: Promise<{ id: string }> }

export const POST = rutaProtegida(async (request: NextRequest, ctx: Ctx) => {
  const actor = await requireActor();
  const { id } = await ctx.params;
  const mensajeId = parseInt(id, 10);

  const original = await getMensajePorId(mensajeId);
  if (!original) throw new NotFoundError('El mensaje no existe.');

  const body = await request.json();
  const cuerpo = String(body?.replyMessage ?? body?.mensaje ?? '').trim();
  if (!cuerpo) throw new BusinessError('La respuesta no puede estar vacía.');

  const asunto = String(body?.subject ?? `Re: ${(original as any).subject}`).trim();

  const resultado = await sendMessageReplyEmail({
    originalMessage: original,
    replyMessage: cuerpo,
    includeOriginalMessage: body?.includeOriginal !== false,
  });

  if (!resultado?.success) {
    throw new BusinessError(
      `No se pudo enviar el correo: ${resultado?.error ?? 'error desconocido'}`,
      502
    );
  }

  // Se registra sólo si el envío salió bien, para que el histórico refleje lo
  // que el cliente realmente recibió.
  await registrarRespuesta({
    mensajeId,
    empleadoId: actor.empleadoId,
    asunto,
    cuerpo,
    enviadoA: (original as any).email,
  });

  return NextResponse.json({ success: true, message: 'Respuesta enviada.' });
});
