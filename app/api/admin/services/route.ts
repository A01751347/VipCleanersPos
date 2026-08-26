import { NextRequest, NextResponse } from 'next/server';
import { requireActor, requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { getServicios, crearServicio } from '@/lib/db';

export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const soloActivos = request.nextUrl.searchParams.get('all') !== 'true';
  const servicios = await getServicios(soloActivos);
  return NextResponse.json({ success: true, servicios, services: servicios });
});

export const POST = rutaProtegida(async (request: NextRequest) => {
  // Los precios definen lo que se cobra: sólo administradores.
  await requireAdmin();
  const body = await request.json();
  const servicio = await crearServicio({
    nombre: body?.nombre,
    descripcion: body?.descripcion,
    precio: Number(body?.precio),
    tiempoEstimadoMinutos: body?.tiempo_estimado_minutos,
    requiereIdentificacion: body?.requiere_identificacion,
    imagenUrl: body?.imagen_url,
  });
  return NextResponse.json({ success: true, servicio }, { status: 201 });
});
