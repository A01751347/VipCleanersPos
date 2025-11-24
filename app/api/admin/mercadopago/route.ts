// app/api/admin/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';

const MP_API_BASE = 'https://api.mercadopago.com';
const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_USER_ID = process.env.MERCADOPAGO_USER_ID;
const MP_EXTERNAL_STORE_ID = process.env.MERCADOPAGO_EXTERNAL_STORE_ID;
const MP_EXTERNAL_POS_ID = process.env.MERCADOPAGO_EXTERNAL_POS_ID;

/**
 * POST /api/admin/mercadopago - Crear orden en Mercado Pago Point
 *
 * Crea una orden de pago en Mercado Pago Point Smart usando la Orders API
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Validar configuración de Mercado Pago
    if (!MP_ACCESS_TOKEN || !MP_USER_ID) {
      return NextResponse.json(
        {
          error: 'Configuración de Mercado Pago incompleta',
          details: 'Configura MERCADOPAGO_ACCESS_TOKEN y MERCADOPAGO_USER_ID en .env'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      amount,
      description,
      ordenId,
      codigoOrden,
      clienteNombre
    } = body;

    // Validaciones
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      );
    }

    // Crear la orden en Mercado Pago
    const orderData = {
      // Identificadores únicos
      external_reference: `VIP-${codigoOrden}-${ordenId}`,
      title: description || `Orden ${codigoOrden}`,
      description: `Orden de lavandería - Cliente: ${clienteNombre}`,

      // Notificación URL para webhooks
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,

      // Monto total
      total_amount: parseFloat(amount.toFixed(2)),

      // Items de la orden
      items: [
        {
          sku_number: codigoOrden,
          category: 'service',
          title: description || `Servicios de limpieza`,
          description: `Orden ${codigoOrden}`,
          unit_price: parseFloat(amount.toFixed(2)),
          quantity: 1,
          unit_measure: 'unit',
          total_amount: parseFloat(amount.toFixed(2))
        }
      ],

      // Metadata adicional
      metadata: {
        orden_id: ordenId,
        codigo_orden: codigoOrden,
        cliente_nombre: clienteNombre,
        source: 'vipcleaners_pos'
      }
    };

    // Realizar request a Mercado Pago Orders API
    const mpResponse = await fetch(
      `${MP_API_BASE}/instore/orders/qr/seller/collectors/${MP_USER_ID}/pos/${MP_EXTERNAL_POS_ID}/qrs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      }
    );

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json().catch(() => ({}));
      console.error('Error de Mercado Pago:', errorData);

      return NextResponse.json(
        {
          error: 'Error al crear orden en Mercado Pago',
          details: errorData.message || 'Error desconocido',
          mpError: errorData
        },
        { status: mpResponse.status }
      );
    }

    const mpOrder = await mpResponse.json();

    return NextResponse.json({
      success: true,
      mercadoPagoOrderId: mpOrder.qr_data,
      inStoreOrderId: mpOrder.in_store_order_id,
      qrData: mpOrder.qr_data,
      message: 'Orden creada en Point. Esperando pago del cliente...'
    });

  } catch (error) {
    console.error('Error en integración de Mercado Pago:', error);

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
 * GET /api/admin/mercadopago?orderId=xxx - Consultar estado de orden
 *
 * Consulta el estado actual de una orden de pago en Mercado Pago
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const inStoreOrderId = searchParams.get('orderId');

    if (!inStoreOrderId) {
      return NextResponse.json(
        { error: 'orderId es requerido' },
        { status: 400 }
      );
    }

    // Validar configuración
    if (!MP_ACCESS_TOKEN || !MP_USER_ID) {
      return NextResponse.json(
        { error: 'Configuración de Mercado Pago incompleta' },
        { status: 500 }
      );
    }

    // Consultar estado de la orden
    const mpResponse = await fetch(
      `${MP_API_BASE}/instore/qr/seller/collectors/${MP_USER_ID}/pos/${MP_EXTERNAL_POS_ID}/orders`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        }
      }
    );

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Error al consultar estado de orden',
          details: errorData.message || 'Error desconocido'
        },
        { status: mpResponse.status }
      );
    }

    const orders = await mpResponse.json();

    // Buscar la orden específica por in_store_order_id
    const order = orders.elements?.find((o: any) =>
      o.in_store_order_id === inStoreOrderId
    );

    if (!order) {
      return NextResponse.json({
        success: true,
        status: 'pending',
        message: 'Orden no encontrada o aún no procesada'
      });
    }

    return NextResponse.json({
      success: true,
      status: order.status,
      order: {
        id: order.id,
        inStoreOrderId: order.in_store_order_id,
        externalReference: order.external_reference,
        status: order.status,
        totalAmount: order.total_amount,
        createdDate: order.date_created,
        closedDate: order.date_closed,
        paymentId: order.payment?.id,
        paymentStatus: order.payment?.status,
        paymentType: order.payment?.payment_type_id
      }
    });

  } catch (error) {
    console.error('Error consultando estado de pago:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
