// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '../../../../auth';

// Crea el manejador de Next.js para las rutas de autenticación
const handler = NextAuth(authOptions);

// En Next.js App Router debemos exportar los métodos, no la configuración
export { handler as GET, handler as POST };