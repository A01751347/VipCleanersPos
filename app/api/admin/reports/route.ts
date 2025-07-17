// app/api/admin/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';
import { 
  getSalesReport, 
  getEmployeePerformanceReport, 
  getTopCustomersReport,
  getCashRegisterReport
} from '../../../../lib/database';

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
    const reportType = searchParams.get('type');
    
    if (!reportType) {
      return NextResponse.json(
        { error: 'Tipo de reporte no especificado' },
        { status: 400 }
      );
    }
    
    // Fechas por defecto (último mes)
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const startDate = searchParams.get('startDate') || oneMonthAgo.toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || today.toISOString().split('T')[0];
    
    // Generar el reporte según el tipo
    switch (reportType) {
      case 'sales':
        const groupBy = searchParams.get('groupBy') || 'day';
        const salesReport = await getSalesReport({
          startDate,
          endDate,
          groupBy: groupBy as 'day' | 'week' | 'month'
        });
        return NextResponse.json(salesReport, { status: 200 });
        
      case 'employees':
        const empleadoId = searchParams.get('empleadoId') ? parseInt(searchParams.get('empleadoId') as string, 10) : null;
        const employeeReport = await getEmployeePerformanceReport({
          startDate,
          endDate,
        });
        return NextResponse.json(employeeReport, { status: 200 });
        
      case 'customers':
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const customersReport = await getTopCustomersReport({
          startDate,
          endDate,
        });
        return NextResponse.json(customersReport, { status: 200 });
        
      case 'cashRegister':
        const fecha = searchParams.get('fecha') || today.toISOString().split('T')[0];
        const cashEmployeeId = searchParams.get('empleadoId') ? parseInt(searchParams.get('empleadoId') as string, 10) : undefined;
        const cashReport = await getCashRegisterReport(fecha, cashEmployeeId);
        return NextResponse.json(cashReport, { status: 200 });
        
      default:
        return NextResponse.json(
          { error: 'Tipo de reporte no válido' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}