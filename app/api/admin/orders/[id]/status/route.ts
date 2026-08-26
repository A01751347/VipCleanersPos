import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { cambiarEstadoOrden, getOrdenPorId, BusinessError } from '@/lib/db';
import { notificarCambioEstado } from '@/lib/notifications';

interface Ctx { params: Promise<{ id: string }> }

export const PUT = rutaProtegida(async (request: NextRequest, ctx: Ctx) => {
  const actor = await requireActor();
  const { id } = await ctx.params;
  const ordenId = parseInt(id, 10);
  if (!Number.isInteger(ordenId)) throw new BusinessError('Id de orden inválido.');

  const body = await request.json();
  const estadoId = parseInt(String(body?.estadoId ?? ''), 10);
  if (!Number.isInteger(estadoId)) throw new BusinessError('El estado es obligatorio.');

  const resultado = await cambiarEstadoOrden(
    ordenId,
    estadoId,
    // El empleado de la sesión. Antes se usaba `session.user.id`, que es el
    // usuario_id: atribuía el cambio a otra persona o rompía la llave foránea.
    actor.empleadoId,
    body?.comentario ?? null
  );

  // El aviso al cliente va fuera de la transacción y no puede tumbar la
  // operación: el cambio de estado ya está confirmado en la base.
  if (resultado.notificaCliente) {
    notificarCambioEstado(ordenId, resultado.estadoNombre).catch((err) =>
      console.error('[notificaciones] fallo al avisar cambio de estado', err)
    );
  }

  return NextResponse.json({
    success: true,
    message: `Estado actualizado a "${resultado.estadoNombre}"`,
    data: resultado,
    notificado: resultado.notificaCliente,
  });
});
