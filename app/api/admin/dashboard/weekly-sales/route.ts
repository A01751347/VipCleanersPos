import { NextRequest, NextResponse } from 'next/server';
import { getWeeklySalesData } from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const data = await getWeeklySalesData();
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching weekly sales data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de ventas semanales' },
      { status: 500 }
    );
  }
}