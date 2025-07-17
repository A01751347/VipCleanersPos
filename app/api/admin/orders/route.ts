// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';
import { getOrders, getOrderById } from '../../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Caso: Obtener detalle de una orden específica
    const orderId = searchParams.get('id');
    if (orderId) {
      const order = await getOrderById(parseInt(orderId, 10));
      
      if (!order) {
        return NextResponse.json(
          { error: 'Orden no encontrada' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ order }, { status: 200 });
    }
    
    // Caso: Obtener listado de órdenes con filtros
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const estadoId = searchParams.get('estadoId') ? parseInt(searchParams.get('estadoId') as string, 10) : null;
    const estadoPago = searchParams.get('estadoPago') || null;
    const fechaInicio = searchParams.get('fechaInicio') || null;
    const fechaFin = searchParams.get('fechaFin') || null;
    const searchQuery = searchParams.get('search') || null;
    const empleadoId = searchParams.get('empleadoId') ? parseInt(searchParams.get('empleadoId') as string, 10) : null;
    
    const orders = await getOrders({
      page,
      pageSize,
      estadoId,
      estadoPago,
      fechaInicio,
      fechaFin,
      searchQuery,
      empleadoId
    });
    
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}