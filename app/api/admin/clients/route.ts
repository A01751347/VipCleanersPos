// app/api/admin/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';
import { 
  searchClients, 
  getClientDetails, 
  createClient,
  updateClient
} from '../../../../lib/database';

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
    
    // app/api/admin/clients/route.ts (continuación)
    const { searchParams } = new URL(request.url);
    
    // Caso: Obtener un cliente específico
    const clientId = searchParams.get('id');
    if (clientId) {
      const client = await getClientDetails(parseInt(clientId, 10));
      
      if (!client) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 404 }
        );
      }

      
      return NextResponse.json({ client }, { status: 200 });
    }
    
    // Caso: Buscar clientes
    const searchQuery = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    const clients = await searchClients({
      searchQuery,
      page,
      pageSize
    });

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
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
    
    const data = await request.json();
    
    // Validar datos básicos
    if (!data.nombre || !data.telefono) {
      return NextResponse.json(
        { error: 'Nombre y teléfono son obligatorios' },
        { status: 400 }
      );
    }
    
    const clientId = await createClient(
      data.nombre,
      data.apellidos || '',
      data.telefono,
      data.email || '',
      data.direccion || null,
      data.codigo_postal || null,
      data.ciudad || null,
      data.estado || null
    );
    
    return NextResponse.json({
      success: true,
      clientId
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Validar datos básicos
    if (!data.clienteId || !data.nombre || !data.telefono) {
      return NextResponse.json(
        { error: 'ID de cliente, nombre y teléfono son obligatorios' },
        { status: 400 }
      );
    }
    
    await updateClient(
      data.clienteId,
      data.nombre,
      data.apellidos || '',
      data.telefono,
      data.email || '',
      data.direccion || null,
      data.codigo_postal || null,
      data.ciudad || null,
      data.estado || null
    );
    
    return NextResponse.json({
      success: true
    }, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}