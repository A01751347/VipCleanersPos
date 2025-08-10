// app/api/admin/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';
import { getAllServices, getServiceById, executeQuery, isServiceInUse } from '../../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('id');
    const onlyActive = searchParams.get('onlyActive') !== 'false';
    
    if (serviceId) {
      // Obtener un servicio específico por ID
      const service = await getServiceById(parseInt(serviceId, 10));
      
      if (!service) {
        return NextResponse.json(
          { error: 'Servicio no encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ service }, { status: 200 });
    }
    
    // Obtener todos los servicios
    const services = await getAllServices(onlyActive);
    
    return NextResponse.json({ services }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
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
    
    // Crear el servicio usando la función existente
    const serviceId = await executeQuery<any>({
      query: `
        INSERT INTO servicios (
          nombre, descripcion, precio, tiempo_estimado_minutos, 
          requiere_identificacion, activo
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      values: [
        nombre.trim(),
        descripcion.trim(),
        precio,
        tiempo_estimado_minutos || null,
        requiere_identificacion ? 1 : 0,
        activo ? 1 : 0
      ]
    });
    
    return NextResponse.json({
      message: 'Servicio creado exitosamente',
      serviceId: serviceId.insertId
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return NextResponse.json(
      { error: 'Error al crear el servicio' },
      { status: 500 }
    );
  }
}
