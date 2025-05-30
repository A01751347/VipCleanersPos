// auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail, verifyPassword } from './lib/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await getUserByEmail(credentials.email);
          
          if (!user) {
            return null;
          }
          
          const isValid = await verifyPassword(credentials.password, user.password);
          
          if (!isValid) {
            return null;
          }
          
          return {
            id: user.usuario_id.toString(),
            name: user.nombre ? `${user.nombre} ${user.apellidos || ''}`.trim() : user.email,
            email: user.email,
            role: user.rol
          };
        } catch (error) {
          console.error('💥 Error en autorización:', error);
          return null;
        }
      }
    })
  ],
  
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  
  callbacks: {
    async jwt({ token, user }) {
      
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    
    async session({ session, token }) {
      
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      
      // Si viene de un login exitoso, redirigir al admin
      if (url.includes('/admin/login') || url === baseUrl) {
        return `${baseUrl}/admin`;
      }
      
      // Si es una URL relativa, hacerla absoluta
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Si es del mismo dominio, permitir
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Por defecto, ir al admin
      return `${baseUrl}/admin`;
    },
  },
  
  
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};