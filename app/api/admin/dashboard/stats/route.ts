import { NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getEstadisticasDashboard } from '@/lib/db';

/**
 * Métricas del tablero.
 *
 * Devuelve las mismas claves que consumen las tarjetas del panel. Antes los
 * nombres no coincidían y la pantalla mostraba "undefined" y "$NaN" en cuatro
 * de las seis tarjetas.
 */
export const GET = rutaProtegida(async () => {
  await requireActor();
  const s = await getEstadisticasDashboard();

  return NextResponse.json({
    success: true,

    // Claves que usan las tarjetas
    totalBookings: Number(s.total_ordenes ?? 0),
    pendingMessages: Number(s.mensajes_sin_leer ?? 0),
    monthlySales: Number(s.ingresos_mes ?? 0),
    activeClients: Number(s.total_clientes ?? 0),

    metricas: {
      ordenes_hoy: Number(s.ordenes_hoy ?? 0),
      ventas_hoy: Number(s.ingresos_hoy ?? 0),
      ordenes_mes: Number(s.total_ordenes ?? 0),
      total_clientes: Number(s.total_clientes ?? 0),
    },

    // Datos operativos completos
    ordenes_activas: Number(s.ordenes_activas ?? 0),
    ordenes_retrasadas: Number(s.ordenes_retrasadas ?? 0),
    por_cobrar: Number(s.por_cobrar ?? 0),
    clientes_nuevos_mes: Number(s.clientes_nuevos_mes ?? 0),
    productos_stock_bajo: Number(s.productos_stock_bajo ?? 0),
    pares_sin_ubicar: Number(s.pares_sin_ubicar ?? 0),
    serviciosPopulares: s.serviciosPopulares,
    productosPopulares: s.productosPopulares,
    entregasHoy: s.entregasHoy,
    identificacionPendiente: s.identificacionPendiente,
  });
});
