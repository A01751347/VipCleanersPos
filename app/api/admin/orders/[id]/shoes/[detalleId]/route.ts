import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../../auth';
import { executeQuery } from '../../../../../../../lib/database';

export async function PUT(request: NextRequest, { params }: { params: { id: string, detalleId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ordenId = parseInt(params.id, 10);
    const detalleId = parseInt(params.detalleId, 10);
    if (Number.isNaN(ordenId) || Number.isNaN(detalleId)) {
      return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 });
    }

    const body = await request.json();
    const { marca, modelo, talla, color, descripcion } = body;

    await executeQuery({
      query: `
        UPDATE detalles_orden_servicios
        SET
          marca = ?,
          modelo = ?,
          talla = ?,
          color = ?,
          descripcion_calzado = ?
        WHERE detalle_servicio_id = ? AND orden_id = ?
      `,
      values: [
        (marca ?? '').trim() || null,
        (modelo ?? '').trim() || null,
        (talla ?? '').trim() || null,
        (color ?? '').trim() || null,
        (descripcion ?? '').trim() || null,
        detalleId, ordenId
      ]
    });

    return NextResponse.json({ success: true });
  } catch (e:any) {
    console.error('PUT shoe error', e);
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
  }
}
