// app/tracking/page.tsx - Versión corregida final
'use client'
import React, { useState } from 'react';
// app/tracking/page.tsx
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

import { Search, Loader2, CheckCircle, AlertCircle, Package, Clock, Calendar, Truck } from 'lucide-react';

interface BookingService {
  cantidad: number;
  descripcion_calzado: string;
  marca_calzado: string;
  modelo_calzado: string;
  servicio_nombre: string;
  servicio_descripcion: string;
  precio_unitario: string;
  subtotal: string;
}

interface BookingDetails {
  id: number;
  codigo_orden?: string;
  codigo_reservacion?: string;
  cliente_nombre?: string;
  cliente_apellidos?: string;
  cliente_email?: string;
  servicio_nombre?: string;
  marca?: string;
  modelo?: string;
  delivery_method?: string;
  status?: string;
  estado?: string;
  fecha_reservacion?: string;
  fecha_recepcion?: string;
  created_at: string;
  type: 'order' | 'reservation';
  servicios?: BookingService[];
  total?: string;
}

interface SearchStatus {
  status: 'idle' | 'searching' | 'success' | 'error';
  message: string;
}

const getStatusStep = (status: string, type?: string): number => {
  if (!status) return 4;
  
  const normalizedStatus = status.toLowerCase().trim();

  // Mapeo de estados exactamente como los diste
  const statusMap: { [key: string]: number } = {
    // Estados básicos
    'recibida': 1,
    'received': 1,
    'pendiente': 1,
    'creada': 1,

    // Descripciones exactas
    'el calzado ha sido recibido en la lavandería': 1,
    'el calzado está siendo procesado': 2,
    'el calzado está listo para ser entregado': 3,
    'el calzado ha sido entregado al cliente': 4,
  };

  return statusMap[normalizedStatus] || 1; // Por defecto 5
};

const getStatusLabel = (step: number): string => {
  const labels = [
    'Recibida',
    'En Proceso', 
    'Completada',
    'Entregada'
  ];
  
  return labels[step - 1] || 'Pendiente';
};

const TrackingPage: React.FC = () => {
  const [reference, setReference] = useState<string>('');
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>({
    status: 'idle',
    message: ''
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reference.trim()) {
      setSearchStatus({
        status: 'error',
        message: 'Por favor, introduce un código de referencia'
      });
      return;
    }
    
    setSearchStatus({
      status: 'searching',
      message: 'Buscando tu pedido...'
    });
    
    try {
      const response = await fetch(`/api/booking?reference=${encodeURIComponent(reference.trim())}`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'No se encontró el pedido');
      }
      
      setBookingDetails(data.booking);
      setSearchStatus({
        status: 'success',
        message: 'Pedido encontrado'
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'No se encontró el pedido'
      });
      setBookingDetails(null);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'No disponible';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatCurrency = (amount: string | number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numAmount || 0);
  };

  const currentStatus = bookingDetails?.status || bookingDetails?.estado || 'pendiente';
  const currentStep = getStatusStep(currentStatus, bookingDetails?.type);

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-24 pb-16 bg-[#f5f9f8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-[#313D52] sm:text-4xl mb-4">
              Rastrear mi Pedido
            </h1>
            <p className="text-[#6c7a89] max-w-2xl mx-auto">
              Introduce tu código de referencia para conocer el estado actual de tu servicio de limpieza o restauración.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(49,61,82,0.1),0_4px_6px_-2px_rgba(49,61,82,0.05)] p-6 mb-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={20} className="text-[#6c7a89]" />
                </div>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  placeholder="Código de referencia (ej. ORD2025052605969, RES-001)"
                  className="w-full pl-10 pr-4 py-3 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                />
              </div>
              <button
                type="submit"
                disabled={searchStatus.status === 'searching'}
                className={`px-6 py-3 bg-[#78f3d3] text-[#313D52] font-semibold rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center justify-center min-w-[120px] ${
                  searchStatus.status === 'searching' ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {searchStatus.status === 'searching' ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Buscando...
                  </>
                ) : (
                  'Buscar'
                )}
              </button>
            </form>
            
            {searchStatus.status === 'error' && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-start">
                <AlertCircle size={20} className="flex-shrink-0 mr-2 mt-0.5" />
                <span>{searchStatus.message}</span>
              </div>
            )}
          </div>
          
          {bookingDetails && (
            <div className="bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(49,61,82,0.1),0_4px_6px_-2px_rgba(49,61,82,0.05)] overflow-hidden">
              <div className="bg-[#313D52] p-6 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Detalles del {bookingDetails.type === 'order' ? 'Pedido' : 'Reserva'}
                  </h2>
                  <span className="text-sm px-3 py-1 bg-[#78f3d3] text-[#313D52] rounded-full font-medium">
                    {bookingDetails.codigo_orden || bookingDetails.codigo_reservacion}
                  </span>
                </div>
              </div>
              
              {/* Información del pedido */}
              <div className="p-6 border-b border-[#e0e6e5]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-[#6c7a89] mb-1">Cliente</h3>
                    <p className="text-[#313D52] font-medium">
                      {bookingDetails.cliente_nombre && bookingDetails.cliente_apellidos 
                        ? `${bookingDetails.cliente_nombre} ${bookingDetails.cliente_apellidos}` 
                        : 'No disponible'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-[#6c7a89] mb-1">Correo Electrónico</h3>
                    <p className="text-[#313D52]">{bookingDetails.cliente_email || 'No disponible'}</p>
                  </div>
                  
                  {/* Servicios - Mostrar todos los servicios */}
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-[#6c7a89] mb-2">Servicios Solicitados</h3>
                    {bookingDetails.servicios && bookingDetails.servicios.length > 0 ? (
                      <div className="space-y-2">
                        {bookingDetails.servicios.map((servicio, index) => (
                          <div key={index} className="bg-[#f5f9f8] p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-[#313D52] font-medium">{servicio.servicio_nombre}</p>
                                <p className="text-sm text-[#6c7a89]">{servicio.servicio_descripcion}</p>
                                <div className="mt-1 text-sm text-[#6c7a89]">
                                  <span className="font-medium">Calzado:</span> {servicio.marca_calzado} {servicio.modelo_calzado}
                                  {servicio.descripcion_calzado && (
                                    <span> - {servicio.descripcion_calzado}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-[#313D52] font-medium">{formatCurrency(servicio.subtotal)}</p>
                                <p className="text-xs text-[#6c7a89]">
                                  {servicio.cantidad}x {formatCurrency(servicio.precio_unitario)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#313D52]">{bookingDetails.servicio_nombre || 'No disponible'}</p>
                    )}
                  </div>
                  
                  {bookingDetails.delivery_method && (
                    <div>
                      <h3 className="text-sm font-medium text-[#6c7a89] mb-1">Método de Entrega</h3>
                      <p className="text-[#313D52]">{bookingDetails.delivery_method}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-[#6c7a89] mb-1">
                      Fecha de {bookingDetails.type === 'order' ? 'Recepción' : 'Reserva'}
                    </h3>
                    <p className="text-[#313D52]">
                      {formatDate(
                        bookingDetails.fecha_recepcion || 
                        bookingDetails.fecha_reservacion || 
                        bookingDetails.created_at
                      )}
                    </p>
                  </div>

                  {/* Total si está disponible */}
                  {bookingDetails.total && (
                    <div>
                      <h3 className="text-sm font-medium text-[#6c7a89] mb-1">Total</h3>
                      <p className="text-[#313D52] font-bold text-lg">{formatCurrency(bookingDetails.total)}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Estado del pedido */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[#313D52] mb-6">Estado del Servicio</h3>
                
                <div className="relative mb-8">
                  {/* Línea de progreso */}
                  <div className="absolute top-5 left-0 right-0 h-1 bg-[#e0e6e5] rounded-full"></div>
                  <div 
                    className="absolute top-5 left-0 h-1 bg-[#78f3d3] transition-all duration-500 rounded-full"
                    style={{ width: `${(currentStep / 4) * 100}%` }}
                  ></div>
                  
                  {/* Pasos de estado */}
                  <div className="flex justify-between">
                    {[1, 2, 3, 4].map((step) => {
                      const isActive = step <= currentStep;
                      const isCurrent = step === currentStep;
                      
                      return (
                        <div key={step} className="flex flex-col items-center relative">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                              isCurrent 
                                ? 'bg-[#78f3d3] text-[#313D52] ring-4 ring-[#e0f7f0] shadow-lg scale-110'
                                : isActive 
                                  ? 'bg-[#78f3d3] text-[#313D52]' 
                                  : 'bg-[#e0e6e5] text-[#6c7a89]'
                            }`}
                          >
                            {step === 1 && <Package size={18} />}
                            {step === 2 && <Clock size={18} />}
                            {step === 3 && <CheckCircle size={18} />}
                            {step === 4 && <Truck size={18} />}
                          </div>
                          <p className={`text-xs font-medium mt-2 text-center w-20 transition-colors ${
                            isCurrent ? 'text-[#78f3d3] font-bold' : isActive ? 'text-[#313D52]' : 'text-[#6c7a89]'
                          }`}>
                            {getStatusLabel(step)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="p-4 bg-[#e0f7f0] rounded-lg flex items-start">
                  <Calendar size={20} className="text-[#78f3d3] flex-shrink-0 mr-3 mt-0.5" />
                  <div>
                    <p className="text-[#313D52] font-medium">Estado actual: {currentStatus}</p>
                    <p className="text-sm text-[#6c7a89]">
                      Progreso: Paso {currentStep} de 4 - {getStatusLabel(currentStep)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </main>
  );
};

export default TrackingPage;