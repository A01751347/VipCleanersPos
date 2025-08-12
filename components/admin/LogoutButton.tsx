'use client'
import React, { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  className?: string;
  iconOnly?: boolean;
  collapsed?: boolean;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className = '', iconOnly = false, collapsed = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut({ redirect: false, callbackUrl: '/admin/login' });
      router.push('/admin/login');
      // router.refresh(); // usually not needed after push to a different route
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-label="Cerrar sesión"
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#6c7a89] transition-colors hover:bg-zinc-100 hover:text-[#313D52] ${className}`}
      title={collapsed ? 'Cerrar sesión' : undefined}
    >
      {isLoading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <LogOut size={20} className={iconOnly || collapsed ? '' : 'mr-2'} />
      )}
      {/* Hide label if iconOnly OR collapsed */}
      {!iconOnly && (
        <span className={`${collapsed ? 'hidden' : 'block'}`}>
          {isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
        </span>
      )}
    </button>
  );
};

export default LogoutButton;
