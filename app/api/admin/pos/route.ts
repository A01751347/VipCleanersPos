// app/api/admin/pos/route.ts - VERSIÓN ACTUALIZADA
import { NextRequest, NextResponse } from 'next/server';
import { 
  createPosOrder, 
  createClient, 
  findClientByPhoneOrEmail,
  assignStorageLocations, 
  executeQuery
} from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      cliente,
      servicios,
      productos = [],
      subtotal,
      iva, 
      total,
      metodoPago,
      monto,
      tieneIdentificacion = false,
      notas = null,
      ubicaciones = [] // 🆕 Nuevo campo para ubicaciones
    } = body;

    // Validaciones básicas
    if (!cliente || !servicios || servicios.length === 0) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: cliente y servicios' },
        { status: 400 }
      );
    }

    if (!metodoPago || !monto || monto <= 0) {
      return NextResponse.json(
        { error: 'Datos de pago inválidos' },
        { status: 400 }
      );
    }

    // Manejar cliente (existente o nuevo)
    let clienteId = cliente.cliente_id;
    
    if (!clienteId) {
      // Buscar cliente existente por teléfono o email
      const clienteExistente = await findClientByPhoneOrEmail(
        cliente.telefono || cliente.email
      );
      
      if (clienteExistente) {
        clienteId = clienteExistente.cliente_id;
      } else {
        // Crear nuevo cliente
        clienteId = await createClient(
          cliente.nombre,
          cliente.apellidos || '',
          cliente.telefono || '',
          cliente.email || '',
          undefined, // direccion
          undefined, // codigo_postal
          undefined, // ciudad
          undefined  // estado
        );
      }
    }

    // Calcular fecha de entrega estimada (3 días hábiles por defecto)
    const fechaEntregaEstimada = new Date();
    fechaEntregaEstimada.setDate(fechaEntregaEstimada.getDate() + 3);

    // Crear la orden usando el empleado ID por defecto (deberías obtenerlo del contexto de autenticación)
    const empleadoId = 1; // TODO: Obtener del token de autenticación

    const { ordenId, codigoOrden } = await createPosOrder({
      clienteId,
      empleadoId,
      servicios: servicios.map((s: any) => ({
        servicioId: parseInt(s.servicioId),
        cantidad: parseInt(s.cantidad),
        modeloId: s.modeloId ? parseInt(s.modeloId) : null,
        marca: s.marca?.trim() || null,
        modelo: s.modelo?.trim() || null,
        descripcion: s.descripcion?.trim() || null
      })),
      productos: productos.map((p: any) => ({
        productoId: parseInt(p.productoId),
        cantidad: parseInt(p.cantidad)
      })),
      requiereIdentificacion: false, // Se calcula automáticamente en el procedimiento
      tieneIdentificacionRegistrada: tieneIdentificacion,
      fechaEntregaEstimada,
      metodoPago,
      monto: parseFloat(monto),
      notasOrder: notas,
      subtotal: parseFloat(subtotal),
      iva: parseFloat(iva),
      total: parseFloat(total)
    });

    // 🆕 Si hay ubicaciones especificadas, asignarlas
    if (ubicaciones && ubicaciones.length > 0) {
      try {
        // Obtener los detalles de servicios recién creados para mapear con las ubicaciones
        const serviciosCreados = await executeQuery<any[]>({
          query: `
            SELECT detalle_servicio_id, marca, modelo, descripcion_calzado
            FROM detalles_orden_servicios 
            WHERE orden_id = ? AND (marca IS NOT NULL OR modelo IS NOT NULL)
            ORDER BY detalle_servicio_id ASC
          `,
          values: [ordenId]
        });

        // Mapear ubicaciones con servicios (esto podría necesitar lógica más sofisticada)
        const ubicacionesParaAsignar = ubicaciones.map((ubicacion: any, index: number) => {
          const servicioCorrespondiente = serviciosCreados[index];
          return {
            detalleServicioId: servicioCorrespondiente?.detalle_servicio_id,
            ordenId,
            cajaAlmacenamiento: ubicacion.cajaAlmacenamiento,
            codigoUbicacion: ubicacion.codigoUbicacion,
            notasEspeciales: ubicacion.notasEspeciales || null,
            empleadoId
          };
        }).filter((u: any) => u.detalleServicioId); // Filtrar ubicaciones sin servicio correspondiente

        if (ubicacionesParaAsignar.length > 0) {
          await assignStorageLocations(ubicacionesParaAsignar);
        }
      } catch (ubicacionError) {
        console.warn('Error asignando ubicaciones:', ubicacionError);
        // No fallar la orden por error en ubicaciones, solo registrar warning
      }
    }

    // Determinar si requiere identificación (esto se hace en el backend)
    const requiereIdentificacion = servicios.some((s: any) => s.servicioId === 2); // Servicio premium por ejemplo

    return NextResponse.json({
      success: true,
      ordenId,
      codigoOrden,
      requiereIdentificacion,
      message: 'Orden creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando orden:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}

// GET - Obtener órdenes (opcional, para consultas)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'recent':
        // Obtener órdenes recientes
        const limit = parseInt(searchParams.get('limit') || '10');
        // Implementar lógica para obtener órdenes recientes
        return NextResponse.json({
          success: true,
          ordenes: [] // Implementar consulta
        });
        
      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error en GET /api/admin/pos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}