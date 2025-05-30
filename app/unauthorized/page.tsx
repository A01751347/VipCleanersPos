'use client'
// app/unauthorized/page.tsx
import React from 'react';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function UnauthorizedPage() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ 
      redirect: true,
      callbackUrl: '/admin/login'
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#f5f9f8]">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield size={40} className="text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-[#313D52] mb-4">
          Acceso No Autorizado
        </h1>
        
        <p className="text-[#6c7a89] mb-6">
          No tienes permisos para acceder a esta sección del sistema. 
          Solo los administradores pueden acceder al panel de administración.
        </p>
        
        {session?.user && (
          <div className="bg-[#f5f9f8] p-4 rounded-lg mb-6">
            <p className="text-sm text-[#6c7a89] mb-2">
              Usuario actual:
            </p>
            <p className="font-medium text-[#313D52]">
              {session.user.name || session.user.email}
            </p>
            <p className="text-xs text-[#6c7a89]">
              Rol: {session.user.role || 'Sin rol asignado'}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          {session ? (
            <>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors font-medium"
              >
                <ArrowLeft size={18} className="mr-2" />
                Cerrar Sesión
              </button>
              
              <Link 
                href="/"
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-[#e0e6e5] text-[#6c7a89] rounded-lg hover:bg-[#f5f9f8] transition-colors"
              >
                <Home size={18} className="mr-2" />
                Ir al Inicio
              </Link>
            </>
          ) : (
            <Link 
              href="/admin/login"
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors font-medium"
            >
              <ArrowLeft size={18} className="mr-2" />
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-[#6c7a89]">
        <p>
          Si crees que esto es un error, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}