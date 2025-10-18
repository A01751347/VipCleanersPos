// app/api/admin/media/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth';
import { executeQuery } from '../../../../../lib/database/connection';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Configurar cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(
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

    const { id } = await params;
    const archivoId = parseInt(id, 10);
    if (isNaN(archivoId)) {
      return NextResponse.json(
        { error: 'ID de archivo inválido' },
        { status: 400 }
      );
    }

    // Obtener información del archivo antes de eliminarlo
    const fileInfo = await executeQuery<{
      s3_bucket: string;
      s3_key: string;
      archivo_id: number;
    }[]>({
      query: 'SELECT s3_bucket, s3_key, archivo_id FROM archivos_media WHERE archivo_id = ?',
      values: [archivoId]
    });

    if (!fileInfo || fileInfo.length === 0) {
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      );
    }

    const file = fileInfo[0];

    // Eliminar archivo de S3
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: file.s3_bucket,
        Key: file.s3_key,
      });

      await s3Client.send(deleteCommand);
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error);
      // Continuar con la eliminación de la base de datos aunque falle S3
    }

    // Eliminar registro de la base de datos
    await executeQuery({
      query: 'DELETE FROM archivos_media WHERE archivo_id = ?',
      values: [archivoId]
    });

    return NextResponse.json({
      success: true,
      message: 'Archivo eliminado correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar archivo' },
      { status: 500 }
    );
  }
}