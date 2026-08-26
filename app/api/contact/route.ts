import { NextRequest, NextResponse } from 'next/server';
import { rutaProtegida } from '@/lib/auth/guard';
import { crearMensaje } from '@/lib/db';
import { validar, contactoSchema } from '@/lib/validation/schemas';
import { verificarTurnstile } from '@/lib/turnstile';
import { aplicarLimite, ipDe } from '@/lib/auth/rate-limit';

/**
 * Formulario de contacto.
 * No tenía captcha ni límite: era escritura anónima ilimitada a la base.
 */
export const POST = rutaProtegida(async (request: NextRequest) => {
  await aplicarLimite(request, 'contacto', 3, 600);

  const datos = validar(contactoSchema, await request.json());
  await verificarTurnstile(datos.turnstileToken, ipDe(request));

  const mensajeId = await crearMensaje({
    nombre: datos.name,
    email: datos.email,
    telefono: datos.phone,
    asunto: datos.subject,
    mensaje: datos.message,
  });

  return NextResponse.json(
    { success: true, mensajeId, message: 'Gracias por escribirnos. Te responderemos pronto.' },
    { status: 201 }
  );
});
