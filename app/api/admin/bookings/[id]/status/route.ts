// app/api/admin/bookings/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../auth';
import { updateBookingStatus } from '../../../../../../lib/database';

// Definir la interfaz correcta para Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(
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
    
    // Await params para Next.js 15
    const { id } = await context.params;
    const bookingId = parseInt(id, 10);
    
    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'ID de reservación inválido' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    const status = data.status;
    
    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'El estado es requerido' },
        { status: 400 }
      );
    }
    
    // Validar estados permitidos
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado no válido' },
        { status: 400 }
      );
    }
    
    // Actualizar el estado de la reservación
    await updateBookingStatus(bookingId, status);
    
    return NextResponse.json(
      { success: true, message: 'Estado actualizado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar estado de reservación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}