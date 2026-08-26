import { NextResponse } from 'next/server';
import { rutaProtegida } from '@/lib/auth/guard';
import { getServicios, getZonasCobertura } from '@/lib/db';

/** Catálogo público: sólo servicios activos y zonas de cobertura. */
export const GET = rutaProtegida(async () => {
  const [servicios, zonas] = await Promise.all([getServicios(true), getZonasCobertura()]);

  return NextResponse.json({
    success: true,
    services: servicios.map((s: any) => ({
      servicio_id: s.servicio_id,
      nombre: s.nombre,
      descripcion: s.descripcion,
      precio: s.precio,
      tiempo_estimado_minutos: s.tiempo_estimado_minutos,
      requiere_identificacion: s.requiere_identificacion,
      imagen_url: s.imagen_url,
    })),
    servicios,
    zonas,
  });
});
