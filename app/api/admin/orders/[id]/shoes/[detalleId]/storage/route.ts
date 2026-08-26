import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { moverPar, getHistorialUbicaciones, BusinessError } from '@/lib/db';

interface Ctx { params: Promise<{ id: string; detalleId: string }> }

/**
 * Asigna o cambia la ubicación física de un par.
 *
 * El panel llamaba a esta ruta y no existía: sólo estaba
 * `/shoes/[detalleId]` sin el segmento `/storage`, así que mover un par de
 * caja desde el detalle de la orden devolvía 404.
 */
export const PUT = rutaProtegida(async (request: NextRequest, ctx: Ctx) => {
  const actor = await requireActor();
  const { detalleId } = await ctx.params;
  const detalleServicioId = parseInt(detalleId, 10);
  if (!Number.isInteger(detalleServicioId)) throw new BusinessError('Id de par inválido.');

  const body = await request.json();
  const caja = String(body?.cajaAlmacenamiento ?? body?.caja ?? '').trim();
  if (!caja) throw new BusinessError('La caja de almacenamiento es obligatoria.');

  const resultado = await moverPar({
    detalleServicioId,
    cajaAlmacenamiento: caja,
    codigoUbicacion: body?.codigoUbicacion ?? null,
    notasEspeciales: body?.notasEspeciales ?? null,
    empleadoId: actor.empleadoId,
  });

  return NextResponse.json({ success: true, ...resultado, message: 'Ubicación actualizada.' });
});

export const GET = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireActor();
  const { detalleId } = await ctx.params;
  const historial = await getHistorialUbicaciones(parseInt(detalleId, 10));
  return NextResponse.json({ success: true, historial });
});
