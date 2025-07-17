// app/api/admin/services/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth';
import { getAllServices, getServiceById, executeQuery, isServiceInUse } from '../../../../../lib/database';

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
    const { 
      nombre, 
      descripcion, 
      precio, 
      tiempo_estimado_minutos, 
      requiere_identificacion, 
      activo 
    } = body;
    
    // Validaciones
    if (!nombre || !descripcion || precio === undefined) {
      return NextResponse.json(
        { error: 'Datos requeridos faltantes' },
        { status: 400 }
      );
    }
    
    if (typeof precio !== 'number' || precio < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido' },
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
    
    // Actualizar el servicio
    const query = `
      UPDATE servicios 
      SET nombre = ?, descripcion = ?, precio = ?, tiempo_estimado_minutos = ?, 
          requiere_identificacion = ?, activo = ?, fecha_actualizacion = NOW()
      WHERE servicio_id = ?
    `;
    
    await executeQuery({
      query,
      values: [
        nombre.trim(),
        descripcion.trim(),
        precio,
        tiempo_estimado_minutos || null,
        requiere_identificacion ? 1 : 0,
        activo ? 1 : 0,
        serviceId
      ]
    });
    
    return NextResponse.json({
      message: 'Servicio actualizado exitosamente'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el servicio' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    // Verificar que el servicio existe
    const existingService = await getServiceById(serviceId);
    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el servicio está siendo usado en órdenes usando la función existente
    const isInUse = await isServiceInUse(serviceId);
    
    if (isInUse) {
      // No eliminar, solo desactivar
      await executeQuery({
        query: `
          UPDATE servicios 
          SET activo = FALSE, fecha_actualizacion = NOW()
          WHERE servicio_id = ?
        `,
        values: [serviceId]
      });
      
      return NextResponse.json({
        message: 'Servicio desactivado (no se puede eliminar porque está en uso)'
      }, { status: 200 });
    }
    
    // Eliminar el servicio si no está en uso
    await executeQuery({
      query: `DELETE FROM servicios WHERE servicio_id = ?`,
      values: [serviceId]
    });
    
    return NextResponse.json({
      message: 'Servicio eliminado exitosamente'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el servicio' },
      { status: 500 }
    );
  }
}