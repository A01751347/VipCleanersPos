// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createContactMessage } from '../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();
    
    // Validaciones básicas
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El correo electrónico no es válido' },
        { status: 400 }
      );
    }
    
    // Guardar en la base de datos
    await createContactMessage(name, email, subject || '', message);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error en el endpoint de contacto:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}