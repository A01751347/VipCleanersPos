// app/api/admin/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';
import { getMessages, getRecentMessages } from '../../../../lib/db';

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
    
    // Si solo se solicitan los mensajes recientes
    if (searchParams.get('recent') === 'true') {
      const limit = parseInt(searchParams.get('limit') || '5', 10);
      const recentMessages = await getRecentMessages(limit);
      return NextResponse.json({ messages: recentMessages }, { status: 200 });
    }
    
    // Obtener parámetros de paginación y filtros
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const filter = searchParams.get('filter') as 'all' | 'unread' | 'read' | 'starred' | 'archived' || 'all';
    const searchQuery = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortField = searchParams.get('sortField') || 'fecha_creacion';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    
    // Obtener mensajes con paginación y filtros
    const result = await getMessages({
      page,
      pageSize,
      filter,
      searchQuery,
      startDate,
      endDate,
      sortField,
      sortDirection
    });
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}