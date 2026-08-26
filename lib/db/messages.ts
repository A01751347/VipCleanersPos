import 'server-only';
import { query, queryOne, NotFoundError } from './client';

const CAMPOS_ORDEN: Record<string, string> = {
  fecha_creacion: 'fecha_creacion',
  nombre: 'nombre',
  email: 'email',
  asunto: 'asunto',
};

export async function crearMensaje(input: {
  nombre: string; email: string; telefono?: string | null;
  asunto: string; mensaje: string;
}): Promise<number> {
  const fila = await queryOne<{ mensaje_id: number }>(
    `INSERT INTO mensajes_contacto (nombre, email, telefono, asunto, mensaje)
     VALUES ($1,$2,$3,$4,$5) RETURNING mensaje_id`,
    [
      input.nombre.trim(),
      input.email.trim().toLowerCase(),
      input.telefono?.trim() || null,
      input.asunto.trim(),
      input.mensaje.trim(),
    ]
  );
  return fila!.mensaje_id;
}

export async function getMensajes(opciones: {
  filtro?: 'all' | 'unread' | 'read' | 'starred' | 'archived';
  busqueda?: string | null;
  desde?: string | null;
  hasta?: string | null;
  pagina?: number;
  porPagina?: number;
  ordenarPor?: string;
  direccion?: string;
} = {}) {
  const pagina = Math.max(1, Math.trunc(opciones.pagina ?? 1));
  const porPagina = Math.min(100, Math.max(1, Math.trunc(opciones.porPagina ?? 20)));
  const offset = (pagina - 1) * porPagina;

  const campo = CAMPOS_ORDEN[opciones.ordenarPor ?? ''] ?? 'fecha_creacion';
  const direccion = opciones.direccion?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const condiciones: string[] = [];
  const valores: unknown[] = [];

  switch (opciones.filtro) {
    case 'unread':   condiciones.push('NOT esta_leido'); break;
    case 'read':     condiciones.push('esta_leido'); break;
    case 'starred':  condiciones.push('esta_destacado'); break;
    case 'archived': condiciones.push('esta_archivado'); break;
    default:         condiciones.push('NOT esta_archivado');
  }

  if (opciones.busqueda?.trim()) {
    valores.push(`%${opciones.busqueda.trim()}%`);
    const i = valores.length;
    condiciones.push(`(nombre ILIKE $${i} OR email ILIKE $${i} OR asunto ILIKE $${i} OR mensaje ILIKE $${i})`);
  }
  if (opciones.desde) {
    valores.push(opciones.desde);
    condiciones.push(`fecha_creacion >= $${valores.length}::date`);
  }
  if (opciones.hasta) {
    valores.push(opciones.hasta);
    condiciones.push(`fecha_creacion < ($${valores.length}::date + interval '1 day')`);
  }

  const where = `WHERE ${condiciones.join(' AND ')}`;

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM mensajes_contacto ${where}`,
    valores
  );

  const mensajes = await query(
    `SELECT mensaje_id AS id, nombre AS name, email, telefono,
            asunto AS subject, mensaje AS message,
            esta_leido AS is_read, esta_destacado AS is_starred,
            esta_archivado AS is_archived, fecha_creacion AS created_at
     FROM mensajes_contacto ${where}
     ORDER BY ${campo} ${direccion}
     LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, porPagina, offset]
  );

  return {
    mensajes, messages: mensajes, total, pagina, porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
    totalPages: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export async function getMensajePorId(mensajeId: number) {
  const mensaje = await queryOne(
    `SELECT mensaje_id AS id, nombre AS name, email, telefono,
            asunto AS subject, mensaje AS message,
            esta_leido AS is_read, esta_destacado AS is_starred,
            esta_archivado AS is_archived, fecha_creacion AS created_at
     FROM mensajes_contacto WHERE mensaje_id = $1`,
    [mensajeId]
  );
  if (!mensaje) return null;
  const respuestas = await query(
    `SELECT r.*, NULLIF(TRIM(CONCAT_WS(' ', e.nombre, e.apellidos)), '') AS empleado_nombre
     FROM respuestas_mensajes r
     LEFT JOIN empleados e ON e.empleado_id = r.empleado_id
     WHERE r.mensaje_id = $1 ORDER BY r.enviado_en DESC`,
    [mensajeId]
  );
  return { ...mensaje, respuestas };
}

export async function actualizarEstadoMensaje(
  mensajeId: number,
  cambios: { leido?: boolean; destacado?: boolean; archivado?: boolean }
) {
  const fila = await queryOne(
    `UPDATE mensajes_contacto SET
       esta_leido = COALESCE($2, esta_leido),
       esta_destacado = COALESCE($3, esta_destacado),
       esta_archivado = COALESCE($4, esta_archivado)
     WHERE mensaje_id = $1 RETURNING mensaje_id`,
    [mensajeId, cambios.leido ?? null, cambios.destacado ?? null, cambios.archivado ?? null]
  );
  if (!fila) throw new NotFoundError('El mensaje no existe.');
  return fila;
}

export async function marcarTodosLeidos(): Promise<number> {
  const filas = await query(
    `UPDATE mensajes_contacto SET esta_leido = TRUE
     WHERE NOT esta_leido RETURNING mensaje_id`
  );
  return filas.length;
}

export async function registrarRespuesta(input: {
  mensajeId: number; empleadoId: number; asunto: string; cuerpo: string; enviadoA: string;
}) {
  await query(
    `INSERT INTO respuestas_mensajes (mensaje_id, empleado_id, asunto, cuerpo, enviado_a)
     VALUES ($1,$2,$3,$4,$5)`,
    [input.mensajeId, input.empleadoId, input.asunto, input.cuerpo, input.enviadoA]
  );
  await query(
    `UPDATE mensajes_contacto SET esta_leido = TRUE WHERE mensaje_id = $1`,
    [input.mensajeId]
  );
}

export async function getEstadisticasMensajes() {
  const [stats] = await query<any>(
    `SELECT
       COUNT(*)::int                                   AS total,
       COUNT(*) FILTER (WHERE NOT esta_leido)::int     AS no_leidos,
       COUNT(*) FILTER (WHERE esta_destacado)::int     AS destacados,
       COUNT(*) FILTER (WHERE esta_archivado)::int     AS archivados,
       COUNT(*) FILTER (WHERE fecha_creacion::date = CURRENT_DATE)::int AS hoy
     FROM mensajes_contacto`
  );
  return {
    ...stats,
    unread: stats.no_leidos,
    starred: stats.destacados,
    archived: stats.archivados,
  };
}
