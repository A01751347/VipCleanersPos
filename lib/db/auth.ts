import 'server-only';
import { compare, hash } from 'bcryptjs';
import { query, queryOne } from './client';

export type Rol = 'admin' | 'empleado' | 'cliente';

export interface UsuarioAutenticable {
  usuario_id: number;
  email: string;
  password: string;
  rol: Rol;
  activo: boolean;
  bloqueado_hasta: Date | null;
  intentos_fallidos: number;
  empleado_id: number | null;
  nombre: string | null;
  apellidos: string | null;
}

const MAX_INTENTOS = 8;
const BLOQUEO_MINUTOS = 15;

export async function getUsuarioPorEmail(email: string): Promise<UsuarioAutenticable | null> {
  return queryOne<UsuarioAutenticable>(
    `SELECT u.usuario_id, u.email, u.password, u.rol, u.activo,
            u.bloqueado_hasta, u.intentos_fallidos,
            e.empleado_id, e.nombre, e.apellidos
     FROM usuarios u
     LEFT JOIN empleados e ON e.usuario_id = u.usuario_id AND e.activo
     WHERE lower(u.email) = lower($1) AND u.activo`,
    [email.trim()]
  );
}

export async function verificarPassword(plano: string, hashGuardado: string): Promise<boolean> {
  try {
    return await compare(plano, hashGuardado);
  } catch (err) {
    console.error('[auth] error comparando contraseña', err);
    return false;
  }
}

export async function hashPassword(plano: string): Promise<string> {
  return hash(plano, 12);
}

export function estaBloqueado(u: UsuarioAutenticable): boolean {
  return u.bloqueado_hasta !== null && new Date(u.bloqueado_hasta) > new Date();
}

/**
 * Registra un intento fallido y bloquea la cuenta al llegar al límite.
 * Sin esto, adivinar la contraseña de administrador era ilimitado.
 */
export async function registrarIntentoFallido(usuarioId: number): Promise<void> {
  await query(
    `UPDATE usuarios
     SET intentos_fallidos = intentos_fallidos + 1,
         bloqueado_hasta = CASE
           WHEN intentos_fallidos + 1 >= $2 THEN now() + ($3 || ' minutes')::interval
           ELSE bloqueado_hasta
         END
     WHERE usuario_id = $1`,
    [usuarioId, MAX_INTENTOS, String(BLOQUEO_MINUTOS)]
  );
}

export async function registrarAccesoExitoso(usuarioId: number): Promise<void> {
  await query(
    `UPDATE usuarios
     SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = now()
     WHERE usuario_id = $1`,
    [usuarioId]
  );
}

/** Crea el token de recuperación y devuelve el valor en claro (para el correo). */
export async function crearTokenRecuperacion(email: string, token: string, minutos = 60): Promise<boolean> {
  const filas = await query(
    `UPDATE usuarios
     SET token_recuperacion = $2,
         expiracion_token = now() + ($3 || ' minutes')::interval
     WHERE lower(email) = lower($1) AND activo
     RETURNING usuario_id`,
    [email.trim(), token, String(minutos)]
  );
  return filas.length > 0;
}

export async function consumirTokenRecuperacion(token: string, nuevoHash: string): Promise<boolean> {
  const filas = await query(
    `UPDATE usuarios
     SET password = $2, token_recuperacion = NULL, expiracion_token = NULL,
         intentos_fallidos = 0, bloqueado_hasta = NULL
     WHERE token_recuperacion = $1 AND expiracion_token > now() AND activo
     RETURNING usuario_id`,
    [token, nuevoHash]
  );
  return filas.length > 0;
}

/**
 * empleado_id a partir del usuario de la sesión.
 * Antes varias rutas usaban `session.user.id` (que es usuario_id) directamente
 * como empleado_id. Son tablas distintas con numeración independiente: el
 * historial quedaba atribuido a otra persona, o reventaba la llave foránea.
 */
export async function getEmpleadoIdDeUsuario(usuarioId: number): Promise<number | null> {
  const fila = await queryOne<{ empleado_id: number }>(
    `SELECT empleado_id FROM empleados WHERE usuario_id = $1 AND activo`,
    [usuarioId]
  );
  return fila?.empleado_id ?? null;
}
