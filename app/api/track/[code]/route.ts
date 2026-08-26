import { NextRequest, NextResponse } from 'next/server';
import { rutaProtegida } from '@/lib/auth/guard';
import { getSeguimientoPublico, getSeguimientoPorCodigo, NotFoundError, BusinessError } from '@/lib/db';
import { aplicarLimite } from '@/lib/auth/rate-limit';

interface Ctx { params: Promise<{ code: string }> }

/**
 * Seguimiento público.
 *
 * Dos cambios de fondo respecto a la versión anterior:
 *
 *  1. Se devuelve sólo lo que el cliente necesita ver. Antes se propagaba el
 *     objeto completo de la orden — nombre, correo, teléfono, domicilio y hasta
 *     el historial de pagos — a cualquiera con el código.
 *
 *  2. El código legible ya no basta por sí solo. Con `?tel=` (últimos 4 dígitos)
 *     se consulta por código de orden; sin eso sólo funciona el token de
 *     seguimiento de 160 bits. Antes el código era prefijo + fecha + 5 dígitos:
 *     100,000 combinaciones por día, sin límite de peticiones.
 */
export const GET = rutaProtegida(async (request: NextRequest, ctx: Ctx) => {
  await aplicarLimite(request, 'track', 20, 300);

  const { code } = await ctx.params;
  const codigo = decodeURIComponent(code ?? '').trim();
  if (codigo.length < 4) throw new BusinessError('Código de seguimiento inválido.');

  const telefono = request.nextUrl.searchParams.get('tel')?.trim();

  const datos = telefono
    ? await getSeguimientoPorCodigo(codigo, telefono)
    : await getSeguimientoPublico(codigo);

  if (!datos) {
    // Mismo mensaje en ambos casos: distinguirlos permitiría averiguar qué
    // códigos existen probando uno por uno.
    throw new NotFoundError('No encontramos ninguna orden con esos datos.');
  }

  return NextResponse.json(
    { success: true, data: datos },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
});
