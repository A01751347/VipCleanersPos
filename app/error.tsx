'use client';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aquí se engancharía Sentry. Por ahora al menos queda en consola con el
    // digest, que es lo que permite localizar el error en los logs del servidor.
    console.error('[error]', error.digest, error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f9f8] px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#e0e6e5] p-8 text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-amber-500" />
        </div>
        <h1 className="text-xl font-semibold text-[#313D52] mb-2">Algo salió mal</h1>
        <p className="text-sm text-[#6c7a89] mb-6">
          No pudimos cargar esta página. Puedes intentar de nuevo; si sigue
          fallando, avísanos con el código de abajo.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-[#6c7a89] bg-[#f5f9f8] rounded px-3 py-2 mb-6">
            {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 py-2.5 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg
                       inline-flex items-center justify-center gap-2 hover:bg-[#4de0c0]"
          >
            <RefreshCw size={18} /> Reintentar
          </button>
          <Link
            href="/"
            className="flex-1 py-2.5 border border-[#e0e6e5] text-[#313D52] font-medium rounded-lg
                       inline-flex items-center justify-center gap-2 hover:bg-[#f5f9f8]"
          >
            <Home size={18} /> Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
