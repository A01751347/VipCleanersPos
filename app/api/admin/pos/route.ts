// app/api/admin/pos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { crearOrden, crearOEncontrarCliente } from '@/lib/db';
import { validar, crearOrdenPosSchema } from '@/lib/validation/schemas';

/**
 * Alta de venta en mostrador.
 *
 * Cambios frente a la versión anterior:
 *  - Exige sesión. Antes cualquiera en internet podía crear órdenes y pagos.
 *  - Los importes se calculan en el servidor a partir del catálogo; el cuerpo
 *    de la petición ya no trae subtotal, iva ni total.
 *  - Todo ocurre en una transacción, sobre una sola conexión.
 *  - El empleado sale de la sesión, no de un `1` escrito a mano.
 *  - Devuelve los ids de cada par para poder adjuntarles sus fotos.
 */
export const POST = rutaProtegida(async (request: NextRequest) => {
  const actor = await requireActor();
  const datos = validar(crearOrdenPosSchema, await request.json());

  const clienteId =
    datos.cliente.cliente_id ??
    (await crearOEncontrarCliente({
      nombre: datos.cliente.nombre,
      apellidos: datos.cliente.apellidos,
      telefono: datos.cliente.telefono,
      email: datos.cliente.email,
    }));

  const resultado = await crearOrden({
    clienteId,
    empleadoId: actor.empleadoId,
    origen: 'pos',
    servicios: datos.servicios,
    productos: datos.productos,
    descuentoPorcentaje: datos.descuentoPorcentaje,
    motivoDescuento: datos.motivoDescuento,
    notas: datos.notas,
    tieneIdentificacion: datos.tieneIdentificacion,
    pago: datos.pago ?? null,
  });

  return NextResponse.json(
    {
      success: true,
      ordenId: resultado.ordenId,
      codigoOrden: resultado.codigoOrden,
      subtotal: resultado.subtotal,
      impuestos: resultado.impuestos,
      total: resultado.total,
      requiereIdentificacion: resultado.requiereIdentificacion,
      // El front las necesita para subir las fotos de cada par y para el
      // modal de ubicaciones. Antes no se devolvían y las fotos se perdían.
      servicios: resultado.detallesServicios,
      message: 'Orden creada correctamente',
    },
    { status: 201 }
  );
});

/** Datos que el punto de venta necesita al abrir. */
export const GET = rutaProtegida(async () => {
  await requireActor();
  const { getServicios, getProductos, getCategorias } = await import('@/lib/db');
  const [servicios, { productos }, categorias] = await Promise.all([
    getServicios(true),
    getProductos({ soloActivos: true, porPagina: 200 }),
    getCategorias(true),
  ]);
  return NextResponse.json({ success: true, servicios, productos, categorias });
});
