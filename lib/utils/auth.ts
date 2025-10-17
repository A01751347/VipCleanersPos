// lib/utils/auth.ts
import { executeQuery } from '../database/connection';

/**
 * Obtiene el empleado_id basado en el usuario_id de la sesión
 * @param usuarioId ID del usuario de la sesión
 * @returns empleado_id correspondiente o fallback al empleado principal (ID: 1)
 */
export async function getEmpleadoIdFromUsuarioId(usuarioId: string | number): Promise<number> {
  try {
    const empleadoResult = await executeQuery<{empleado_id: number}[]>({
      query: 'SELECT empleado_id FROM empleados WHERE usuario_id = ?',
      values: [parseInt(usuarioId.toString(), 10)]
    });

    if (!empleadoResult || empleadoResult.length === 0) {
      // Si no existe empleado, usar empleado_id = 1 como fallback (admin principal)
      console.warn(`Usuario ${usuarioId} no tiene empleado asociado, usando empleado_id = 1`);
      return 1;
    } else {
      return empleadoResult[0].empleado_id;
    }
  } catch (dbError) {
    console.error('Error al obtener empleado_id:', dbError);
    // Fallback a empleado_id = 1 en caso de error
    return 1;
  }
}

/**
 * Verifica si un empleado_id existe en la base de datos
 * @param empleadoId ID del empleado a verificar
 * @returns true si existe, false si no
 */
export async function empleadoExists(empleadoId: number): Promise<boolean> {
  try {
    const result = await executeQuery<{count: number}[]>({
      query: 'SELECT COUNT(*) as count FROM empleados WHERE empleado_id = ?',
      values: [empleadoId]
    });

    return result[0].count > 0;
  } catch (error) {
    console.error('Error al verificar empleado:', error);
    return false;
  }
}