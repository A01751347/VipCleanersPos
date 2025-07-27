// lib/email.ts
import * as nodemailer from 'nodemailer';
import { getBusinessConfig } from './database';

// Configuración del transportador de email
const createTransporter = () => {
  // Configuración para diferentes proveedores
  const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
  switch (emailProvider) {
    case 'smtp.gmail.com':
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD, // Usar contraseña de aplicación
        },
      });
    
    case 'sendgrid':
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    
    case 'mailgun':
      return nodemailer.createTransport({
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAILGUN_SMTP_USER,
          pass: process.env.MAILGUN_SMTP_PASSWORD,
        },
      });
    
    default:
      // Configuración SMTP genérica
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
  }
};

// Función para formatear moneda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

// Función para formatear fecha
const formatDate = (dateString: string): string => {
  if (!dateString) return 'No especificada';
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Template HTML para el ticket de la orden
const generateTicketHTML = (order: any, businessConfig: any, customMessage?: string) => {
  const serviciosList = order.servicios?.map((servicio: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${servicio.servicio_nombre}</strong>
        ${servicio.marca && servicio.modelo ? `<br><small style="color: #666;">${servicio.marca} ${servicio.modelo}</small>` : ''}
        ${servicio.descripcion_calzado ? `<br><small style="color: #666;">${servicio.descripcion_calzado}</small>` : ''}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${servicio.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(servicio.precio_unitario)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formatCurrency(servicio.subtotal)}</td>
    </tr>
  `).join('') || '';

  const productosList = order.productos?.map((producto: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${producto.producto_nombre}</strong>
        ${producto.descripcion ? `<br><small style="color: #666;">${producto.descripcion}</small>` : ''}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${producto.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(producto.precio_unitario)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formatCurrency(producto.subtotal)}</td>
    </tr>
  `).join('') || '';

  const colorMap: Record<string, string> = {
    'recibido': '#fbbf24',
    'en_proceso': '#3b82f6',
    'listo': '#10b981',
    'entregado': '#059669',
    'cancelado': '#ef4444'
  };
  const estadoColor = colorMap[order.color_estado?.toLowerCase() as string] || '#6b7280';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket de Servicio - ${order.codigo_orden}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .ticket-container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #78f3d3, #4de0c0);
          color: #313D52;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 16px;
          opacity: 0.8;
        }
        .content {
          padding: 30px;
        }
        .info-section {
          margin-bottom: 25px;
        }
        .info-section h3 {
          color: #313D52;
          border-bottom: 2px solid #78f3d3;
          padding-bottom: 8px;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .info-item {
          padding: 10px;
          background: #f8f9fa;
          border-radius: 5px;
        }
        .info-item strong {
          color: #313D52;
          display: block;
          margin-bottom: 5px;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
          background-color: ${estadoColor};
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .items-table th {
          background: #313D52;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
        }
        .items-table td {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        .totals-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        .total-row.final {
          border-top: 2px solid #313D52;
          padding-top: 10px;
          margin-top: 10px;
          font-size: 18px;
          font-weight: bold;
          color: #313D52;
        }
        .custom-message {
          background: #e0f7f0;
          border-left: 4px solid #78f3d3;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          background: #313D52;
          color: white;
          padding: 20px 30px;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
        }
        .contact-info {
          margin-top: 15px;
          font-size: 14px;
          opacity: 0.9;
        }
        @media (max-width: 600px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
          .items-table {
            font-size: 14px;
          }
          .items-table th,
          .items-table td {
            padding: 6px 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <!-- Header -->
        <div class="header">
          <h1>${businessConfig.nombre_empresa || 'VipCleaners'}</h1>
          <p>Ticket de Servicio</p>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Información del Ticket -->
          <div class="info-section">
            <h3>Información del Ticket</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Código de Orden:</strong>
                ${order.codigo_orden}
              </div>
              <div class="info-item">
                <strong>Estado:</strong>
                <span class="status-badge">${order.estado_servicio}</span>
              </div>
              <div class="info-item">
                <strong>Fecha de Recepción:</strong>
                ${formatDate(order.fecha_recepcion)}
              </div>
              <div class="info-item">
                <strong>Fecha de Entrega Estimada:</strong>
                ${formatDate(order.fecha_entrega_estimada)}
              </div>
            </div>
          </div>

          <!-- Información del Cliente -->
          <div class="info-section">
            <h3>Información del Cliente</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Nombre:</strong>
                ${order.cliente_nombre} ${order.cliente_apellidos || ''}
              </div>
              <div class="info-item">
                <strong>Teléfono:</strong>
                ${order.cliente_telefono}
              </div>
              <div class="info-item">
                <strong>Email:</strong>
                ${order.cliente_email}
              </div>
              ${order.cliente_direccion ? `
              <div class="info-item">
                <strong>Dirección:</strong>
                ${order.cliente_direccion}
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Servicios -->
          ${serviciosList ? `
          <div class="info-section">
            <h3>Servicios Solicitados</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th style="text-align: center; width: 80px;">Cant.</th>
                  <th style="text-align: right; width: 100px;">Precio Unit.</th>
                  <th style="text-align: right; width: 100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${serviciosList}
              </tbody>
            </table>
          </div>
          ` : ''}

          <!-- Productos -->
          ${productosList ? `
          <div class="info-section">
            <h3>Productos Adquiridos</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align: center; width: 80px;">Cant.</th>
                  <th style="text-align: right; width: 100px;">Precio Unit.</th>
                  <th style="text-align: right; width: 100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${productosList}
              </tbody>
            </table>
          </div>
          ` : ''}

          <!-- Mensaje Personalizado -->
          ${customMessage ? `
          <div class="custom-message">
            <strong>Mensaje de la empresa:</strong><br>
            ${customMessage}
          </div>
          ` : ''}

          <!-- Totales -->
          <div class="totals-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(order.subtotal)}</span>
            </div>
            <div class="total-row">
              <span>IVA (16%):</span>
              <span>${formatCurrency(order.impuestos)}</span>
            </div>
            ${order.descuento > 0 ? `
            <div class="total-row">
              <span>Descuento:</span>
              <span>-${formatCurrency(order.descuento)}</span>
            </div>
            ` : ''}
            <div class="total-row final">
              <span>Total:</span>
              <span>${formatCurrency(order.total)}</span>
            </div>
          </div>

          <!-- Notas -->
          ${order.notas ? `
          <div class="info-section">
            <h3>Notas Adicionales</h3>
            <div class="info-item">
              ${order.notas}
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>¡Gracias por confiar en nosotros!</strong></p>
          <div class="contact-info">
            ${businessConfig.telefono_contacto ? `<p>📞 ${businessConfig.telefono_contacto}</p>` : ''}
            ${businessConfig.email_contacto ? `<p>✉️ ${businessConfig.email_contacto}</p>` : ''}
            ${businessConfig.direccion_empresa ? `<p>📍 ${businessConfig.direccion_empresa}</p>` : ''}
            ${businessConfig.website_empresa ? `<p>🌐 ${businessConfig.website_empresa}</p>` : ''}
          </div>
          <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
            Este es un documento generado automáticamente. Por favor conserve este ticket para cualquier consulta.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Función principal para enviar el ticket por email
export async function sendOrderTicketEmail({
  order,
  includeImages = false,
  customMessage = null,
  sendCopy = false,
  copyEmail = null
}: {
  order: any;
  includeImages?: boolean;
  customMessage?: string | null;
  sendCopy?: boolean;
  copyEmail?: string | null;
}) {
  try {
    // Obtener configuración del negocio
    const businessConfig = await getBusinessConfig();
    
    // Crear transportador de email
    const transporter = createTransporter();
    
    // Generar el HTML del ticket
    const ticketHTML = generateTicketHTML(order, businessConfig, customMessage || undefined);
    
    // Configurar las opciones del email
    const mailOptions: {
      from: { name: string; address: string };
      to: any;
      subject: string;
      html: string;
      text: string;
      attachments: any[];
      cc?: string;
    } = {
      from: {
        name: businessConfig.nombre_empresa || 'VipCleaners',
        address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@vipcleaner.com'
      },
      to: order.cliente_email,
      subject: `Ticket de Servicio - ${order.codigo_orden}`,
      html: ticketHTML,
      text: `
        Ticket de Servicio
        Código de Orden: ${order.codigo_orden}
        Cliente: ${order.cliente_nombre} ${order.cliente_apellidos || ''}
        Estado: ${order.estado_servicio}
        
        
        Fecha de Recepción: ${formatDate(order.fecha_recepcion)}
        Fecha de Entrega Estimada: ${formatDate(order.fecha_entrega_estimada)}
        
        Total: ${formatCurrency(order.total)}
        
        ${customMessage ? `\nMensaje: ${customMessage}` : ''}
        
        Gracias por confiar en ${businessConfig.nombre_empresa || 'VipCleaners'}
      `,
      attachments: [] as any[]
    };
    
    // Agregar copia si se solicita
    if (sendCopy && copyEmail) {
      mailOptions.cc = copyEmail;
    }
    
    console.log('Enviando email a:', order.cliente_email);
    console.log('Asunto:', mailOptions.subject);
    
    // Enviar el email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email enviado exitosamente:', result.messageId);
    
    return {
      success: true,
      emailId: result.messageId,
      message: `Ticket enviado exitosamente a ${order.cliente_email}`
    };
    
  } catch (error) {
    console.error('Error enviando ticket por email:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar email'
    };
  }
}

// Función para enviar email de notificación de cambio de estado
export async function sendOrderStatusUpdateEmail(order: any, newStatusName: string, comments?: string) {
  try {
    const businessConfig = await getBusinessConfig();
    const transporter = createTransporter();
    
    const statusColors = {
      'recibido': '#fbbf24',
      'en_proceso': '#3b82f6', 
      'listo': '#10b981',
      'entregado': '#059669',
      'cancelado': '#ef4444'
    };
    
    const statusColor = statusColors[newStatusName?.toLowerCase() as keyof typeof statusColors] || '#6b7280';
    
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualización de Estado - ${order.codigo_orden}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #78f3d3, #4de0c0); color: #313D52; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .status-badge { padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; background-color: ${statusColor}; }
          .info-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${businessConfig.nombre_empresa || 'VipCleaners'}</h1>
            <p>Actualización de Estado</p>
          </div>
          <div class="content">
            <h2>¡Hola ${order.cliente_nombre}!</h2>
            <p>Tu orden <strong>${order.codigo_orden}</strong> ha sido actualizada.</p>
            
            <div class="info-box">
              <p><strong>Nuevo Estado:</strong> <span class="status-badge">${newStatusName}</span></p>
              ${comments ? `<p><strong>Comentarios:</strong> ${comments}</p>` : ''}
            </div>
            
            <p>Puedes consultar el estado completo de tu orden en cualquier momento.</p>
            
            <p>¡Gracias por confiar en nosotros!</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const mailOptions = {
      from: {
        name: businessConfig.nombre_empresa || 'VipCleaners',
        address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@vipcleaner.com'
      },
      to: order.cliente_email,
      subject: `Actualización de Estado - ${order.codigo_orden}`,
      html,
      text: `
        Tu orden ${order.codigo_orden} ha sido actualizada.
        Nuevo Estado: ${newStatusName}
        ${comments ? `Comentarios: ${comments}` : ''}
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      emailId: result.messageId
    };
    
  } catch (error) {
    console.error('Error enviando notificación de estado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export async function sendMessageReplyEmail({
  originalMessage,
  replyMessage,
  includeOriginalMessage = true,
  employeeName = 'Equipo de Soporte',
  replyId = null
}: {
  originalMessage: any;
  replyMessage: string;
  includeOriginalMessage?: boolean;
  employeeName?: string;
  replyId?: number | null;
}) {
  try {
    // Obtener configuración del negocio
    const businessConfig = await getBusinessConfig();
    
    // Crear transportador de email
    const transporter = createTransporter();
    
    // 🔥 CORRECCIÓN 1: Usar el mismo formato de email FROM que en sendOrderTicketEmail
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@vipcleaner.com';
    const fromName = businessConfig.nombre_empresa || 'VipCleaners';
    
    // 🔥 CORRECCIÓN 2: Validar que tenemos un email FROM válido
    if (!fromEmail || !fromEmail.includes('@')) {
      throw new Error('Email FROM no configurado correctamente en variables de entorno');
    }
    
    // Generar el HTML de la respuesta
    const replyHTML = generateReplyHTML(
      originalMessage, 
      replyMessage, 
      includeOriginalMessage, 
      businessConfig, 
      employeeName
    );
    
    // Generar el texto plano de la respuesta
    const replyText = generateReplyText(
      originalMessage, 
      replyMessage, 
      includeOriginalMessage, 
      employeeName,
      businessConfig
    );

    console.log('📧 Configuración de email para respuesta:', {
      from: fromEmail,
      fromName: fromName,
      to: originalMessage.email,
      subject: `Re: ${originalMessage.subject}`
    });
    
    // 🔥 CORRECCIÓN 3: Usar el mismo formato FROM que funciona en sendOrderTicketEmail
    const mailOptions = {
      from: {
        name: fromName,
        address: fromEmail
      },
      to: originalMessage.email,
      subject: `Re: ${originalMessage.subject}`,
      html: replyHTML,
      text: replyText,
      // 🔥 CORRECCIÓN 4: Simplificar headers - quitar headers que pueden causar problemas
      replyTo: fromEmail
    };
    
    console.log('📤 Enviando respuesta por email a:', originalMessage.email);
    console.log('📋 Asunto:', mailOptions.subject);
    
    // Enviar el email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Respuesta enviada exitosamente:', result.messageId);
    
    return {
      success: true,
      emailId: result.messageId,
      message: `Respuesta enviada exitosamente a ${originalMessage.email}`
    };
    
  } catch (error) {
    console.error('❌ Error enviando respuesta por email:', error);
    
    let errorMessage = 'Error desconocido al enviar respuesta';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Errores específicos de SMTP
      if (errorMessage.includes('Invalid login') || errorMessage.includes('authentication')) {
        errorMessage = 'Credenciales de email incorrectas. Verifica GMAIL_USER y GMAIL_APP_PASSWORD';
      } else if (errorMessage.includes('Invalid') && errorMessage.includes('address')) {
        errorMessage = 'Email FROM inválido. Verifica SMTP_FROM_EMAIL en las variables de entorno';
      } else if (errorMessage.includes('connection')) {
        errorMessage = 'Error de conexión con el servidor SMTP';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Timeout al conectar con el servidor SMTP';
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}



// Función para generar HTML de la respuesta
function generateReplyHTML(
  originalMessage: any, 
  replyMessage: string, 
  includeOriginalMessage: boolean, 
  businessConfig: any, 
  employeeName: string
): string {
  const formattedDate = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const originalDate = new Date(originalMessage.created_at).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Respuesta a tu mensaje - ${businessConfig.nombre_empresa || 'VipCleaners'}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .email-container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #78f3d3, #4de0c0);
          color: #313D52;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 16px;
          opacity: 0.8;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 18px;
          color: #313D52;
          margin-bottom: 20px;
        }
        .reply-message {
          background: #f8f9fa;
          border-left: 4px solid #78f3d3;
          padding: 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .reply-message p {
          margin: 0;
          white-space: pre-wrap;
          line-height: 1.7;
        }
        .original-message {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e6e5;
        }
        .original-message h3 {
          color: #6c7a89;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
        }
        .original-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
          font-size: 14px;
          color: #6c7a89;
        }
        .original-content {
          background: #f1f3f4;
          padding: 15px;
          border-radius: 8px;
          font-style: italic;
          color: #313D52;
        }
        .signature {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e6e5;
        }
        .signature-name {
          font-weight: bold;
          color: #313D52;
        }
        .signature-company {
          color: #6c7a89;
          font-size: 14px;
        }
        .footer {
          background: #313D52;
          color: white;
          padding: 20px 30px;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
          font-size: 14px;
        }
        .contact-info {
          margin-top: 15px;
          font-size: 13px;
          opacity: 0.9;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .content {
            padding: 20px;
          }
          .header {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <h1>${businessConfig.nombre_empresa || 'VipCleaners'}</h1>
          <p>Respuesta a tu mensaje</p>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">
            Hola ${originalMessage.name},
          </div>

          <p>Gracias por contactarnos. Hemos recibido tu mensaje y queremos responderte:</p>

          <!-- Reply Message -->
          <div class="reply-message">
            <p>${replyMessage.replace(/\n/g, '<br>')}</p>
          </div>

          ${includeOriginalMessage ? `
          <!-- Original Message -->
          <div class="original-message">
            <h3>Tu mensaje original:</h3>
            
            <div class="original-info">
              <strong>De:</strong> ${originalMessage.name} &lt;${originalMessage.email}&gt;<br>
              <strong>Asunto:</strong> ${originalMessage.subject}<br>
              <strong>Fecha:</strong> ${originalDate}
            </div>
            
            <div class="original-content">
              ${originalMessage.message.replace(/\n/g, '<br>')}
            </div>
          </div>
          ` : ''}

          <!-- Signature -->
          <div class="signature">
            <div class="signature-name">${employeeName}</div>
            <div class="signature-company">${businessConfig.nombre_empresa || 'VipCleaners'}</div>
          </div>

          <p style="margin-top: 20px; color: #6c7a89; font-size: 14px;">
            Si tienes más preguntas, no dudes en responder a este email o contactarnos directamente.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>¡Gracias por contactarnos!</strong></p>
          <div class="contact-info">
            ${businessConfig.telefono_contacto ? `<p>📞 ${businessConfig.telefono_contacto}</p>` : ''}
            ${businessConfig.email_contacto ? `<p>✉️ ${businessConfig.email_contacto}</p>` : ''}
            ${businessConfig.direccion_empresa ? `<p>📍 ${businessConfig.direccion_empresa}</p>` : ''}
            ${businessConfig.website_empresa ? `<p>🌐 ${businessConfig.website_empresa}</p>` : ''}
          </div>
          <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
            Este email es una respuesta a tu mensaje de contacto del ${originalDate}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Función para generar texto plano de la respuesta
function generateReplyText(
  originalMessage: any, 
  replyMessage: string, 
  includeOriginalMessage: boolean, 
  employeeName: string,
  businessConfig: any // ✅ Agregar este parámetro
): string {
  const formattedDate = new Date().toLocaleDateString('es-MX');
  const originalDate = new Date(originalMessage.created_at).toLocaleDateString('es-MX');

  let textContent = `
Hola ${originalMessage.name},

Gracias por contactarnos. Hemos recibido tu mensaje y queremos responderte:

${replyMessage}

`;

  if (includeOriginalMessage) {
    textContent += `

--- Tu mensaje original ---
De: ${originalMessage.name} <${originalMessage.email}>
Asunto: ${originalMessage.subject}
Fecha: ${originalDate}

${originalMessage.message}

`;
  }

  // FALTA esto 👇👇
  return textContent;
}