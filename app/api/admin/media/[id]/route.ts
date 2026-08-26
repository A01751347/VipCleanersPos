import { NextRequest, NextResponse } from 'next/server';
import { requireActor, requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { getArchivo, eliminarArchivo, BusinessError } from '@/lib/db';
import { urlFirmada, borrarArchivo } from '@/lib/storage/s3';

interface Ctx { params: Promise<{ id: string }> }

/**
 * Entrega un archivo mediante redirección a una URL firmada de 5 minutos.
 * Requiere sesión: las fotos de identificación son datos personales sensibles
 * y antes quedaban accesibles a quien construyera la URL pública de S3.
 */
export const GET = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireActor();
  const { id } = await ctx.params;
  const archivoId = parseInt(id, 10);
  if (!Number.isInteger(archivoId)) throw new BusinessError('Id inválido.');

  const archivo = await getArchivo(archivoId);
  const url = await urlFirmada(archivo.s3_bucket, archivo.s3_key, 300);

  return NextResponse.redirect(url, {
    headers: { 'Cache-Control': 'private, max-age=240' },
  });
});

export const DELETE = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const archivo = await eliminarArchivo(parseInt(id, 10));
  if (!archivo) throw new BusinessError('El archivo no existe.', 404);

  try {
    await borrarArchivo((archivo as any).s3_bucket, (archivo as any).s3_key);
  } catch (err) {
    // El registro ya se borró; que el objeto quede huérfano en S3 es
    // preferible a dejar una fila apuntando a algo que ya no existe.
    console.error('[media] no se pudo borrar el objeto en S3', err);
  }

  return NextResponse.json({ success: true, message: 'Archivo eliminado.' });
});
