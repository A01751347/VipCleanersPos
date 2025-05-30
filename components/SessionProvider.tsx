/**
 * Session Provider Component
 * File: components/SessionProvider.tsx
 * 
 * Cliente component que envuelve la aplicación con NextAuth SessionProvider
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

interface SessionProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}