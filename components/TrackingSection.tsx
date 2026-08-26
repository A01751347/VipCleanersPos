'use client';
// components/TrackingSection.tsx
import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle, Package, Clock } from 'lucide-react';

/**
 * Consulta pública del estado de una orden.
 *
 * La respuesta ya no trae datos personales. Antes este widget recibía nombre
 * completo, correo, teléfono, domicilio y hasta el historial de pagos, y
 * bastaba el código para obtenerlos. Ahora se pide también los últimos cuatro
 * dígitos del teléfono, y sólo se devuelve el avance del servicio.
 */

interface Par {
  servicio: string;
  marca: string | null;
  modelo: string | null;
  talla: string | null;
  color: string | null;
}

interface EventoHistorial {
  estado: string;
  color: string;
  fecha_cambio: string;
}

interface Seguimiento {
  codigo: string;
  nombre: string;
  estado: string;
  estado_color: string;
  finalizada: boolean;
  cancelada: boolean;
  pagada: boolean;
  fecha_recepcion: string;
  fecha_entrega_estimada: string;
  fecha_entrega_real: string | null;
  fecha_reservacion: string | null;
  pares: Par[];
  historial: EventoHistorial[];
}

const formatoFecha = (v: string | null) =>
  v
    ? new Date(v).toLocaleString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

const TrackingSection: React.FC = () => {
  const [codigo, setCodigo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [datos, setDatos] = useState<Seguimiento | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) {
      setError('Escribe tu código de orden');
      return;
    }
    if (!/^\d{4}$/.test(telefono.trim())) {
      setError('Escribe los últimos 4 dígitos del teléfono con el que reservaste');
      return;
    }

    setCargando(true);
    setError(null);
    setDatos(null);

    try {
      const res = await fetch(
        `/api/track/${encodeURIComponent(codigo.trim())}?tel=${encodeURIComponent(telefono.trim())}`
      );
      const cuerpo = await res.json();
      if (!res.ok) throw new Error(cuerpo.error || 'No pudimos consultar tu orden');
      setDatos(cuerpo.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos consultar tu orden');
    } finally {
      setCargando(false);
    }
  };

  return (
    <section id="seguimiento" className="py-16 px-4 bg-[#f5f9f8]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#313D52]">Sigue tu orden</h2>
          <p className="mt-2 text-[#6c7a89]">
            Consulta en qué va tu calzado con el código que te dimos.
          </p>
        </div>

        <form onSubmit={buscar} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-[#313D52] mb-1">
              Código de orden
            </label>
            <input
              id="codigo"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="ORD-260819-K3M7P"
              autoComplete="off"
              className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] font-mono
                         focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            />
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-[#313D52] mb-1">
              Últimos 4 dígitos de tu teléfono
            </label>
            <input
              id="telefono"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              autoComplete="off"
              className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] font-mono tracking-widest
                         focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            />
            <p className="text-xs text-[#6c7a89] mt-1">
              Lo pedimos para proteger tus datos: así nadie más puede ver tu orden.
            </p>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg
                       flex items-center justify-center gap-2 hover:bg-[#4de0c0]
                       transition-colors disabled:opacity-60"
          >
            {cargando ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            {cargando ? 'Consultando…' : 'Consultar'}
          </button>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </form>

        {datos && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <p className="text-sm text-[#6c7a89]">Hola {datos.nombre}, tu orden</p>
                <p className="font-mono text-lg font-semibold text-[#313D52]">{datos.codigo}</p>
              </div>
              <span
                className="px-3 py-1.5 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: datos.estado_color }}
              >
                {datos.estado}
              </span>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6c7a89]">Recibido</dt>
                <dd className="text-sm text-[#313D52]">{formatoFecha(datos.fecha_recepcion)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#6c7a89]">
                  {datos.fecha_entrega_real ? 'Entregado' : 'Entrega estimada'}
                </dt>
                <dd className="text-sm text-[#313D52]">
                  {formatoFecha(datos.fecha_entrega_real ?? datos.fecha_entrega_estimada)}
                </dd>
              </div>
            </dl>

            {datos.pares.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#313D52] mb-2 flex items-center gap-2">
                  <Package size={16} /> Tu calzado
                </h3>
                <ul className="space-y-2">
                  {datos.pares.map((p, i) => (
                    <li key={i} className="text-sm text-[#6c7a89] bg-[#f5f9f8] rounded-lg px-3 py-2">
                      <span className="text-[#313D52] font-medium">{p.servicio}</span>
                      {(p.marca || p.modelo) && (
                        <> — {[p.marca, p.modelo].filter(Boolean).join(' ')}</>
                      )}
                      {p.talla && <> · Talla {p.talla}</>}
                      {p.color && <> · {p.color}</>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {datos.historial.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#313D52] mb-3 flex items-center gap-2">
                  <Clock size={16} /> Avance
                </h3>
                <ol className="space-y-3">
                  {datos.historial.map((h, i) => {
                    const esUltimo = i === datos.historial.length - 1;
                    return (
                      <li key={i} className="flex gap-3">
                        <span
                          className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: esUltimo ? h.color : '#d8dcdf' }}
                        />
                        <div>
                          <p className={`text-sm ${esUltimo ? 'text-[#313D52] font-medium' : 'text-[#6c7a89]'}`}>
                            {h.estado}
                          </p>
                          <p className="text-xs text-[#6c7a89]">{formatoFecha(h.fecha_cambio)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {datos.finalizada && !datos.cancelada && (
              <div className="mt-6 p-3 bg-green-50 text-green-800 rounded-lg flex items-center gap-2">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">¡Listo! Gracias por confiar en nosotros.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TrackingSection;
