// app/api/admin/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../auth';
import { executeQuery } from '../../../../../../lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = await context.params;
    const ordenId = parseInt(id, 10);
    
    if (isNaN(ordenId)) {
      return NextResponse.json(
        { error: 'ID de orden inválido' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    console.log('Solicitud de cambio de estado recibida:', {
      ordenId,
      data,
      sessionUser: session.user
    });
    
    if (!data.estadoId) {
      return NextResponse.json(
        { error: 'ID de estado es obligatorio' },
        { status: 400 }
      );
    }
    
    const empleadoId = session.user.id ? parseInt(session.user.id, 10) : null;
    
    console.log('Parámetros para cambio de estado:', {
      ordenId,
      estadoId: data.estadoId,
      empleadoId,
      comentario: data.comentario
    });
    
    const result = await changeOrderStatus(
      ordenId,
      data.estadoId,
      empleadoId,
      data.comentario ?? null
    );
    
    return NextResponse.json({
      success: true,
      message: 'Estado actualizado correctamente',
      data: result
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al actualizar estado de orden:', error);
    
    let errorMessage = 'Error al procesar la solicitud';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('no existe')) {
        statusCode = 404;
        errorMessage = error.message;
      } else if (error.message.includes('mismo estado')) {
        statusCode = 400;
        errorMessage = error.message;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

async function changeOrderStatus(
  ordenId: number,
  estadoId: number,
  empleadoId: number | null,
  comentario: string | null
) {
  try {
    console.log('Ejecutando cambio de estado:', {
      ordenId,
      estadoId,
      empleadoId,
      comentario
    });

    const orderExists = await executeQuery<any[]>({
      query: 'SELECT orden_id, estado_actual_id FROM ordenes WHERE orden_id = ?',
      values: [ordenId]
    });

    if (orderExists.length === 0) {
      throw new Error(`Orden ${ordenId} no encontrada`);
    }

    console.log('Orden encontrada:', orderExists[0]);

    const stateExists = await executeQuery<any[]>({
      query: 'SELECT estado_id, nombre FROM estados_servicio WHERE estado_id = ?',
      values: [estadoId]
    });

    if (stateExists.length === 0) {
      throw new Error(`Estado ${estadoId} no encontrado`);
    }

    console.log('Estado a aplicar:', stateExists[0]);

    const result = await executeQuery<any[]>({
      query: 'CALL CambiarEstadoOrden(?, ?, ?, ?)',
      values: [ordenId, estadoId, empleadoId, comentario]
    });

    console.log('Resultado del procedimiento almacenado:', result);

    const historyCheck = await executeQuery<any[]>({
      query: `
        SELECT 
          h.historial_id,
          h.orden_id, 
          h.estado_id,
          h.empleado_id, 
          h.comentario,
          h.fecha_cambio,
          e.nombre as estado_nombre,
          emp.nombre as empleado_nombre
        FROM historial_estados h 
        JOIN estados_servicio e ON h.estado_id = e.estado_id 
        LEFT JOIN empleados emp ON h.empleado_id = emp.empleado_id
        WHERE h.orden_id = ? 
        ORDER BY h.fecha_cambio DESC 
        LIMIT 1
      `,
      values: [ordenId]
    });

    console.log('Último registro en historial:', historyCheck[0]);

    const orderCheck = await executeQuery<any[]>({
      query: `
        SELECT 
          o.orden_id,
          o.estado_actual_id,
          e.nombre as estado_actual_nombre
        FROM ordenes o
        JOIN estados_servicio e ON o.estado_actual_id = e.estado_id
        WHERE o.orden_id = ?
      `,
      values: [ordenId]
    });

    console.log('Estado actual de la orden:', orderCheck[0]);

    if (historyCheck.length === 0) {
      throw new Error('No se pudo registrar el cambio de estado en el historial');
    }

    if (orderCheck.length === 0 || orderCheck[0].estado_actual_id !== estadoId) {
      throw new Error('No se pudo actualizar el estado de la orden');
    }
    
    return {
      historial: historyCheck[0],
      orden: orderCheck[0]
    };
    
  } catch (error) {
    console.error('Error en changeOrderStatus:', error);
    throw error;
  }
}