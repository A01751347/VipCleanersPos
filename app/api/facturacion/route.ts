// app/api/facturacion/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';
import { sendEmail } from '@/lib/email';

const FACTURAPI_BASE_URL = 'https://www.facturapi.io/v2';
const FACTURAPI_KEY = process.env.FACTURAPI_MODE === 'live'
  ? process.env.FACTURAPI_SECRET_KEY
  : process.env.FACTURAPI_TEST_KEY;

interface InvoiceData {
  ordenId: number;
  codigoOrden: string;
  rfc: string;
  razonSocial: string;
  usoCfdi: string;
  regimenFiscal: string;
  codigoPostal: string;
  email: string;
  total: number;
}

/**
 * POST /api/facturacion
 * Genera una factura para una orden existente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      codigoOrden,
      montoTotal,
      rfc,
      razonSocial,
      usoCfdi = 'G03',
      regimenFiscal,
      codigoPostal,
      email
    } = body;

    // Validaciones básicas
    if (!codigoOrden || !montoTotal || !rfc || !razonSocial || !email) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos para facturar' },
        { status: 400 }
      );
    }

    // Validar RFC
    const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
    if (!rfcPattern.test(rfc.toUpperCase())) {
      return NextResponse.json(
        { error: 'RFC inválido' },
        { status: 400 }
      );
    }

    // Buscar la orden
    const [orden] = await executeQuery<any[]>({
      query: `
        SELECT
          o.orden_id,
          o.codigo_orden,
          o.total,
          o.subtotal,
          o.iva,
          o.facturado,
          o.factura_status,
          o.factura_uuid,
          c.nombre,
          c.apellidos,
          c.telefono,
          c.email as cliente_email
        FROM ordenes o
        LEFT JOIN clientes c ON o.cliente_id = c.cliente_id
        WHERE o.codigo_orden = ?
      `,
      values: [codigoOrden]
    });

    if (!orden) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Validar monto (seguridad contra facturas de órdenes ajenas)
    if (Math.abs(orden.total - parseFloat(montoTotal)) > 0.01) {
      return NextResponse.json(
        { error: 'El monto total no coincide con la orden' },
        { status: 400 }
      );
    }

    // Verificar si ya está facturada
    if (orden.facturado && orden.factura_status === 'issued') {
      return NextResponse.json(
        {
          error: 'Esta orden ya ha sido facturada',
          details: {
            uuid: orden.factura_uuid,
            message: 'La factura ya fue emitida previamente'
          }
        },
        { status: 409 } // Conflict
      );
    }

    // Validar configuración de Facturapi
    if (!FACTURAPI_KEY) {
      return NextResponse.json(
        { error: 'Servicio de facturación no configurado' },
        { status: 500 }
      );
    }

    // Obtener conceptos de la orden
    const conceptos = await getOrderConcepts(orden.orden_id);

    // Crear factura en Facturapi
    const facturaData = {
      customer: {
        legal_name: razonSocial,
        tax_id: rfc.toUpperCase(),
        tax_system: regimenFiscal || '616', // 616 = Sin obligaciones fiscales
        email: email,
        address: {
          zip: codigoPostal || '00000'
        }
      },
      items: conceptos.map(item => ({
        product: {
          description: item.descripcion,
          product_key: '90111600', // Clave genérica para servicios de lavandería
          price: item.precioUnitario,
          tax_included: true,
          taxability: '01', // Objeto de impuesto
          taxes: [
            {
              type: 'IVA',
              rate: 0.16
            }
          ]
        },
        quantity: item.cantidad
      })),
      use: usoCfdi,
      payment_form: '03', // Transferencia electrónica
      payment_method: 'PUE', // Pago en una sola exhibición
      external_id: codigoOrden
    };

    console.log('📄 Creando factura en Facturapi:', JSON.stringify(facturaData, null, 2));

    const facturapiResponse = await fetch(`${FACTURAPI_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FACTURAPI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(facturaData)
    });

    if (!facturapiResponse.ok) {
      const errorData = await facturapiResponse.json().catch(() => ({}));
      console.error('❌ Error de Facturapi:', errorData);

      return NextResponse.json(
        {
          error: 'Error al generar la factura',
          details: errorData.message || 'Error desconocido de Facturapi'
        },
        { status: facturapiResponse.status }
      );
    }

    const factura = await facturapiResponse.json();

    console.log('✅ Factura generada:', factura.id, factura.uuid);

    // Actualizar la orden en la base de datos
    await executeQuery({
      query: `
        UPDATE ordenes
        SET
          facturado = TRUE,
          factura_uuid = ?,
          factura_serie = ?,
          factura_folio = ?,
          factura_fecha = NOW(),
          factura_pdf_url = ?,
          factura_xml_url = ?,
          factura_status = 'issued',
          facturapi_id = ?,
          rfc_cliente = ?,
          razon_social_cliente = ?,
          uso_cfdi = ?,
          regimen_fiscal = ?,
          codigo_postal_fiscal = ?
        WHERE orden_id = ?
      `,
      values: [
        factura.uuid,
        factura.series || null,
        factura.folio_number || null,
        factura.pdf_custom_section ? null : `${FACTURAPI_BASE_URL}/invoices/${factura.id}/pdf`,
        factura.xml ? null : `${FACTURAPI_BASE_URL}/invoices/${factura.id}/xml`,
        factura.status,
        factura.id,
        rfc.toUpperCase(),
        razonSocial,
        usoCfdi,
        regimenFiscal,
        codigoPostal,
        orden.orden_id
      ]
    });

    // Registrar en log de auditoría
    await executeQuery({
      query: `
        INSERT INTO facturas_log (orden_id, accion, factura_uuid, detalles)
        VALUES (?, 'created', ?, ?)
      `,
      values: [
        orden.orden_id,
        factura.uuid,
        JSON.stringify({
          rfc,
          razonSocial,
          email,
          source: 'self-service'
        })
      ]
    });

    // Enviar factura por correo
    try {
      await sendInvoiceEmail({
        email,
        ordenCodigo: codigoOrden,
        razonSocial,
        uuid: factura.uuid,
        pdfUrl: `${FACTURAPI_BASE_URL}/invoices/${factura.id}/pdf`,
        xmlUrl: `${FACTURAPI_BASE_URL}/invoices/${factura.id}/xml`
      });

      await executeQuery({
        query: `
          INSERT INTO facturas_log (orden_id, accion, factura_uuid, detalles)
          VALUES (?, 'email_sent', ?, ?)
        `,
        values: [orden.orden_id, factura.uuid, JSON.stringify({ email })]
      });
    } catch (emailError) {
      console.error('⚠️ Error enviando email:', emailError);
      // No fallar la factura si el email falla
    }

    return NextResponse.json({
      success: true,
      message: 'Factura generada exitosamente',
      factura: {
        uuid: factura.uuid,
        serie: factura.series,
        folio: factura.folio_number,
        fecha: factura.date,
        total: factura.total,
        pdfUrl: `${FACTURAPI_BASE_URL}/invoices/${factura.id}/pdf`,
        xmlUrl: `${FACTURAPI_BASE_URL}/invoices/${factura.id}/xml`
      }
    });

  } catch (error) {
    console.error('❌ Error en facturación:', error);

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
 * GET /api/facturacion?codigoOrden=XXX
 * Obtiene información de facturación de una orden
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codigoOrden = searchParams.get('codigoOrden');

    if (!codigoOrden) {
      return NextResponse.json(
        { error: 'codigoOrden es requerido' },
        { status: 400 }
      );
    }

    const [orden] = await executeQuery<any[]>({
      query: `
        SELECT
          orden_id,
          codigo_orden,
          total,
          facturado,
          factura_uuid,
          factura_serie,
          factura_folio,
          factura_fecha,
          factura_pdf_url,
          factura_xml_url,
          factura_status,
          rfc_cliente,
          razon_social_cliente
        FROM ordenes
        WHERE codigo_orden = ?
      `,
      values: [codigoOrden]
    });

    if (!orden) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      orden: {
        codigoOrden: orden.codigo_orden,
        total: orden.total,
        facturado: orden.facturado,
        facturaStatus: orden.factura_status,
        factura: orden.facturado ? {
          uuid: orden.factura_uuid,
          serie: orden.factura_serie,
          folio: orden.factura_folio,
          fecha: orden.factura_fecha,
          pdfUrl: orden.factura_pdf_url,
          xmlUrl: orden.factura_xml_url,
          rfc: orden.rfc_cliente,
          razonSocial: orden.razon_social_cliente
        } : null
      }
    });

  } catch (error) {
    console.error('Error obteniendo información de factura:', error);

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Helper: Obtener conceptos de la orden
async function getOrderConcepts(ordenId: number) {
  const servicios = await executeQuery<any[]>({
    query: `
      SELECT
        ds.cantidad,
        s.nombre as descripcion,
        ds.precio_unitario as precioUnitario,
        ds.subtotal,
        ds.iva
      FROM detalles_orden_servicios ds
      JOIN servicios s ON ds.servicio_id = s.servicio_id
      WHERE ds.orden_id = ?
    `,
    values: [ordenId]
  });

  const productos = await executeQuery<any[]>({
    query: `
      SELECT
        dp.cantidad,
        p.nombre as descripcion,
        dp.precio_unitario as precioUnitario,
        dp.subtotal,
        dp.iva
      FROM detalles_orden_productos dp
      JOIN productos p ON dp.producto_id = p.producto_id
      WHERE dp.orden_id = ?
    `,
    values: [ordenId]
  });

  return [...servicios, ...productos];
}

// Helper: Enviar factura por email
async function sendInvoiceEmail(data: {
  email: string;
  ordenCodigo: string;
  razonSocial: string;
  uuid: string;
  pdfUrl: string;
  xmlUrl: string;
}) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Tu Factura - ${process.env.COMPANY_NAME}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #313D52;">Tu Factura Electrónica</h2>

        <p>Hola <strong>${data.razonSocial}</strong>,</p>

        <p>Tu factura para la orden <strong>${data.ordenCodigo}</strong> ha sido generada exitosamente.</p>

        <div style="background-color: #f5f9f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>UUID:</strong> ${data.uuid}</p>
          <p style="margin: 5px 0;"><strong>Orden:</strong> ${data.ordenCodigo}</p>
        </div>

        <p><strong>Descarga tu factura:</strong></p>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 10px 0;">
            <a href="${data.pdfUrl}"
               style="display: inline-block; padding: 10px 20px; background-color: #78f3d3; color: #313D52; text-decoration: none; border-radius: 5px;">
              📄 Descargar PDF
            </a>
          </li>
          <li style="margin: 10px 0;">
            <a href="${data.xmlUrl}"
               style="display: inline-block; padding: 10px 20px; background-color: #313D52; color: white; text-decoration: none; border-radius: 5px;">
              📋 Descargar XML
            </a>
          </li>
        </ul>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Gracias por tu preferencia,<br>
          <strong>${process.env.COMPANY_NAME}</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.email,
    subject: `Tu Factura - Orden ${data.ordenCodigo}`,
    html: htmlContent
  });
}
