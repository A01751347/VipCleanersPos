import { NextRequest, NextResponse } from 'next/server';
import { requireActor, rutaProtegida } from '@/lib/auth/guard';
import { getClientes, crearOEncontrarCliente, actualizarCliente, BusinessError } from '@/lib/db';

export const GET = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const sp = request.nextUrl.searchParams;
  const resultado = await getClientes({
    busqueda: sp.get('search') ?? sp.get('query'),
    pagina: parseInt(sp.get('page') ?? '1', 10),
    porPagina: parseInt(sp.get('pageSize') ?? '20', 10),
  });
  return NextResponse.json({ success: true, ...resultado });
});

export const POST = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const body = await request.json();
  const clienteId = await crearOEncontrarCliente({
    nombre: body?.nombre,
    apellidos: body?.apellidos,
    telefono: body?.telefono,
    email: body?.email,
    direccion: body?.direccion,
    codigoPostal: body?.codigo_postal,
    ciudad: body?.ciudad,
    estado: body?.estado,
    rfc: body?.rfc,
    razonSocial: body?.razon_social,
    regimenFiscal: body?.regimen_fiscal,
    usoCfdi: body?.uso_cfdi,
    cpFiscal: body?.cp_fiscal,
  });
  const { getClientePorId } = await import('@/lib/db');
  return NextResponse.json(
    { success: true, cliente_id: clienteId, cliente: await getClientePorId(clienteId) },
    { status: 201 }
  );
});

export const PUT = rutaProtegida(async (request: NextRequest) => {
  await requireActor();
  const body = await request.json();
  const clienteId = parseInt(String(body?.cliente_id ?? ''), 10);
  if (!Number.isInteger(clienteId)) throw new BusinessError('Id de cliente inválido.');
  const cliente = await actualizarCliente(clienteId, {
    nombre: body?.nombre, apellidos: body?.apellidos, telefono: body?.telefono,
    email: body?.email, direccion: body?.direccion, codigoPostal: body?.codigo_postal,
    ciudad: body?.ciudad, estado: body?.estado, rfc: body?.rfc,
    razonSocial: body?.razon_social, regimenFiscal: body?.regimen_fiscal,
    usoCfdi: body?.uso_cfdi, cpFiscal: body?.cp_fiscal, notas: body?.notas,
  });
  return NextResponse.json({ success: true, cliente });
});
