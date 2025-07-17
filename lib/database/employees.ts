import { executeQuery } from './connection';

// Obtener todos los empleados activos
export async function getActiveEmployees() {
  const query = `
    SELECT 
      empleado_id, 
      nombre, 
      apellidos, 
      telefono, 
      email, 
      puesto
    FROM empleados
    WHERE activo = TRUE
    ORDER BY nombre, apellidos
  `;
  
  return executeQuery<any[]>({
    query,
    values: []
  });
}

// Obtener detalles de un empleado
export async function getEmployeeById(empleadoId: number) {
  const query = `
    SELECT * FROM empleados
    WHERE empleado_id = ?
  `;
  
  const [employee] = await executeQuery<any[]>({
    query,
    values: [empleadoId]
  });
  
  if (!employee) return null;
  
  // Obtener usuario asociado si existe
  if (employee.usuario_id) {
    const userQuery = `
      SELECT usuario_id, email, rol, activo
      FROM usuarios
      WHERE usuario_id = ?
    `;
    
    const [user] = await executeQuery<any[]>({
      query: userQuery,
      values: [employee.usuario_id]
    });
    
    if (user) {
      employee.usuario = user;
    }
  }
  
  return employee;
}

// Buscar empleado por email
export async function getEmployeeByEmail(email: string) {
  const query = `
    SELECT e.* 
    FROM empleados e
    JOIN usuarios u ON e.usuario_id = u.usuario_id
    WHERE u.email = ?
  `;
  
  const [employee] = await executeQuery<any[]>({
    query,
    values: [email]
  });
  
  return employee || null;
}

// Función adicional para verificar empleados disponibles (útil para debugging)
export async function getAvailableEmployees() {
  try {
    const empleados = await executeQuery<any[]>({
      query: `
        SELECT empleado_id, nombre, apellidos, puesto, activo 
        FROM empleados 
        WHERE activo = TRUE 
        ORDER BY nombre, apellidos
      `,
      values: []
    });

    return empleados;
  } catch (error) {
    console.error('Error obteniendo empleados disponibles:', error);
    throw error;
  }
}