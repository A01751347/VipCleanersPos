// app/api/admin/storage-locations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  assignStorageLocations, 
  searchShoesByLocation, 
  getStorageLocationMap,
  getServicesWithoutLocation,
  generateLocationCode,
  getStorageStatistics,
  executeQuery
} from '@/lib/database';

// POST - Asignar ubicaciones de almacenamiento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locations, empleadoId } = body;

    // Validaciones básicas
    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de ubicaciones' },
        { status: 400 }
      );
    }

    if (!empleadoId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del empleado' },
        { status: 400 }
      );
    }

    // Transformar y validar datos
    const locationData = [];
    
    for (const location of locations) {
      // Validar campos requeridos
      if (!location.detalleServicioId || !location.ordenId || 
          !location.cajaAlmacenamiento || !location.codigoUbicacion) {
        return NextResponse.json(
          { error: 'Todos los campos requeridos deben estar presentes en cada ubicación' },
          { status: 400 }
        );
      }

      // Validar tipos de datos
      const detalleServicioId = parseInt(location.detalleServicioId);
      const ordenId = parseInt(location.ordenId);
      const empleadoIdNum = parseInt(empleadoId);

      if (isNaN(detalleServicioId) || isNaN(ordenId) || isNaN(empleadoIdNum)) {
        return NextResponse.json(
          { error: 'Los IDs deben ser números válidos' },
          { status: 400 }
        );
      }

      locationData.push({
        detalleServicioId,
        ordenId,
        cajaAlmacenamiento: location.cajaAlmacenamiento.trim(),
        codigoUbicacion: location.codigoUbicacion.trim(),
        notasEspeciales: location.notasEspeciales?.trim() || null,
        empleadoId: empleadoIdNum
      });
    }

    // Verificar que no haya códigos duplicados en la solicitud
    const codigos = locationData.map(loc => loc.codigoUbicacion);
    const codigosDuplicados = codigos.filter((codigo, index) => codigos.indexOf(codigo) !== index);
    
    if (codigosDuplicados.length > 0) {
      return NextResponse.json(
        { error: `Códigos de ubicación duplicados en la solicitud: ${codigosDuplicados.join(', ')}` },
        { status: 400 }
      );
    }

    // Verificar que los códigos no estén ya en uso
    const codigosExistentes = await executeQuery<any[]>({
      query: `
        SELECT codigo_ubicacion 
        FROM detalles_orden_servicios 
        WHERE codigo_ubicacion IN (${codigos.map(() => '?').join(',')})
        AND codigo_ubicacion IS NOT NULL
      `,
      values: codigos
    });

    if (codigosExistentes.length > 0) {
      const codigosEnUso = codigosExistentes.map(row => row.codigo_ubicacion);
      return NextResponse.json(
        { error: `Los siguientes códigos ya están en uso: ${codigosEnUso.join(', ')}` },
        { status: 400 }
      );
    }

    // Verificar que los detalles de servicio existan y no tengan ya ubicación
    for (const location of locationData) {
      const detalleServicio = await executeQuery<any[]>({
        query: `
          SELECT dos.detalle_servicio_id, dos.caja_almacenamiento, dos.codigo_ubicacion, o.codigo_orden
          FROM detalles_orden_servicios dos
          JOIN ordenes o ON dos.orden_id = o.orden_id
          WHERE dos.detalle_servicio_id = ? AND dos.orden_id = ?
        `,
        values: [location.detalleServicioId, location.ordenId]
      });

      if (detalleServicio.length === 0) {
        return NextResponse.json(
          { error: `No se encontró el detalle de servicio ${location.detalleServicioId} para la orden ${location.ordenId}` },
          { status: 404 }
        );
      }

      const detalle = detalleServicio[0];
      if (detalle.caja_almacenamiento && detalle.codigo_ubicacion) {
        return NextResponse.json(
          { error: `El servicio ${location.detalleServicioId} ya tiene ubicación asignada: ${detalle.caja_almacenamiento} - ${detalle.codigo_ubicacion}` },
          { status: 400 }
        );
      }
    }

    // Asignar ubicaciones usando transacción
    await assignStorageLocations(locationData);

    return NextResponse.json({
      success: true,
      message: `${locations.length} ubicación${locations.length > 1 ? 'es' : ''} asignada${locations.length > 1 ? 's' : ''} correctamente`,
      ubicacionesAsignadas: locationData.length
    });

  } catch (error) {
    console.error('Error asignando ubicaciones:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}

// GET - Buscar tenis por ubicación o obtener estadísticas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const busqueda = searchParams.get('q');
    const ordenId = searchParams.get('ordenId');
    const limit = searchParams.get('limit');

    switch (action) {
      case 'search':
        if (!busqueda || busqueda.trim().length === 0) {
          return NextResponse.json(
            { error: 'Se requiere un término de búsqueda' },
            { status: 400 }
          );
        }
        
        const resultados = await searchShoesByLocation(busqueda.trim());
        
        return NextResponse.json({
          success: true,
          resultados,
          total: resultados.length,
          termino_busqueda: busqueda.trim()
        });

      case 'map':
        const mapaUbicaciones = await getStorageLocationMap();
        
        return NextResponse.json({
          success: true,
          mapa: mapaUbicaciones,
          total_ubicaciones: mapaUbicaciones.length
        });

      case 'pending':
        const ordenIdNum = ordenId ? parseInt(ordenId) : undefined;
        
        if (ordenId && isNaN(ordenIdNum!)) {
          return NextResponse.json(
            { error: 'ID de orden inválido' },
            { status: 400 }
          );
        }
        
        const serviciosPendientes = await getServicesWithoutLocation(ordenIdNum);
        
        return NextResponse.json({
          success: true,
          servicios: serviciosPendientes,
          total: serviciosPendientes.length,
          orden_filtrada: ordenIdNum || null
        });

      case 'stats':
        const estadisticas = await getStorageStatistics();
        
        return NextResponse.json({
          success: true,
          estadisticas,
          fecha_consulta: new Date().toISOString()
        });

      case 'history':
        // Obtener historial de ubicaciones
        const detalleServicioId = searchParams.get('detalleServicioId');
        
        if (!detalleServicioId) {
          return NextResponse.json(
            { error: 'Se requiere el ID del detalle de servicio' },
            { status: 400 }
          );
        }

        const historial = await executeQuery<any[]>({
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
          values: [parseInt(detalleServicioId)]
        });

        return NextResponse.json({
          success: true,
          historial,
          detalle_servicio_id: parseInt(detalleServicioId)
        });

      case 'validate-code':
        // Validar si un código de ubicación está disponible
        const codigo = searchParams.get('codigo');
        
        if (!codigo) {
          return NextResponse.json(
            { error: 'Se requiere el código a validar' },
            { status: 400 }
          );
        }

        const codigoEnUso = await executeQuery<any[]>({
          query: `
            SELECT dos.detalle_servicio_id, o.codigo_orden
            FROM detalles_orden_servicios dos
            JOIN ordenes o ON dos.orden_id = o.orden_id
            JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
            WHERE dos.codigo_ubicacion = ? AND es.nombre != 'Entregado'
          `,
          values: [codigo.trim()]
        });

        return NextResponse.json({
          success: true,
          disponible: codigoEnUso.length === 0,
          codigo: codigo.trim(),
          en_uso_por: codigoEnUso.length > 0 ? codigoEnUso[0] : null
        });

      case 'boxes':
        // Obtener información de todas las cajas
        const infoBoxes = await executeQuery<any[]>({
          query: `
            SELECT 
              caja_almacenamiento,
              COUNT(*) as total_pares,
              COUNT(DISTINCT orden_id) as total_ordenes,
              MIN(fecha_almacenamiento) as fecha_mas_antigua,
              MAX(fecha_almacenamiento) as fecha_mas_reciente,
              AVG(TIMESTAMPDIFF(DAY, fecha_almacenamiento, NOW())) as dias_promedio
            FROM detalles_orden_servicios dos
            JOIN ordenes o ON dos.orden_id = o.orden_id
            JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
            WHERE 
              dos.caja_almacenamiento IS NOT NULL 
              AND es.nombre != 'Entregado'
            GROUP BY caja_almacenamiento
            ORDER BY total_pares DESC
          `,
          values: []
        });

        return NextResponse.json({
          success: true,
          cajas: infoBoxes,
          total_cajas_ocupadas: infoBoxes.length
        });

      default:
        return NextResponse.json(
          { error: 'Acción no válida. Acciones disponibles: search, map, pending, stats, history, validate-code, boxes' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error en GET /api/admin/storage-locations:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar ubicación existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      detalleServicioId, 
      ordenId, 
      cajaAlmacenamiento, 
      codigoUbicacion, 
      notasEspeciales, 
      empleadoId 
    } = body;

    // Validaciones
    if (!detalleServicioId || !ordenId || !cajaAlmacenamiento || !codigoUbicacion || !empleadoId) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben estar presentes' },
        { status: 400 }
      );
    }

    const detalleId = parseInt(detalleServicioId);
    const ordenIdNum = parseInt(ordenId);
    const empleadoIdNum = parseInt(empleadoId);

    if (isNaN(detalleId) || isNaN(ordenIdNum) || isNaN(empleadoIdNum)) {
      return NextResponse.json(
        { error: 'Los IDs deben ser números válidos' },
        { status: 400 }
      );
    }

    // Verificar que el detalle de servicio existe
    const detalleExiste = await executeQuery<any[]>({
      query: `
        SELECT detalle_servicio_id, caja_almacenamiento, codigo_ubicacion
        FROM detalles_orden_servicios 
        WHERE detalle_servicio_id = ? AND orden_id = ?
      `,
      values: [detalleId, ordenIdNum]
    });

    if (detalleExiste.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró el detalle de servicio especificado' },
        { status: 404 }
      );
    }

    // Verificar que el código no esté en uso por otro servicio
    const codigoEnUso = await executeQuery<any[]>({
      query: `
        SELECT detalle_servicio_id 
        FROM detalles_orden_servicios 
        WHERE codigo_ubicacion = ? AND detalle_servicio_id != ?
      `,
      values: [codigoUbicacion.trim(), detalleId]
    });

    if (codigoEnUso.length > 0) {
      return NextResponse.json(
        { error: `El código ${codigoUbicacion} ya está en uso por otro servicio` },
        { status: 400 }
      );
    }

    // Actualizar ubicación
    await executeQuery({
      query: `
        UPDATE detalles_orden_servicios
        SET 
          caja_almacenamiento = ?,
          codigo_ubicacion = ?,
          notas_especiales = ?,
          fecha_almacenamiento = COALESCE(fecha_almacenamiento, NOW()),
          empleado_almacenamiento_id = ?
        WHERE detalle_servicio_id = ? AND orden_id = ?
      `,
      values: [
        cajaAlmacenamiento.trim(),
        codigoUbicacion.trim(),
        notasEspeciales?.trim() || null,
        empleadoIdNum,
        detalleId,
        ordenIdNum
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Ubicación actualizada correctamente',
      detalleServicioId: detalleId,
      nuevaUbicacion: {
        caja: cajaAlmacenamiento.trim(),
        codigo: codigoUbicacion.trim()
      }
    });

  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}

// DELETE - Remover ubicación (liberar espacio)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detalleServicioId = searchParams.get('detalleServicioId');
    const ordenId = searchParams.get('ordenId');
    const empleadoId = searchParams.get('empleadoId');

    if (!detalleServicioId || !ordenId || !empleadoId) {
      return NextResponse.json(
        { error: 'Se requieren detalleServicioId, ordenId y empleadoId' },
        { status: 400 }
      );
    }

    const detalleId = parseInt(detalleServicioId);
    const ordenIdNum = parseInt(ordenId);
    const empleadoIdNum = parseInt(empleadoId);

    if (isNaN(detalleId) || isNaN(ordenIdNum) || isNaN(empleadoIdNum)) {
      return NextResponse.json(
        { error: 'Los IDs deben ser números válidos' },
        { status: 400 }
      );
    }

    // Verificar que el detalle existe y tiene ubicación
    const detalle = await executeQuery<any[]>({
      query: `
        SELECT caja_almacenamiento, codigo_ubicacion
        FROM detalles_orden_servicios 
        WHERE detalle_servicio_id = ? AND orden_id = ?
      `,
      values: [detalleId, ordenIdNum]
    });

    if (detalle.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró el detalle de servicio especificado' },
        { status: 404 }
      );
    }

    if (!detalle[0].caja_almacenamiento || !detalle[0].codigo_ubicacion) {
      return NextResponse.json(
        { error: 'El servicio no tiene ubicación asignada' },
        { status: 400 }
      );
    }

    const ubicacionAnterior = {
      caja: detalle[0].caja_almacenamiento,
      codigo: detalle[0].codigo_ubicacion
    };

    // Limpiar ubicación
    await executeQuery({
      query: `
        UPDATE detalles_orden_servicios
        SET 
          caja_almacenamiento = NULL,
          codigo_ubicacion = NULL,
          notas_especiales = NULL,
          fecha_almacenamiento = NULL,
          empleado_almacenamiento_id = NULL
        WHERE detalle_servicio_id = ? AND orden_id = ?
      `,
      values: [detalleId, ordenIdNum]
    });

    // Registrar en historial la liberación
    await executeQuery({
      query: `
        INSERT INTO historial_ubicaciones (
          detalle_servicio_id, orden_id, caja_almacenamiento, 
          codigo_ubicacion, notas, empleado_id
        ) VALUES (?, ?, ?, ?, 'Ubicación liberada', ?)
      `,
      values: [
        detalleId,
        ordenIdNum,
        ubicacionAnterior.caja,
        ubicacionAnterior.codigo,
        empleadoIdNum
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Ubicación liberada correctamente',
      ubicacionLiberada: ubicacionAnterior
    });

  } catch (error) {
    console.error('Error liberando ubicación:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}