// app/api/booking/route.ts - Versión actualizada para múltiples servicios correctos
import { NextRequest, NextResponse } from 'next/server';
import { 
  createClient, 
  getClientByEmail, 
  createReservation,
  getOrderByCode,
  getReservationByCode,
  createAddress,
  executeQuery
} from '../../../lib/database';

// Zonas de cobertura con costos de pickup
const COVERAGE_ZONES = [
  { zipRange: ['76000', '76099'], zone: 'Centro', cost: 49, time: '30-45 min' },
  { zipRange: ['76100', '76199'], zone: 'Norte', cost: 69, time: '45-60 min' },
  { zipRange: ['76200', '76299'], zone: 'Sur', cost: 79, time: '50-65 min' },
  { zipRange: ['76300', '76399'], zone: 'Este', cost: 59, time: '35-50 min' },
  { zipRange: ['76400', '76499'], zone: 'Oeste', cost: 64, time: '40-55 min' }
];

// Tipos para múltiples servicios
interface ServiceRequest {
  serviceId: string;
  quantity: number;
  shoesType: string;
  serviceName?: string;
  servicePrice?: number;
}

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

// ============== POST - Crear Reserva con Múltiples Servicios como Orden ==============
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    
    console.log('📥 Booking request received:', {
      hasFullName: !!requestBody.fullName,
      hasEmail: !!requestBody.email,
      hasPhone: !!requestBody.phone,
      deliveryMethod: requestBody.deliveryMethod,
      servicesCount: requestBody.services?.length || 0,
      // Mantener compatibilidad con versión anterior
      serviceType: requestBody.serviceType,
      shoesType: requestBody.shoesType
    });
    
    const {
      fullName,
      email,
      phone,
      services, // Array de servicios nuevo
      serviceType, // Mantener compatibilidad
      shoesType, // Mantener compatibilidad  
      totalServiceCost,
      deliveryMethod,
      bookingDate,
      bookingTime,
      address,
      requiresPickup,
      pickupCost,
      pickupZone
    } = requestBody;
    
    // Validaciones básicas
    if (!fullName || !email || !phone || !deliveryMethod || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { error: 'Todos los campos básicos son requeridos' },
        { status: 400 }
      );
    }

    // Validar servicios - priorizar el array de servicios, pero mantener compatibilidad
    let servicesToProcess: ServiceRequest[] = [];
    
    if (services && Array.isArray(services) && services.length > 0) {
      // Nueva estructura con múltiples servicios
      servicesToProcess = services;
      
      // Validar cada servicio
      for (let i = 0; i < servicesToProcess.length; i++) {
        const service = servicesToProcess[i];
        if (!service.serviceId || !service.shoesType || service.quantity < 1) {
          return NextResponse.json(
            { error: `Servicio ${i + 1}: Todos los campos son requeridos y la cantidad debe ser mayor a 0` },
            { status: 400 }
          );
        }
      }
    } else if (serviceType && shoesType) {
      // Compatibilidad con versión anterior
      servicesToProcess = [{
        serviceId: serviceType,
        quantity: 1,
        shoesType: shoesType
      }];
    } else {
      return NextResponse.json(
        { error: 'Debe especificar al menos un servicio' },
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
      console.log('✅ Cliente existente encontrado:', clientId);
      
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
        console.log('✅ Cliente actualizado exitosamente');
      } catch (updateError) {
        console.log('⚠️ Error actualizando cliente (no crítico):', updateError);
      }
    } else {
      console.log('🆕 Creando nuevo cliente...');
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
        
        console.log('✅ Nuevo cliente creado con ID:', clientId);
      } catch (createError) {
        console.error('❌ Error creando cliente:', createError);
        throw new Error('Error al crear el cliente');
      }
    }
    
    // Verificar que clientId sea válido
    if (!clientId || typeof clientId !== 'number') {
      console.error('❌ Cliente ID inválido:', clientId, typeof clientId);
      throw new Error('Error al obtener ID de cliente válido');
    }
    
    // Crear dirección si es pickup
    let addressId = null;
    if (requiresPickup && address) {
      console.log('🏠 Creando dirección de pickup...');
      try {
        addressId = await createAddress(
          clientId,                                    // clienteId
          'pickup',                                   // tipo
          address.street || '',                       // calle
          address.number || '',                       // numeroExterior
          address.interior || '',                   // numeroInterior
          address.neighborhood || '',               // colonia
          address.municipality || '',               // delegacionMunicipio
          address.city || 'Santiago de Querétaro',   // ciudad
          address.state || 'Querétaro',              // estado
          address.zipCode || '',                      // codigoPostal
          'Dirección de pickup para reserva',        // alias
          address.phone || phoneClean,               // telefonoContacto
          fullName,                                  // destinatario
          address.instructions || "",              // instrucciones
          address.timeWindowStart || "",           // ventanaHoraInicio
          address.timeWindowEnd || ""              // ventanaHoraFin
        );
        console.log('✅ Dirección creada con ID:', addressId);
        
        if (!addressId || typeof addressId !== 'number') {
          throw new Error('No se pudo crear la dirección correctamente');
        }
      } catch (error) {
        console.error('❌ Error creando dirección:', error);
        return NextResponse.json(
          { error: 'Error al guardar la dirección: ' + (error instanceof Error ? error.message : 'Error desconocido') },
          { status: 500 }
        );
      }
    }
    
    // Combinar fecha y hora para crear un datetime completo
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    const estimatedDeliveryDate = new Date(bookingDateTime);
    
    // Calcular tiempo total estimado basado en los servicios
    let totalEstimatedMinutes = 0;
    for (const service of servicesToProcess) {
      try {
        const serviceResult = await executeQuery<any[]>({
          query: 'SELECT tiempo_estimado_minutos FROM servicios WHERE servicio_id = ?',
          values: [parseInt(service.serviceId)]
        });
        
        if (serviceResult.length > 0 && serviceResult[0].tiempo_estimado_minutos) {
          totalEstimatedMinutes += serviceResult[0].tiempo_estimado_minutos * service.quantity;
        } else {
          // Tiempo por defecto si no se encuentra
          totalEstimatedMinutes += 60 * service.quantity; // 1 hora por servicio por defecto
        }
      } catch (error) {
        console.log('⚠️ Error obteniendo información del servicio:', error);
        totalEstimatedMinutes += 60 * service.quantity; // Fallback
      }
    }
    
    // Agregar tiempo estimado más 72 horas de procesamiento
    estimatedDeliveryDate.setTime(
      estimatedDeliveryDate.getTime() + 
      (totalEstimatedMinutes * 60 * 1000) + 
      (72 * 60 * 60 * 1000)
    );
    
    // 🆕 NUEVA LÓGICA: Crear como ORDEN en lugar de reservación
    console.log('💾 Creando orden directamente para múltiples servicios...');
    
    try {
      // 1. Crear la orden principal usando el procedimiento almacenado
      await executeQuery({
        query: `CALL CrearOrden(?, ?, NULL, ?, ?, @orden_id, @codigo_orden)`,
        values: [
          clientId, 
          1, // empleado_id por defecto para booking online
          estimatedDeliveryDate, 
          `Reservación online con ${servicesToProcess.length} servicio${servicesToProcess.length > 1 ? 's' : ''}`
        ]
      });
      
      const [orderResult] = await executeQuery<any>({
        query: `SELECT @orden_id as orden_id, @codigo_orden as codigo_orden`,
        values: []
      });
      
      const ordenId = orderResult.orden_id;
      const codigoOrden = orderResult.codigo_orden;
      
      console.log('✅ Orden creada:', { ordenId, codigoOrden });
      
      // 2. Agregar todos los servicios a la orden
      let subtotalTotal = 0;
      
      for (const service of servicesToProcess) {
        try {
          // Obtener información del servicio
          const serviceInfo = await executeQuery<any[]>({
            query: 'SELECT * FROM servicios WHERE servicio_id = ?',
            values: [parseInt(service.serviceId)]
          });
          
          if (serviceInfo.length === 0) {
            console.warn(`⚠️ Servicio ${service.serviceId} no encontrado`);
            continue;
          }
          
          const servicioData = serviceInfo[0];
          const precioUnitario = servicioData.precio || 0;
          
          // Crear registros individuales para cada par de tenis
          for (let i = 0; i < service.quantity; i++) {
            await executeQuery({
              query: `
                INSERT INTO detalles_orden_servicios (
                  orden_id, servicio_id, cantidad, precio_unitario, descuento, subtotal,
                  modelo_id, marca, modelo, descripcion_calzado
                ) VALUES (?, ?, 1, ?, 0.00, ?, ?, ?, ?, ?)
              `,
              values: [
                ordenId,
                parseInt(service.serviceId),
                precioUnitario,
                precioUnitario,
                null, // modelo_id
                null, // marca (extraer de shoesType si es necesario)
                service.shoesType.trim(), // modelo
                `Par ${i + 1} de ${service.quantity} - ${service.shoesType}` // descripcion
              ]
            });
            
            subtotalTotal += precioUnitario;
          }
          
          console.log(`✅ Servicio agregado: ${servicioData.nombre} x${service.quantity}`);
        } catch (serviceError) {
          console.error(`❌ Error agregando servicio ${service.serviceId}:`, serviceError);
          throw serviceError;
        }
      }
      
      // 3. Calcular totales
      const iva = subtotalTotal * 0.16; // 16% IVA
      const totalOrden = subtotalTotal + iva;
      
      // 4. Actualizar la orden con totales y información adicional
      let notasAdicionales = `Reservación online - ${servicesToProcess.length} servicio${servicesToProcess.length > 1 ? 's' : ''}`;
      if (requiresPickup && pickupZone) {
        notasAdicionales += `\nPickup: Zona ${pickupZone} (+${pickupCost || 0})`;
      }
      if (address && address.instructions) {
        notasAdicionales += `\nInstrucciones: ${address.instructions}`;
      }
      
      await executeQuery({
        query: `
          UPDATE ordenes 
          SET 
            subtotal = ?, 
            impuestos = ?, 
            total = ?, 
            estado_pago = 'pendiente',
            requiere_identificacion = FALSE,
            metodo_pago = 'pendiente',
            notas = ?,
            direccion_id = ?
          WHERE orden_id = ?
        `,
        values: [
          subtotalTotal, 
          iva, 
          totalOrden, 
          notasAdicionales,
          addressId,
          ordenId
        ]
      });
      
// Versión mejorada del manejo de pickup sin dependencia de servicio específico
// Reemplazar la sección del pickup en el código anterior

// 5. Si hay pickup, agregar información de costos SIN crear servicio adicional
if (requiresPickup && pickupCost && pickupZone) {
  try {
    // Opción 1: Agregar el costo directamente al total de la orden
    const nuevoTotal = totalOrden + pickupCost;
    
    await executeQuery({
      query: `
        UPDATE ordenes 
        SET 
          total = ?,
          costo_pickup = ?,
          zona_pickup = ?,
          notas = CONCAT(COALESCE(notas, ''), '\nPickup: Zona ', ?, ' (+$', ?, ')')
        WHERE orden_id = ?
      `,
      values: [nuevoTotal, pickupCost, pickupZone, pickupZone, pickupCost, ordenId]
    });
    
    console.log('✅ Información de pickup agregada a la orden');
    
    // Opción 2: Si quieres mantener el pickup como un ítem separado, usar una tabla de costos adicionales
    try {
      await executeQuery({
        query: `
          INSERT INTO costos_adicionales_orden (
            orden_id,
            concepto,
            descripcion,
            monto,
            fecha_creacion
          ) VALUES (?, 'pickup', ?, ?, NOW())
        `,
        values: [
          ordenId,
          `Servicio de pickup - Zona ${pickupZone}`,
          pickupCost
        ]
      });
      console.log('✅ Costo de pickup registrado en costos adicionales');
    } catch (additionalCostError) {
      console.warn('⚠️ Tabla costos_adicionales_orden no existe, usando solo el campo costo_pickup');
    }
    
  } catch (pickupError) {
    console.warn('⚠️ Error agregando pickup (no crítico):', pickupError);
  }
}
      
      console.log('🎉 Orden con múltiples servicios creada exitosamente:', codigoOrden);
      
      return NextResponse.json({ 
        success: true, 
        bookingReference: codigoOrden,
        orderId: ordenId,
        message: 'Orden creada exitosamente',
        details: {
          ordenId,
          clientId,
          addressId,
          servicesCount: servicesToProcess.length,
          totalServices: servicesToProcess.reduce((sum, s) => sum + s.quantity, 0),
          deliveryMethod,
          pickupCost: requiresPickup ? (pickupCost || 0) : 0,
          totalServiceCost: subtotalTotal,
          totalWithTax: totalOrden,
          estimatedDelivery: estimatedDeliveryDate.toISOString()
        }
      }, { status: 201 });
      
    } catch (orderError) {
      console.error('❌ Error creando orden:', orderError);
      return NextResponse.json(
        { error: 'Error al crear la orden: ' + (orderError instanceof Error ? orderError.message : 'Error desconocido') },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error en el endpoint de reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, intenta nuevamente.' },
      { status: 500 }
    );
  }
}

// ============== GET - Obtener información de reserva/orden ==============
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    console.log('🔍 Tracking request for reference:', reference);
    
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
        console.log('✅ Found as order:', orderData.codigo_orden);
      }
    } catch (error) {
      console.log('ℹ️ Not found as order, trying reservation...');
    }
    
    // Si no es una orden, intentar como reservación
    if (!bookingData) {
      try {
        const reservationData = await getReservationByCode(cleanReference);
        if (reservationData) {
          bookingData = reservationData;
          type = 'reservation';
          console.log('✅ Found as reservation:', reservationData.codigo_reservacion);
        }
      } catch (error) {
        console.log('ℹ️ Not found as reservation either');
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
          console.log('⚠️ Error obteniendo dirección:', error);
        }
      }
      
      // Obtener detalles de servicios si existen
      try {
        const serviceDetails = await executeQuery<any[]>({
          query: `
            SELECT 
              drs.*,
              s.nombre as servicio_nombre,
              s.descripcion as servicio_descripcion
            FROM detalles_reservacion_servicios drs
            JOIN servicios s ON drs.servicio_id = s.servicio_id
            WHERE drs.reservacion_id = ?
          `,
          values: [bookingData.reservacion_id]
        });
        
        if (serviceDetails.length > 0) {
          bookingData.servicios_detalle = serviceDetails;
        }
      } catch (error) {
        console.log('⚠️ Error obteniendo detalles de servicios:', error);
      }
    }
    
    // Para órdenes, obtener servicios y detalles
    if (type === 'order') {
      try {
        const serviceDetails = await executeQuery<any[]>({
          query: `
            SELECT 
              dos.*,
              s.nombre as servicio_nombre,
              s.descripcion as servicio_descripcion
            FROM detalles_orden_servicios dos
            JOIN servicios s ON dos.servicio_id = s.servicio_id
            WHERE dos.orden_id = ?
            ORDER BY dos.detalle_servicio_id ASC
          `,
          values: [bookingData.orden_id]
        });
        
        if (serviceDetails.length > 0) {
          bookingData.servicios_detalle = serviceDetails;
        }
      } catch (error) {
        console.log('⚠️ Error obteniendo detalles de servicios de orden:', error);
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
      status: bookingData.estado_actual || bookingData.estado || 'pending',
      estado: bookingData.estado_actual || bookingData.estado || 'pending',
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
      
      // Detalles de servicios múltiples
      servicios_detalle: bookingData.servicios_detalle || null,
      
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
    
    console.log('✅ Returning normalized response:', {
      id: normalizedResponse.id,
      type: normalizedResponse.type,
      status: normalizedResponse.status,
      reference: normalizedResponse.booking_reference,
      servicesCount: normalizedResponse.servicios_detalle?.length || 0
    });
    
    return NextResponse.json({ 
      success: true,
      booking: normalizedResponse 
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error al obtener la reserva:', error);
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
        zoneInfo: {
          zone: zoneInfo.zone,
          isSupported: zoneInfo.available,
          additionalCost: zoneInfo.cost,
          estimatedTime: zoneInfo.time
        }
      }, { status: 200 });
    }
    
    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('❌ Error en validación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}