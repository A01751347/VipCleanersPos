import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getVentasSemanales } from '@/lib/db';

/**
 * Ventas por día para la gráfica del tablero.
 *
 * Esta ruta no verificaba sesión: las ventas del negocio eran públicas.
 * Además devuelve exactamente la forma que espera la gráfica; antes el panel
 * leía `d.date` de una respuesta que traía `fecha`, y `new Date(undefined)`
 * lanzaba "Invalid time value" dentro del render.
 */
export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const dias = Math.min(90, Math.max(1, parseInt(request.nextUrl.searchParams.get('dias') ?? '7', 10)));

  const filas = await getVentasSemanales(dias);

  const data = filas.map((f: any) => {
    const fecha = f.fecha instanceof Date ? f.fecha : new Date(f.fecha);
    return {
      date: fecha.toISOString(),
      day: String(f.etiqueta ?? '').replace('.', ''),
      dayName: String(f.etiqueta ?? ''),
      sales: Number(f.total ?? 0),
      orders: Number(f.ordenes ?? 0),
    };
  });

  const totalSales = data.reduce((s, d) => s + d.sales, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  // Crecimiento: mitad reciente contra mitad anterior del rango.
  const corte = Math.floor(data.length / 2);
  const anterior = data.slice(0, corte).reduce((s, d) => s + d.sales, 0);
  const reciente = data.slice(corte).reduce((s, d) => s + d.sales, 0);
  const weekGrowth = anterior > 0 ? ((reciente - anterior) / anterior) * 100 : reciente > 0 ? 100 : 0;

  const mejor = data.reduce(
    (mejorHastaAhora, d) => (d.sales > mejorHastaAhora.sales ? d : mejorHastaAhora),
    { day: '—', sales: 0 } as { day: string; sales: number }
  );

  return NextResponse.json({
    success: true,
    data,
    ventas: data,
    totalSales,
    totalOrders,
    weekGrowth: Math.round(weekGrowth * 10) / 10,
    bestDay: { day: mejor.day, sales: mejor.sales },
  });
});
