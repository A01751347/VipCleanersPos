/**
 * Minimal Root Layout
 * File: app/layout.tsx (usa esto si no tienes un layout principal)
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth'; // Ajusta la ruta según donde tengas tu auth.ts
import SessionProvider from '../components/SessionProvider';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Obtener la sesión en el servidor
  const session = await getServerSession(authOptions);
  
  console.log('🏠 Root Layout - Server session:', !!session, session?.user?.role);

  return (
    <html lang="es">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}