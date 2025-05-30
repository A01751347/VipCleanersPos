// app/api/admin/pos/route.ts - API Route CORREGIDO
import { NextRequest, NextResponse } from 'next/server';
import { createPosOrder } from '../../../../lib/db';

export async function POST(request: NextRequest) {
  console.log('🔥 API /admin/pos - Recibiendo POST request');
  
  try {
    const body = await request.json();
    console.log('📦 Datos recibidos del frontend:', JSON.stringify(body, null, 2));
    
    // Extraer y validar datos del request
    const {
      cliente,
      servicios = [],
      productos = [],
      // ✅ ESTOS SON LOS TOTALES CORRECTOS CALCULADOS POR EL FRONTEND
      subtotal,
      iva,
      total,
      metodoPago,
      monto,
      tieneIdentificacion = false,
      notas = null
    } = body;

    // Validaciones
    if (!cliente || !cliente.cliente_id) {
      console.error('❌ Cliente no proporcionado o inválido');
      return NextResponse.json(
        { success: false, error: 'Cliente requerido' },
        { status: 400 }
      );
    }

    if (servicios.length === 0) {
      console.error('❌ No hay servicios en la orden');
      return NextResponse.json(
        { success: false, error: 'Al menos un servicio es requerido' },
        { status: 400 }
      );
    }

    if (!subtotal || !iva || !total) {
      console.error('❌ Totales no proporcionados o inválidos');
      return NextResponse.json(
        { success: false, error: 'Totales de orden requeridos' },
        { status: 400 }
      );
    }

    if (!metodoPago || !monto) {
      console.error('❌ Información de pago incompleta');
      return NextResponse.json(
        { success: false, error: 'Información de pago requerida' },
        { status: 400 }
      );
    }

    console.log('✅ Validaciones pasadas, creando orden...');
    console.log('💰 Totales que se enviarán a DB:', { subtotal, iva, total });

    // Calcular fecha de entrega estimada (3 días hábiles)
    const fechaEntregaEstimada = new Date();
    fechaEntregaEstimada.setDate(fechaEntregaEstimada.getDate() + 3);

    // ✅ LLAMAR A createPosOrder CON LOS TOTALES CORRECTOS
    const result = await createPosOrder({
      clienteId: cliente.cliente_id,
      empleadoId: 1, // TODO: Obtener del usuario logueado
      servicios,
      productos,
      requiereIdentificacion: false, // TODO: Verificar según servicios
      tieneIdentificacionRegistrada: tieneIdentificacion,
      fechaEntregaEstimada,
      metodoPago: metodoPago as 'efectivo' | 'tarjeta' | 'transferencia' | 'mercado_pago',
      monto,
      notasOrder: notas,
      // ✅ PASAR LOS TOTALES CORRECTOS DEL FRONTEND
      subtotal: subtotal,  // Servicios + Productos
      iva: iva,           // 16% del subtotal total
      total: total        // Subtotal + IVA
    });

    console.log('🎉 Orden creada exitosamente:', result);
    console.log('📊 Totales finales enviados a DB:', { subtotal, iva, total });

    return NextResponse.json({
      success: true,
      ordenId: result.ordenId,
      codigoOrden: result.codigoOrden,
      message: 'Orden creada exitosamente'
    });

  } catch (error) {
    console.error('💥 Error en API /admin/pos:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}