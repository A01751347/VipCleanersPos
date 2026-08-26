import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { getEmpleadoPorId, actualizarEmpleado, cambiarPassword, BusinessError, NotFoundError } from '@/lib/db';

interface Ctx { params: Promise<{ id: string }> }

export const GET = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const empleado = await getEmpleadoPorId(parseInt(id, 10));
  if (!empleado) throw new NotFoundError('El empleado no existe.');
  return NextResponse.json({ success: true, empleado });
});

export const PUT = rutaProtegida(async (request: NextRequest, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const empleadoId = parseInt(id, 10);
  if (!Number.isInteger(empleadoId)) throw new BusinessError('Id inválido.');

  const body = await request.json();

  if (body?.password) {
    const empleado = await getEmpleadoPorId(empleadoId);
    if (!empleado) throw new NotFoundError('El empleado no existe.');
    await cambiarPassword((empleado as any).usuario_id, String(body.password));
  }

  const actualizado = await actualizarEmpleado(empleadoId, {
    nombre: body?.nombre,
    apellidos: body?.apellidos,
    telefono: body?.telefono,
    puesto: body?.puesto,
    rol: body?.rol,
    activo: body?.activo,
  });

  return NextResponse.json({ success: true, empleado: actualizado });
});
