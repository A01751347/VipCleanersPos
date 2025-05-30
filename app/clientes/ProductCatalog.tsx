'use client'
// components/admin/pos/ProductCatalog.tsx
import React, { useState, useEffect } from 'react';
import { Package, Tag, PlusCircle, Loader2, AlertCircle, Filter } from 'lucide-react';

// Interfaces
interface Category {
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

interface Product {
  producto_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  precio_oferta?: number;
  stock: number;
  stock_minimo: number;
  categoria_id: number;
  categoria_nombre?: string;
  codigo_barras?: string;
  activo: boolean;
  estado_stock?: 'Disponible' | 'Bajo' | 'Agotado';
}

interface ProductCatalogProps {
  onAddToCart: (item: {
    id: number;
    tipo: 'producto';
    nombre: string;
    precio: number;
    cantidad: number;
  }) => void;
  searchTerm: string;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ onAddToCart, searchTerm }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Inicializar con todas las categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/admin/products?categories=true');
        
        if (!response.ok) {
          throw new Error('Error al cargar categorías');
        }
        
        const data = await response.json();
        setCategories(data.categories || []);
        
        // Si hay categorías, seleccionar la primera por defecto
        if (data.categories && data.categories.length > 0) {
          setSelectedCategory(data.categories[0].categoria_id);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('No se pudieron cargar las categorías de productos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Cargar productos cuando cambia la categoría seleccionada
  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedCategory === null) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/products?categoryId=${selectedCategory}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar productos');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('No se pudieron cargar los productos');
      } finally {
        setLoading(false);
      }
    };
    
    // Buscar productos por término de búsqueda
    const searchProducts = async () => {
      if (!searchTerm || searchTerm.length < 3) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/products?search=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
          throw new Error('Error al buscar productos');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
        setSelectedCategory(null); // Deseleccionar categoría cuando se está buscando
      } catch (err) {
        console.error('Error searching products:', err);
        setError('No se pudieron buscar los productos');
      } finally {
        setLoading(false);
      }
    };
    
    if (searchTerm && searchTerm.length >= 3) {
      searchProducts();
    } else if (selectedCategory !== null) {
      fetchProducts();
    }
  }, [selectedCategory, searchTerm]);
  
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
  };
  
  const handleAddToCart = (product: Product) => {
    onAddToCart({
      id: product.producto_id,
      tipo: 'producto',
      nombre: product.nombre,
      precio: product.precio_oferta || product.precio,
      cantidad: 1
    });
  };
  
  const renderCategoryTabs = () => {
    return (
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category.categoria_id}
              onClick={() => handleCategorySelect(category.categoria_id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === category.categoria_id
                  ? 'bg-[#78f3d3] text-[#313D52] font-medium'
                  : 'bg-[#f5f9f8] text-[#6c7a89] hover:bg-[#e0e6e5]'
              }`}
            >
              {category.nombre}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  const renderStockBadge = (product: Product) => {
    if (!product.estado_stock) return null;
    
    const badgeClasses = {
      Disponible: 'bg-green-100 text-green-800',
      Bajo: 'bg-yellow-100 text-yellow-800',
      Agotado: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded ${badgeClasses[product.estado_stock]}`}>
        {product.estado_stock}
      </span>
    );
  };
  
  const renderProductCard = (product: Product) => {
    const isOutOfStock = product.stock <= 0;
    
    return (
      <div 
        key={product.producto_id} 
        className={`bg-white p-4 rounded-lg border border-[#e0e6e5] hover:shadow-md transition-shadow ${
          isOutOfStock ? 'opacity-50' : ''
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-[#313D52] flex items-center">
              <Package size={18} className="mr-2" />
              {product.nombre}
            </h3>
            
            {product.descripcion ? (
              <p className="text-sm text-[#6c7a89] mt-1">{product.descripcion}</p>
            ): (null)}
            
            <div className="flex items-center mt-2 space-x-2">
            {renderStockBadge(product)}
              
              {product.categoria_nombre ? (
                <span className="text-xs bg-[#f5f9f8] text-[#6c7a89] px-2 py-1 rounded flex items-center">
                  <Tag size={12} className="mr-1" />
                  {product.categoria_nombre}
                </span>
              ):(null)}
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-bold text-[#313D52]">
              ${(Number(product.precio_oferta) || Number(product.precio)).toFixed(2)}


            </div>
            
            {product.precio_oferta ? (
              <div className="text-xs text-[#6c7a89] line-through">
                ${product.precio.toFixed(2)}
              </div>
            ):(null)}
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-[#6c7a89]">
            <span className="font-medium">Stock:</span> {product.stock}
          </div>
          
          <button
            onClick={() => handleAddToCart(product)}
            disabled={isOutOfStock}
            className={`flex items-center text-sm rounded-lg px-3 py-1 ${
              isOutOfStock
                ? 'bg-[#f5f9f8] text-[#6c7a89] cursor-not-allowed'
                : 'bg-[#f5f9f8] text-[#313D52] hover:bg-[#e0e6e5]'
            }`}
          >
            <PlusCircle size={16} className={`mr-1 ${isOutOfStock ? 'text-[#6c7a89]' : 'text-[#78f3d3]'}`} />
            {isOutOfStock ? 'Sin stock' : 'Agregar'}
          </button>
        </div>
      </div>
    );
  };
  
  if (loading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
      </div>
    );
  }
  
  if (error && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={40} className="text-red-500 mb-4" />
        <p className="text-[#313D52]">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  return (
    <div>
      {/* Mostrar categorías solo cuando no se está buscando */}
      {(!searchTerm || searchTerm.length < 3) && renderCategoryTabs()}
      
      {/* Indicador de búsqueda */}
      {searchTerm && searchTerm.length >= 3 && (
        <div className="mb-4 flex items-center text-sm text-[#6c7a89]">
          <Filter size={16} className="mr-1" />
          Resultados para: <span className="font-medium ml-1">&quot;{searchTerm}&quot;</span>

          
          {selectedCategory === null && loading && (
            <Loader2 size={16} className="ml-2 animate-spin text-[#78f3d3]" />
          )}
        </div>
      )}
      
      {/* Productos */}
      {loading && selectedCategory !== null ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={32} className="animate-spin text-[#78f3d3]" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-[#6c7a89]">
          <p>No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map(renderProductCard)}
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;