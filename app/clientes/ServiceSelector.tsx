'use client';

// ==== FILE: ServiceSelector.tsx ====

import React, { useEffect, useMemo, useState } from 'react';
import { Brush, Shield, PlusCircle, Loader2, AlertCircle, Footprints } from 'lucide-react';

/************************************
 * Tipos y helpers compartidos
 ************************************/
export interface Service {
  servicio_id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_estimado?: number;
  requiere_identificacion: boolean;
  activo: boolean;
}

export interface ServiceSelectorProps {
  onAddToCart: (item: {
    id: number;
    tipo: 'servicio';
    nombre: string;
    precio: number;
    cantidad: number;
    modeloId?: number;
    marca?: string;
    modelo?: string;
    descripcion?: string;
  }) => void;
  searchTerm: string;
  onAddShoesService?: (serviceId: number, serviceName: string, servicePrice: number) => void;
  /** Permite controlar el contenedor externo (opcional) */
  className?: string;
}

const formatCurrency = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const shoesKeywords = ['limpieza', 'restauracion', 'restauración', 'tenis', 'sneaker', 'zapato', 'calzado'];
const isShoeService = (s: Service) => {
  const name = s.nombre?.toLowerCase() ?? '';
  const desc = s.descripcion?.toLowerCase() ?? '';
  return shoesKeywords.some((k) => name.includes(k) || desc.includes(k));
};

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onAddToCart, searchTerm, onAddShoesService, className }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/admin/services');
        if (!res.ok) throw new Error('Error al cargar servicios');
        const data = await res.json();
        if (!active) return;
        setServices(data.services || []);
      } catch (e) {
        console.error(e);
        if (!active) return;
        setError('No se pudieron cargar los servicios');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /** Derivados */
  const filtered = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.nombre.toLowerCase().includes(q) || (s.descripcion || '').toLowerCase().includes(q));
  }, [services, searchTerm]);

  /** Handlers */
  const handleAddClick = (s: Service) => {
    if (isShoeService(s) && onAddShoesService) {
      onAddShoesService(s.servicio_id, s.nombre, s.precio);
      return;
    }
    onAddToCart({ id: s.servicio_id, tipo: 'servicio', nombre: s.nombre, precio: s.precio, cantidad: 1 });
  };

  /** Card */
  const renderServiceCard = (s: Service) => {
    const Icon = isShoeService(s) ? Footprints : s.nombre.toLowerCase().includes('premium') ? Shield : Brush;

    return (
      <article
        key={s.servicio_id}
        className="h-full bg-white p-3 sm:p-4 rounded-lg border border-[#e0e6e5] hover:shadow-md transition-shadow flex flex-col"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
          <div className="pr-0 md:pr-4">
            <h3 className="font-medium text-[#313D52] flex items-start md:items-center text-base sm:text-[1rem]">
              <Icon size={18} className="mt-[2px] md:mt-0 mr-2 text-[#78f3d3] shrink-0" />
              <span className="break-words">{s.nombre}</span>
            </h3>
            {s.descripcion ? (
              <p className="text-[13px] sm:text-sm text-[#6c7a89] mt-1 leading-relaxed break-words">{s.descripcion}</p>
            ) : (
              <p className="text-[13px] sm:text-sm text-[#6c7a89] mt-1 italic">Sin descripción</p>
            )}

            {s.requiere_identificacion && (
              <span className="mt-2 inline-flex items-center text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                <AlertCircle size={12} className="mr-1" />
                Requiere identificación
              </span>
            )}
          </div>

          <div className="md:text-right md:whitespace-nowrap">
            <div className="font-bold text-[#313D52] text-base sm:text-lg">{formatCurrency(s.precio)}</div>
          </div>
        </div>

        <div className="mt-4 flex justify-end md:mt-auto">
            <button
              onClick={() => handleAddClick(s)}
              className={`w-full sm:w-auto inline-flex justify-center items-center text-sm rounded-lg px-3 py-2 transition-colors
                ${isShoeService(s) && onAddShoesService
                  ? 'bg-[#78f3d3] text-[#313D52] hover:bg-[#4de0c0]'
                  : 'bg-[#f5f9f8] text-[#313D52] hover:bg-[#e0e6e5]'}
              `}
            >
              <PlusCircle size={16} className="mr-1" />
              {isShoeService(s) && onAddShoesService ? 'Agregar detalles' : 'Agregar'}
            </button>
        </div>
      </article>
    );
  };

  /** UI */
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" aria-busy>
        <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12" role="alert" aria-live="polite">
        <AlertCircle size={40} className="text-red-500 mb-2" />
        <p className="text-[#313D52] text-center px-4">{error}</p>
        <button onClick={() => location.reload()} className="mt-4 w-full sm:w-auto px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg">
          Reintentar
        </button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-[#6c7a89] px-3">
        <p>No se encontraron servicios</p>
        {searchTerm ? <p className="text-sm mt-2 break-words">Búsqueda: “{searchTerm}”</p> : null}
      </div>
    );
  }

  return (
    <section className={`mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 ${className || ''}`}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-3 sm:gap-4 lg:gap-5">
        {filtered.map(renderServiceCard)}
      </div>
    </section>
  );
};

export default ServiceSelector;

