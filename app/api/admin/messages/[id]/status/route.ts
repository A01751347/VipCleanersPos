// app/api/admin/messages/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../auth';
import { 
  updateMessageReadStatus, 
  updateMessageStarredStatus, 
  updateMessageArchivedStatus 
} from '../../../../../../lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const resolvedParams = await params;
    const messageId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(messageId)) {
      return NextResponse.json(
        { error: 'ID de mensaje inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { action, value } = body;
    
    if (!action || typeof value !== 'boolean') {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }
    
    // Ejecutar la acción correspondiente
    switch (action) {
      case 'read':
        await updateMessageReadStatus(messageId, value);
        break;
      case 'starred':
        await updateMessageStarredStatus(messageId, value);
        break;
      case 'archived':
        await updateMessageArchivedStatus(messageId, value);
        break;
      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: `Mensaje ${action === 'read' ? 'marcado como leído' : 
                              action === 'starred' ? (value ? 'destacado' : 'sin destacar') :
                              action === 'archived' ? (value ? 'archivado' : 'desarchivado') : 'actualizado'}`
      }, 
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error al actualizar estado del mensaje:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}