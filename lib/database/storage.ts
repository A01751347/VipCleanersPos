import { executeQuery } from './connection';

// Función para asignar ubicaciones de almacenamiento
export async function assignStorageLocations(
  locations: {
    detalleServicioId: number;
    ordenId: number;
    cajaAlmacenamiento: string;
    codigoUbicacion: string;
    notasEspeciales?: string;
    empleadoId: number;
  }[]
): Promise<void> {
  try {
    // Procesar cada ubicación
    for (const location of locations) {
      await executeQuery({
        query: `CALL AsignarUbicacionAlmacenamiento(?, ?, ?, ?, ?, ?)`,
        values: [
          location.detalleServicioId,
          location.ordenId,
          location.cajaAlmacenamiento,
          location.codigoUbicacion,
          location.notasEspeciales || null,
          location.empleadoId
        ]
      });
    }
  } catch (error) {
    console.error('Error asignando ubicaciones:', error);
    throw error;
  }
}

// Función para buscar tenis por ubicación
export async function searchShoesByLocation(busqueda: string) {
  try {
    const result = await executeQuery<any[]>({
      query: `CALL BuscarTenisPorUbicacion(?)`,
      values: [busqueda]
    });
    
    // Los procedimientos almacenados devuelven un array anidado
    return result[0] || [];
  } catch (error) {
    console.error('Error buscando por ubicación:', error);
    throw error;
  }
}

// Función para obtener el mapa de ubicaciones
export async function getStorageLocationMap() {
  try {
    const result = await executeQuery<any[]>({
      query: `SELECT * FROM vw_mapa_ubicaciones ORDER BY caja_almacenamiento, codigo_ubicacion`,
      values: []
    });
    
    return result;
  } catch (error) {
    console.error('Error obteniendo mapa de ubicaciones:', error);
    throw error;
  }
}

// Función para obtener servicios pendientes de ubicación
export async function getServicesWithoutLocation(ordenId?: number) {
  let query = `
    SELECT 
      dos.detalle_servicio_id,
      dos.orden_id,
      o.codigo_orden,
      s.nombre AS servicio_nombre,
      dos.marca,
      dos.modelo,
      dos.descripcion_calzado,
      dos.cantidad,
      CONCAT(c.nombre, ' ', c.apellidos) AS cliente,
      c.telefono,
      o.fecha_recepcion,
      es.nombre AS estado_orden
    FROM detalles_orden_servicios dos
    JOIN ordenes o ON dos.orden_id = o.orden_id
    JOIN clientes c ON o.cliente_id = c.cliente_id
    JOIN servicios s ON dos.servicio_id = s.servicio_id
    JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
    WHERE 
      dos.caja_almacenamiento IS NULL 
      AND dos.codigo_ubicacion IS NULL
      AND (dos.marca IS NOT NULL OR dos.modelo IS NOT NULL)
      AND es.nombre != 'Entregado'
  `;
  
  const values: any[] = [];
  
  if (ordenId) {
    query += ` AND dos.orden_id = ?`;
    values.push(ordenId);
  }
  
  query += ` ORDER BY o.fecha_recepcion DESC`;
  
  try {
    const result = await executeQuery<any[]>({
      query,
      values
    });
    
    return result;
  } catch (error) {
    console.error('Error obteniendo servicios sin ubicación:', error);
    throw error;
  }
}

// Función para generar código de ubicación automático
export async function generateLocationCode(caja: string): Promise<string> {
  try {
    const result = await executeQuery<any[]>({
      query: `SELECT GenerarCodigoUbicacion(?) as codigo`,
      values: [caja]
    });
    
    return result[0]?.codigo || '';
  } catch (error) {
    console.error('Error generando código de ubicación:', error);
    throw error;
  }
}

// Función para obtener historial de ubicaciones de un par de tenis
export async function getLocationHistory(detalleServicioId: number) {
  try {
    const result = await executeQuery<any[]>({
      query: `
        SELECT 
          hu.*,
          CONCAT(e.nombre, ' ', e.apellidos) AS empleado_nombre,
          o.codigo_orden
        FROM historial_ubicaciones hu
        JOIN empleados e ON hu.empleado_id = e.empleado_id
        JOIN ordenes o ON hu.orden_id = o.orden_id
        WHERE hu.detalle_servicio_id = ?
        ORDER BY hu.fecha_asignacion DESC
      `,
      values: [detalleServicioId]
    });
    
    return result;
  } catch (error) {
    console.error('Error obteniendo historial de ubicaciones:', error);
    throw error;
  }
}

// Función para obtener estadísticas de almacenamiento
export async function getStorageStatistics() {
  try {
    // Total de pares almacenados
    const [totalStored] = await executeQuery<[{total: number}]>({
      query: `
        SELECT COUNT(*) as total
        FROM detalles_orden_servicios dos
        JOIN ordenes o ON dos.orden_id = o.orden_id
        JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
        WHERE 
          dos.caja_almacenamiento IS NOT NULL 
          AND dos.codigo_ubicacion IS NOT NULL
          AND es.nombre != 'Entregado'
      `,
      values: []
    });
    
    // Pares sin ubicación asignada
    const [pendingLocation] = await executeQuery<[{total: number}]>({
      query: `
        SELECT COUNT(*) as total
        FROM detalles_orden_servicios dos
        JOIN ordenes o ON dos.orden_id = o.orden_id
        JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
        WHERE 
          (dos.caja_almacenamiento IS NULL OR dos.codigo_ubicacion IS NULL)
          AND (dos.marca IS NOT NULL OR dos.modelo IS NOT NULL)
          AND es.nombre != 'Entregado'
      `,
      values: []
    });
    
    // Tiempo promedio de almacenamiento
    const [avgStorageTime] = await executeQuery<[{promedio: number}]>({
      query: `
        SELECT AVG(TIMESTAMPDIFF(DAY, dos.fecha_almacenamiento, NOW())) as promedio
        FROM detalles_orden_servicios dos
        JOIN ordenes o ON dos.orden_id = o.orden_id
        JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
        WHERE 
          dos.fecha_almacenamiento IS NOT NULL
          AND es.nombre != 'Entregado'
      `,
      values: []
    });
    
    // Cajas más utilizadas
    const topBoxes = await executeQuery<any[]>({
      query: `
        SELECT 
          caja_almacenamiento,
          COUNT(*) as total_pares
        FROM detalles_orden_servicios dos
        JOIN ordenes o ON dos.orden_id = o.orden_id
        JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
        WHERE 
          dos.caja_almacenamiento IS NOT NULL
          AND es.nombre != 'Entregado'
        GROUP BY caja_almacenamiento
        ORDER BY total_pares DESC
        LIMIT 5
      `,
      values: []
    });
    
    return {
      totalAlmacenados: totalStored.total,
      pendientesUbicacion: pendingLocation.total,
      tiempoPromedioAlmacenamiento: Math.round(avgStorageTime.promedio || 0),
      cajasMasUtilizadas: topBoxes
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de almacenamiento:', error);
    throw error;
  }
}