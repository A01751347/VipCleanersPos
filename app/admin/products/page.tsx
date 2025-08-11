// app/admin/products/page.tsx
"use client"
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Download,
  Loader2,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Package,
  DollarSign,
  AlertTriangle,
  Filter,
  Grid,
  List
} from 'lucide-react';

interface Product {
  producto_nombre: string;
  producto_id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  costo: number;
  categoria: string;
  categoria_id: number;
  categoria_nombre?: string;
  codigo_barras?: string;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface Category {
  categoria_id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filtros
  const [filters, setFilters] = useState({
    searchQuery: '',
    categoryId: '',
    onlyLowStock: false,
    onlyActive: true
  });

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    costo: '',
    categoria_id: '',
    codigo_barras: '',
    stock: '',
    stock_minimo: '',
    activo: true
  });

  const loadProducts = async () => {
    try {
      setIsRefreshing(true);

      const params = new URLSearchParams({
        page: '1',
        pageSize: '100',
        onlyActive: filters.onlyActive.toString()
      });

      if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
      if (filters.categoryId) params.append('categoryIdFilter', filters.categoryId);
      if (filters.onlyLowStock) params.append('onlyLowStock', 'true');

      const response = await fetch(`/api/admin/products?${params}`);

      if (!response.ok) {
        throw new Error('Error al cargar los productos');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error al cargar los productos. Intente nuevamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/products?categories=true');
      if (!response.ok) throw new Error('Error al cargar categorías');
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const handleRefresh = () => {
    loadProducts();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStockStatus = (stock: number, stockMinimo: number) => {
    if (stock <= 0) return { status: 'out', text: 'Agotado', color: 'text-red-600 bg-red-100' };
    if (stock <= stockMinimo) return { status: 'low', text: 'Bajo', color: 'text-orange-600 bg-orange-100' };
    return { status: 'ok', text: 'Disponible', color: 'text-green-600 bg-green-100' };
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.producto_nombre,
      descripcion: product.descripcion || '',
      precio: product.precio.toString(),
      costo: product.costo?.toString() || '0',
      categoria_id: product.categoria_id?.toString()|| '0',
      codigo_barras: product.codigo_barras || '',
      stock: product.stock.toString(),
      stock_minimo: product.stock_minimo.toString(),
      activo: product.activo
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      costo: '0',
      categoria_id: '',
      codigo_barras: '',
      stock: '0',
      stock_minimo: '0',
      activo: true
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.producto_id}`
        : '/api/admin/products';

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          precio: parseFloat(formData.precio),
          costo: parseFloat(formData.costo || '0'),
          categoria_id: parseInt(formData.categoria_id),
          stock: parseInt(formData.stock),
          stock_minimo: parseInt(formData.stock_minimo)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el producto');
      }

      setShowModal(false);
      loadProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert(error.message || 'Error al guardar el producto');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${product.producto_nombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${product.producto_id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el producto');
      }

      const result = await response.json();
      alert(result.message);
      loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert(error.message || 'Error al eliminar el producto');
    }
  };
console.log(products)
  const ProductCard = ({ product }: { product: Product }) => {
    const stockStatus = getStockStatus(product.stock, product.stock_minimo);
    
    return (
      <div
        className={`bg-white rounded-lg border border-[#e0e6e5] overflow-hidden ${
          !product.activo ? 'opacity-60' : ''
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-medium text-[#313D52] truncate">
              {product.producto_nombre}
            </h3>
            <div className="flex items-center space-x-2">
              {product.activo ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <XCircle size={20} className="text-red-500" />
              )}
            </div>
          </div>


          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center text-sm text-[#6c7a89]">
                <DollarSign size={16} className="mr-1" />
                Precio:
              </span>
              <span className="font-medium text-[#313D52]">
                {formatCurrency(product.precio)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center text-sm text-[#6c7a89]">
                <Package size={16} className="mr-1" />
                Stock:
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${stockStatus.color}`}>
                {product.stock} - {stockStatus.text}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6c7a89]">Categoría:</span>
              <span className="text-sm text-[#313D52]">
                {product.categoria || 'Sin categoría'}
              </span>
            </div>

            {product.codigo_barras && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6c7a89]">Código:</span>
                <span className="text-sm text-[#313D52] font-mono">
                  {product.codigo_barras}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[#e0e6e5]">
            <button
              onClick={() => handleDelete(product)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 size={18} />
            </button>

            <button
              onClick={() => handleEdit(product)}
              className="text-[#78f3d3] hover:text-[#4de0c0] transition-colors"
            >
              <Edit size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ProductRow = ({ product }: { product: Product }) => {
    const stockStatus = getStockStatus(product.stock, product.stock_minimo);
    
    return (
      <div
        className={`bg-white rounded-lg border border-[#e0e6e5] p-4 ${
          !product.activo ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center space-x-2">
              {product.activo ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <XCircle size={20} className="text-red-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-[#313D52] truncate">
                {product.producto_nombre}
              </h3>
              <p className="text-xs text-[#6c7a89] truncate">
                {product.descripcion || 'Sin descripción'}
              </p>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <p className="text-xs text-[#6c7a89]">Precio</p>
                <p className="text-sm font-medium text-[#313D52]">
                  {formatCurrency(product.precio)}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-[#6c7a89]">Stock</p>
                <span className={`px-2 py-1 rounded text-xs font-medium ${stockStatus.color}`}>
                  {product.stock}
                </span>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-[#6c7a89]">Categoría</p>
                <p className="text-sm text-[#313D52]">
                  {product.categoria_nombre || 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => handleDelete(product)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => handleEdit(product)}
              className="text-[#78f3d3] hover:text-[#4de0c0] transition-colors"
            >
              <Edit size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#313D52]">Gestión de Productos</h1>
          <p className="text-sm text-[#6c7a89]">Administra el inventario de productos</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-[#313D52] text-white rounded-lg hover:bg-[#3e4a61] transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Nuevo Producto
          </button>

          <button
            className="inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Actualizar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#6c7a89] mb-1">
              Buscar productos
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Nombre o código de barras..."
              className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6c7a89] mb-1">
              Categoría
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.categoria_id} value={category.categoria_id}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.onlyLowStock}
                onChange={(e) => setFilters({ ...filters, onlyLowStock: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-[#6c7a89]">Solo stock bajo</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.onlyActive}
                onChange={(e) => setFilters({ ...filters, onlyActive: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-[#6c7a89]">Solo activos</span>
            </label>
          </div>

          <div className="flex items-end justify-end space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#78f3d3] text-[#313D52]' : 'text-[#6c7a89]'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#78f3d3] text-[#313D52]' : 'text-[#6c7a89]'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {isLoading ? (
          <div className={`${viewMode === 'grid' ? 'col-span-full' : ''} flex justify-center items-center py-20`}>
            <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
          </div>
        ) : error ? (
          <div className={`${viewMode === 'grid' ? 'col-span-full' : ''} text-center py-10 text-red-500`}>
            <p>{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className={`${viewMode === 'grid' ? 'col-span-full' : ''} text-center py-20`}>
            <Package size={48} className="mx-auto text-[#e0e6e5] mb-4" />
            <p className="text-[#6c7a89] font-medium">No hay productos registrados</p>
            <p className="text-sm text-[#6c7a89]">Crea el primer producto para comenzar</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 mt-4 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Nuevo Producto
            </button>
          </div>
        ) : (
          products.map((product) => 
            viewMode === 'grid' ? (
              <ProductCard key={product.producto_id} product={product} />
            ) : (
              <ProductRow key={product.producto_id} product={product} />
            )
          )
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-[#313D52] mb-4">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                    Precio *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({...formData, precio: e.target.value})}
                    className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                    Costo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costo}
                    onChange={(e) => setFormData({...formData, costo: e.target.value})}
                    className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Categoría *
                </label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                  className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.categoria_id} value={category.categoria_id}>
                      {category.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Código de barras
                </label>
                <input
                  type="text"
                  value={formData.codigo_barras}
                  onChange={(e) => setFormData({...formData, codigo_barras: e.target.value})}
                  className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                    Stock actual
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                    Stock mínimo
                  </label>
                  <input
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({...formData, stock_minimo: e.target.value})}
                    className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="activo" className="text-sm text-[#6c7a89]">
                  Producto activo
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-[#6c7a89] border border-[#e0e6e5] rounded-lg hover:bg-[#f5f9f8] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
                >
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}