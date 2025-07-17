import { executeQuery } from './connection';

// Función para obtener servicios
export async function getServices(onlyActive: boolean = true) {
  const query = `
    SELECT * FROM servicios
    ${onlyActive ? 'WHERE activo = TRUE' : ''}
    ORDER BY precio ASC
  `;
  
  return executeQuery({
    query,
    values: []
  });
}

// Obtener todos los servicios disponibles
export async function getAllServices(onlyActive: boolean = true) {
  const query = `
    SELECT * FROM servicios
    ${onlyActive ? 'WHERE activo = TRUE' : ''}
    ORDER BY precio ASC
  `;
  
  return executeQuery<any[]>({
    query,
    values: []
  });
}

// Obtener un servicio por ID
export async function getServiceById(serviceId: number) {
  const query = `SELECT * FROM servicios WHERE servicio_id = ?`;
  
  const result = await executeQuery<any[]>({
    query,
    values: [serviceId]
  });
  
  return result.length > 0 ? result[0] : null;
}

export async function createService({
  nombre,
  descripcion,
  precio,
  tiempo_estimado_minutos = null,
  requiere_identificacion = false,
  activo = true
}: {
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_estimado_minutos?: number | null;
  requiere_identificacion?: boolean;
  activo?: boolean;
}) {
  const query = `
    INSERT INTO servicios (
      nombre, descripcion, precio, tiempo_estimado_minutos, 
      requiere_identificacion, activo
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const result = await executeQuery<any>({
    query,
    values: [
      nombre.trim(),
      descripcion.trim(),
      precio,
      tiempo_estimado_minutos,
      requiere_identificacion ? 1 : 0,
      activo ? 1 : 0
    ]
  });
  
  return result.insertId;
}

// Actualizar un servicio existente
export async function updateService(
  serviceId: number,
  {
    nombre,
    descripcion,
    precio,
    tiempo_estimado_minutos = null,
    requiere_identificacion = false,
    activo = true
  }: {
    nombre: string;
    descripcion: string;
    precio: number;
    tiempo_estimado_minutos?: number | null;
    requiere_identificacion?: boolean;
    activo?: boolean;
  }
) {
  const query = `
    UPDATE servicios 
    SET nombre = ?, descripcion = ?, precio = ?, tiempo_estimado_minutos = ?, 
        requiere_identificacion = ?, activo = ?, fecha_actualizacion = NOW()
    WHERE servicio_id = ?
  `;
  
  await executeQuery({
    query,
    values: [
      nombre.trim(),
      descripcion.trim(),
      precio,
      tiempo_estimado_minutos,
      requiere_identificacion ? 1 : 0,
      activo ? 1 : 0,
      serviceId
    ]
  });
  
  return true;
}

// Activar/desactivar servicio
export async function toggleServiceStatus(serviceId: number, activo: boolean) {
  const query = `
    UPDATE servicios 
    SET activo = ?, fecha_actualizacion = NOW()
    WHERE servicio_id = ?
  `;
  
  await executeQuery({
    query,
    values: [activo ? 1 : 0, serviceId]
  });
  
  return true;
}

// Verificar si un servicio está en uso
export async function isServiceInUse(serviceId: number): Promise<boolean> {
  const query = `
    SELECT COUNT(*) as count 
    FROM detalles_orden_servicios 
    WHERE servicio_id = ?
  `;
  
  const [result] = await executeQuery<[{count: number}]>({
    query,
    values: [serviceId]
  });
  
  return result.count > 0;
}