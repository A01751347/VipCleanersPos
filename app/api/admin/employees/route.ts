import { NextRequest, NextResponse } from 'next/server';
import { requireActor, requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { getEmpleados, crearEmpleado } from '@/lib/db';
import { validar, crearEmpleadoSchema } from '@/lib/validation/schemas';

/**
 * Personal. El panel llamaba a esta ruta desde el filtro del corte de caja y
 * no existía, así que el selector de empleado siempre salía vacío.
 */
export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const incluirInactivos = request.nextUrl.searchParams.get('incluirInactivos') === 'true';
  const empleados = await getEmpleados(!incluirInactivos);
  return NextResponse.json({ success: true, empleados, employees: empleados });
});

export const POST = rutaProtegida(async (request: NextRequest) => {
  await requireAdmin();
  const datos = validar(crearEmpleadoSchema, await request.json());
  const empleado = await crearEmpleado(datos);
  return NextResponse.json({ success: true, empleado }, { status: 201 });
});
