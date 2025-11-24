// app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

/**
 * Webhook de Mercado Pago para recibir notificaciones de pago
 *
 * Mercado Pago envía notificaciones cuando:
 * - Se crea un pago
 * - Se actualiza el estado de un pago
 * - Se completa una orden
 *
 * Documentación: https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📩 Webhook de Mercado Pago recibido:', JSON.stringify(body, null, 2));

    const { action, data, type } = body;

    // Filtrar solo notificaciones de pago
    if (type !== 'payment' && action !== 'payment.created' && action !== 'payment.updated') {
      console.log('ℹ️ Tipo de notificación no manejada:', type, action);
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    // Obtener el ID del pago
    const paymentId = data?.id;

    if (!paymentId) {
      console.warn('⚠️ Notificación sin payment ID');
      return NextResponse.json({ status: 'no_payment_id' }, { status: 200 });
    }

    // Consultar detalles del pago desde Mercado Pago
    const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!MP_ACCESS_TOKEN) {
      console.error('❌ MERCADOPAGO_ACCESS_TOKEN no configurado');
      return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 });
    }

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        }
      }
    );

    if (!paymentResponse.ok) {
      console.error('❌ Error al obtener detalles del pago de MP');
      return NextResponse.json({ error: 'Error obteniendo pago' }, { status: 500 });
    }

    const payment = await paymentResponse.json();

    console.log('💳 Detalles del pago:', {
      id: payment.id,
      status: payment.status,
      externalReference: payment.external_reference,
      amount: payment.transaction_amount
    });

    // Extraer información relevante
    const {
      status,
      status_detail,
      external_reference,
      transaction_amount,
      payment_type_id,
      payment_method_id,
      date_approved
    } = payment;

    // El external_reference tiene el formato: VIP-{codigoOrden}-{ordenId}
    // Ejemplo: VIP-ORD-2024-001-123
    if (!external_reference || !external_reference.startsWith('VIP-')) {
      console.warn('⚠️ External reference inválido:', external_reference);
      return NextResponse.json({ status: 'invalid_reference' }, { status: 200 });
    }

    const parts = external_reference.split('-');
    const ordenId = parts[parts.length - 1];

    if (!ordenId || isNaN(parseInt(ordenId))) {
      console.warn('⚠️ No se pudo extraer orden ID de:', external_reference);
      return NextResponse.json({ status: 'invalid_order_id' }, { status: 200 });
    }

    // Registrar el pago en la base de datos
    if (status === 'approved') {
      console.log('✅ Pago aprobado, registrando en BD...');

      try {
        // Actualizar el pago en la tabla de pagos
        await executeQuery({
          query: `
            UPDATE pagos
            SET
              estado_pago = 'completado',
              referencia_pago = ?,
              fecha_pago = NOW(),
              metodo_pago = ?
            WHERE orden_id = ? AND estado_pago = 'pendiente'
          `,
          values: [
            paymentId.toString(),
            payment_method_id || 'mercado_pago',
            parseInt(ordenId)
          ]
        });

        // Si no existe el pago, crear uno nuevo
        const existingPayment = await executeQuery<any[]>({
          query: 'SELECT pago_id FROM pagos WHERE orden_id = ?',
          values: [parseInt(ordenId)]
        });

        if (existingPayment.length === 0) {
          await executeQuery({
            query: `
              INSERT INTO pagos (
                orden_id,
                monto,
                metodo_pago,
                estado_pago,
                referencia_pago,
                fecha_pago
              ) VALUES (?, ?, ?, 'completado', ?, NOW())
            `,
            values: [
              parseInt(ordenId),
              transaction_amount,
              payment_method_id || 'mercado_pago',
              paymentId.toString()
            ]
          });
        }

        console.log('✅ Pago registrado exitosamente en BD');

        return NextResponse.json({
          status: 'processed',
          message: 'Pago procesado exitosamente'
        }, { status: 200 });

      } catch (dbError) {
        console.error('❌ Error al actualizar BD:', dbError);
        return NextResponse.json(
          { error: 'Error en base de datos' },
          { status: 500 }
        );
      }
    } else if (status === 'rejected' || status === 'cancelled') {
      console.log('❌ Pago rechazado o cancelado');

      // Actualizar estado del pago a rechazado
      await executeQuery({
        query: `
          UPDATE pagos
          SET
            estado_pago = 'rechazado',
            referencia_pago = ?
          WHERE orden_id = ?
        `,
        values: [paymentId.toString(), parseInt(ordenId)]
      });

      return NextResponse.json({
        status: 'processed',
        message: 'Pago rechazado'
      }, { status: 200 });
    }

    return NextResponse.json({
      status: 'acknowledged',
      message: 'Notificación recibida'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error procesando webhook de Mercado Pago:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/mercadopago
 * Endpoint para verificar que el webhook está activo
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Webhook de Mercado Pago activo',
    timestamp: new Date().toISOString()
  });
}
