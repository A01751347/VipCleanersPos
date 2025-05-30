// app/api/admin/messages/mark-all-read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth';
import { markAllMessagesAsRead } from '../../../../../lib/db';

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
    
    // Marcar todos los mensajes como leídos
    await markAllMessagesAsRead();
    
    return NextResponse.json(
      { success: true, message: 'Todos los mensajes han sido marcados como leídos' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al marcar todos los mensajes como leídos:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}