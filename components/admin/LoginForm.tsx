// components/admin/LoginForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, useSession, getSession } from "next-auth/react";
import { Loader2, ShieldAlert, Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status, update } = useSession();

  // Verificar errores en la URL
  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (errorParam) {
      setError("Error de autenticación. Por favor, verifica tus credenciales.");
    }
  }, [searchParams]);

  // Manejar redirección cuando el usuario ya está autenticado
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      router.replace("/admin");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Por favor, ingresa tu correo y contraseña");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email o contraseña incorrectos");
      } else if (result?.ok) {
        await update();
        const updatedSession = await getSession();
        if (updatedSession?.user?.role === "admin") {
          window.location.href = "/admin";
        } else {
          setError("No tienes permisos de administrador");
        }
      } else {
        setError("Error inesperado al iniciar sesión");
      }
    } catch (err) {
      console.error("💥 Error en handleSubmit:", err);
      setError("Ocurrió un error al iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#f5f9f8]">
        <Loader2 size={50} className="animate-spin text-[#78f3d3]" />
        <p className="mt-4 text-[#313D52]">Verificando sesión...</p>
      </div>
    );
  }

  if (session?.user?.role === "admin") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#f5f9f8]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#e0f7f0] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} className="text-[#78f3d3]" />
          </div>
          <h2 className="text-xl font-semibold text-[#313D52] mb-2">
            Ya estás conectado
          </h2>
          <p className="text-[#6c7a89] mb-4">
            Redirigiendo al panel de administración...
          </p>
          <Loader2 size={24} className="animate-spin text-[#78f3d3] mx-auto" />
          <button
            onClick={() => (window.location.href = "/admin")}
            className="mt-4 px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
          >
            Ir al Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#f5f9f8]">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#313D52] mb-2">
            Vip<span className="text-[#78f3d3]">Cleaners</span>
          </h1>
          <p className="text-[#6c7a89]">Panel de Administración</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
            <ShieldAlert size={20} className="mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center">
            <Loader2 size={20} className="mr-2 flex-shrink-0 animate-spin" />
            <p>Iniciando sesión...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#313D52] mb-2"
            >
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
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 pl-10 pr-4 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                placeholder="admin@vipcleaner.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#313D52] mb-2"
            >
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 pl-10 pr-12 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#6c7a89] hover:text-[#313D52] focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg bg-[#78f3d3] text-[#313D52] font-semibold shadow-sm hover:bg-[#4de0c0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#78f3d3] flex items-center justify-center ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-[#6c7a89]">
          <p>¿Problemas para acceder? Contacta al administrador del sistema.</p>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-[#6c7a89]">
        <p>
          &copy; {new Date().getFullYear()} VipCleaners. Todos los derechos
          reservados.
        </p>
      </div>
    </div>
  );
}
