'use client';
// app/admin/bookings/page.tsx
//
// Las reservas en línea ya no viven en una tabla aparte: son órdenes con
// `origen = 'online'`. Antes el formulario público escribía en `ordenes` pero
// esta pantalla leía `reservaciones`, así que las reservas reales nunca
// aparecían aquí y se perdían entre las ventas de mostrador.
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar, Search, RefreshCw, AlertCircle, Package, Clock, MapPin, ChevronRight,
} from 'lucide-react';

interface Reserva {
  orden_id: number;
  codigo_orden: string;
  cliente_nombre: string;
  cliente_apellidos: string;
  cliente_telefono: string | null;
  estado_servicio: string;
  color_estado: string;
  total: number;
  total_pares: number;
  requiere_pickup: boolean;
  zona_pickup: string | null;
  fecha_reservacion: string | null;
  fecha_recepcion: string;
  fecha_entrega_estimada: string;
}

const formatoMXN = (n: number) =>
  Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const formatoFecha = (v: string | null) =>
  v
    ? new Date(v).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        origen: 'online',
        page: String(pagina),
        pageSize: '20',
      });
      if (busqueda.trim()) params.set('search', busqueda.trim());

      const res = await fetch(`/api/admin/orders?${params}`);
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || 'No se pudieron cargar las reservas');

      setReservas(datos.ordenes ?? []);
      setTotalPaginas(datos.totalPaginas ?? 1);
      setTotal(datos.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las reservas');
    } finally {
      setCargando(false);
    }
  }, [pagina, busqueda]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#313D52]">Reservas en línea</h1>
          <p className="text-sm text-[#6c7a89] mt-1">
            {total} reserva{total === 1 ? '' : 's'} recibida{total === 1 ? '' : 's'} desde el sitio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => { e.preventDefault(); setPagina(1); cargar(); }}
            className="relative"
          >
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c7a89]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Código, nombre o teléfono"
              className="py-2 pl-10 pr-4 rounded-lg border border-[#e0e6e5] text-sm w-full sm:w-72
                         focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            />
          </form>
          <button
            onClick={cargar}
            disabled={cargando}
            className="p-2 rounded-lg border border-[#e0e6e5] text-[#6c7a89] hover:bg-[#f5f9f8] disabled:opacity-50"
            aria-label="Recargar"
          >
            <RefreshCw size={18} className={cargando ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {cargando ? (
        <div className="py-16 text-center text-[#6c7a89]">
          <RefreshCw size={28} className="mx-auto mb-3 animate-spin" />
          Cargando reservas…
        </div>
      ) : reservas.length === 0 ? (
        <div className="py-16 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-[#e0e6e5]" />
          <p className="text-[#313D52] font-medium">Todavía no hay reservas en línea</p>
          <p className="text-sm text-[#6c7a89] mt-1">
            Las que lleguen desde el sitio aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => (
            <Link
              key={r.orden_id}
              href={`/admin/orders/${r.orden_id}`}
              className="flex items-center gap-4 bg-white border border-[#e0e6e5] rounded-lg p-4
                         hover:border-[#78f3d3] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#313D52]">{r.codigo_orden}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: r.color_estado }}
                  >
                    {r.estado_servicio}
                  </span>
                  {r.requiere_pickup && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#e0f7f0] text-[#1f7a5c] inline-flex items-center gap-1">
                      <MapPin size={11} /> {r.zona_pickup ?? 'Recolección'}
                    </span>
                  )}
                </div>

                <p className="text-sm text-[#313D52] mt-1 truncate">
                  {r.cliente_nombre} {r.cliente_apellidos}
                  {r.cliente_telefono && (
                    <span className="text-[#6c7a89]"> · {r.cliente_telefono}</span>
                  )}
                </p>

                <div className="flex items-center gap-4 text-xs text-[#6c7a89] mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} /> Reserva: {formatoFecha(r.fecha_reservacion)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Package size={12} /> {r.total_pares} par{r.total_pares === 1 ? '' : 'es'}
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-[#313D52] tabular-nums">{formatoMXN(r.total)}</div>
              </div>
              <ChevronRight size={18} className="text-[#6c7a89] flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="px-4 py-2 rounded-lg border border-[#e0e6e5] text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-[#6c7a89]">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="px-4 py-2 rounded-lg border border-[#e0e6e5] text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
