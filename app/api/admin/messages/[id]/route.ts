// app/api/admin/messages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth';
import { getMessageById } from '../../../../../lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
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
    const messageId = parseInt(id, 10);
    
    if (isNaN(messageId)) {
      return NextResponse.json(
        { error: 'ID de mensaje inválido' },
        { status: 400 }
      );
    }
    
    const message = await getMessageById(messageId);
    
    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(message, { status: 200 });
  } catch (error) {
    console.error('Error al obtener detalles del mensaje:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}