'use client'
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, ShieldAlert, Eye, EyeOff, Lock, Mail } from 'lucide-react';

const AdminLoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  
  // Verificar si hay un error de autenticación en los parámetros de búsqueda
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      setError('Error de autenticación. Por favor, verifica tus credenciales.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Iniciando login con:', email);
      
      // Redirección directa - esto fuerza a que NextAuth maneje la redirección
      await signIn('credentials', {
        redirect: true,
        email,
        password,
        callbackUrl: '/admin'
      });
      
      // No se llegará a este punto si la redirección es exitosa
      
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('Ocurrió un error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#f5f9f8]">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#313D52] mb-2">
            Kick<span className="text-[#78f3d3]">Clean</span>
          </h1>
          <p className="text-[#6c7a89]">Panel de Administración</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
            <ShieldAlert size={20} className="mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#313D52] mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-[#6c7a89]" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 pl-10 pr-4 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                placeholder="admin@kickclean.com"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#313D52] mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-[#6c7a89]" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 pl-10 pr-12 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#6c7a89] hover:text-[#313D52] focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg bg-[#78f3d3] text-[#313D52] font-semibold shadow-sm hover:bg-[#4de0c0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#78f3d3] flex items-center justify-center ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-[#6c7a89]">
          <p>
            ¿Problemas para acceder? Contacta al administrador del sistema.
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-[#6c7a89]">
        <p>
          &copy; {new Date().getFullYear()} KickClean. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginForm;