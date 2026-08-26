import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import {
  getReporteVentas, getReporteEmpleados, getMejoresClientes,
  getResumenDia, getResumenCaja, BusinessError,
} from '@/lib/db';

/** Los reportes exponen ventas, márgenes y desempeño: sólo administradores. */
export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireAdmin();
  const sp = request.nextUrl.searchParams;
  const tipo = sp.get('type');
  if (!tipo) throw new BusinessError('Indica el tipo de reporte.');

  const hoy = new Date();
  const haceUnMes = new Date(hoy);
  haceUnMes.setMonth(haceUnMes.getMonth() - 1);

  const desde = sp.get('startDate') || haceUnMes.toISOString().slice(0, 10);
  const hasta = sp.get('endDate') || hoy.toISOString().slice(0, 10);

  switch (tipo) {
    case 'sales':
      return NextResponse.json(
        await getReporteVentas({ desde, hasta, agrupacion: (sp.get('groupBy') as any) ?? 'day' })
      );

    case 'employees':
      return NextResponse.json({ empleados: await getReporteEmpleados({ desde, hasta }) });

    case 'customers':
      return NextResponse.json({
        clientes: await getMejoresClientes({ desde, hasta, limite: 20 }),
      });

    case 'cashRegister': {
      const corteId = sp.get('corteId');
      if (corteId) return NextResponse.json(await getResumenCaja(parseInt(corteId, 10)));
      const fecha = sp.get('fecha') || hoy.toISOString().slice(0, 10);
      const empleadoId = sp.get('empleadoId') ? parseInt(sp.get('empleadoId')!, 10) : null;
      return NextResponse.json(await getResumenDia(fecha, empleadoId));
    }

    default:
      throw new BusinessError(`Tipo de reporte no reconocido: ${tipo}`);
  }
});
