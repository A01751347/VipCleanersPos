// app/api/admin/orders/[id]/send-ticket/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../auth';
import { getOrderById } from '../../../../../../lib/db';
import { sendOrderTicketEmail } from '../../../../../../lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Await params para Next.js 15
    const resolvedParams = await params;
    const ordenId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(ordenId)) {
      return NextResponse.json(
        { error: 'ID de orden inválido' },
        { status: 400 }
      );
    }
    
    // Obtener los detalles completos de la orden
    const order = await getOrderById(ordenId);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar que el cliente tenga email
    if (!order.cliente_email || order.cliente_email.trim() === '') {
      return NextResponse.json(
        { error: 'El cliente no tiene un email registrado' },
        { status: 400 }
      );
    }
    
    // Obtener datos adicionales del cuerpo de la petición
    const body = await request.json();
    const { 
      includeImages = false, 
      customMessage = null,
      sendCopy = false,
      copyEmail = null 
    } = body;
    
    console.log('Enviando ticket por email:', {
      ordenId,
      clienteEmail: order.cliente_email,
      codigoOrden: order.codigo_orden
    });
    
    // Enviar el email con el ticket
    const emailResult = await sendOrderTicketEmail({
      order,
      includeImages,
      customMessage,
      sendCopy,
      copyEmail
    });
    
    if (!emailResult.success) {
      console.error('Error enviando email:', emailResult.error);
      return NextResponse.json(
        { error: emailResult.error || 'Error al enviar el email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Ticket enviado exitosamente a ${order.cliente_email}`,
      emailId: emailResult.emailId
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error en API de envío de tickets:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}