import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { registrarArchivo, BusinessError } from '@/lib/db';
import { validarArchivo, subirArchivo } from '@/lib/storage/s3';

const TIPOS = ['calzado_entrada', 'calzado_salida', 'identificacion', 'otro'] as const;
const ENTIDADES = ['orden', 'cliente', 'empleado', 'producto', 'servicio', 'marca'] as const;

export const POST = rutaProtegida(async (request: NextRequest) => {
  const actor = await requireActor();

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) throw new BusinessError('No se recibió ningún archivo.');

  const tipo = String(formData.get('tipo') ?? '');
  const entidadTipo = String(formData.get('entidadTipo') ?? '');
  const entidadId = parseInt(String(formData.get('entidadId') ?? ''), 10);
  const detalleServicioIdRaw = formData.get('detalleServicioId');
  const detalleServicioId = detalleServicioIdRaw
    ? parseInt(String(detalleServicioIdRaw), 10)
    : null;

  if (!TIPOS.includes(tipo as any)) throw new BusinessError('Tipo de archivo no válido.');
  if (!ENTIDADES.includes(entidadTipo as any)) throw new BusinessError('Entidad no válida.');
  if (!Number.isInteger(entidadId)) throw new BusinessError('Id de entidad no válido.');

  const buffer = Buffer.from(await file.arrayBuffer());
  // Se valida contra los bytes del archivo, no contra el nombre ni el
  // ContentType que envía el navegador.
  const { mime, extension } = validarArchivo(buffer, file.size);

  const { s3Key, bucket } = await subirArchivo({
    buffer,
    mime,
    extension,
    prefijo: tipo === 'identificacion' ? 'identificaciones' : 'calzado',
  });

  const archivoId = await registrarArchivo({
    tipo: tipo as (typeof TIPOS)[number],
    entidadTipo: entidadTipo as (typeof ENTIDADES)[number],
    entidadId,
    detalleServicioId: Number.isInteger(detalleServicioId) ? detalleServicioId : null,
    nombreArchivo: file.name.slice(0, 250),
    extension,
    tamano: file.size,
    contentType: mime,
    s3Bucket: bucket,
    s3Key,
    descripcion: (formData.get('descripcion') as string) ?? null,
    empleadoId: actor.empleadoId,
  });

  return NextResponse.json(
    { success: true, archivoId, url: `/api/admin/media/${archivoId}` },
    { status: 201 }
  );
});
