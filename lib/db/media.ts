import 'server-only';
import { query, queryOne, NotFoundError } from './client';

export interface ArchivoInput {
  tipo: 'calzado_entrada' | 'calzado_salida' | 'identificacion' | 'otro';
  entidadTipo: 'orden' | 'cliente' | 'empleado' | 'producto' | 'servicio' | 'marca';
  entidadId: number;
  detalleServicioId?: number | null;
  nombreArchivo: string;
  extension: string;
  tamano: number;
  contentType: string;
  s3Bucket: string;
  s3Key: string;
  descripcion?: string | null;
  empleadoId: number;
}

export async function registrarArchivo(input: ArchivoInput): Promise<number> {
  const fila = await queryOne<{ archivo_id: number }>(
    `INSERT INTO archivos_media (
       tipo, entidad_tipo, entidad_id, detalle_servicio_id, nombre_archivo,
       extension, tamano, content_type, s3_bucket, s3_key, descripcion,
       es_publico, empleado_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,FALSE,$12)
     RETURNING archivo_id`,
    [
      input.tipo,
      input.entidadTipo,
      input.entidadId,
      input.detalleServicioId ?? null,
      input.nombreArchivo,
      input.extension,
      input.tamano,
      input.contentType,
      input.s3Bucket,
      input.s3Key,
      input.descripcion ?? null,
      input.empleadoId,
    ]
  );

  // Registrar la identificación marca la orden como documentada.
  if (input.tipo === 'identificacion' && input.entidadTipo === 'orden') {
    await query(
      `UPDATE ordenes SET tiene_identificacion_registrada = TRUE WHERE orden_id = $1`,
      [input.entidadId]
    );
  }

  return fila!.archivo_id;
}

export async function getArchivo(archivoId: number) {
  const fila = await queryOne<{
    archivo_id: number; s3_bucket: string; s3_key: string; content_type: string;
    nombre_archivo: string; tipo: string; entidad_tipo: string; entidad_id: number;
  }>(`SELECT * FROM archivos_media WHERE archivo_id = $1`, [archivoId]);
  if (!fila) throw new NotFoundError('El archivo no existe.');
  return fila;
}

export async function getArchivosDeOrden(ordenId: number) {
  return query(
    `SELECT archivo_id, tipo, detalle_servicio_id, nombre_archivo, extension,
            tamano, content_type, descripcion, fecha_creacion
     FROM archivos_media
     WHERE entidad_tipo = 'orden' AND entidad_id = $1
     ORDER BY fecha_creacion DESC`,
    [ordenId]
  );
}

export async function getArchivosDePar(detalleServicioId: number) {
  return query(
    `SELECT archivo_id, tipo, nombre_archivo, content_type, descripcion, fecha_creacion
     FROM archivos_media WHERE detalle_servicio_id = $1
     ORDER BY fecha_creacion`,
    [detalleServicioId]
  );
}

export async function eliminarArchivo(archivoId: number) {
  return queryOne(
    `DELETE FROM archivos_media WHERE archivo_id = $1
     RETURNING archivo_id, s3_bucket, s3_key`,
    [archivoId]
  );
}
