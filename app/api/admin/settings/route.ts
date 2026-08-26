import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { getTodaLaConfig, setConfigMultiple } from '@/lib/db';

export const GET = rutaProtegida(async () => {
  await requireAdmin();
  return NextResponse.json({ success: true, settings: await getTodaLaConfig() });
});

export const PUT = rutaProtegida(async (request: NextRequest) => {
  await requireAdmin();
  const body = await request.json();

  // Sólo se aceptan pares clave/valor planos; nada de objetos anidados.
  const entradas: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(body ?? {})) {
    if (valor === null || valor === undefined) continue;
    if (typeof valor === 'object') continue;
    entradas[clave] = String(valor);
  }

  await setConfigMultiple(entradas);
  return NextResponse.json({
    success: true,
    settings: await getTodaLaConfig(),
    message: 'Configuración guardada.',
  });
});
