import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, rutaProtegida } from '@/lib/auth/guard';
import { getClientes } from '@/lib/db';
import { aCsv } from '@/lib/csv';

/**
 * Exportación de clientes. El botón del panel apuntaba aquí y daba 404.
 * Restringida a administradores: es la base de datos completa de clientes.
 */
export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireAdmin();
  const { clientes } = await getClientes({
    busqueda: request.nextUrl.searchParams.get('search'),
    porPagina: 10_000,
  });

  const csv = aCsv(clientes as Record<string, unknown>[], [
    ['cliente_id', 'ID'],
    ['nombre', 'Nombre'],
    ['apellidos', 'Apellidos'],
    ['telefono', 'Teléfono'],
    ['email', 'Correo'],
    ['total_ordenes', 'Órdenes'],
    ['total_gastado', 'Total gastado'],
    ['ultima_orden', 'Última orden'],
    ['fecha_creacion', 'Alta'],
  ]);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clientes_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});
