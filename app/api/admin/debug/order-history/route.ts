// app/api/admin/debug/order-history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth';
import { 
  checkOrderHistoryIntegrity, 
  repairMissingOrderHistory 
} from '../../../../../lib/db';

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
    const action = searchParams.get('action');
    const orderId = searchParams.get('orderId');

    if (action === 'repair') {
      console.log('Iniciando reparación de historial de órdenes...');
      const result = await repairMissingOrderHistory();
      
      return NextResponse.json({
        success: true,
        message: `Se repararon ${result.reparadas} órdenes`,
        ...result
      });
    } else {
      // Solo verificar integridad
      const orderIdNum = orderId ? parseInt(orderId, 10) : undefined;
      const orders = await checkOrderHistoryIntegrity(orderIdNum);
      
      return NextResponse.json({
        success: true,
        orders
      });
    }
  } catch (error) {
    console.error('Error en debug de historial de órdenes:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('Ejecutando reparación completa del historial...');
    const result = await repairMissingOrderHistory();
    
    return NextResponse.json({
      success: true,
      message: `Reparación completada. Se corrigieron ${result.reparadas} órdenes`,
      reparadas: result.reparadas
    });
  } catch (error) {
    console.error('Error en reparación de historial:', error);
    return NextResponse.json(
      { error: 'Error al reparar el historial', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}