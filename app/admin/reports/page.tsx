// app/admin/reports/page.tsx
'use client'
import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Download,
  Loader2,
  RefreshCw,
  FileText,
  Activity
} from 'lucide-react';

interface SalesReportData {
  por_periodo: Array<{
    periodo: string;
    total_ordenes: number;
    subtotal: number;
    impuestos: number;
    descuentos: number;
    total: number;
  }>;
  por_metodo_pago: Array<{
    metodo_pago: string;
    total_ordenes: number;
    total: number;
  }>;
  por_servicio: Array<{
    servicio: string;
    cantidad: number;
    total: number;
  }>;
  por_producto: Array<{
    producto: string;
    cantidad: number;
    total: number;
  }>;
}

interface EmployeesReportData {
  empleados?: Array<{
    empleado_id: number;
    nombre_completo: string;
    total_ordenes_recibidas: number;
    monto_total_recibido: number;
    total_pagos_procesados: number;
    monto_total_pagos: number;
  }>;
  resumen?: {
    empleado_id: number;
    nombre_completo: string;
    total_ordenes_recibidas: number;
    monto_total_recibido: number;
  };
  ventas_diarias?: Array<{
    fecha: string;
    total_ordenes: number;
    monto_total: number;
  }>;
  servicios_top?: Array<{
    servicio: string;
    cantidad: number;
    monto_total: number;
  }>;
}

interface CustomersReportData {
  clientes: Array<{
    cliente_id: number;
    nombre: string;
    apellidos: string;
    telefono: string;
    email: string;
    total_ordenes: number;
    monto_total: number;
    ultima_visita: string;
    puntos_fidelidad: number;
  }>;
}

interface CashRegisterData {
  pagos: Array<{
    pago_id: number;
    orden_id: number;
    codigo_orden: string;
    cliente: string;
    empleado: string;
    monto: number;
    metodo: string;
    referencia?: string;
    fecha_pago: string;
  }>;
  resumen_por_metodo: Array<{
    metodo: string;
    total_transacciones: number;
    monto_total: number;
  }>;
  total: number;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [reportType, setReportType] = useState<'sales' | 'employees' | 'customers' | 'cashRegister'>('sales');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      let url = '';
      
      // Construir URL según el tipo de reporte
      switch (reportType) {
        case 'sales':
          url = `/api/admin/reports?type=sales&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&groupBy=day`;
          break;
        case 'employees':
          url = `/api/admin/reports?type=employees&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
          break;
        case 'customers':
          url = `/api/admin/reports?type=customers&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=10`;
          break;
        case 'cashRegister':
          url = `/api/admin/reports?type=cashRegister&fecha=${dateRange.endDate}`;
          break;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar los reportes');
      }

      const data = await response.json();
      setReportData(data);

    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Error al cargar los reportes. Intente nuevamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [reportType, dateRange]);

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRefresh = () => {
    loadReports();
  };

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(
        `/api/admin/reports/export?type=${reportType}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&format=${format}`
      );

      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${reportType}_${dateRange.startDate}_${dateRange.endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar el reporte');
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numAmount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const reportTypes = [
    { value: 'sales', label: 'Ventas', icon: TrendingUp },
    { value: 'employees', label: 'Empleados', icon: Activity },
    { value: 'customers', label: 'Clientes', icon: Users },
    { value: 'cashRegister', label: 'Arqueo de Caja', icon: DollarSign }
  ];

  // Calcular métricas para el dashboard
  const getMetrics = () => {
    if (!reportData) return { total: 0, ordenes: 0, ticketPromedio: 0 };

    switch (reportType) {
      case 'sales':
        const totalVentas = reportData.por_periodo?.reduce((sum: number, item: any) => 
          sum + parseFloat(item.total || 0), 0) || 0;
        const totalOrdenes = reportData.por_periodo?.reduce((sum: number, item: any) => 
          sum + parseInt(item.total_ordenes || 0), 0) || 0;
        
        return {
          total: totalVentas,
          ordenes: totalOrdenes,
          ticketPromedio: totalOrdenes > 0 ? totalVentas / totalOrdenes : 0
        };

      case 'employees':
        const totalVentasEmp = reportData.empleados?.reduce((sum: number, item: any) => 
          sum + parseFloat(item.monto_total_recibido || 0), 0) || 0;
        const totalOrdenesEmp = reportData.empleados?.reduce((sum: number, item: any) => 
          sum + parseInt(item.total_ordenes_recibidas || 0), 0) || 0;

        return {
          total: totalVentasEmp,
          ordenes: totalOrdenesEmp,
          ticketPromedio: totalOrdenesEmp > 0 ? totalVentasEmp / totalOrdenesEmp : 0
        };

      case 'customers':
        const totalVentasCli = reportData.clientes?.reduce((sum: number, item: any) => 
          sum + parseFloat(item.monto_total || 0), 0) || 0;
        const totalOrdenesCli = reportData.clientes?.reduce((sum: number, item: any) => 
          sum + parseInt(item.total_ordenes || 0), 0) || 0;

        return {
          total: totalVentasCli,
          ordenes: totalOrdenesCli,
          ticketPromedio: totalOrdenesCli > 0 ? totalVentasCli / totalOrdenesCli : 0
        };

      case 'cashRegister':
        return {
          total: reportData.total || 0,
          ordenes: reportData.pagos?.length || 0,
          ticketPromedio: reportData.pagos?.length > 0 ? (reportData.total || 0) / reportData.pagos.length : 0
        };

      default:
        return { total: 0, ordenes: 0, ticketPromedio: 0 };
    }
  };

  const metrics = getMetrics();

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#313D52]">Reportes y Análisis</h1>
          <p className="text-sm text-[#6c7a89]">Información detallada del rendimiento del negocio</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExportReport('excel')}
            className="inline-flex items-center px-4 py-2 bg-[#f5f9f8] text-[#313D52] rounded-lg border border-[#e0e6e5] hover:bg-[#e0e6e5] transition-colors"
          >
            <Download size={16} className="mr-2" />
            Excel
          </button>

          <button
            onClick={() => handleExportReport('pdf')}
            className="inline-flex items-center px-4 py-2 bg-[#f5f9f8] text-[#313D52] rounded-lg border border-[#e0e6e5] hover:bg-[#e0e6e5] transition-colors"
          >
            <FileText size={16} className="mr-2" />
            PDF
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
        <div className="flex flex-col gap-4">
          {/* Tipo de reporte */}
          <div>
            <label className="block text-sm font-medium text-[#6c7a89] mb-2">
              Tipo de Reporte
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setReportType(type.value as any)}
                    className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${
                      reportType === type.value
                        ? 'bg-[#78f3d3] border-[#78f3d3] text-[#313D52]'
                        : 'bg-white border-[#e0e6e5] text-[#6c7a89] hover:bg-[#f5f9f8]'
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    <span className="text-sm">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fechas */}
          <div className="flex flex-col md:flex-row gap-4">
            {reportType !== 'cashRegister' ? (
              <>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                    Fecha Inicio
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                    Fecha Fin
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => handleDateChange('endDate', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Fecha
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del reporte */}
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
      ) : reportData ? (
        <>
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6c7a89]">
                    {reportType === 'cashRegister' ? 'Total del Día' : 'Total de Ventas'}
                  </p>
                  <p className="text-2xl font-bold text-[#313D52]">
                    {formatCurrency(metrics.total)}
                  </p>
                </div>
                <div className="p-3 bg-[#e0f7f0] rounded-lg">
                  <DollarSign size={24} className="text-[#78f3d3]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6c7a89]">
                    {reportType === 'cashRegister' ? 'Transacciones' : 'Órdenes'}
                  </p>
                  <p className="text-2xl font-bold text-[#313D52]">
                    {metrics.ordenes.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <BarChart3 size={24} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6c7a89]">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-[#313D52]">
                    {formatCurrency(metrics.ticketPromedio)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <TrendingUp size={24} className="text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Contenido específico por tipo de reporte */}
          
          {/* Reporte de Ventas */}
          {reportType === 'sales' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Productos más vendidos */}
              {reportData.por_producto && reportData.por_producto.length > 0 && (
                <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
                  <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
                    <h2 className="font-medium text-[#313D52]">Productos Más Vendidos</h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {reportData.por_producto.slice(0, 5).map((producto: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#313D52]">
                              {producto.producto}
                            </p>
                            <p className="text-xs text-[#6c7a89]">
                              {producto.cantidad} unidades
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-[#313D52]">
                              {formatCurrency(producto.total)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Métodos de pago */}
              {reportData.por_metodo_pago && reportData.por_metodo_pago.length > 0 && (
                <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
                  <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
                    <h2 className="font-medium text-[#313D52]">Métodos de Pago</h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {reportData.por_metodo_pago.map((metodo: any, index: number) => {
                        const porcentaje = metrics.total > 0 ? (parseFloat(metodo.total) / metrics.total) * 100 : 0;
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-[#313D52]">
                                  {metodo.metodo_pago}
                                </span>
                                <span className="text-sm text-[#6c7a89]">
                                  {porcentaje.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-[#f5f9f8] rounded-full h-2">
                                <div
                                  className="bg-[#78f3d3] h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${porcentaje}%` }}
                                />
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <p className="text-sm font-medium text-[#313D52]">
                                {formatCurrency(metodo.total)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reporte de Empleados */}
          {reportType === 'employees' && reportData.empleados && (
            <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
              <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
                <h2 className="font-medium text-[#313D52]">Rendimiento de Empleados</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e0e6e5]">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Empleado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Órdenes Recibidas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Monto Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Pagos Procesados
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e6e5]">
                    {reportData.empleados.map((empleado: any, index: number) => (
                      <tr key={index} className="hover:bg-[#f5f9f8]">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52]">
                          {empleado.nombre_completo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                          {empleado.total_ordenes_recibidas || 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52]">
                          {formatCurrency(empleado.monto_total_recibido)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                          {empleado.total_pagos_procesados || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reporte de Clientes */}
          {reportType === 'customers' && reportData.clientes && (
            <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
              <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
                <h2 className="font-medium text-[#313D52]">Clientes Más Frecuentes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e0e6e5]">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Órdenes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Total Gastado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Última Visita
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e6e5]">
                    {reportData.clientes.map((cliente: any, index: number) => (
                      <tr key={index} className="hover:bg-[#f5f9f8]">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-[#313D52]">
                              {cliente.nombre} {cliente.apellidos}
                            </div>
                            <div className="text-xs text-[#6c7a89]">
                              {cliente.telefono}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                          {cliente.total_ordenes}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52]">
                          {formatCurrency(cliente.monto_total)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                          {formatDate(cliente.ultima_visita)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Arqueo de Caja */}
          {reportType === 'cashRegister' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resumen por método de pago */}
              <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
                <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
                  <h2 className="font-medium text-[#313D52]">Resumen por Método de Pago</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {reportData.resumen_por_metodo?.map((metodo: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#f5f9f8] rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-[#313D52] capitalize">
                            {metodo.metodo}
                          </p>
                          <p className="text-xs text-[#6c7a89]">
                            {metodo.total_transacciones} transacciones
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#313D52]">
                            {formatCurrency(metodo.monto_total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Últimas transacciones */}
              <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
                <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
                  <h2 className="font-medium text-[#313D52]">Últimas Transacciones</h2>
                </div>
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {reportData.pagos?.slice(0, 10).map((pago: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b border-[#e0e6e5] last:border-b-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#313D52]">
                          {pago.codigo_orden}
                        </p>
                        <p className="text-xs text-[#6c7a89]">
                          {pago.cliente} • {pago.metodo}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[#313D52]">
                          {formatCurrency(pago.monto)}
                        </p>
                        <p className="text-xs text-[#6c7a89]">
                          {new Date(pago.fecha_pago).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tabla de datos por período - Solo para ventas */}
          {reportType === 'sales' && reportData.por_periodo && reportData.por_periodo.length > 0 && (
            <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
              <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
                <h2 className="font-medium text-[#313D52]">Ventas por Período</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e0e6e5]">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Período
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Órdenes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Subtotal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Impuestos
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Descuentos
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e6e5]">
                    {reportData.por_periodo.map((periodo: any, index: number) => (
                      <tr key={index} className="hover:bg-[#f5f9f8]">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#313D52]">
                          {formatDate(periodo.periodo)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                          {periodo.total_ordenes}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                          {formatCurrency(periodo.subtotal)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                          {formatCurrency(periodo.impuestos)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                          {formatCurrency(periodo.descuentos)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52]">
                          {formatCurrency(periodo.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Servicios más vendidos - Solo para ventas */}
          {reportType === 'sales' && reportData.por_servicio && reportData.por_servicio.length > 0 && (
            <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
              <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
                <h2 className="font-medium text-[#313D52]">Servicios Más Solicitados</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportData.por_servicio.slice(0, 6).map((servicio: any, index: number) => (
                    <div key={index} className="bg-[#f5f9f8] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Package size={20} className="text-[#78f3d3]" />
                        <span className="text-xs text-[#6c7a89]">
                          {servicio.cantidad} servicios
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-[#313D52] mb-1">
                        {servicio.servicio}
                      </h3>
                      <p className="text-lg font-bold text-[#313D52]">
                        {formatCurrency(servicio.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-[#6c7a89]">
          <p>No hay datos disponibles para el período seleccionado</p>
        </div>
      )}
    </div>
  );
}