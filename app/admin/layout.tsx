// app/admin/layout.tsx
'use client'; // Añade esta línea si no estaba ya

import React from 'react';
import { Inter } from 'next/font/google';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { usePathname } from 'next/navigation'; // Importa el hook

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  return (
    <div className={`${inter.variable} bg-[#f5f9f8] min-h-screen flex flex-col md:flex-row`}>
      {/* Sidebar y Header solo si no estamos en la página de login */}
      {!isLoginPage && <AdminSidebar />}
      
      <div className="flex-1 flex flex-col">
        {!isLoginPage && <AdminHeader />}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
