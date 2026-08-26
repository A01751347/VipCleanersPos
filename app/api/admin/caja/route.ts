import { NextRequest, NextResponse } from 'next/server';
import { requireActor, requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { abrirCaja, cerrarCaja, getCajaAbierta, getResumenCaja, getCortes } from '@/lib/db';
import { validar, abrirCajaSchema, cerrarCajaSchema } from '@/lib/validation/schemas';

/**
 * Corte de caja.
 *
 * No existía: había un reporte de pagos del día, pero sin apertura, fondo
 * inicial, cierre declarado ni registro de diferencias. Sin cierre contra lo
 * esperado, un faltante de efectivo era indetectable.
 */
export const GET = rutaProtegida(async (request: NextRequest) => {
  const actor = await requireActor();
  const sp = request.nextUrl.searchParams;

  const corteId = sp.get('corteId');
  if (corteId) {
    const resumen = await getResumenCaja(parseInt(corteId, 10));
    return NextResponse.json({ success: true, ...resumen });
  }

  if (sp.get('historial') === 'true') {
    const cortes = await getCortes({ desde: sp.get('desde'), hasta: sp.get('hasta') });
    return NextResponse.json({ success: true, cortes });
  }

  const abierta = await getCajaAbierta(actor.empleadoId);
  const resumen = abierta ? await getResumenCaja((abierta as any).corte_id) : null;
  return NextResponse.json({ success: true, caja: abierta, resumen });
});

export const POST = rutaProtegida(async (request: NextRequest) => {
  const actor = await requireActor();
  const datos = validar(abrirCajaSchema, await request.json());
  const caja = await abrirCaja(actor.empleadoId, datos.fondoInicial, datos.notas);
  return NextResponse.json({ success: true, caja, message: 'Caja abierta.' }, { status: 201 });
});

export const PUT = rutaProtegida(async (request: NextRequest) => {
  const actor = await requireActor();
  const datos = validar(cerrarCajaSchema, await request.json());
  const corte = await cerrarCaja({ ...datos, empleadoId: actor.empleadoId });

  const diferencia = Number((corte as any)?.diferencia ?? 0);
  return NextResponse.json({
    success: true,
    corte,
    message:
      diferencia === 0
        ? 'Caja cerrada. El efectivo cuadra.'
        : diferencia > 0
          ? `Caja cerrada. Sobran ${diferencia.toFixed(2)}.`
          : `Caja cerrada. Faltan ${Math.abs(diferencia).toFixed(2)}.`,
  });
});
