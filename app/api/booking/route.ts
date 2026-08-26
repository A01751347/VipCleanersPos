import { NextRequest, NextResponse } from 'next/server';
import { rutaProtegida } from '@/lib/auth/guard';
import {
  crearOrden, crearOEncontrarCliente, crearDireccion,
  validarFechaReserva, validarZonaPickup, getCalendarioDisponibilidad,
  getDisponibilidad, BusinessError, ESTADO_PENDIENTE,
} from '@/lib/db';
import { validar, reservaSchema } from '@/lib/validation/schemas';
import { verificarTurnstile } from '@/lib/turnstile';
import { aplicarLimite, ipDe } from '@/lib/auth/rate-limit';
import { notificarReservaCreada } from '@/lib/notifications';

/**
 * Reserva en línea.
 *
 * Antes esta ruta: no validaba fecha ni horario (se podía reservar en el
 * pasado o en día cerrado), leía el id de la orden con una variable de sesión
 * en otra conexión del pool, calculaba los importes con flotantes, no tenía
 * límite de peticiones y no enviaba ningún correo de confirmación.
 */
export const POST = rutaProtegida(async (request: NextRequest) => {
  await aplicarLimite(request, 'booking', 5, 600);

  const cuerpo = await request.json();
  const datos = validar(reservaSchema, cuerpo);
  await verificarTurnstile(datos.turnstileToken, ipDe(request));

  const totalPares = datos.services.reduce((s, x) => s + x.quantity, 0);
  const cuando = await validarFechaReserva(datos.bookingDate, datos.bookingTime, totalPares);

  // Zona y costo salen de la base, no de una lista escrita en el código.
  let costoPickup = 0;
  let zonaPickup: string | null = null;
  let direccionId: number | null = null;
  const requierePickup = datos.requiresPickup && datos.deliveryMethod === 'pickup';

  if (requierePickup) {
    if (!datos.address) throw new BusinessError('La dirección es obligatoria para recolección.');
    const zona = await validarZonaPickup(datos.address.zipCode);
    if (!zona.disponible) {
      throw new BusinessError('Todavía no damos servicio de recolección en ese código postal.');
    }
    costoPickup = zona.costo;
    zonaPickup = zona.zona;
  }

  const partes = datos.fullName.trim().split(/\s+/);
  const clienteId = await crearOEncontrarCliente({
    nombre: partes[0],
    apellidos: partes.slice(1).join(' '),
    telefono: datos.phone,
    email: datos.email,
  });

  if (requierePickup && datos.address) {
    direccionId = await crearDireccion({
      clienteId,
      tipo: 'pickup',
      calle: datos.address.street,
      numeroExterior: datos.address.number,
      numeroInterior: datos.address.interior,
      colonia: datos.address.neighborhood,
      delegacionMunicipio: datos.address.municipality,
      ciudad: datos.address.city,
      estado: datos.address.state,
      codigoPostal: datos.address.zipCode,
      telefonoContacto: datos.address.phone || datos.phone,
      destinatario: datos.fullName,
      instrucciones: datos.address.instructions,
      ventanaHoraInicio: datos.address.timeWindowStart,
      ventanaHoraFin: datos.address.timeWindowEnd,
      alias: 'Recolección',
    });
  }

  const resultado = await crearOrden({
    clienteId,
    // La reserva la registra el sistema; queda como orden pendiente hasta que
    // el calzado llega y un empleado la recibe.
    empleadoId: await empleadoDelSistema(),
    origen: 'online',
    estadoInicialId: ESTADO_PENDIENTE,
    servicios: datos.services.map((s) => ({
      servicioId: s.serviceId,
      cantidad: s.quantity,
      descripcion: s.shoesType,
    })),
    requierePickup,
    direccionId,
    costoPickup,
    zonaPickup,
    fechaReservacion: cuando,
    aceptaTerminos: datos.acceptTerms,
    aceptaWhatsapp: datos.acceptWhatsapp,
    notas: `Reserva en línea · ${totalPares} par${totalPares === 1 ? '' : 'es'}`,
  });

  // La confirmación no bloquea la respuesta ni puede tumbar la reserva.
  notificarReservaCreada(resultado.ordenId).catch((err) =>
    console.error('[booking] no se pudo enviar la confirmación', err)
  );

  return NextResponse.json(
    {
      success: true,
      bookingReference: resultado.codigoOrden,
      codigoSeguimiento: resultado.codigoSeguimiento,
      total: resultado.total,
      subtotal: resultado.subtotal,
      impuestos: resultado.impuestos,
      costoPickup,
      zonaPickup,
      fechaReservacion: cuando,
      message: 'Reserva creada. Te enviamos la confirmación por correo.',
    },
    { status: 201 }
  );
});

/** Disponibilidad para pintar el calendario del formulario. */
export const GET = rutaProtegida(async (request: NextRequest) => {
  await aplicarLimite(request, 'booking-get', 60, 60);
  const sp = request.nextUrl.searchParams;

  const fecha = sp.get('fecha');
  if (fecha) return NextResponse.json({ success: true, ...(await getDisponibilidad(fecha)) });

  const dias = Math.min(60, Math.max(1, parseInt(sp.get('dias') ?? '30', 10)));
  return NextResponse.json({ success: true, dias: await getCalendarioDisponibilidad(dias) });
});

/** Empleado bajo el que quedan las reservas automáticas. */
async function empleadoDelSistema(): Promise<number> {
  const { queryOne } = await import('@/lib/db');
  const fila = await queryOne<{ empleado_id: number }>(
    `SELECT e.empleado_id FROM empleados e
     JOIN usuarios u ON u.usuario_id = e.usuario_id
     WHERE e.activo AND u.rol = 'admin'
     ORDER BY e.empleado_id LIMIT 1`
  );
  if (!fila) {
    throw new BusinessError(
      'No hay ningún administrador dado de alta para recibir reservas.',
      503
    );
  }
  return fila.empleado_id;
}
