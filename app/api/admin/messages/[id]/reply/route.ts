// app/api/admin/messages/[id]/reply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../auth';
import { getMessageById, saveMessageReply } from '../../../../../../lib/db';
import { sendMessageReplyEmail } from '../../../../../../lib/email';

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
    const messageId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(messageId)) {
      return NextResponse.json(
        { error: 'ID de mensaje inválido' },
        { status: 400 }
      );
    }
    
    // Obtener el mensaje original
    const originalMessage = await getMessageById(messageId);
    
    if (!originalMessage) {
      return NextResponse.json(
        { error: 'Mensaje original no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener datos de la respuesta
    const body = await request.json();
    const { 
      replyMessage,
      includeOriginalMessage = true,
      markAsRead = true,
      saveInDatabase = true
    } = body;
    
    if (!replyMessage || replyMessage.trim() === '') {
      return NextResponse.json(
        { error: 'El mensaje de respuesta es requerido' },
        { status: 400 }
      );
    }
    
    console.log('Procesando respuesta a mensaje:', {
      messageId,
      recipientEmail: originalMessage.email,
      originalSubject: originalMessage.subject
    });
    
    // Obtener información del empleado que responde
    const employeeId = 1;
    
    // Guardar la respuesta en la base de datos si se solicita
    let replyId = null;
    if (saveInDatabase) {
      try {
        replyId = await saveMessageReply({
          originalMessageId: messageId,
          employeeId,
          replyMessage: replyMessage.trim(),
          sentByEmail: true
        });
      } catch (dbError) {
        console.error('Error guardando respuesta en DB:', dbError);
        // Continuar con el envío aunque falle el guardado
      }
    }
    
    // Enviar email de respuesta
    const emailResult = await sendMessageReplyEmail({
      originalMessage,
      replyMessage: replyMessage.trim(),
      includeOriginalMessage,
      employeeName: session.user.name || 'Equipo de Soporte',
      replyId
    });
    
    if (!emailResult.success) {
      console.error('Error enviando email de respuesta:', emailResult.error);
      return NextResponse.json(
        { error: emailResult.error || 'Error al enviar la respuesta por email' },
        { status: 500 }
      );
    }
    
    // Marcar mensaje original como leído si se solicita
    if (markAsRead && !originalMessage.is_read) {
      try {
        const { updateMessageReadStatus } = await import('../../../../../../lib/db');
        await updateMessageReadStatus(messageId, true);
      } catch (updateError) {
        console.error('Error marcando mensaje como leído:', updateError);
        // No fallar por esto
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Respuesta enviada exitosamente a ${originalMessage.email}`,
      replyId,
      emailId: emailResult.emailId
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error en API de respuesta a mensajes:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}