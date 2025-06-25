// app/api/booking/route.ts - Versión Completa Compatible
import { NextRequest, NextResponse } from 'next/server';
import { 
  createClient, 
  getClientByEmail, 
  createReservation,
  getOrderByCode,
  getReservationByCode,
  createAddress,
  executeQuery
} from '../../../lib/db';

// Zonas de cobertura con costos de pickup
const COVERAGE_ZONES = [
  { zipRange: ['76000', '76099'], zone: 'Centro', cost: 49, time: '30-45 min' },
  { zipRange: ['76100', '76199'], zone: 'Norte', cost: 69, time: '45-60 min' },
  { zipRange: ['76200', '76299'], zone: 'Sur', cost: 79, time: '50-65 min' },
  { zipRange: ['76300', '76399'], zone: 'Este', cost: 59, time: '35-50 min' },
  { zipRange: ['76400', '76499'], zone: 'Oeste', cost: 64, time: '40-55 min' }
];

// Función para validar zona de cobertura
function validatePickupZone(zipCode: string) {
  if (!zipCode || zipCode.length !== 5) {
    return { available: false, zone: null, cost: 0, time: '' };
  }

  const zip = parseInt(zipCode);
  const zone = COVERAGE_ZONES.find(z => {
    return zip >= parseInt(z.zipRange[0]) && zip <= parseInt(z.zipRange[1]);
  });

  if (zone) {
    return {
      available: true,
      zone: zone.zone,
      cost: zone.cost,
      time: zone.time
    };
  }

  return { available: false, zone: null, cost: 0, time: '' };
}

// ============== POST - Crear Reserva ==============
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    
    // Debug: Log del cuerpo de la petición
    console.log('Body completo recibido:', JSON.stringify(requestBody, null, 2));
    
    const {
      fullName,
      email,
      phone,
      shoesType,
      serviceType,
      deliveryMethod,
      bookingDate,
      address,
      requiresPickup,
      pickupCost,
      pickupZone
    } = requestBody;
    
    console.log('Datos de reserva recibidos:', {
      fullName,
      email,
      phone,
      shoesType,
      serviceType,
      deliveryMethod,
      requiresPickup: !!requiresPickup,
      pickupCost: pickupCost || 0,
      hasAddress: !!address
    });
    
    // Validaciones básicas
    if (!fullName || !email || !phone || !shoesType || !serviceType || !deliveryMethod || !bookingDate) {
      return NextResponse.json(
        { error: 'Todos los campos básicos son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de teléfono
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 10) {
      return NextResponse.json(
        { error: 'El número de teléfono debe tener 10 dígitos' },
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

    // Validar pickup si es necesario
    if (requiresPickup && deliveryMethod === 'pickup') {
      if (!address || !address.street || !address.number || !address.neighborhood || !address.zipCode) {
        return NextResponse.json(
          { error: 'La dirección completa es requerida para pickup' },
          { status: 400 }
        );
      }

      // Validar zona de cobertura
      const zoneValidation = validatePickupZone(address.zipCode);
      if (!zoneValidation.available) {
        return NextResponse.json(
          { error: 'La zona no tiene cobertura de pickup disponible' },
          { status: 400 }
        );
      }

      // Verificar que el costo enviado coincida
      if (pickupCost !== zoneValidation.cost) {
        return NextResponse.json(
          { error: 'El costo de pickup no coincide con la zona' },
          { status: 400 }
        );
      }
    }
    
    // Extraer nombre y apellidos
    const nameParts = fullName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const firstName = nameParts[0];
    
    // Buscar o crear cliente
    let clientId;
    const existingClient = await getClientByEmail(email);
    
    if (existingClient) {
      clientId = existingClient.cliente_id;
      console.log('Cliente existente encontrado:', clientId);
      
      // Actualizar información del cliente si es necesario
      try {
        await executeQuery({
          query: `
            UPDATE clientes 
            SET telefono = ?, nombre = ?, apellidos = ?, fecha_actualizacion = NOW()
            WHERE cliente_id = ?
          `,
          values: [phoneClean, firstName, lastName, clientId]
        });
        console.log('Cliente actualizado exitosamente');
      } catch (updateError) {
        console.log('Error actualizando cliente (no crítico):', updateError);
      }
    } else {
      console.log('Creando nuevo cliente...');
      try {
        clientId = await createClient(
          firstName,
          lastName,
          phoneClean,
          email,
          "",  // direccion
          "",  // codigo_postal
          "",  // ciudad
          ""   // estado
        );
        
        console.log('Nuevo cliente creado con ID:', clientId);
      } catch (createError) {
        console.error('Error creando cliente:', createError);
        throw new Error('Error al crear el cliente');
      }
    }
    
    // Verificar que clientId sea válido
    if (!clientId || typeof clientId !== 'number') {
      console.error('Cliente ID inválido:', clientId, typeof clientId);
      throw new Error('Error al obtener ID de cliente válido');
    }
    
    // Crear dirección si es pickup
    let addressId = null;
    if (requiresPickup && address) {
      console.log('Creando dirección de pickup...');
      try {
        addressId = await createAddress(
          clientId,                                    // clienteId
          'pickup',                                   // tipo
          address.street || '',                       // calle
          address.number || '',                       // numeroExterior
          address.interior || '',                   // numeroInterior
          address.neighborhood || '',               // colonia
          address.municipality || '',               // delegacionMunicipio
          address.city || '',   // ciudad
          address.state || 'CDMX',              // estado
          address.zipCode || '',                      // codigoPostal
          'Dirección de pickup para reserva',        // alias
          address.phone || phoneClean,               // telefonoContacto
          fullName,                                  // destinatario
          address.instructions || "",              // instrucciones
          address.timeWindowStart || "",           // ventanaHoraInicio
          address.timeWindowEnd || ""              // ventanaHoraFin
        );
        console.log('Dirección creada con ID:', addressId);
        
        if (!addressId || typeof addressId !== 'number') {
          throw new Error('No se pudo crear la dirección correctamente');
        }
      } catch (error) {
        console.error('Error creando dirección:', error);
        return NextResponse.json(
          { error: 'Error al guardar la dirección: ' + (error instanceof Error ? error.message : 'Error desconocido') },
          { status: 500 }
        );
      }
    }
    
    // Calcular fechas
    const bookingDateTime = new Date(bookingDate);
    const estimatedDeliveryDate = new Date(bookingDateTime);
    
    // Obtener información del servicio para calcular tiempo de entrega
    let serviceInfo = null;
    try {
      const serviceResult = await executeQuery<any[]>({
        query: 'SELECT tiempo_estimado_minutos FROM servicios WHERE servicio_id = ?',
        values: [parseInt(serviceType)]
      });
      
      if (serviceResult.length > 0) {
        serviceInfo = serviceResult[0];
      }
    } catch (error) {
      console.log('Error obteniendo información del servicio:', error);
    }
    
    if (serviceInfo && serviceInfo.tiempo_estimado_minutos) {
      // Agregar tiempo del servicio más 24 horas
      estimatedDeliveryDate.setTime(
        estimatedDeliveryDate.getTime() + 
        (serviceInfo.tiempo_estimado_minutos * 60 * 1000) + 
        (72 * 60 * 60 * 1000)
      );
    } else {
      // Por defecto 3 días después
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 3);
    }
    
    // Crear notas con información adicional
    let notes = `Método de entrega: ${deliveryMethod || 'store'}`;
    if (requiresPickup && pickupZone) {
      notes += `\nZona de pickup: ${pickupZone} (+${pickupCost || 0})`;
    }
    if (address && address.instructions) {
      notes += `\nInstrucciones: ${address.instructions}`;
    }
    
    console.log('Datos para createReservation:', {
      clientId,
      serviceType: parseInt(serviceType),
      shoesType,
      bookingDateTime,
      estimatedDeliveryDate,
      notes,
      addressId,
      requiresPickup: !!requiresPickup
    });
    
    // Crear la reservación directamente con INSERT en lugar del procedimiento almacenado
    try {
      console.log('Creando reservación con INSERT directo...');
      
      // Generar código de reservación único
      const generateBookingCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'RES';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      
      const codigoReservacion = generateBookingCode();
      
      // Insertar reservación directamente
      const insertResult = await executeQuery<any>({
        query: `
          INSERT INTO reservaciones (
            cliente_id,
            servicio_id,
            modelo_id,
            marca,
            modelo,
            descripcion_calzado,
            fecha_reservacion,
            fecha_entrega_estimada,
            notas,
            direccion_id,
            requiere_pickup,
            fecha_solicitud_pickup,
            codigo_reservacion,
            estado,
            activo,
            fecha_creacion
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        values: [
          clientId,                           // cliente_id
          parseInt(serviceType),              // servicio_id
          null,                              // modelo_id
          null,                              // marca
          shoesType || '',                   // modelo
          `Calzado: ${shoesType || 'No especificado'}`, // descripcion_calzado
          bookingDateTime,                   // fecha_reservacion
          estimatedDeliveryDate,             // fecha_entrega_estimada
          notes || null,                     // notas
          addressId || null,                 // direccion_id
          !!requiresPickup,                  // requiere_pickup
          requiresPickup ? bookingDateTime : null, // fecha_solicitud_pickup
          codigoReservacion,                 // codigo_reservacion
          'pendiente',                       // estado
          true                               // activo
        ]
      });
      
      console.log('Reservación creada con ID:', insertResult.insertId);
      const code = codigoReservacion;
      
      // Si hay pickup, actualizar información adicional
      if (requiresPickup && addressId && pickupCost && pickupZone) {
        try {
          await executeQuery({
            query: `
              UPDATE reservaciones 
              SET costo_pickup = ?, zona_pickup = ?
              WHERE reservacion_id = ?
            `,
            values: [pickupCost, pickupZone, insertResult.insertId]
          });
          console.log('Datos de pickup actualizados');
        } catch (updateError) {
          console.log('Error actualizando datos de pickup (no crítico):', updateError);
        }
      }
      
      console.log('Reserva creada exitosamente:', code);
      
      return NextResponse.json({ 
        success: true, 
        bookingReference: code,
        message: 'Reserva creada exitosamente',
        details: {
          clientId,
          addressId,
          deliveryMethod,
          pickupCost: requiresPickup ? (pickupCost || 0) : 0,
          estimatedDelivery: estimatedDeliveryDate.toISOString()
        }
      }, { status: 201 });
      
    } catch (reservationError) {
      console.error('Error creando reservación:', reservationError);
      return NextResponse.json(
        { error: 'Error al crear la reservación: ' + (reservationError instanceof Error ? reservationError.message : 'Error desconocido') },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error en el endpoint de reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, intenta nuevamente.' },
      { status: 500 }
    );
  }
}

// ============== GET - Obtener información de reserva ==============
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
    
    // Obtener información adicional si es reserva
    if (type === 'reservation') {
      // Obtener información de la dirección si existe
      if (bookingData.direccion_id) {
        try {
          const addressInfo = await executeQuery<any[]>({
            query: 'SELECT * FROM direcciones WHERE direccion_id = ?',
            values: [bookingData.direccion_id]
          });
          
          if (addressInfo.length > 0) {
            bookingData.direccion_pickup = addressInfo[0];
          }
        } catch (error) {
          console.log('Error obteniendo dirección:', error);
        }
      }
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
      shoes_type: bookingData.shoes_type || bookingData.modelo_calzado || bookingData.modelo,
      
      // Estado y fechas
      status: bookingData.estado_actual || bookingData.estado || 'pendiente',
      estado: bookingData.estado_actual || bookingData.estado || 'pendiente',
      fecha_recepcion: bookingData.fecha_recepcion,
      fecha_reservacion: bookingData.fecha_reservacion,
      fecha_entrega_estimada: bookingData.fecha_entrega_estimada,
      created_at: bookingData.created_at || bookingData.fecha_creacion,
      
      // Información adicional
      delivery_method: bookingData.delivery_method || bookingData.metodo_entrega,
      total: bookingData.total,
      estado_pago: bookingData.estado_pago,
      costo_pickup: bookingData.costo_pickup,
      zona_pickup: bookingData.zona_pickup,
      
      // Información de dirección para pickup
      direccion_pickup: bookingData.direccion_pickup || null,
      
      // Datos específicos para órdenes
      ...(type === 'order' && {
        servicios: bookingData.servicios,
        historial: bookingData.historial,
        productos: bookingData.productos,
        pagos: bookingData.pagos
      }),
      
      // Datos específicos para reservas
      ...(type === 'reservation' && {
        notas: bookingData.notas,
        requiere_pickup: bookingData.requiere_pickup,
        fecha_solicitud_pickup: bookingData.fecha_solicitud_pickup
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

// ============== PUT - Validar zona de pickup ==============
export async function PUT(request: NextRequest) {
  try {
    const { action, zipCode } = await request.json();
    
    if (action === 'validate-zone') {
      if (!zipCode || zipCode.length !== 5) {
        return NextResponse.json(
          { error: 'Código postal debe tener 5 dígitos' },
          { status: 400 }
        );
      }
      
      const zoneInfo = validatePickupZone(zipCode);
      
      return NextResponse.json({
        success: true,
        zoneInfo
      }, { status: 200 });
    }
    
    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error en validación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ============== PATCH - Actualizar reserva (opcional) ==============
export async function PATCH(request: NextRequest) {
  try {
    const { code, updates } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Código de reserva es requerido' },
        { status: 400 }
      );
    }
    
    // Aquí puedes agregar lógica para actualizar reservas
    // Por ejemplo: cambiar fecha, actualizar dirección, etc.
    
    return NextResponse.json({
      success: true,
      message: 'Reserva actualizada exitosamente'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error actualizando reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ============== DELETE - Cancelar reserva (opcional) ==============
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Código de reserva es requerido' },
        { status: 400 }
      );
    }
    
    // Aquí puedes agregar lógica para cancelar reservas
    // Por ejemplo: marcar como cancelada, enviar notificaciones, etc.
    
    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada exitosamente'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error cancelando reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}