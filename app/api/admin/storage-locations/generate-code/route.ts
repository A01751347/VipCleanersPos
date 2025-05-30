// app/api/admin/storage-locations/generate-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateLocationCode, executeQuery } from '@/lib/db';
import { validateLocationCode } from './validateLocationCode';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caja } = body;

    // Validaciones
    if (!caja || typeof caja !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere especificar la caja como string' },
        { status: 400 }
      );
    }

    const cajaTrimmed = caja.trim();
    
    if (cajaTrimmed.length === 0) {
      return NextResponse.json(
        { error: 'El nombre de la caja no puede estar vacío' },
        { status: 400 }
      );
    }

    // Validar formato de caja (opcional, puedes ajustar según tus necesidades)
    const cajaRegex = /^[A-Z]\d+$/i; // Formato: A1, B2, C3, etc.
    if (!cajaRegex.test(cajaTrimmed)) {
      // Si no coincide con el formato estándar, usar generación manual
      const codigo = await generateManualCode(cajaTrimmed);
      
      return NextResponse.json({
        success: true,
        codigo,
        caja: cajaTrimmed,
        tipo: 'manual'
      });
    }

    // Usar la función de base de datos para generar código automático
    try {
      const codigo = await generateLocationCode(cajaTrimmed);
      
      if (!codigo) {
        // Fallback a generación manual si la función de BD falla
        const codigoManual = await generateManualCode(cajaTrimmed);
        
        return NextResponse.json({
          success: true,
          codigo: codigoManual,
          caja: cajaTrimmed,
          tipo: 'manual_fallback'
        });
      }

      return NextResponse.json({
        success: true,
        codigo,
        caja: cajaTrimmed,
        tipo: 'automatico'
      });

    } catch (dbError) {
      console.warn('Error en función de BD, usando generación manual:', dbError);
      
      // Fallback a generación manual
      const codigoManual = await generateManualCode(cajaTrimmed);
      
      return NextResponse.json({
        success: true,
        codigo: codigoManual,
        caja: cajaTrimmed,
        tipo: 'manual_fallback'
      });
    }

  } catch (error) {
    console.error('Error generando código de ubicación:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}

// GET - Obtener información sobre códigos disponibles para una caja
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caja = searchParams.get('caja');

    if (!caja) {
      return NextResponse.json(
        { error: 'Se requiere especificar la caja' },
        { status: 400 }
      );
    }

    // Obtener códigos existentes para esta caja
    const codigosExistentes = await executeQuery<any[]>({
      query: `
        SELECT 
          codigo_ubicacion,
          COUNT(*) as total_pares,
          GROUP_CONCAT(DISTINCT o.codigo_orden) as ordenes
        FROM detalles_orden_servicios dos
        JOIN ordenes o ON dos.orden_id = o.orden_id
        JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
        WHERE 
          dos.caja_almacenamiento = ? 
          AND dos.codigo_ubicacion IS NOT NULL
          AND es.nombre != 'Entregado'
        GROUP BY codigo_ubicacion
        ORDER BY codigo_ubicacion
      `,
      values: [caja.trim()]
    });

    // Generar próximo código disponible
    const proximoCodigo = await generateManualCode(caja.trim());

    return NextResponse.json({
      success: true,
      caja: caja.trim(),
      codigos_existentes: codigosExistentes,
      total_codigos_ocupados: codigosExistentes.length,
      proximo_codigo_sugerido: proximoCodigo
    });

  } catch (error) {
    console.error('Error obteniendo información de códigos:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false 
      },
      { status: 500 }
    );
  }
}

// Función helper para generar código manualmente
async function generateManualCode(caja: string): Promise<string> {
  try {
    // Extraer letra y número de la caja (ej: A1 -> A y 1)
    const cajaUpper = caja.toUpperCase();
    let letra = 'X';
    let numero = '1';
    
    // Intentar extraer letra y número
    const match = cajaUpper.match(/([A-Z]+)(\d+)/);
    if (match) {
      letra = match[1].charAt(0); // Tomar solo la primera letra
      numero = match[2];
    } else {
      // Si no coincide con el patrón, usar la primera letra de la caja
      letra = cajaUpper.charAt(0) || 'X';
      numero = '1';
    }

    // Contar cuántos items ya están en esta caja
    const conteoResult = await executeQuery<any[]>({
      query: `
        SELECT COUNT(*) as total
        FROM detalles_orden_servicios dos
        JOIN ordenes o ON dos.orden_id = o.orden_id
        JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
        WHERE 
          dos.caja_almacenamiento = ? 
          AND dos.codigo_ubicacion IS NOT NULL
          AND es.nombre != 'Entregado'
      `,
      values: [caja]
    });

    const contador = conteoResult[0]?.total || 0;
    const posicion = contador + 1;

    // Generar código: EST[LETRA]-F[NUMERO]-P[POSICION]
    const codigo = `EST${letra}-F${numero}-P${posicion}`;

    // Verificar que el código no exista (por si acaso)
    const codigoExiste = await executeQuery<any[]>({
      query: `
        SELECT detalle_servicio_id 
        FROM detalles_orden_servicios 
        WHERE codigo_ubicacion = ?
      `,
      values: [codigo]
    });

    if (codigoExiste.length > 0) {
      // Si el código ya existe, agregar timestamp para hacerlo único
      const timestamp = Date.now().toString().slice(-3);
      return `EST${letra}-F${numero}-P${posicion}-${timestamp}`;
    }

    return codigo;

  } catch (error) {
    console.error('Error en generación manual de código:', error);
    
    // Fallback absoluto
    const timestamp = Date.now().toString().slice(-6);
    return `EST-AUTO-${timestamp}`;
  }
}
