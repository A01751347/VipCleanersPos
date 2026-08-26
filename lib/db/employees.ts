import 'server-only';
import { query, queryOne, withTransaction, BusinessError } from './client';
import { hashPassword } from './auth';

export async function getEmpleados(soloActivos = true) {
  return query(
    `SELECT e.empleado_id, e.nombre, e.apellidos, e.puesto, e.telefono, e.activo,
            NULLIF(TRIM(CONCAT_WS(' ', e.nombre, e.apellidos)), '') AS nombre_completo,
            u.email, u.rol, u.usuario_id, u.ultimo_acceso
     FROM empleados e
     JOIN usuarios u ON u.usuario_id = e.usuario_id
     ${soloActivos ? 'WHERE e.activo' : ''}
     ORDER BY e.nombre, e.apellidos`
  );
}

export async function getEmpleadoPorId(empleadoId: number) {
  return queryOne(
    `SELECT e.*, u.email, u.rol, u.activo AS usuario_activo, u.ultimo_acceso
     FROM empleados e JOIN usuarios u ON u.usuario_id = e.usuario_id
     WHERE e.empleado_id = $1`,
    [empleadoId]
  );
}

/** Crea usuario y ficha de empleado en una sola transacción. */
export async function crearEmpleado(input: {
  nombre: string; apellidos?: string; email: string; password: string;
  rol: 'admin' | 'empleado'; telefono?: string | null; puesto?: string | null;
}) {
  if (!input.email?.trim()) throw new BusinessError('El correo es obligatorio.');
  if (!input.password || input.password.length < 8) {
    throw new BusinessError('La contraseña debe tener al menos 8 caracteres.');
  }
  if (!input.nombre?.trim()) throw new BusinessError('El nombre es obligatorio.');

  const hash = await hashPassword(input.password);

  return withTransaction(async (client) => {
    const usuario = await queryOne<{ usuario_id: number }>(
      `INSERT INTO usuarios (email, password, rol) VALUES ($1,$2,$3::rol_usuario)
       RETURNING usuario_id`,
      [input.email.trim().toLowerCase(), hash, input.rol],
      client
    );

    const empleado = await queryOne(
      `INSERT INTO empleados (usuario_id, nombre, apellidos, telefono, puesto)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        usuario!.usuario_id,
        input.nombre.trim(),
        input.apellidos?.trim() ?? '',
        input.telefono?.replace(/\D/g, '') || null,
        input.puesto?.trim() ?? null,
      ],
      client
    );

    return empleado;
  });
}

export async function actualizarEmpleado(
  empleadoId: number,
  input: { nombre?: string; apellidos?: string; telefono?: string | null;
           puesto?: string | null; rol?: 'admin' | 'empleado'; activo?: boolean }
) {
  return withTransaction(async (client) => {
    const empleado = await queryOne<{ usuario_id: number }>(
      `UPDATE empleados SET
         nombre = COALESCE($2, nombre),
         apellidos = COALESCE($3, apellidos),
         telefono = COALESCE($4, telefono),
         puesto = COALESCE($5, puesto),
         activo = COALESCE($6, activo)
       WHERE empleado_id = $1 RETURNING usuario_id`,
      [
        empleadoId,
        input.nombre?.trim() ?? null,
        input.apellidos?.trim() ?? null,
        input.telefono?.replace(/\D/g, '') ?? null,
        input.puesto?.trim() ?? null,
        input.activo ?? null,
      ],
      client
    );
    if (!empleado) throw new BusinessError('El empleado no existe.');

    if (input.rol || input.activo !== undefined) {
      await query(
        `UPDATE usuarios SET
           rol = COALESCE($2::rol_usuario, rol),
           activo = COALESCE($3, activo)
         WHERE usuario_id = $1`,
        [empleado.usuario_id, input.rol ?? null, input.activo ?? null],
        client
      );
    }

    return getEmpleadoPorId(empleadoId);
  });
}

export async function cambiarPassword(usuarioId: number, nuevaPassword: string) {
  if (!nuevaPassword || nuevaPassword.length < 8) {
    throw new BusinessError('La contraseña debe tener al menos 8 caracteres.');
  }
  const hash = await hashPassword(nuevaPassword);
  await query(
    `UPDATE usuarios SET password = $2, intentos_fallidos = 0, bloqueado_hasta = NULL
     WHERE usuario_id = $1`,
    [usuarioId, hash]
  );
}
