// app/api/track/[code]/route.ts - API actualizado para tracking unificado
import { NextRequest, NextResponse } from 'next/server';
import { 
  getReservationByCodeWithDetails, 
  getOrderByCode,
  executeQuery
} from '../../../../lib/database';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { code } = await context.params;
    
    if (!code || code.length < 3) {
      return NextResponse.json(
        { error: 'Código de seguimiento inválido' },
        { status: 400 }
      );
    }

    console.log('Buscando seguimiento para código:', code);

    let trackingData = null;
    let dataType = '';

    // 1. Primero buscar en órdenes (tanto por código de orden como por código de reservación)
    
      console.log('Buscando orden por código de orden...');
      trackingData = await getOrderByCode(code);
      dataType = 'orden';
    
    
    // 2. Si no se encuentra, buscar orden por código de reservación
    if (!trackingData) {
      console.log('Buscando orden por código de reservación...');
      trackingData = await getOrderByBookingReference(code);
      dataType = 'orden_desde_reservacion';
    }
    
    // 3. Si aún no se encuentra, buscar en reservaciones
    if (!trackingData) {
      console.log('Buscando reservación...');
      trackingData = await getReservationByCodeWithDetails(code);
      dataType = 'reservacion';
    }

    if (!trackingData) {
      return NextResponse.json(
        { 
          error: 'No se encontró ninguna orden o reservación con ese código',
          code: code
        },
        { status: 404 }
      );
    }

    // Formatear los datos según el tipo
    const formattedData = trackingData

    return NextResponse.json({
      success: true,
      data: formattedData,
      type: dataType
    }, { status: 200 });

  } catch (error) {
    console.error('Error en tracking:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de seguimiento' },
      { status: 500 }
    );
  }
}

// Función para buscar orden por código de reservación
async function getOrderByBookingReference(code: string) {
  try {
    const query = `
      SELECT 
        o.*,
        c.nombre as cliente_nombre,
        c.apellidos as cliente_apellidos,
        c.telefono as cliente_telefono,
        c.email as cliente_email,
        es.nombre as estado_nombre,
        es.descripcion as estado_descripcion,
        es.color as estado_color
      FROM ordenes o
      JOIN clientes c ON o.cliente_id = c.cliente_id
      JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
      WHERE o.codigo_reservacion = ?
    `;
    
    const result = await executeQuery<any[]>({
      query,
      values: [code]
    });
    
    if (result.length === 0) {
      return null;
    }

    const order = result[0];
    
    // Obtener servicios de la orden
    const servicios = await executeQuery<any[]>({
      query: `
        SELECT 
          dos.*,
          s.nombre as servicio_nombre,
          s.descripcion as servicio_descripcion
        FROM detalles_orden_servicios dos
        JOIN servicios s ON dos.servicio_id = s.servicio_id
        WHERE dos.orden_id = ?
      `,
      values: [order.orden_id]
    });

    // Obtener historial de estados
    const historial = await executeQuery<any[]>({
      query: `
        SELECT 
          h.*,
          es.nombre as estado_nombre,
          es.descripcion as estado_descripcion,
          es.color as estado_color,
          COALESCE(CONCAT(e.nombre, ' ', e.apellidos), 'Sistema') as empleado_nombre
        FROM historial_estados h
        JOIN estados_servicio es ON h.estado_id = es.estado_id
        LEFT JOIN empleados e ON h.empleado_id = e.empleado_id
        WHERE h.orden_id = ?
        ORDER BY h.fecha_cambio DESC
      `,
      values: [order.orden_id]
    });

    return {
      ...order,
      servicios,
      historial,
      tipo: 'orden'
    };

  } catch (error) {
    console.error('Error obteniendo orden por código de reservación:', error);
    return null;
  }
}

function formatTrackingData(data: any, type: string) {
  const baseData = {
    codigo: data.codigo_orden || data.codigo_reservacion || data.booking_reference,
    cliente: {
      nombre: data.cliente_nombre || data.client_name || data.full_name || '',
      apellidos: data.cliente_apellidos || data.client_lastname || '',
      telefono: data.cliente_telefono || data.client_phone || '',
      email: data.cliente_email || data.client_email || ''
    },
    fechaCreacion: data.fecha_creacion || data.created_at,
    notas: data.notas || data.notes
  };

  if (type === 'orden' || type === 'orden_desde_reservacion') {
    return {
      ...baseData,
      tipo: 'orden',
      estadoActual: {
        nombre: data.estado_nombre || 'Pendiente',
        descripcion: data.estado_descripcion || 'Estado no disponible',
        color: data.estado_color || 'gray'
      },
      servicios: data.servicios?.map((s: any) => ({
        cantidad: s.cantidad || 1,
        descripcion_calzado: s.descripcion_calzado || '',
        marca_calzado: s.marca || '',
        modelo_calzado: s.modelo || '',
        marca: s.marca || '',
        modelo: s.modelo || '',
        servicio_nombre: s.servicio_nombre || '',
        servicio_descripcion: s.servicio_descripcion || '',
        precio_unitario: s.precio_unitario || 0,
        subtotal: s.subtotal || 0
      })) || [],
      productos: data.productos || [],
      historial: data.historial?.map((h: any) => ({
        estado: h.estado_nombre || h.nombre || '',
        descripcion: h.estado_descripcion || h.descripcion || '',
        fecha: h.fecha_cambio || h.fecha || '',
        empleado: h.empleado_nombre || '',
        comentario: h.comentario || ''
      })) || [],
      totales: {
        subtotal: parseFloat(data.subtotal || '0'),
        impuestos: parseFloat(data.impuestos || '0'),
        total: parseFloat(data.total || '0')
      },
      fechas: {
        recepcion: data.fecha_recepcion || data.fecha_creacion,
        entregaEstimada: data.fecha_entrega_estimada,
        entregaReal: data.fecha_entrega_real
      },
      pago: {
        estado: data.estado_pago || 'pendiente',
        metodo: data.metodo_pago || ''
      },
      // Información de reservación original si aplica
      ...(data.codigo_reservacion && {
        reservacionOriginal: data.codigo_reservacion
      })
    };
  } else {
    // Es una reservación
    return {
      ...baseData,
      tipo: 'reservacion',
      estadoActual: {
        nombre: getReservationStatusName(data.status || data.estado || 'pending'),
        descripcion: getReservationStatusDescription(data.status || data.estado || 'pending'),
        color: getReservationStatusColor(data.status || data.estado || 'pending')
      },
      servicio: {
        nombre: data.servicio_nombre || data.service_name || '',
        descripcion: data.servicio_descripcion || data.service_description || '',
        precio: parseFloat(data.servicio_precio || data.service_price || '0'),
        calzado: {
          marca: data.marca || '',
          modelo: data.modelo || '',
          descripcion: data.descripcion_calzado || data.shoes_description || ''
        }
      },
      fechas: {
        recepcion: data.fecha_reservacion || data.booking_date,
        entregaEstimada: data.fecha_entrega_estimada || data.estimated_delivery,
        entregaReal: null
      },
      direccion: data.direccion_completa ? {
        completa: data.direccion_completa,
        detalles: {
          calle: data.calle,
          numeroExterior: data.numero_exterior,
          colonia: data.colonia,
          ciudad: data.ciudad,
          codigoPostal: data.codigo_postal,
          instrucciones: data.instrucciones_entrega
        }
      } : null
    };
  }
}

function getReservationStatusName(status: string): string {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case 'pending': 
    case 'pendiente': 
      return 'Pendiente';
    case 'completed': 
    case 'completada': 
      return 'Procesada';
    case 'cancelled': 
    case 'cancelada': 
      return 'Cancelada';
    case 'transferida_a_orden': 
      return 'En Proceso';
    default: 
      return 'Confirmada';
  }
}

function getReservationStatusDescription(status: string): string {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case 'pending': 
    case 'pendiente': 
      return 'Tu reservación está confirmada y pendiente de procesamiento';
    case 'completed': 
    case 'completada': 
      return 'Tu reservación ha sido procesada exitosamente';
    case 'cancelled': 
    case 'cancelada': 
      return 'Tu reservación ha sido cancelada';
    case 'transferida_a_orden': 
      return 'Tu reservación se ha convertido en una orden activa';
    default: 
      return 'Tu reservación está confirmada';
  }
}

function getReservationStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case 'pending': 
    case 'pendiente': 
      return 'yellow';
    case 'completed': 
    case 'completada': 
      return 'green';
    case 'cancelled': 
    case 'cancelada': 
      return 'red';
    case 'transferida_a_orden': 
      return 'blue';
    default: 
      return 'blue';
  }
}