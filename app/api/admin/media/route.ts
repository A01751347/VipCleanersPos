// app/api/admin/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';
import { getMediaFiles } from '../../../../lib/database/media';

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
    const entidadTipo = searchParams.get('entidadTipo');
    const entidadId = searchParams.get('entidadId');
    const tipo = searchParams.get('tipo'); // Opcional: filtrar por tipo de foto

    if (!entidadTipo || !entidadId) {
      return NextResponse.json(
        { error: 'entidadTipo y entidadId son requeridos' },
        { status: 400 }
      );
    }

    const entidadIdNum = parseInt(entidadId, 10);
    if (isNaN(entidadIdNum)) {
      return NextResponse.json(
        { error: 'entidadId debe ser un número válido' },
        { status: 400 }
      );
    }

    let mediaFiles = await getMediaFiles(entidadTipo, entidadIdNum);

    // Filtrar por tipo si se especifica
    if (tipo) {
      mediaFiles = mediaFiles.filter((file: any) => file.tipo === tipo);
    }

    // Formatear la respuesta
    const formattedFiles = mediaFiles.map((file: any) => ({
      id: file.archivo_id,
      url: file.s3_url,
      tipo: file.tipo,
      nombreArchivo: file.nombre_archivo,
      extension: file.extension,
      tamano: file.tamano,
      descripcion: file.descripcion,
      fechaCreacion: file.fecha_creacion,
      esPublico: file.es_publico
    }));

    return NextResponse.json({
      success: true,
      files: formattedFiles
    });

  } catch (error) {
    console.error('Error al obtener archivos de media:', error);
    return NextResponse.json(
      { error: 'Error al obtener archivos' },
      { status: 500 }
    );
  }
}