/**
 * Simple Admin Dashboard Page
 * File: app/admin/page.tsx
 * 
 * Página principal del panel de administración
 */

'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { Shield, LogOut, User } from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('🏠 Admin Dashboard - Status:', status);
    console.log('🏠 Admin Dashboard - Session:', session);
    console.log('🏠 Admin Dashboard - Página cargada correctamente');
  }, [session, status]);

  // Mostrar loading mientras se verifica la sesión
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f9f8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#78f3d3] mx-auto"></div>
          <p className="mt-4 text-[#313D52]">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado (no debería pasar por el middleware)
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f9f8]">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Autenticación</h1>
          <p className="text-[#6c7a89] mb-4">
            No estás autenticado. Esto es un error del middleware.
          </p>
          <a
            href="/admin/login"
            className="inline-block px-6 py-3 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0]"
          >
            Ir al Login
          </a>
        </div>
      </div>
    );
  }

  // Verificar que el usuario sea admin
  if (session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f9f8]">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-[#6c7a89] mb-4">
            No tienes permisos de administrador.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="px-6 py-3 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0]"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Panel de administración principal
  return (
    <div className="min-h-screen bg-[#f5f9f8]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-[#e0e6e5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-[#78f3d3] mr-3" />
              <h1 className="text-xl font-bold text-[#313D52]">
                Vip<span className="text-[#78f3d3]">Cleaners</span> Admin
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-[#6c7a89]">
                <User className="w-4 h-4 mr-2" />
                {session.user.name || session.user.email}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="flex items-center px-4 py-2 text-sm text-[#6c7a89] hover:text-[#313D52] hover:bg-[#f5f9f8] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#e0f7f0] rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-[#78f3d3]" />
            </div>
            
            <h2 className="text-3xl font-bold text-[#313D52] mb-4">
              ¡Bienvenido al Panel de Administración!
            </h2>
            
            <p className="text-[#6c7a89] text-lg mb-6">
              Has accedido exitosamente como administrador.
            </p>

            {/* Success Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✅ Autenticación exitosa
            </div>
          </div>
        </div>

        {/* Session Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#313D52] mb-4">
            Información de la Sesión
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#f5f9f8] p-4 rounded-lg">
              <p className="text-sm text-[#6c7a89] mb-1">Usuario</p>
              <p className="font-medium text-[#313D52]">{session.user.name || 'Sin nombre'}</p>
            </div>
            
            <div className="bg-[#f5f9f8] p-4 rounded-lg">
              <p className="text-sm text-[#6c7a89] mb-1">Email</p>
              <p className="font-medium text-[#313D52]">{session.user.email}</p>
            </div>
            
            <div className="bg-[#f5f9f8] p-4 rounded-lg">
              <p className="text-sm text-[#6c7a89] mb-1">Rol</p>
              <p className="font-medium text-[#313D52]">{session.user.role}</p>
            </div>
            
            <div className="bg-[#f5f9f8] p-4 rounded-lg">
              <p className="text-sm text-[#6c7a89] mb-1">ID de Usuario</p>
              <p className="font-medium text-[#313D52]">{session.user.id}</p>
            </div>
          </div>
        </div>

        {/* Placeholder for future admin features */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#313D52] mb-4">
            Funciones de Administración
          </h3>
          <p className="text-[#6c7a89]">
            Aquí irán las funciones administrativas del sistema...
          </p>
        </div>
      </main>
    </div>
  );
}