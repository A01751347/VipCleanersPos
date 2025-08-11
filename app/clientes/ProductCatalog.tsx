

'use client';
// ==== FILE: ProductCatalog.tsx ====

import React, { useEffect, useMemo, useState } from 'react';
import { Package, Tag, PlusCircle, Loader2, AlertCircle, Filter } from 'lucide-react';

export interface ProductApiShape {
  producto_id?: number;
  id?: number;
  nombre?: string;
  producto_nombre?: string;
  name?: string;
  producto_descripcion?: string;
  categoria?: string;

  precio?: number | string;
  price?: number | string;
  precio_oferta?: number | string;

  stock: number;
  stock_minimo?: number;

  categoria_id?: number;
  categoria_nombre?: string;

  codigo_barras?: string;
  activo?: boolean;
  estado_stock?: 'Suficiente' |"Disponible"| 'Bajo' | 'Agotado';
}

export interface ProductCatalogProps {
  onAddToCart: (item: { id: number; tipo: 'producto'; nombre: string; precio: number; cantidad: number }) => void;
  searchTerm: string;
  /** Permite controlar el contenedor externo (opcional) */
  className?: string;
}

const toNumber = (v: unknown) => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? (n as number) : 0;
};
const money = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const getName = (p: ProductApiShape) => p.nombre ?? p.producto_nombre ?? p.name ?? '';
const getId = (p: ProductApiShape) => (p.producto_id ?? p.id ?? 0) as number;
const getBasePrice = (p: ProductApiShape) => toNumber(p.precio ?? p.price ?? 0);
const getOfferPrice = (p: ProductApiShape) => toNumber(p.precio_oferta ?? 0);
const getDisplayPrice = (p: ProductApiShape) => {
  const base = getBasePrice(p);
  const offer = getOfferPrice(p);
  if (offer > 0 && offer < base) return offer;
  return base;
};
const hasOffer = (p: ProductApiShape) => {
  const base = getBasePrice(p);
  const offer = getOfferPrice(p);
  return offer > 0 && offer < base;
};
const getStockState = (p: ProductApiShape): 'Suficiente' |"Disponible" | 'Bajo' | 'Agotado' => {
  if (p.stock <= 0) return 'Agotado';
  const min = p.stock_minimo ?? 0;
  if (p.stock <= min) return 'Bajo';
  return 'Disponible';
};

const ProductCatalog: React.FC<ProductCatalogProps> = ({ onAddToCart, searchTerm, className }) => {
  const [products, setProducts] = useState<ProductApiShape[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar TODOS los productos al montar
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/admin/products');
        if (!res.ok) throw new Error('Error al cargar productos');
        const data = await res.json();
        if (!alive) return;
        const list: ProductApiShape[] = data.products ?? data.productos ?? [];
        setProducts(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError('No se pudieron cargar los productos');
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Buscar cuando searchTerm ≥ 3, si no, re-muestra el listado original
  useEffect(() => {
    let alive = true;

    const search = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/products?search=${encodeURIComponent(searchTerm)}`);
        if (!res.ok) throw new Error('Error al buscar productos');
        const data = await res.json();
        if (!alive) return;
        const list: ProductApiShape[] = data.products ?? data.productos ?? [];
        setProducts(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError('No se pudieron buscar los productos');
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    const loadAll = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/admin/products');
        if (!res.ok) throw new Error('Error al cargar productos');
        const data = await res.json();
        if (!alive) return;
        const list: ProductApiShape[] = data.products ?? data.productos ?? [];
        setProducts(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError('No se pudieron cargar los productos');
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    if (searchTerm && searchTerm.trim().length >= 3) {
      search();
    } else {
      loadAll();
    }

    return () => {
      alive = false;
    };
  }, [searchTerm]);

  const showingQuery = useMemo(() => (searchTerm && searchTerm.trim().length >= 3 ? searchTerm.trim() : ''), [searchTerm]);

  const renderStockBadge = (p: ProductApiShape): React.JSX.Element => {
    const state =  getStockState(p);
    const cls =

      state === 'Suficiente' || "Disponible"
        ? 'bg-green-100 text-green-800'
        : state === 'Bajo'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800';
    return <span className={`text-xs px-2 py-1 rounded ${cls}`}>{state}</span>;
  };

  const renderCard = (p: ProductApiShape) => {
    const id = getId(p);
    const name = getName(p);
    const price = getDisplayPrice(p);
    const out = p.stock <= 0;

    return (
      <article
        key={id}
        className={`h-full bg-white p-3 sm:p-4 rounded-lg border border-[#e0e6e5] hover:shadow-md transition-shadow flex flex-col ${
          out ? 'opacity-60' : ''
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
          <div className="pr-0 md:pr-4">
            <h3 className="font-medium text-[#313D52] flex items-start md:items-center">
              <Package size={18} className="mt-[2px] md:mt-0 mr-2 text-[#78f3d3] shrink-0" />
              <span className="break-words">{name || <span className="italic text-[#6c7a89]">Sin nombre</span>}</span>
            </h3>

            {p.producto_descripcion ? (
              <p className="text-[13px] sm:text-sm text-[#6c7a89] mt-1 leading-relaxed break-words">{p.producto_descripcion}</p>
            ) : (
              <p className="text-[13px] sm:text-sm text-[#6c7a89] mt-1 italic">&nbsp;</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {renderStockBadge(p)}
              {p.categoria ? (
                <span className="text-xs bg-[#f5f9f8] text-[#6c7a89] px-2 py-1 rounded inline-flex items-center">
                  <Tag size={12} className="mr-1" />
                  {p.categoria}
                </span>
              ) : null}
            </div>
          </div>

          <div className="md:text-right md:whitespace-nowrap">
            <div className="font-bold text-[#313D52] text-base sm:text-lg">{money(price)}</div>
            {hasOffer(p) ? <div className="text-xs text-[#6c7a89] line-through">{money(getBasePrice(p))}</div> : null}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between md:mt-auto">
          <div className="text-sm text-[#6c7a89]"><span className="font-medium">Stock:</span> {p.stock}</div>

          <button
            onClick={() => onAddToCart({ id, tipo: 'producto', nombre: name || `Producto #${id}`, precio: price, cantidad: 1 })}
            disabled={out}
            className={`w-full sm:w-auto inline-flex justify-center items-center text-sm rounded-lg px-3 py-2 transition-colors ${
              out ? 'bg-[#f5f9f8] text-[#6c7a89] cursor-not-allowed' : 'bg-[#f5f9f8] text-[#313D52] hover:bg-[#e0e6e5]'
            }`}
            title={out ? 'Sin stock' : 'Agregar al carrito'}
          >
            <PlusCircle size={16} className={`mr-1 ${out ? '' : 'text-[#78f3d3]'}`} />
            {out ? 'Sin stock' : 'Agregar'}
          </button>
        </div>
      </article>
    );
  };

  /* UI */
  if (isLoading && products.length === 0) {
    return (
      <div className="flex justify-center items-center py-12" aria-busy>
        <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
      </div>
    );
  }

  if (error && products.length === 0) {
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

  return (
    <section className={`mx-auto w-full max-w-5xl px-3 sm:px-4 lg:px-6 ${className || ''}`}>
      {showingQuery ? (
        <div className="mb-4 flex items-center text-sm text-[#6c7a89] gap-2">
          <Filter size={16} />
          <span className="truncate">Resultados para: <span className="font-medium">“{showingQuery}”</span></span>
          {isLoading ? <Loader2 size={16} className="ml-auto sm:ml-2 animate-spin text-[#78f3d3]" /> : null}
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="text-center py-12 text-[#6c7a89] px-3">
          <p>No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-3 sm:gap-4 lg:gap-5">

          {products.map(renderCard)}
        </div>
      )}
    </section>
  );
};

export default ProductCatalog;