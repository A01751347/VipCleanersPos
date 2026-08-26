import Link from 'next/link';
import { SearchX, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f9f8] px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#e0e6e5] p-8 text-center">
        <div className="w-14 h-14 bg-[#f5f9f8] rounded-full flex items-center justify-center mx-auto mb-4">
          <SearchX size={28} className="text-[#6c7a89]" />
        </div>
        <h1 className="text-xl font-semibold text-[#313D52] mb-2">No encontramos esta página</h1>
        <p className="text-sm text-[#6c7a89] mb-6">
          Puede que el enlace esté mal escrito o que la página ya no exista.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 py-2.5 px-6
                     bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0]"
        >
          <Home size={18} /> Volver al inicio
        </Link>
      </div>
    </main>
  );
}
