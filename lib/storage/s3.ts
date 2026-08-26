import 'server-only';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { BusinessError } from '../db/client';

/**
 * Almacenamiento de archivos en S3.
 *
 * El bucket debe ser PRIVADO. La versión anterior construía una URL pública
 * predecible (`uploads/identificacion_orden_{id}_{timestamp}.jpg`) y la
 * guardaba en la base, incluso para fotos de INE. Aquí sólo se guarda la llave
 * y las descargas se sirven con URLs firmadas de corta duración.
 */

const TIPOS_PERMITIDOS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10 MB

// Firmas de los primeros bytes. El tipo declarado por el cliente no se cree:
// antes se aceptaba cualquier archivo con cualquier ContentType.
const FIRMAS: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { mime: 'image/heic', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
];

export function detectarTipo(buffer: Buffer): string | null {
  for (const firma of FIRMAS) {
    const inicio = firma.offset ?? 0;
    if (buffer.length < inicio + firma.bytes.length) continue;
    if (firma.bytes.every((b, i) => buffer[inicio + i] === b)) return firma.mime;
  }
  return null;
}

export function validarArchivo(buffer: Buffer, tamano: number): { mime: string; extension: string } {
  if (tamano > TAMANO_MAXIMO) {
    throw new BusinessError(
      `El archivo pesa ${(tamano / 1024 / 1024).toFixed(1)} MB; el máximo es ${TAMANO_MAXIMO / 1024 / 1024} MB.`
    );
  }
  if (tamano === 0) throw new BusinessError('El archivo está vacío.');

  const mime = detectarTipo(buffer);
  if (!mime || !TIPOS_PERMITIDOS[mime]) {
    throw new BusinessError('Formato no permitido. Se aceptan JPG, PNG, WebP, HEIC y PDF.');
  }
  return { mime, extension: TIPOS_PERMITIDOS[mime] };
}

let cliente: S3Client | null = null;

function getCliente(): S3Client {
  if (cliente) return cliente;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new BusinessError(
      'El almacenamiento de archivos no está configurado (faltan variables AWS_*).',
      503
    );
  }
  cliente = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  return cliente;
}

export function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new BusinessError('Falta AWS_S3_BUCKET en la configuración.', 503);
  return bucket;
}

export async function subirArchivo(args: {
  buffer: Buffer;
  mime: string;
  extension: string;
  prefijo: string;
}): Promise<{ s3Key: string; bucket: string }> {
  const bucket = getBucket();
  // UUID en la llave: nada de nombres derivados del id de la orden, que
  // permitían adivinar la ruta de las identificaciones de otros clientes.
  const s3Key = `${args.prefijo}/${randomUUID()}.${args.extension}`;

  await getCliente().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: args.buffer,
      ContentType: args.mime,
      ContentLength: args.buffer.length,
      ServerSideEncryption: 'AES256',
    })
  );

  return { s3Key, bucket };
}

/** URL temporal para ver un archivo. Por omisión, 5 minutos. */
export async function urlFirmada(bucket: string, s3Key: string, segundos = 300): Promise<string> {
  return getSignedUrl(getCliente(), new GetObjectCommand({ Bucket: bucket, Key: s3Key }), {
    expiresIn: segundos,
  });
}

export async function borrarArchivo(bucket: string, s3Key: string): Promise<void> {
  await getCliente().send(new DeleteObjectCommand({ Bucket: bucket, Key: s3Key }));
}

export function almacenamientoConfigurado(): boolean {
  return Boolean(
    process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET
  );
}
