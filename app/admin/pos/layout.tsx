'use client'
// app/admin/pos/layout.tsx
import React from 'react';
import { Inter } from 'next/font/google';

// Fuente Inter
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} h-screen flex flex-col`}>
      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}