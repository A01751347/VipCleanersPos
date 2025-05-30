// app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';
import { registerMediaFile, registerIdentificationImage } from '../../../../lib/db';

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
    
    // Recibir FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }
    
    // Extraer los metadatos necesarios
    const tipo = formData.get('tipo') as string;
    const entidadTipo = formData.get('entidadTipo') as string;
    const entidadId = parseInt(formData.get('entidadId') as string, 10);
const descripcion = (formData.get('descripcion') as string) ?? null;

    
    // Validar datos básicos
    if (!tipo || !entidadTipo || isNaN(entidadId)) {
      return NextResponse.json(
        { error: 'Tipo, entidad tipo e ID son obligatorios' },
        { status: 400 }
      );
    }
    
    // Procesar el archivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Obtener extensión del archivo
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const nombreArchivo = `${tipo}_${entidadTipo}_${entidadId}_${timestamp}.${extension}`;
    
    // En un entorno real, aquí subiríamos el archivo a S3 o similar
    // Para este ejemplo, simularemos el almacenamiento
    
    const s3Bucket = 'lavanderia-tenis-files';
    const s3Key = `uploads/${nombreArchivo}`;
    const s3Url = `https://example.com/${s3Key}`; // URL simulada
    
    if (!session.user.id) {
  return NextResponse.json(
    { error: 'ID de usuario no válido' },
    { status: 400 }
  );
}
const empleadoId = parseInt(session.user.id, 10);
    
    // Si es una imagen de identificación, usar la función específica
    if (tipo === 'identificacion' && entidadTipo === 'orden') {
      const result = await registerIdentificationImage({
        ordenId: entidadId,
        nombreArchivo: file.name,
        extension,
        tamano: file.size,
        s3Bucket,
        s3Key,
        s3Url,
        empleadoId
      });
      
      return NextResponse.json({
        success: true,
        archivoId: result.archivoId,
        url: s3Url
      }, { status: 201 });
    }
    
const tipoValue = tipo as "calzado_entrada" | "calzado_salida" | "identificacion" | "otro";
const entidadTipoValue = entidadTipo as "orden" | "cliente" | "empleado" | "producto" | "servicio" | "marca";


    // Para otros tipos de archivos
    const result = await registerMediaFile({
  tipo: tipoValue,
  entidadTipo: entidadTipoValue,
      entidadId,
      nombreArchivo: file.name,
      extension,
      tamano: file.size,
      s3Bucket,
      s3Key,
      s3Url,
      descripcion ,
      esPublico: false,
      empleadoId
    });
    
    return NextResponse.json({
      success: true,
      archivoId: result.archivoId,
      url: s3Url
    }, { status: 201 });
  } catch (error) {
    console.error('Error al subir archivo:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}