// app/api/admin/bookings/[id]/transfer-to-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../auth';
import { 
  getReservationWithDetails, 
  createOrderFromReservation,
  executeQuery,
  getAvailableEmployees // Para debugging
} from '../../../../../../lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const reservacionId = parseInt(id, 10);
    
    if (isNaN(reservacionId)) {
      return NextResponse.json(
        { error: 'ID de reservación inválido' },
        { status: 400 }
      );
    }

    const { notasAdicionales } = await request.json();
    const empleadoId = 1;

    console.log('Datos de sesión:', {
      userId: session.user.id,
      empleadoId,
      userRole: session.user.role
    });

    if (!empleadoId) {
      return NextResponse.json(
        { error: 'No se pudo identificar el empleado en la sesión' },
        { status: 400 }
      );
    }

    // Verificar que el empleado existe en la base de datos
    try {
      const empleadoCheck = await executeQuery<any[]>({
        query: 'SELECT empleado_id, nombre, apellidos, activo FROM empleados WHERE empleado_id = ?',
        values: [empleadoId]
      });

      if (empleadoCheck.length === 0) {
        // Debug: mostrar empleados disponibles
        const empleadosDisponibles = await getAvailableEmployees();
        console.error('Empleado no encontrado. Empleados disponibles:', empleadosDisponibles);
        
        return NextResponse.json(
          { 
            error: `Empleado con ID ${empleadoId} no encontrado en la base de datos`,
            debug: {
              empleadosDisponibles: empleadosDisponibles.map(e => ({
                id: e.empleado_id,
                nombre: `${e.nombre} ${e.apellidos}`,
                puesto: e.puesto
              }))
            }
          },
          { status: 400 }
        );
      }

      if (!empleadoCheck[0].activo) {
        return NextResponse.json(
          { error: `El empleado ${empleadoCheck[0].nombre} ${empleadoCheck[0].apellidos} no está activo` },
          { status: 400 }
        );
      }

      console.log('Empleado validado:', empleadoCheck[0]);

    } catch (error) {
      console.error('Error validando empleado:', error);
      return NextResponse.json(
        { error: 'Error al validar el empleado' },
        { status: 500 }
      );
    }

    // Obtener datos completos de la reservación
    const reservacion = await getReservationWithDetails(reservacionId);
    
    if (!reservacion) {
      return NextResponse.json(
        { error: 'Reservación no encontrada' },
        { status: 404 }
      );
    }

    console.log('Reservación encontrada:', {
      id: reservacion.id,
      codigo: reservacion.booking_reference,
      cliente_id: reservacion.cliente_id,
      is_active: reservacion.is_active,
      status: reservacion.status
    });

    // Verificar que la reservación esté activa
    if (!reservacion.is_active) {
      return NextResponse.json(
        { error: 'La reservación no está activa' },
        { status: 400 }
      );
    }

    // Verificar que no se haya transferido ya
    if (reservacion.status === 'completed' || reservacion.status_raw === 'transferida_a_orden') {
      return NextResponse.json(
        { error: 'Esta reservación ya ha sido procesada' },
        { status: 400 }
      );
    }

    // Crear la orden basada en la reservación
    const result = await transferBookingToOrder(reservacion, empleadoId, notasAdicionales);

    return NextResponse.json({
      success: true,
      message: 'Reservación transferida exitosamente a orden',
      data: {
        ordenId: result.ordenId,
        codigoOrden: result.codigoOrden,
        codigoReservacion: reservacion.booking_reference,
        total: result.total
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error transfiriendo reservación a orden:', error);
    
    let errorMessage = 'Error al procesar la solicitud';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('no encontrada') || error.message.includes('no encontrado')) {
        statusCode = 404;
      } else if (
        error.message.includes('no está activa') || 
        error.message.includes('ya ha sido procesada') ||
        error.message.includes('no está activo')
      ) {
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

async function transferBookingToOrder(
  reservacion: any,
  empleadoId: number,
  notasAdicionales: string | null = null
) {
  try {
    console.log('Iniciando transferencia de reservación a orden:', {
      reservacionId: reservacion.id,
      clienteId: reservacion.cliente_id,
      empleadoId
    });

    // 1. Preparar fechas y notas
    const fechaEntregaEstimada = reservacion.estimated_delivery 
      ? new Date(reservacion.estimated_delivery)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días por defecto

    const notasCombinadas = [
      `Transferido desde reservación: ${reservacion.booking_reference}`,
      reservacion.notes && `Notas originales: ${reservacion.notes}`,
      notasAdicionales && `Notas adicionales: ${notasAdicionales}`
    ].filter(Boolean).join('\n');

    // 2. Crear la orden usando la función específica (con validaciones)
    const { id: ordenId, code: codigoOrden } = await createOrderFromReservation(
      reservacion.cliente_id,
      empleadoId,
      reservacion.id,
      fechaEntregaEstimada,
      notasCombinadas
    );

    console.log('Orden creada exitosamente:', { ordenId, codigoOrden });

    // 3. Agregar el servicio a la orden
    const precioServicio = reservacion.service_price || 0;
    
    await executeQuery({
      query: `
        INSERT INTO detalles_orden_servicios (
          orden_id, 
          servicio_id, 
          cantidad, 
          precio_unitario, 
          descuento, 
          subtotal,
          modelo_id,
          marca,
          modelo,
          descripcion_calzado
        ) VALUES (?, ?, 1, ?, 0.00, ?, ?, ?, ?, ?)
      `,
      values: [
        ordenId,
        reservacion.servicio_id,
        precioServicio,
        precioServicio,
        reservacion.modelo_id || null,
        reservacion.marca || null,
        reservacion.modelo || null,
        reservacion.shoes_description || null
      ]
    });

    console.log('Servicio agregado a la orden');

    // 4. Calcular totales
    const subtotal = precioServicio;
    const iva = subtotal * 0.16; // 16% IVA
    const total = subtotal + iva;

    // 5. Actualizar la orden con los totales y código de reservación
    await executeQuery({
      query: `
        UPDATE ordenes 
        SET 
          subtotal = ?, 
          impuestos = ?, 
          total = ?, 
          estado_pago = 'pendiente',
          codigo_reservacion = ?
        WHERE orden_id = ?
      `,
      values: [subtotal, iva, total, reservacion.booking_reference, ordenId]
    });

    console.log('Orden actualizada con totales y código de reservación');

    // 6. Marcar la reservación como transferida
    await executeQuery({
      query: `
        UPDATE reservaciones 
        SET 
          estado = 'transferida_a_orden', 
          orden_id = ?,
          fecha_actualizacion = NOW()
        WHERE reservacion_id = ?
      `,
      values: [ordenId, reservacion.id]
    });

    console.log('Reservación marcada como transferida');

    return { 
      ordenId, 
      codigoOrden, 
      total: Math.round(total * 100) / 100,
      codigoReservacion: reservacion.booking_reference
    };

  } catch (error) {
    console.error('Error en transferBookingToOrder:', error);
    throw error;
  }
}