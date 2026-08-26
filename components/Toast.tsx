'use client';
// components/Toast.tsx
//
// Reemplaza a los alert() nativos que había regados por el panel. Un alert()
// bloquea el hilo del navegador hasta que alguien lo cierra: en la caja eso
// significa que el mostrador se detiene, y en un iPad el diálogo del sistema
// tapa la interfaz.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type Tipo = 'exito' | 'error' | 'info';

interface Aviso {
  id: number;
  tipo: Tipo;
  texto: string;
}

interface ToastAPI {
  exito: (texto: string) => void;
  error: (texto: string) => void;
  info: (texto: string) => void;
}

const Contexto = createContext<ToastAPI | null>(null);

export function useToast(): ToastAPI {
  const api = useContext(Contexto);
  if (!api) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return api;
}

const ESTILOS: Record<Tipo, { fondo: string; texto: string; icono: React.ReactNode }> = {
  exito: {
    fondo: 'bg-green-50 border-green-200',
    texto: 'text-green-800',
    icono: <CheckCircle size={18} className="text-green-600" />,
  },
  error: {
    fondo: 'bg-red-50 border-red-200',
    texto: 'text-red-800',
    icono: <AlertCircle size={18} className="text-red-600" />,
  },
  info: {
    fondo: 'bg-[#f5f9f8] border-[#e0e6e5]',
    texto: 'text-[#313D52]',
    icono: <Info size={18} className="text-[#2E9C82]" />,
  },
};

let siguienteId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const quitar = useCallback((id: number) => {
    setAvisos((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const agregar = useCallback((tipo: Tipo, texto: string) => {
    const id = siguienteId++;
    setAvisos((prev) => [...prev, { id, tipo, texto }]);
    // Los errores se quedan más tiempo: suelen traer instrucciones.
    const ms = tipo === 'error' ? 8000 : 4000;
    setTimeout(() => quitar(id), ms);
  }, [quitar]);

  const api: ToastAPI = {
    exito: useCallback((t: string) => agregar('exito', t), [agregar]),
    error: useCallback((t: string) => agregar('error', t), [agregar]),
    info: useCallback((t: string) => agregar('info', t), [agregar]),
  };

  return (
    <Contexto.Provider value={api}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto"
        role="status"
        aria-live="polite"
      >
        {avisos.map((a) => {
          const e = ESTILOS[a.tipo];
          return (
            <div
              key={a.id}
              className={`${e.fondo} ${e.texto} border rounded-lg shadow-sm px-4 py-3
                          flex items-start gap-3 animate-[fadeIn_.15s_ease-out]`}
            >
              <span className="flex-shrink-0 mt-0.5">{e.icono}</span>
              <p className="text-sm flex-1 whitespace-pre-line">{a.texto}</p>
              <button
                onClick={() => quitar(a.id)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Cerrar aviso"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </Contexto.Provider>
  );
}
