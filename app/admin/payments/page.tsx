'use client';
// app/admin/payments/page.tsx — Caja: apertura, cobros del día y cierre.
import React, { useCallback, useEffect, useState } from 'react';
import {
  Wallet, Lock, Unlock, RefreshCw, AlertCircle, CheckCircle,
  Banknote, CreditCard, Smartphone, ArrowLeftRight, TrendingDown,
} from 'lucide-react';

interface Corte {
  corte_id: number;
  empleado_nombre: string | null;
  estado: 'abierto' | 'cerrado';
  fondo_inicial: number;
  abierto_en: string;
  cerrado_en: string | null;
  efectivo_declarado: number | null;
  efectivo_esperado: number | null;
  diferencia: number | null;
}

interface PorMetodo {
  metodo: string;
  transacciones: number;
  monto: number;
  efectivo_recibido: number;
  cambio_entregado: number;
}

interface Movimiento {
  pago_id: number;
  monto: number;
  metodo: string;
  fecha_pago: string;
  motivo: string | null;
  es_reembolso: boolean;
  codigo_orden: string;
  cliente: string | null;
}

const mxn = (n: unknown) =>
  Number(n ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const hora = (v: string) =>
  new Date(v).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

const ICONOS: Record<string, React.ReactNode> = {
  efectivo: <Banknote size={16} />,
  tarjeta: <CreditCard size={16} />,
  transferencia: <ArrowLeftRight size={16} />,
  mercado_pago: <Smartphone size={16} />,
};

const ETIQUETAS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  mercado_pago: 'Mercado Pago',
};

export default function CajaPage() {
  const [caja, setCaja] = useState<Corte | null>(null);
  const [porMetodo, setPorMetodo] = useState<PorMetodo[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [fondoInicial, setFondoInicial] = useState('');
  const [efectivoDeclarado, setEfectivoDeclarado] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/caja');
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || 'No se pudo cargar la caja');
      setCaja(datos.caja ?? null);
      setPorMetodo(datos.resumen?.porMetodo ?? []);
      setMovimientos(datos.resumen?.movimientos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la caja');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fondoInicial: Number(fondoInicial || 0), notas: notas || null }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || 'No se pudo abrir la caja');
      setAviso(datos.message);
      setFondoInicial('');
      setNotas('');
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la caja');
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caja) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/caja', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corteId: caja.corte_id,
          efectivoDeclarado: Number(efectivoDeclarado || 0),
          notas: notas || null,
        }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || 'No se pudo cerrar la caja');
      setAviso(datos.message);
      setEfectivoDeclarado('');
      setNotas('');
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar la caja');
    } finally {
      setEnviando(false);
    }
  };

  const efectivoEsperado =
    Number(caja?.fondo_inicial ?? 0) +
    Number(porMetodo.find((m) => m.metodo === 'efectivo')?.efectivo_recibido ?? 0) -
    Number(porMetodo.find((m) => m.metodo === 'efectivo')?.cambio_entregado ?? 0);

  const totalCobrado = porMetodo.reduce((s, m) => s + Number(m.monto), 0);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#313D52]">Caja</h1>
          <p className="text-sm text-[#6c7a89] mt-1">
            Abre tu turno, cobra, y cierra contando el efectivo.
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          className="p-2 rounded-lg border border-[#e0e6e5] text-[#6c7a89] hover:bg-[#f5f9f8] disabled:opacity-50"
          aria-label="Recargar"
        >
          <RefreshCw size={18} className={cargando ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {aviso && (
        <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-lg flex items-start gap-2">
          <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
          <span className="text-sm">{aviso}</span>
        </div>
      )}

      {!caja ? (
        <form onSubmit={abrir} className="bg-white border border-[#e0e6e5] rounded-xl p-6 max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <Unlock size={20} className="text-[#2E9C82]" />
            <h2 className="font-semibold text-[#313D52]">Abrir caja</h2>
          </div>
          <p className="text-sm text-[#6c7a89] mb-4">
            Cuenta el efectivo con el que arrancas el turno. Al cerrar se compara
            contra lo que el sistema espera.
          </p>

          <label htmlFor="fondo" className="block text-sm font-medium text-[#313D52] mb-1">
            Fondo inicial
          </label>
          <input
            id="fondo"
            type="number"
            step="0.01"
            min="0"
            required
            value={fondoInicial}
            onChange={(e) => setFondoInicial(e.target.value)}
            placeholder="500.00"
            className="w-full px-4 py-2.5 rounded-lg border border-[#e0e6e5] tabular-nums mb-4
                       focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
          />

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-2.5 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg
                       hover:bg-[#4de0c0] transition-colors disabled:opacity-60"
          >
            {enviando ? 'Abriendo…' : 'Abrir caja'}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6">
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e0e6e5] border border-[#e0e6e5] rounded-xl overflow-hidden mb-6">
              <div className="bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-[#6c7a89]">Fondo</div>
                <div className="text-xl font-semibold text-[#313D52] tabular-nums mt-1">
                  {mxn(caja.fondo_inicial)}
                </div>
              </div>
              <div className="bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-[#6c7a89]">Cobrado</div>
                <div className="text-xl font-semibold text-[#313D52] tabular-nums mt-1">
                  {mxn(totalCobrado)}
                </div>
              </div>
              <div className="bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-[#6c7a89]">Movimientos</div>
                <div className="text-xl font-semibold text-[#313D52] tabular-nums mt-1">
                  {movimientos.length}
                </div>
              </div>
              <div className="bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-[#6c7a89]">Efectivo esperado</div>
                <div className="text-xl font-semibold text-[#2E9C82] tabular-nums mt-1">
                  {mxn(efectivoEsperado)}
                </div>
              </div>
            </div>

            <h2 className="text-sm font-semibold text-[#313D52] mb-3">Por método de pago</h2>
            {porMetodo.length === 0 ? (
              <p className="text-sm text-[#6c7a89] mb-6">Todavía no hay cobros en este turno.</p>
            ) : (
              <div className="space-y-2 mb-6">
                {porMetodo.map((m) => (
                  <div
                    key={m.metodo}
                    className="flex items-center justify-between bg-white border border-[#e0e6e5] rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#6c7a89]">{ICONOS[m.metodo]}</span>
                      <div>
                        <div className="text-sm font-medium text-[#313D52]">
                          {ETIQUETAS[m.metodo] ?? m.metodo}
                        </div>
                        <div className="text-xs text-[#6c7a89]">
                          {m.transacciones} movimiento{m.transacciones === 1 ? '' : 's'}
                          {m.metodo === 'efectivo' && Number(m.cambio_entregado) > 0 && (
                            <> · {mxn(m.cambio_entregado)} de cambio</>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-semibold text-[#313D52] tabular-nums">{mxn(m.monto)}</span>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-sm font-semibold text-[#313D52] mb-3">Movimientos del turno</h2>
            <div className="bg-white border border-[#e0e6e5] rounded-lg divide-y divide-[#e7eaec]">
              {movimientos.length === 0 ? (
                <p className="text-sm text-[#6c7a89] p-4">Sin movimientos.</p>
              ) : (
                movimientos.map((m) => (
                  <div key={m.pago_id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm text-[#313D52] font-medium truncate">
                        {m.codigo_orden}
                        {m.es_reembolso && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-700">
                            reembolso
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6c7a89] truncate">
                        {hora(m.fecha_pago)} · {ETIQUETAS[m.metodo] ?? m.metodo}
                        {m.cliente && ` · ${m.cliente}`}
                      </div>
                    </div>
                    <span
                      className={`font-medium tabular-nums ${
                        Number(m.monto) < 0 ? 'text-red-600' : 'text-[#313D52]'
                      }`}
                    >
                      {mxn(m.monto)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={cerrar} className="bg-white border border-[#e0e6e5] rounded-xl p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={18} className="text-[#9A5B00]" />
              <h2 className="font-semibold text-[#313D52]">Cerrar caja</h2>
            </div>

            <p className="text-sm text-[#6c7a89] mb-4">
              Cuenta el efectivo físico en el cajón e ingrésalo. La diferencia
              contra lo esperado se guarda en el corte.
            </p>

            <div className="bg-[#f5f9f8] rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
              <span className="text-xs text-[#6c7a89]">Esperado</span>
              <span className="font-semibold text-[#313D52] tabular-nums">{mxn(efectivoEsperado)}</span>
            </div>

            <label htmlFor="declarado" className="block text-sm font-medium text-[#313D52] mb-1">
              Efectivo contado
            </label>
            <input
              id="declarado"
              type="number"
              step="0.01"
              min="0"
              required
              value={efectivoDeclarado}
              onChange={(e) => setEfectivoDeclarado(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[#e0e6e5] tabular-nums mb-3
                         focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            />

            {efectivoDeclarado !== '' && (
              <div
                className={`text-sm rounded-lg px-3 py-2 mb-3 flex items-center gap-2 ${
                  Math.abs(Number(efectivoDeclarado) - efectivoEsperado) < 0.005
                    ? 'bg-green-50 text-green-800'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                <TrendingDown size={15} />
                Diferencia: {mxn(Number(efectivoDeclarado) - efectivoEsperado)}
              </div>
            )}

            <label htmlFor="notas" className="block text-sm font-medium text-[#313D52] mb-1">
              Notas
            </label>
            <textarea
              id="notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] text-sm resize-none mb-4
                         focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            />

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-2.5 bg-[#313D52] text-white font-medium rounded-lg
                         hover:bg-[#3e4a61] transition-colors disabled:opacity-60
                         inline-flex items-center justify-center gap-2"
            >
              <Wallet size={18} />
              {enviando ? 'Cerrando…' : 'Cerrar caja'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
