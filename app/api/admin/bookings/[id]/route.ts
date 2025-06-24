// app/api/admin/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth';
import { getBookingById, getReservationWithDetails } from '../../../../../lib/db';

// Definir la interfaz correcta para Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
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
    
    // Obtener los detalles de la reservación
    const booking = await getReservationWithDetails(bookingId);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Reservación no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error('Error al obtener detalles de la reservación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}