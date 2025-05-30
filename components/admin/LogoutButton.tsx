'use client'
// components/admin/LogoutButton.tsx
import React, { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  className?: string;
  iconOnly?: boolean;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className, iconOnly = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      // Esperar a que el proceso de cierre de sesión se complete
      await signOut({ 
        redirect: false,
        callbackUrl: '/admin/login'
      });
      
      // Redirigir manualmente después de cerrar sesión
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Incluso si hay error, intentamos redirigir
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`flex items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className || ''}`}
      aria-label="Cerrar sesión"
    >
      {isLoading ? (
        <Loader2 size={20} className="animate-spin mr-2" />
      ) : (
        <LogOut size={20} className={iconOnly ? '' : 'mr-2'} />
      )}
      {!iconOnly && <span>{isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>}
    </button>
  );
};

export default LogoutButton;