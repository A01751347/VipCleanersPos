import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLES_PANEL = new Set(['admin', 'empleado']);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin/login') return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const esApi = pathname.startsWith('/api/admin');

  if (!token) {
    // Las rutas de API responden 401; las páginas redirigen al login.
    if (esApi) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const login = new URL('/admin/login', req.url);
    login.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(login);
  }

  // Antes sólo se comprobaba que existiera token: un usuario con rol `cliente`
  // podía cargar todas las páginas del panel.
  if (!ROLES_PANEL.has(String(token.role))) {
    if (esApi) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Se agregó /api/admin: el matcher anterior sólo cubría las páginas, así que
  // cada ruta de API tenía que acordarse de protegerse sola — y cuatro no lo hacían.
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
