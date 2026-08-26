import 'server-only';
import { Pool, PoolClient, types } from 'pg';

// NUMERIC llega como string desde pg para no perder precisión. El dinero se
// maneja en centavos enteros (lib/db/money.ts), así que aquí lo convertimos a
// number sólo para lectura; nunca se hacen cuentas sobre estos valores.
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));

declare global {
  // eslint-disable-next-line no-var
  var __vipPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL no está definida. Copia .env.example a .env y configúrala.'
    );
  }
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl:
      process.env.DB_SSL === 'require'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : undefined,
  });
  pool.on('error', (err) => {
    console.error('[db] error en cliente inactivo del pool', err);
  });
  return pool;
}

/**
 * El pool se crea la primera vez que se usa, no al importar el módulo.
 *
 * Next.js recorre las rutas durante el build para recolectar metadatos, y con
 * la creación en el import eso exigía una base de datos accesible sólo para
 * compilar. Además, en desarrollo se cachea en `global`: sin eso cada recarga
 * de módulo abriría un pool nuevo hasta agotar las conexiones del servidor.
 */
function getPool(): Pool {
  if (!global.__vipPool) {
    global.__vipPool = createPool();
  }
  return global.__vipPool;
}

export class DatabaseError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'DatabaseError';
    const e = cause as { code?: string; constraint?: string; detail?: string };
    this.code = e?.code;
    this.constraint = e?.constraint;
    this.detail = e?.detail;
    this.cause = cause;
  }
}

/**
 * Traduce códigos de PostgreSQL a mensajes accionables.
 * Antes todo error se convertía en "Database error", lo que dejaba a quien
 * llamaba sin forma de distinguir un duplicado de una caída de conexión.
 */
export function describeDbError(err: unknown): { message: string; status: number } {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case '23505':
      return { message: 'Ya existe un registro con esos datos.', status: 409 };
    case '23503':
      return { message: 'El registro referenciado no existe.', status: 409 };
    case '23514':
      return { message: 'Los datos no cumplen una restricción de validación.', status: 400 };
    case '23502':
      return { message: 'Falta un campo obligatorio.', status: 400 };
    case '40001':
    case '40P01':
      return { message: 'Conflicto de concurrencia. Intenta de nuevo.', status: 409 };
    case 'ECONNREFUSED':
    case '57P01':
      return { message: 'La base de datos no está disponible.', status: 503 };
    default:
      return { message: 'Error al procesar la solicitud.', status: 500 };
  }
}

export type Queryable = Pool | PoolClient;

/**
 * Errores en los que la conexión se cayó sin que la sentencia llegara a
 * ejecutarse — o habiéndose abortado por completo. Reintentar es seguro:
 * nada quedó a medias.
 */
const ERRORES_DE_CONEXION = new Set([
  '08000', // connection_exception
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '57P01', // admin_shutdown (failover, reinicio, pg_terminate_backend)
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now (arrancando)
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'ETIMEDOUT',
]);

function esErrorDeConexion(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return code !== undefined && ERRORES_DE_CONEXION.has(code);
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Ejecuta una consulta y devuelve las filas. */
export async function query<T = any>(
  text: string,
  values: readonly unknown[] = [],
  client?: Queryable
): Promise<T[]> {
  // Sólo se reintenta cuando la consulta va contra el pool. Con una conexión
  // dedicada (dentro de una transacción) reintentar aquí sería incorrecto: la
  // transacción ya está abortada y hay que rehacerla completa.
  const intentos = client ? 1 : 2;

  for (let intento = 1; intento <= intentos; intento++) {
    try {
      const res = await (client ?? getPool()).query(text, values as unknown[]);
      return res.rows as T[];
    } catch (err) {
      const reintentable = intento < intentos && esErrorDeConexion(err);

      console.error('[db] fallo de consulta', {
        code: (err as { code?: string })?.code,
        message: (err as Error)?.message,
        intento,
        reintentable,
        // La consulta se registra recortada; los valores NO, porque llevan PII.
        query: text.replace(/\s+/g, ' ').trim().slice(0, 220),
      });

      if (reintentable) {
        // Tras un failover o un reinicio, la primera conexión del pool está
        // muerta. Sin este reintento, la primera venta después del reinicio
        // fallaba aunque la base ya estuviera lista.
        await esperar(120);
        continue;
      }

      throw new DatabaseError((err as Error)?.message ?? 'error de base de datos', err);
    }
  }

  throw new DatabaseError('error de base de datos', undefined);
}

/** Devuelve la primera fila, o null. */
export async function queryOne<T = any>(
  text: string,
  values: readonly unknown[] = [],
  client?: Queryable
): Promise<T | null> {
  const rows = await query<T>(text, values, client);
  return rows.length > 0 ? rows[0] : null;
}

/** Devuelve la primera fila o lanza. Para cuando la ausencia es un error real. */
export async function queryOneOrFail<T = any>(
  text: string,
  values: readonly unknown[],
  mensaje: string,
  client?: Queryable
): Promise<T> {
  const row = await queryOne<T>(text, values, client);
  if (!row) throw new NotFoundError(mensaje);
  return row;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Error de regla de negocio: se muestra tal cual al usuario, con status 400. */
export class BusinessError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'BusinessError';
    this.status = status;
  }
}

/**
 * Ejecuta `fn` dentro de una transacción sobre UNA conexión dedicada.
 *
 * Esto reemplaza al patrón anterior de `pool.query()` suelto, que tomaba una
 * conexión distinta por sentencia. Con procedimientos que devolvían el id por
 * variable de sesión (`@orden_id`), eso significaba leer la variable en otra
 * conexión: se obtenía NULL, o peor, el id de la orden de otro cajero.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[db] falló el ROLLBACK', rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Construye `$1, $2, ...` para cláusulas IN. */
export function placeholders(count: number, start = 1): string {
  return Array.from({ length: count }, (_, i) => `$${start + i}`).join(', ');
}

export { getPool };
