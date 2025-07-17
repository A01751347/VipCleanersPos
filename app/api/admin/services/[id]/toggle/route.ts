// app/api/admin/services/[id]/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../auth';
import { getServiceById, executeQuery } from '../../../../../../lib/database';

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
    
    // Await params in Next.js 15
    const { id } = await context.params;
    const serviceId = parseInt(id, 10);
    
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'ID de servicio inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { activo } = body;
    
    if (typeof activo !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo activo debe ser un booleano' },
        { status: 400 }
      );
    }
    
    // Verificar que el servicio existe
    const existingService = await getServiceById(serviceId);
    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }
    
    // Actualizar el estado activo del servicio
    const query = `
      UPDATE servicios 
      SET activo = ?, fecha_actualizacion = NOW()
      WHERE servicio_id = ?
    `;
    
    await executeQuery({
      query,
      values: [activo ? 1 : 0, serviceId]
    });
    
    return NextResponse.json({
      message: `Servicio ${activo ? 'activado' : 'desactivado'} exitosamente`
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al cambiar estado del servicio:', error);
    return NextResponse.json(
      { error: 'Error al cambiar el estado del servicio' },
      { status: 500 }
    );
  }
}