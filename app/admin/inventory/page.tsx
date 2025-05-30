// app/admin/inventory/page.tsx
'use client'
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Loader2,
  Package,
  AlertTriangle,
  TrendingDown,
  Plus,
  Edit,
  BarChart3,
  Box
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  producto_id: number;
  nombre: string;
  descripcion?: string;
  codigo_barras?: string;
  categoria_id: number;
  categoria: string;
  precio: number;
  precio_oferta?: number;
  stock: number;
  stock_minimo: number;
  estado_stock: 'Disponible' | 'Bajo' | 'Agotado';
  activo: boolean;
}

interface Category {
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estadísticas
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0
  });

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/products?categories=true');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadInventory = async (
    page: number = currentPage,
    category: string = selectedCategory,
    lowStock: boolean = onlyLowStock,
    search: string = searchQuery
  ) => {
    try {
      setIsRefreshing(true);

      let url = `/api/admin/products?page=${page}&pageSize=${itemsPerPage}`;

      if (category) {
        url += `&categoryIdFilter=${category}`;
      }

      if (lowStock) {
        url += `&onlyLowStock=true`;
      }

      if (search) {
        url += `&searchQuery=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar el inventario');
      }

      const data = await response.json();

      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
      setTotalPages(data.totalPages || 1);

      // Calcular estadísticas
      calculateStats(data.products || []);

      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Error al cargar el inventario. Intente nuevamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateStats = (productList: Product[]) => {
    const lowStock = productList.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).length;
    const outOfStock = productList.filter(p => p.stock <= 0).length;
    const totalValue = productList.reduce((sum, p) => sum + (p.stock * p.precio), 0);

    setStats({
      totalItems: productList.length,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock,
      totalValue
    });
  };

  useEffect(() => {
    loadCategories();
    loadInventory();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadInventory(1, selectedCategory, onlyLowStock, searchQuery);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setCurrentPage(1);
    loadInventory(1, category, onlyLowStock, searchQuery);
  };

  const handleLowStockToggle = () => {
    const newValue = !onlyLowStock;
    setOnlyLowStock(newValue);
    setCurrentPage(1);
    loadInventory(1, selectedCategory, newValue, searchQuery);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      loadInventory(newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      loadInventory(newPage);
    }
  };

  const handleRefresh = () => {
    loadInventory();
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(
        `/api/admin/inventory/export?category=${selectedCategory}&lowStock=${onlyLowStock}&search=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStockStatusBadge = (product: Product) => {
    if (product.stock <= 0) {
      return (
        <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-red-100 text-red-800">
          <AlertTriangle size={12} className="mr-1" />
          Agotado
        </span>
      );
    } else if (product.stock <= product.stock_minimo) {
      return (
        <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          <TrendingDown size={12} className="mr-1" />
          Stock bajo
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Disponible
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y acciones */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#313D52]">Gestión de Inventario</h1>
          <p className="text-sm text-[#6c7a89]">Control de productos y existencias</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center px-4 py-2 bg-[#313D52] text-white rounded-lg hover:bg-[#3e4a61] transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Nuevo Producto
          </Link>

          <Link
            href="/admin/inventory/movements"
            className="inline-flex items-center px-4 py-2 bg-[#f5f9f8] text-[#313D52] rounded-lg border border-[#e0e6e5] hover:bg-[#e0e6e5] transition-colors"
          >
            <BarChart3 size={16} className="mr-2" />
            Movimientos
          </Link>

          <button
            onClick={handleExportData}
            className="inline-flex items-center px-4 py-2 bg-[#f5f9f8] text-[#313D52] rounded-lg border border-[#e0e6e5] hover:bg-[#e0e6e5] transition-colors"
          >
            <Download size={16} className="mr-2" />
            Exportar
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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6c7a89]">Total Productos</p>
              <p className="text-2xl font-bold text-[#313D52]">{stats.totalItems}</p>
            </div>
            <div className="p-3 bg-[#f5f9f8] rounded-lg">
              <Package size={24} className="text-[#313D52]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6c7a89]">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <TrendingDown size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6c7a89]">Sin Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6c7a89]">Valor Total</p>
              <p className="text-xl font-bold text-[#313D52]">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="p-3 bg-[#e0f7f0] rounded-lg">
              <Box size={24} className="text-[#78f3d3]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="md:flex-1">
            <form onSubmit={handleSearch} className="flex items-center relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-[#6c7a89]" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full py-2 pl-10 pr-4 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm"
              />
            </form>
          </div>

          {/* Categoría */}
          <div className="flex-shrink-0">
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="py-2 px-4 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.categoria_id} value={cat.categoria_id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro stock bajo */}
          <div className="flex-shrink-0">
            <button
              onClick={handleLowStockToggle}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                onlyLowStock
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                  : 'bg-white border-[#e0e6e5] text-[#6c7a89] hover:bg-[#f5f9f8]'
              }`}
            >
              <Filter size={16} className="mr-2" />
              Solo stock bajo
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">
            <p>{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-[#e0e6e5] mb-4" />
            <p className="text-[#6c7a89] font-medium">No se encontraron productos</p>
            <p className="text-sm text-[#6c7a89]">Intenta con otros filtros o agrega un nuevo producto</p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center px-4 py-2 mt-4 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Nuevo Producto
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e0e6e5]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Stock Mínimo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e0e6e5]">
                {products.map((product) => (
                  <tr key={product.producto_id} className="hover:bg-[#f5f9f8]">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[#313D52]">
                          {product.nombre}
                        </div>
                        {product.descripcion && (
                          <div className="text-xs text-[#6c7a89]">
                            {product.descripcion}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                      {product.categoria}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-[#6c7a89]">
                      {product.codigo_barras || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[#313D52]">
                          {formatCurrency(product.precio)}
                        </div>
                        {product.precio_oferta && (
                          <div className="text-xs text-green-600">
                            Oferta: {formatCurrency(product.precio_oferta)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${
                        product.stock <= 0 ? 'text-red-600' :
                        product.stock <= product.stock_minimo ? 'text-yellow-600' :
                        'text-[#313D52]'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-[#6c7a89]">
                      {product.stock_minimo}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStockStatusBadge(product)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/products/${product.producto_id}/edit`}
                        className="text-[#78f3d3] hover:text-[#4de0c0]"
                      >
                        <Edit size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!isLoading && !error && products.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-[#e0e6e5]">
            <div className="text-sm text-[#6c7a89]">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalProducts)}</span> de{' '}
              <span className="font-medium">{totalProducts}</span> productos
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${
                  currentPage === 1
                    ? 'text-[#e0e6e5] cursor-not-allowed'
                    : 'text-[#313D52] hover:bg-[#f5f9f8]'
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              <span className="text-sm text-[#313D52]">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${
                  currentPage === totalPages
                    ? 'text-[#e0e6e5] cursor-not-allowed'
                    : 'text-[#313D52] hover:bg-[#f5f9f8]'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}