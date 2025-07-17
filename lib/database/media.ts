import { executeQuery } from './connection';

// Registrar un nuevo archivo de media
export async function registerMediaFile({
  tipo,
  entidadTipo,
  entidadId,
  nombreArchivo,
  extension,
  tamano,
  s3Bucket,
  s3Key,
  s3Url,
  descripcion = null,
  esPublico = false,
  empleadoId
}: {
  tipo: 'calzado_entrada' | 'calzado_salida' | 'identificacion' | 'otro';
  entidadTipo: 'orden' | 'cliente' | 'empleado' | 'producto' | 'servicio' | 'marca';
  entidadId: number;
  nombreArchivo: string;
  extension: string;
  tamano: number;
  s3Bucket: string;
  s3Key: string;
  s3Url: string;
  descripcion?: string | null;
  esPublico?: boolean;
  empleadoId: number;
}) {
  // Usar el procedimiento almacenado RegistrarArchivoMedia
  const query = `
    CALL RegistrarArchivoMedia(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @archivo_id);
    SELECT @archivo_id as archivo_id;
  `;
  
  const [result] = await executeQuery<any>({
    query,
    values: [
      tipo,
      entidadTipo,
      entidadId,
      nombreArchivo,
      extension,
      tamano,
      s3Bucket,
      s3Key,
      s3Url,
      descripcion,
      esPublico ? 1 : 0,
      empleadoId
    ]
  });
  
  return {
    archivoId: result[0].archivo_id
  };
}

// Obtener archivos de media por entidad
export async function getMediaFiles(entidadTipo: string, entidadId: number) {
  const query = `
    SELECT * FROM archivos_media
    WHERE entidad_tipo = ? AND entidad_id = ?
    ORDER BY tipo, fecha_creacion DESC
  `;
  
  return executeQuery<any[]>({
    query,
    values: [entidadTipo, entidadId]
  });
}

// Registrar imagen de identificación para una orden
export async function registerIdentificationImage({
  ordenId,
  nombreArchivo,
  extension,
  tamano,
  s3Bucket,
  s3Key,
  s3Url,
  empleadoId
}: {
  ordenId: number;
  nombreArchivo: string;
  extension: string;
  tamano: number;
  s3Bucket: string;
  s3Key: string;
  s3Url: string;
  empleadoId: number;
}) {
  // Registrar el archivo y marcar la orden como con identificación
  const result = await registerMediaFile({
    tipo: 'identificacion',
    entidadTipo: 'orden',
    entidadId: ordenId,
    nombreArchivo,
    extension,
    tamano,
    s3Bucket,
    s3Key,
    s3Url,
    descripcion: 'Identificación para orden',
    esPublico: false,
    empleadoId
  });
  
  // Actualizar el estado de identificación en la orden
  await executeQuery({
    query: `
      UPDATE ordenes 
      SET tiene_identificacion_registrada = TRUE 
      WHERE orden_id = ?
    `,
    values: [ordenId]
  });
  
  return result;
}