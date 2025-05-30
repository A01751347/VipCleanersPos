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
          {/* Búsqueda - visible solo en escritorio */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-[#6c7a89]" />
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="py-2 pl-10 pr-4 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm w-64"
            />
          </form>
          
          {/* Notificaciones */}
          <button className="relative p-2 text-[#6c7a89] hover:bg-[#f5f9f8] rounded-full">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#78f3d3] rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </button>
          
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