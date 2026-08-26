import { NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getCategorias } from '@/lib/db';

export const GET = rutaProtegida(async () => {
  await requireActor();
  const categorias = await getCategorias(true);
  return NextResponse.json({ success: true, categorias, categories: categorias });
});
