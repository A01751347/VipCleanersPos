import { NextRequest, NextResponse } from 'next/server';
import { getAllServices, getServiceById } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const onlyActive = searchParams.get('onlyActive') !== 'false';

    if (id) {
      const service = await getServiceById(parseInt(id, 10));
      if (!service) {
        return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
      }
      // 🔒 Sanitiza campos si es necesario
      return NextResponse.json({ service }, { status: 200 });
    }

    const services = await getAllServices(onlyActive);
    // 🔒 Sanitiza campos si es necesario
    return NextResponse.json({ services }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
