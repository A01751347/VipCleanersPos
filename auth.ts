// auth.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {
  getUsuarioPorEmail,
  verificarPassword,
  estaBloqueado,
  registrarIntentoFallido,
  registrarAccesoExitoso,
} from './lib/db/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const usuario = await getUsuarioPorEmail(credentials.email);
        // Mensaje idéntico en todos los fallos: distinguirlos revelaría qué
        // correos existen en el sistema.
        if (!usuario) return null;

        if (estaBloqueado(usuario)) {
          throw new Error('Cuenta bloqueada temporalmente por intentos fallidos.');
        }

        const valida = await verificarPassword(credentials.password, usuario.password);
        if (!valida) {
          await registrarIntentoFallido(usuario.usuario_id);
          return null;
        }

        // Sólo el personal entra al panel. El rol `cliente` existe para el
        // portal público; antes podía cargar las páginas de /admin.
        if (usuario.rol !== 'admin' && usuario.rol !== 'empleado') return null;

        await registrarAccesoExitoso(usuario.usuario_id);

        return {
          id: String(usuario.usuario_id),
          email: usuario.email,
          name:
            [usuario.nombre, usuario.apellidos].filter(Boolean).join(' ').trim() ||
            usuario.email,
          role: usuario.rol,
          // Se resuelve una sola vez al iniciar sesión y viaja en el token, en
          // lugar de consultarse (o adivinarse) en cada petición.
          empleadoId: usuario.empleado_id ?? null,
        };
      },
    }),
  ],

  pages: { signIn: '/admin/login', error: '/admin/login' },

  session: {
    strategy: 'jwt',
    // Un turno, no un mes. Una tablet de mostrador ya no queda abierta 30 días.
    maxAge: 12 * 60 * 60,
    updateAge: 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
        token.empleadoId = (user as { empleadoId?: number | null }).empleadoId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.empleadoId = (token.empleadoId as number | null) ?? null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/admin`;
    },
  },

  debug: false,
  secret: process.env.NEXTAUTH_SECRET,
};
