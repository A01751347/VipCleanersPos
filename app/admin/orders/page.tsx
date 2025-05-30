'use client'
// app/admin/orders/page.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Loader2,
  Calendar,
  Filter,
  ShoppingBag,
  Package
} from 'lucide-react';
import OrdersTable, { Order } from '../../../components/admin/OrdersTable';
import StatusFilter from '../../../components/admin/StatusFilter';
import Link from 'next/link';

// Definir la interfaz completa para las órdenes

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar los datos
  const loadOrders = async (
    page: number = currentPage, 
    status: string[] = selectedStatus, 
    paymentStatus: string = selectedPaymentStatus,
    search: string = searchQuery, 
    dates: {start: string, end: string} = dateRange
  ) => {
    try {
      setIsRefreshing(true);
      
      // Construir la URL con los parámetros de filtro
      let url = `/api/admin/orders?page=${page}&pageSize=${itemsPerPage}`;
      
      if (status && status.length > 0) {
        url += `&estadoId=${status.join(',')}`;
      }
      
      if (paymentStatus) {
        url += `&estadoPago=${paymentStatus}`;
      }
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      if (dates.start) {
        url += `&fechaInicio=${encodeURIComponent(dates.start)}`;
      }
      
      if (dates.end) {
        url += `&fechaFin=${encodeURIComponent(dates.end)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al cargar las órdenes');
      }
      
      const data = await response.json();
      
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error al cargar las órdenes. Intente nuevamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadOrders(1, selectedStatus, selectedPaymentStatus, searchQuery, dateRange);
  };

  const handleStatusChange = (statuses: string[]) => {
    setSelectedStatus(statuses);
    setCurrentPage(1);
    loadOrders(1, statuses, selectedPaymentStatus, searchQuery, dateRange);
  };

  const handlePaymentStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    setSelectedPaymentStatus(status);
    setCurrentPage(1);
    loadOrders(1, selectedStatus, status, searchQuery, dateRange);
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newDateRange = {
      ...dateRange,
      [name]: value
    };
    setDateRange(newDateRange);
    
    // Si ambas fechas están definidas, actualizar la búsqueda
    if ((name === 'start' && value && dateRange.end) || 
        (name === 'end' && value && dateRange.start)) {
      setCurrentPage(1);
      loadOrders(1, selectedStatus, selectedPaymentStatus, searchQuery, newDateRange);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      loadOrders(newPage, selectedStatus, selectedPaymentStatus, searchQuery, dateRange);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      loadOrders(newPage, selectedStatus, selectedPaymentStatus, searchQuery, dateRange);
    }
  };

  const handleRefresh = () => {
    loadOrders(currentPage, selectedStatus, selectedPaymentStatus, searchQuery, dateRange);
  };

  const handleExportData = () => {
    // Aquí iría la lógica para exportar datos
    console.log('Exportando datos...');
    alert('Funcionalidad de exportación no implementada aún');
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y acciones */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#313D52]">Administrar Órdenes</h1>
          <p className="text-sm text-[#6c7a89]">Visualiza y gestiona las órdenes de servicio y venta</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/admin/pos"
            className="inline-flex items-center px-4 py-2 bg-[#313D52] text-white rounded-lg border border-[#313D52] hover:bg-[#3e4a61] transition-colors"
          >
            <ShoppingBag size={16} className="mr-2" />
            Punto de Venta
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
                placeholder="Buscar por cliente, código o empleado..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="py-2 pl-10 pr-4 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm w-full"
              />
            </form>
          </div>
          
          {/* Filtro por estado */}
          <div className="flex-shrink-0">
            <StatusFilter selectedStatus={selectedStatus} onChange={handleStatusChange} />
          </div>
          
          {/* Filtro por estado de pago */}
          <div className="flex-shrink-0">
            <select
              value={selectedPaymentStatus}
              onChange={handlePaymentStatusChange}
              className="py-2 px-4 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm"
            >
              <option value="">Todos los pagos</option>
              <option value="pendiente">Pago pendiente</option>
              <option value="parcial">Pago parcial</option>
              <option value="completado">Pago completado</option>
            </select>
          </div>
          
          {/* Filtro por fecha */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2">
            <div>
              <label htmlFor="startDate" className="block text-xs text-[#6c7a89] mb-1">Desde</label>
              <input
                type="date"
                id="startDate"
                name="start"
                value={dateRange.start}
                onChange={handleDateRangeChange}
                className="py-2 px-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm w-full"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs text-[#6c7a89] mb-1">Hasta</label>
              <input
                type="date"
                id="endDate"
                name="end"
                value={dateRange.end}
                onChange={handleDateRangeChange}
                className="py-2 px-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm w-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabla de órdenes */}
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
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-[#e0e6e5] mb-4" />
            <p className="text-[#6c7a89] font-medium">No se encontraron órdenes</p>
            <p className="text-sm text-[#6c7a89]">Intenta con otros filtros o crea una nueva orden en el punto de venta</p>
            <Link 
              href="/admin/pos"
              className="inline-flex items-center px-4 py-2 mt-4 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
            >
              <ShoppingBag size={16} className="mr-2" />
              Ir al Punto de Venta
            </Link>
          </div>
        ) : (
          <OrdersTable orders={orders} onStatusChange={handleRefresh} />
        )}
        
        {/* Paginación */}
        {!isLoading && !error && orders.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-[#e0e6e5]">
            <div className="text-sm text-[#6c7a89]">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalOrders)}</span> de <span className="font-medium">{totalOrders}</span> resultados
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
                Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
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