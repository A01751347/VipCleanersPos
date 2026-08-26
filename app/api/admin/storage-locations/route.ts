import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import {
  asignarUbicaciones,
  getMapaUbicaciones,
  buscarPorUbicacion,
  getPendientesDeUbicacion,
  getEstadisticasAlmacen,
} from '@/lib/db';
import { validar, asignarUbicacionSchema } from '@/lib/validation/schemas';

/**
 * Ubicaciones de almacén.
 *
 * Esta ruta no verificaba sesión: sin autenticarse se obtenía el mapa completo
 * de qué tenis, de qué cliente, con teléfono, están en qué caja física — un
 * catálogo listo para un robo dirigido. El POST además permitía reasignar
 * ubicaciones y sabotear el inventario.
 */
export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const sp = request.nextUrl.searchParams;
  const accion = sp.get('action') ?? 'map';

  switch (accion) {
    case 'stats':
      return NextResponse.json({ success: true, estadisticas: await getEstadisticasAlmacen() });

    case 'pending': {
      const ordenId = sp.get('ordenId') ? parseInt(sp.get('ordenId')!, 10) : null;
      const servicios = await getPendientesDeUbicacion(ordenId);
      return NextResponse.json({ success: true, servicios });
    }

    case 'search':
      return NextResponse.json({
        success: true,
        resultados: await buscarPorUbicacion(sp.get('q') ?? ''),
      });

    case 'map':
    default:
      return NextResponse.json({ success: true, ubicaciones: await getMapaUbicaciones() });
  }
});

export const POST = rutaProtegida(async (request: NextRequest) => {
  const actor = await requireActor();
  const datos = validar(asignarUbicacionSchema, await request.json());

  // El empleado sale de la sesión: antes venía en el cuerpo de la petición.
  const asignadas = await asignarUbicaciones(datos.locations, actor.empleadoId);

  return NextResponse.json({
    success: true,
    asignadas,
    ubicacionesAsignadas: asignadas.length,
    message: `${asignadas.length} ubicación${asignadas.length === 1 ? '' : 'es'} asignada${asignadas.length === 1 ? '' : 's'}.`,
  });
});
