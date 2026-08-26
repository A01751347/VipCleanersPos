import { NextRequest, NextResponse } from 'next/server';
import { requireActor, requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import {
  getProductoPorId, actualizarProducto, desactivarProducto,
  registrarMovimiento, NotFoundError, BusinessError,
} from '@/lib/db';

interface Ctx { params: Promise<{ id: string }> }

export const GET = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireActor();
  const { id } = await ctx.params;
  const producto = await getProductoPorId(parseInt(id, 10));
  if (!producto) throw new NotFoundError('El producto no existe.');
  return NextResponse.json({ success: true, producto, product: producto });
});

export const PUT = rutaProtegida(async (request: NextRequest, ctx: Ctx) => {
  const actor = await requireAdmin();
  const { id } = await ctx.params;
  const productoId = parseInt(id, 10);
  if (!Number.isInteger(productoId)) throw new BusinessError('Id inválido.');

  const body = await request.json();
  const actual = await getProductoPorId(productoId);
  if (!actual) throw new NotFoundError('El producto no existe.');

  const producto = await actualizarProducto(productoId, body);

  // Cambiar el stock desde esta pantalla se registra como ajuste, con autor y
  // motivo. Antes se escribía directo al campo y no quedaba rastro de nada.
  if (body?.stock !== undefined && body.stock !== null) {
    const nuevo = parseInt(String(body.stock), 10);
    if (Number.isInteger(nuevo) && nuevo !== (actual as any).stock) {
      await registrarMovimiento({
        productoId,
        tipo: 'ajuste',
        cantidad: nuevo,
        empleadoId: actor.empleadoId,
        motivo: body?.motivoAjuste ?? 'Ajuste manual desde la ficha del producto',
      });
    }
  }

  return NextResponse.json({ success: true, producto: await getProductoPorId(productoId) });
});

export const DELETE = rutaProtegida(async (_req: NextRequest, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const fila = await desactivarProducto(parseInt(id, 10));
  if (!fila) throw new NotFoundError('El producto no existe.');
  // Se desactiva, no se borra: las órdenes históricas lo siguen referenciando.
  return NextResponse.json({ success: true, message: 'Producto desactivado.' });
});
