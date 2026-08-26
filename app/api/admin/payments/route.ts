import { NextRequest, NextResponse } from 'next/server';
import { requireActor, requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { registrarPago, reembolsarPago, getResumenDia, getPagosDeOrden } from '@/lib/db';
import { validar, pagoSchema, idPositivo } from '@/lib/validation/schemas';
import { z } from 'zod';

export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const sp = request.nextUrl.searchParams;

  const ordenId = sp.get('ordenId');
  if (ordenId) {
    const pagos = await getPagosDeOrden(parseInt(ordenId, 10));
    return NextResponse.json({ success: true, pagos, payments: pagos });
  }

  const fecha = sp.get('fecha') ?? new Date().toISOString().slice(0, 10);
  const empleadoId = sp.get('empleadoId') ? parseInt(sp.get('empleadoId')!, 10) : null;
  const resumen = await getResumenDia(fecha, empleadoId);
  return NextResponse.json({ success: true, ...resumen });
});

const registrarPagoSchema = z.object({ ordenId: idPositivo }).and(pagoSchema);

export const POST = rutaProtegida(async (request: NextRequest) => {
  const actor = await requireActor();
  const datos = validar(registrarPagoSchema, await request.json());

  const { pagoId } = await registrarPago({
    ordenId: datos.ordenId,
    // Empleado real de la sesión. La consulta anterior tenía el `empleado_id`
    // escrito como literal `1` dentro del CALL, así que todos los pagos del
    // sistema quedaban registrados al mismo empleado.
    empleadoId: actor.empleadoId,
    pago: {
      metodo: datos.metodo,
      monto: datos.monto,
      efectivoRecibido: datos.efectivoRecibido,
      referencia: datos.referencia,
      terminalId: datos.terminalId,
    },
  });

  return NextResponse.json({ success: true, pagoId }, { status: 201 });
});

const reembolsoSchema = z.object({
  pagoId: idPositivo,
  monto: z.coerce.number().positive().nullish(),
  motivo: z.string().trim().min(3, 'describe el motivo del reembolso'),
});

export const PATCH = rutaProtegida(async (request: NextRequest) => {
  const actor = await requireAdmin();
  const datos = validar(reembolsoSchema, await request.json());
  const resultado = await reembolsarPago({ ...datos, empleadoId: actor.empleadoId });
  return NextResponse.json({ success: true, ...resultado, message: 'Reembolso registrado.' });
});
