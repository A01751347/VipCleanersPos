import { NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { marcarTodosLeidos } from '@/lib/db';

export const POST = rutaProtegida(async () => {
  await requireActor();
  const total = await marcarTodosLeidos();
  return NextResponse.json({ success: true, total, message: `${total} mensajes marcados como leídos.` });
});

export const PUT = POST;
