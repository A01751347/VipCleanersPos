// app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';
import { 
  registerPayment, 
  getOrderPayments, 
  getPaymentsSummary 
} from '../../../../lib/db';

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
    
    // Caso: Obtener pagos de una orden específica
    const ordenId = searchParams.get('ordenId');
    if (ordenId) {
      const payments = await getOrderPayments(parseInt(ordenId, 10));
      return NextResponse.json({ payments }, { status: 200 });
    }
    
    // Caso: Obtener resumen de pagos (para arqueo de caja)
    if (searchParams.get('summary') === 'true') {
      const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
      const empleadoId = searchParams.get('empleadoId') 
  ? parseInt(searchParams.get('empleadoId') as string, 10) 
  : null;
      const summary = await getPaymentsSummary(fecha, empleadoId);
      return NextResponse.json(summary, { status: 200 });
    }
    
    return NextResponse.json(
      { error: 'Parámetros de búsqueda no válidos' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

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
    
    const data = await request.json();
    
    // Validar datos básicos
    if (!data.ordenId || !data.monto || !data.metodo) {
      return NextResponse.json(
        { error: 'Orden, monto y método de pago son obligatorios' },
        { status: 400 }
      );
    }
    
    // Validar que el monto sea mayor a 0
    if (parseFloat(data.monto) <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      );
    }
    
    if (!session.user.id) {
  return NextResponse.json(
    { error: 'ID de usuario no válido' },
    { status: 400 }
  );
}
const empleadoId = parseInt(session.user.id, 10);
    const result = await registerPayment({
      ordenId: parseInt(data.ordenId, 10),
      monto: parseFloat(data.monto),
      metodo: data.metodo,
      referencia: data.referencia ?? null,
      terminalId: data.terminalId ?? null,
      empleadoId
    });
    
    return NextResponse.json({
      success: true,
      pagoId: result.pagoId
    }, { status: 201 });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}