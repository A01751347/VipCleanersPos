// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Obtener el token de la sesión actual
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = req.nextUrl;

  // Solo proteger rutas que empiezan con /admin pero NO la de login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // Si no hay token, redirigir al login
    if (!token) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Permitir la navegación normalmente
  return NextResponse.next();
}

// Configurar para que se ejecute solo en las rutas necesarias
export const config = {
  matcher: ['/admin/:path*'], // Aplica a todas las rutas bajo /admin
};
