'use client'
// components/admin/AdminHeader.tsx
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, User, Search } from 'lucide-react';
import { useSession } from 'next-auth/react';

const AdminHeader = () => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session } = useSession();
  
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname?.startsWith('/admin/bookings')) return 'Reservaciones';
    if (pathname?.startsWith('/admin/messages')) return 'Mensajes de Contacto';
    if (pathname?.startsWith('/admin/users')) return 'Usuarios';
    if (pathname?.startsWith('/admin/settings')) return 'Configuración';
    return 'Panel de Administración';
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar lógica de búsqueda
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="bg-white border-b border-[#e0e6e5] sticky top-0 z-10">
      <div className="flex justify-between items-center px-4 py-3">
        <h1 className="text-lg md:text-xl font-semibold text-[#313D52] md:pl-2">
          {getPageTitle()}
        </h1>
        
        <div className="flex items-center space-x-4">
          
          {/* Perfil de usuario */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#313D52] text-white flex items-center justify-center mr-2">
              <User size={16} />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-[#313D52]">
                {session?.user?.name || 'Admin'}
              </div>
              <div className="text-xs text-[#6c7a89]">
                {session?.user?.email || 'admin@kickclean.com'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;