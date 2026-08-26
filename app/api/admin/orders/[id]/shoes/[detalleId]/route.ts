import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { query, queryOne, BusinessError, NotFoundError } from '@/lib/db';

interface Ctx { params: Promise<{ id: string; detalleId: string }> }

export const PUT = rutaProtegida(async (request: NextRequest, ctx: Ctx) => {
  await requireActor();
  const { id, detalleId } = await ctx.params;
  const ordenId = parseInt(id, 10);
  const detalleServicioId = parseInt(detalleId, 10);
  if (!Number.isInteger(ordenId) || !Number.isInteger(detalleServicioId)) {
    throw new BusinessError('Identificadores inválidos.');
  }

  const body = await request.json();
  const limpiar = (v: unknown) => {
    const s = typeof v === 'string' ? v.trim() : '';
    return s || null;
  };

  const fila = await queryOne(
    `UPDATE detalles_orden_servicios SET
       marca = $3, modelo = $4, talla = $5, color = $6, descripcion_calzado = $7,
       notas_especiales = COALESCE($8, notas_especiales)
     WHERE detalle_servicio_id = $1 AND orden_id = $2
     RETURNING *`,
    [
      detalleServicioId, ordenId,
      limpiar(body?.marca), limpiar(body?.modelo), limpiar(body?.talla),
      limpiar(body?.color), limpiar(body?.descripcion ?? body?.descripcion_calzado),
      limpiar(body?.notasEspeciales),
    ]
  );
  if (!fila) throw new NotFoundError('El par no existe en esta orden.');

  return NextResponse.json({ success: true, par: fila, message: 'Par actualizado.' });
});

export const GET = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireActor();
  const { detalleId } = await ctx.params;
  const par = await queryOne(
    `SELECT * FROM vw_detalles_orden_servicios WHERE detalle_servicio_id = $1`,
    [parseInt(detalleId, 10)]
  );
  if (!par) throw new NotFoundError('El par no existe.');
  const fotos = await query(
    `SELECT archivo_id, tipo, nombre_archivo, content_type, descripcion, fecha_creacion
     FROM archivos_media WHERE detalle_servicio_id = $1 ORDER BY fecha_creacion`,
    [parseInt(detalleId, 10)]
  );
  return NextResponse.json({ success: true, par, fotos });
});
