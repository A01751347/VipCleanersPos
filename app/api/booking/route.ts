// app/api/booking/route.ts (versión mejorada)
import { NextRequest, NextResponse } from 'next/server';
import { 
  createClient, 
  getClientByEmail, 
  createReservation,
  getOrderByCode,
  getReservationByCode,
  createAddress
} from '../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      fullName,
      email,
      phone,
      shoesType,
      serviceType,
      deliveryMethod,
      bookingDate,
      // Nuevos campos
      address,
      requiresPickup
    } = await request.json();
    
    // Validaciones básicas
    if (!fullName || !email || !phone || !shoesType || !serviceType || !deliveryMethod || !bookingDate) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de teléfono (solo números)
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      return NextResponse.json(
        { error: 'El número de teléfono debe tener al menos 10 dígitos' },
        { status: 400 }
      );
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El correo electrónico no es válido' },
        { status: 400 }
      );
    }
    
    // Extraer nombre y apellidos
    const nameParts = fullName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const firstName = nameParts[0];
    
    // Buscar si el cliente ya existe o crear uno nuevo
    let clientId;
    const existingClient = await getClientByEmail(email);
    
    if (existingClient) {
      clientId = existingClient.cliente_id;
    } else {
      clientId = await createClient(
        firstName,
        lastName,
        phoneClean,
        email
      );
    }
    
    // Calcular la fecha de entrega estimada (por defecto 3 días después)
    const bookingDateTime = new Date(bookingDate);
    const estimatedDeliveryDate = new Date(bookingDateTime);
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 3);
    
    // Si requiere pickup, crear la dirección
    let addressId = null;
    if (requiresPickup && address) {
      addressId = await createAddress(
        clientId,
        'pickup',
        address.street,
        address.number,
        address.interior || null,
        address.neighborhood || null,
        address.municipality || null,
        address.city,
        address.state,
        address.zipCode,
        'Dirección de pickup',
        address.phone || phoneClean,
        fullName,
        address.instructions || null,
        address.timeWindowStart || null,
        address.timeWindowEnd || null
      );
    }
    
    // Crear la reservación
    const { code } = await createReservation(
      clientId,
      parseInt(serviceType),  // serviceType ahora es el ID del servicio
      null,  // modeloId (podría ser un nuevo campo en el formulario)
      null,  // marca (podría ser un nuevo campo en el formulario)
      shoesType,  // Usamos shoesType como nombre de modelo por ahora
      `Tipo de calzado: ${shoesType}`,  // descripción
      bookingDateTime,
      estimatedDeliveryDate,
      `Método de entrega: ${deliveryMethod}`,
      addressId,
      requiresPickup,
      requiresPickup ? bookingDateTime : null
    );
    
    return NextResponse.json({ 
      success: true, 
      bookingReference: code,
      message: 'Reserva creada exitosamente'
    }, { status: 201 });
  } catch (error) {
    console.error('Error en el endpoint de reserva:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Endpoint mejorado para obtener información de una reserva o orden
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    console.log('Tracking request for reference:', reference);
    
    if (!reference) {
      return NextResponse.json(
        { error: 'Código de referencia es requerido' },
        { status: 400 }
      );
    }
    
    const cleanReference = reference.trim().toUpperCase();
    
    // Intentar primero como orden
    let bookingData = null;
    let type = null;
    
    try {
      const orderData = await getOrderByCode(cleanReference);
      if (orderData) {
        bookingData = orderData;
        type = 'order';
        console.log('Found as order:', orderData.codigo_orden);
      }
    } catch (error) {
      console.log('Not found as order, trying reservation...');
    }
    
    // Si no es una orden, intentar como reservación
    if (!bookingData) {
      try {
        const reservationData = await getReservationByCode(cleanReference);
        if (reservationData) {
          bookingData = reservationData;
          type = 'reservation';
          console.log('Found as reservation:', reservationData.codigo_reservacion);
        }
      } catch (error) {
        console.log('Not found as reservation either');
      }
    }
    
    if (!bookingData) {
      return NextResponse.json(
        { error: 'No se encontró ninguna orden o reserva con ese código' },
        { status: 404 }
      );
    }
    
    // Normalizar la respuesta para el frontend
    const normalizedResponse = {
      // Datos básicos
      id: bookingData.id || bookingData.orden_id || bookingData.reservacion_id,
      type,
      
      // Códigos de referencia
      codigo_orden: bookingData.codigo_orden,
      codigo_reservacion: bookingData.codigo_reservacion,
      booking_reference: bookingData.codigo_orden || bookingData.codigo_reservacion,
      
      // Información del cliente
      cliente_nombre: bookingData.cliente_nombre || bookingData.nombre_cliente,
      cliente_apellidos: bookingData.cliente_apellidos || bookingData.apellidos_cliente,
      cliente_email: bookingData.cliente_email || bookingData.email,
      cliente_telefono: bookingData.cliente_telefono || bookingData.telefono,
      
      // Información del servicio
      servicio_nombre: bookingData.servicio_nombre || bookingData.servicio_solicitado,
      marca: bookingData.marca || bookingData.marca_calzado,
      modelo: bookingData.modelo || bookingData.modelo_calzado,
      shoes_type: bookingData.shoes_type || bookingData.modelo_calzado,
      
      // Estado y fechas
      status: bookingData.estado_actual || bookingData.estado || 'pendiente',
      estado: bookingData.estado_actual || bookingData.estado || 'pendiente',
      fecha_recepcion: bookingData.fecha_recepcion,
      fecha_reservacion: bookingData.fecha_reservacion,
      created_at: bookingData.created_at || bookingData.fecha_creacion,
      
      // Información adicional
      delivery_method: bookingData.delivery_method || bookingData.metodo_entrega,
      total: bookingData.total,
      estado_pago: bookingData.estado_pago,
      
      // Datos específicos para órdenes
      ...(type === 'order' && {
        servicios: bookingData.servicios,
        historial: bookingData.historial
      }),
      
      // Datos específicos para reservas
      ...(type === 'reservation' && {
        notas: bookingData.notas
      })
    };
    
    console.log('Returning normalized response:', {
      id: normalizedResponse.id,
      type: normalizedResponse.type,
      status: normalizedResponse.status,
      reference: normalizedResponse.booking_reference
    });
    
    return NextResponse.json({ 
      success: true,
      booking: normalizedResponse 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al obtener la reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, intenta nuevamente.' },
      { status: 500 }
    );
  }
}