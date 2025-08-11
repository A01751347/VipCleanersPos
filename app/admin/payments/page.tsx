'use client'
import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  DollarSign,
  CreditCard,
  RefreshCw,
  Smartphone,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Filter,
  User,
  Calculator,
  Printer,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface PaymentSummary {
  metodo: string;
  total_transacciones: number;
  monto_total: number;
  // Campos adicionales para el arqueo correcto
  total_cambio_dado?: number;
  monto_fisico_recibido?: number;
}

interface Payment {
  pago_id: number;
  orden_id: number;
  codigo_orden: string;
  cliente: string;
  empleado: string;
  monto: number; // Monto real de la venta (orden.total)
  monto_recibido?: number; // Monto físicamente recibido
  cambio_dado?: number; // Cambio entregado al cliente
  metodo: string;
  referencia?: string;
  terminal_id?: string;
  fecha_pago: string;
  estado?: string;
}

interface CashRegisterReport {
  pagos: Payment[];
  resumen_por_metodo: PaymentSummary[];
  total: number;
  total_fisico_recibido?: number;
  total_cambio_dado?: number;
}

export default function PaymentsPage() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState<string>(localDate);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [report, setReport] = useState<CashRegisterReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCashDetails, setShowCashDetails] = useState(false);

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/admin/employees');
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const loadCashRegister = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      // Usar directamente el endpoint de reportes corregido
      let url = `/api/admin/reports?type=cashRegister&fecha=${selectedDate}`;
      if (selectedEmployee) {
        url += `&empleadoId=${selectedEmployee}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar el arqueo de caja');
      }

      const data = await response.json();
      
      setReport({
        pagos: data.pagos || [],
        resumen_por_metodo: data.resumen_por_metodo || [],
        total: data.total || 0,
        total_fisico_recibido: data.total_fisico_recibido || 0,
        total_cambio_dado: data.total_cambio_dado || 0
      });

    } catch (err) {
      console.error('Error fetching cash register:', err);
      setError('Error al cargar el arqueo de caja. Intente nuevamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadCashRegister();
  }, [selectedDate, selectedEmployee]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEmployee(e.target.value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'efectivo': return <DollarSign size={20} />;
      case 'tarjeta': return <CreditCard size={20} />;
      case 'transferencia': return <RefreshCw size={20} />;
      case 'mercado_pago': return <Smartphone size={20} />;
      default: return <DollarSign size={20} />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'transferencia': return 'Transferencia';
      case 'mercado_pago': return 'Mercado Pago';
      default: return method;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/admin/reports/export?type=cashRegister&fecha=${selectedDate}${
          selectedEmployee ? `&empleadoId=${selectedEmployee}` : ''
        }&format=excel`
      );

      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arqueo_caja_${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  };

  // Calcular totales por método de pago para efectivo
  const getCashSummary = () => {
    const cashPayments = report?.pagos.filter(p => p.metodo === 'efectivo') || [];
    const totalVentas = cashPayments.reduce((sum, p) => sum + p.monto, 0);
    const totalRecibido = cashPayments.reduce((sum, p) => sum + (p.monto_recibido || p.monto), 0);
    const totalCambio = cashPayments.reduce((sum, p) => sum + (p.cambio_dado || 0), 0);
    
    return {
      totalVentas,
      totalRecibido,
      totalCambio,
      diferencia: totalRecibido - totalVentas - totalCambio
    };
  };

  const cashSummary = getCashSummary();

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#313D52]">Arqueo de Caja</h1>
          <p className="text-sm text-[#6c7a89]">Control de pagos y cierre de caja diario</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 bg-[#f5f9f8] text-[#313D52] rounded-lg border border-[#e0e6e5] hover:bg-[#e0e6e5] transition-colors print:hidden"
          >
            <Printer size={16} className="mr-2" />
            Imprimir
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-[#f5f9f8] text-[#313D52] rounded-lg border border-[#e0e6e5] hover:bg-[#e0e6e5] transition-colors print:hidden"
          >
            <Download size={16} className="mr-2" />
            Exportar
          </button>

          <button
            className="inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
            onClick={loadCashRegister}
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
      <div className="bg-white rounded-lg border border-[#e0e6e5] p-4 print:hidden">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="date" className="block text-sm font-medium text-[#6c7a89] mb-1">
              Fecha
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
              />
            </div>
          </div>

          <div className="flex-1">
            <label htmlFor="employee" className="block text-sm font-medium text-[#6c7a89] mb-1">
              Empleado
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
              <select
                id="employee"
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] appearance-none"
              >
                <option value="">Todos los empleados</option>
                {employees.map((emp) => (
                  <option key={emp.empleado_id} value={emp.empleado_id}>
                    {emp.nombre} {emp.apellidos}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          <p>{error}</p>
          <button
            onClick={loadCashRegister}
            className="mt-4 px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {report?.resumen_por_metodo.map((metodo) => (
              <div key={metodo.metodo} className="bg-white rounded-lg border border-[#e0e6e5] p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-[#f5f9f8] rounded-lg">
                    {getPaymentIcon(metodo.metodo)}
                  </div>
                  <span className="text-xs text-[#6c7a89]">
                    {metodo.total_transacciones} trans.
                  </span>
                </div>
                <h3 className="text-sm text-[#6c7a89] mb-1">
                  {getPaymentMethodName(metodo.metodo)}
                </h3>
                <p className="text-lg font-bold text-[#313D52]">
                  {formatCurrency(metodo.monto_total)}
                </p>
                {/* Mostrar información adicional para efectivo */}
                {metodo.metodo === 'efectivo' && metodo.monto_fisico_recibido && (
                  <div className="mt-2 text-xs text-[#6c7a89]">
                    <p>Recibido: {formatCurrency(metodo.monto_fisico_recibido)}</p>
                    {metodo.total_cambio_dado && metodo.total_cambio_dado > 0 && (
                      <p>Cambio: {formatCurrency(metodo.total_cambio_dado)}</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Total general */}
            <div className="bg-[#313D52] text-white rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Calculator size={20} />
                </div>
                <span className="text-xs opacity-75">
                  {report?.pagos.length || 0} pagos
                </span>
              </div>
              <h3 className="text-sm opacity-75 mb-1">Total Ventas</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(report?.total || 0)}
              </p>
            </div>
          </div>

          {/* Resumen de efectivo detallado */}
          {cashSummary.totalVentas > 0 && (
            <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
              <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5] flex justify-between items-center">
                <h2 className="font-medium text-[#313D52]">Resumen de Efectivo</h2>
                <button
                  onClick={() => setShowCashDetails(!showCashDetails)}
                  className="text-sm text-[#78f3d3] hover:underline print:hidden flex items-center"
                >
                  {showCashDetails ? <EyeOff size={16} className="mr-1" /> : <Eye size={16} className="mr-1" />}
                  {showCashDetails ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              
              {showCashDetails && (
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-[#6c7a89]">Ventas en Efectivo</p>
                      <p className="text-lg font-bold text-[#313D52]">
                        {formatCurrency(cashSummary.totalVentas)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-[#6c7a89]">Efectivo Recibido</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(cashSummary.totalRecibido)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-[#6c7a89]">Cambio Entregado</p>
                      <p className="text-lg font-bold text-red-600">
                        -{formatCurrency(cashSummary.totalCambio)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-[#6c7a89]">Diferencia</p>
                      <p className={`text-lg font-bold ${
                        cashSummary.diferencia === 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(Math.abs(cashSummary.diferencia))}
                        {cashSummary.diferencia !== 0 && (
                          <AlertCircle size={16} className="inline ml-1" />
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detalle de transacciones */}
          <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
            <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5] flex justify-between items-center">
              <h2 className="font-medium text-[#313D52]">Detalle de Pagos</h2>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-[#78f3d3] hover:underline print:hidden flex items-center"
              >
                {showDetails ? <EyeOff size={16} className="mr-1" /> : <Eye size={16} className="mr-1" />}
                {showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
              </button>
            </div>

            {(showDetails || window.matchMedia('print').matches) && (
              <div className="overflow-x-auto">
                {report?.pagos && report.pagos.length > 0 ? (
                  <table className="min-w-full divide-y divide-[#e0e6e5]">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                          Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                          Orden
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                          Método
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                          Referencia
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                          Empleado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                          Monto Venta
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-[#6c7a89] uppercase tracking-wider print:hidden">
                          Recibido
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-[#6c7a89] uppercase tracking-wider print:hidden">
                          Cambio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e0e6e5]">
                      {report.pagos.map((pago) => (
                        <tr key={pago.pago_id} className="hover:bg-[#f5f9f8]">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                            {new Date(pago.fecha_pago).toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52]">
                            {pago.codigo_orden}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#313D52]">
                            {pago.cliente}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="flex items-center text-sm text-[#313D52]">
                              {getPaymentIcon(pago.metodo)}
                              <span className="ml-2">{getPaymentMethodName(pago.metodo)}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                            {pago.referencia || pago.terminal_id || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                            {pago.empleado}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52] text-right">
                            {formatCurrency(pago.monto)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89] text-right print:hidden">
                            {pago.monto_recibido ? formatCurrency(pago.monto_recibido) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89] text-right print:hidden">
                            {pago.cambio_dado ? formatCurrency(pago.cambio_dado) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#f5f9f8]">
                        <td colSpan={6} className="px-4 py-3 text-right font-medium text-[#313D52]">
                          Total Ventas:
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#313D52]">
                          {formatCurrency(report.total)}
                        </td>
                        <td className="px-4 py-3 print:hidden"></td>
                        <td className="px-4 py-3 print:hidden"></td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="text-center py-8 text-[#6c7a89]">
                    <DollarSign size={48} className="mx-auto mb-4 text-[#e0e6e5]" />
                    <p>No hay pagos registrados para esta fecha</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Información de cierre - solo impresión */}
          <div className="hidden print:block mt-8 border-t pt-4">
            <div className="text-center">
              <p className="text-sm text-[#6c7a89]">
                Arqueo de caja generado el {new Date().toLocaleString('es-MX')}
              </p>
              <p className="text-sm text-[#6c7a89] mt-2">
                Fecha de corte: {new Date(selectedDate).toLocaleDateString('es-MX')}
              </p>
              {selectedEmployee && (
                <p className="text-sm text-[#6c7a89]">
                  Empleado: {employees.find(e => e.empleado_id.toString() === selectedEmployee)?.nombre} {employees.find(e => e.empleado_id.toString() === selectedEmployee)?.apellidos}
                </p>
              )}
              <p className="mt-8">
                _______________________________
              </p>
              <p className="text-sm text-[#6c7a89]">Firma del responsable</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}