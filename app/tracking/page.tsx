// app/tracking/page.tsx - Versión mejorada con soporte unificado
'use client'
import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Clock, 
  Calendar, 
  Truck, 
  User,
  MapPin,
  FileText,
  CreditCard,
  ArrowRight
} from 'lucide-react';

interface TrackingService {
  cantidad: number;
  descripcion_calzado: string;
  marca_calzado?: string;
  modelo_calzado?: string;
  marca?: string;
  modelo?: string;
  servicio_nombre: string;
  servicio_descripcion: string;
  precio_unitario: string | number;
  subtotal: string | number;
}

interface TrackingHistorial {
  estado: string;
  descripcion: string;
  fecha: string;
  empleado: string;
  comentario?: string;
}

interface TrackingData {
  codigo: string;
  tipo: 'orden' | 'reservacion';
  cliente: {
    nombre: string;
    apellidos?: string;
    telefono: string;
    email: string;
  };
  fechaCreacion: string;
  notas?: string;
  
  // Para órdenes
  estadoActual?: {
    nombre: string;
    descripcion: string;
    color: string;
  };
  servicios?: TrackingService[];
  productos?: any[];
  historial?: TrackingHistorial[];
  totales?: {
    subtotal: number;
    impuestos: number;
    total: number;
  };
  fechas?: {
    recepcion: string;
    entregaEstimada: string;
    entregaReal?: string;
  };
  pago?: {
    estado: string;
    metodo: string;
  };
  reservacionOriginal?: string;
  
  // Para reservaciones
  servicio?: {
    nombre: string;
    descripcion: string;
    precio: number;
    calzado: {
      marca?: string;
      modelo?: string;
      descripcion?: string;
    };
  };
  direccion?: {
    completa: string;
    detalles: any;
  };
}

interface SearchStatus {
  status: 'idle' | 'searching' | 'success' | 'error';
  message: string;
}

const getStatusStep = (estadoActual: any, tipo: string): number => {
  if (tipo === 'reservacion') {
    // Para reservaciones, solo mostrar paso 1 (recibida)
    return 1;
  }
  
  if (!estadoActual?.nombre) return 1;
  
  const estado = estadoActual.nombre.toLowerCase().trim();
  
  // Mapeo mejorado de estados
  const statusMap: { [key: string]: number } = {
    // Estados iniciales
    'recibida': 1,
    'pendiente': 1,
    'creada': 1,
    'received': 1,
    
    // Estados en proceso
    'en proceso': 2,
    'procesando': 2,
    'lavando': 2,
    'secando': 2,
    'en limpieza': 2,
    
    // Estados listos
    'listo': 3,
    'completado': 3,
    'terminado': 3,
    'listo para entrega': 3,
    
    // Estados entregados
    'entregado': 4,
    'entregada': 4,
    'finalizado': 4
  };
  
  return statusMap[estado] || 1;
};

const getStatusLabel = (step: number): string => {
  const labels = [
    'Recibida',
    'En Proceso', 
    'Listo',
    'Entregado'
  ];
  
  return labels[step - 1] || 'Pendiente';
};

const getStatusDescription = (step: number): string => {
  const descriptions = [
    'Tu calzado ha sido recibido en nuestra lavandería',
    'Tu calzado está siendo procesado y limpiado',
    'Tu calzado está listo para ser entregado',
    'Tu calzado ha sido entregado exitosamente'
  ];
  
  return descriptions[step - 1] || 'Estado no disponible';
};

const TrackingPage: React.FC = () => {
  const [reference, setReference] = useState<string>('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
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
      const response = await fetch(`/api/track/${encodeURIComponent(reference.trim())}`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'No se encontró el pedido');
      }
      
      setTrackingData(data.data);
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
      setTrackingData(null);
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

  const currentStep = trackingData ? getStatusStep(trackingData.estadoActual, trackingData.tipo) : 1;
  const isReservation = trackingData?.tipo === 'reservacion';

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
              Introduce tu código de referencia para conocer el estado actual de tu servicio de limpieza o reservación.
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
                  placeholder="Código de referencia (ej. ORD123456, RES123456)"
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
          
          {trackingData && (
            <div className="bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(49,61,82,0.1),0_4px_6px_-2px_rgba(49,61,82,0.05)] overflow-hidden">
              {/* Header */}
              <div className="bg-[#313D52] p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {isReservation ? 'Reservación' : 'Orden'} de Servicio
                    </h2>
                    {trackingData.reservacionOriginal && (
                      <p className="text-sm text-[#78f3d3] mt-1">
                        Originalmente reservación: {trackingData.reservacionOriginal}
                      </p>
                    )}
                  </div>
                  <span className="text-sm px-3 py-1 bg-[#78f3d3] text-[#313D52] rounded-full font-medium">
                    {trackingData.codigo}
                  </span>
                </div>
              </div>

              {/* Información del cliente */}
              <div className="p-6 border-b border-[#e0e6e5]">
                <div className="flex items-center mb-4">
                  <User size={18} className="text-[#78f3d3] mr-2" />
                  <h3 className="font-semibold text-[#313D52]">Información del Cliente</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-[#6c7a89] mb-1">Cliente</h4>
                    <p className="text-[#313D52] font-medium">
                      {trackingData.cliente.nombre} {trackingData.cliente.apellidos || ''}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#6c7a89] mb-1">Contacto</h4>
                    <p className="text-[#313D52]">{trackingData.cliente.email}</p>
                    <p className="text-[#313D52]">{trackingData.cliente.telefono}</p>
                  </div>
                </div>
              </div>

              {/* Servicios */}
              <div className="p-6 border-b border-[#e0e6e5]">
                <div className="flex items-center mb-4">
                  <Package size={18} className="text-[#78f3d3] mr-2" />
                  <h3 className="font-semibold text-[#313D52]">
                    {isReservation ? 'Servicio Reservado' : 'Servicios Solicitados'}
                  </h3>
                </div>
                
                {isReservation && trackingData.servicio ? (
                  // Vista para reservaciones
                  <div className="bg-[#f5f9f8] p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-[#313D52] font-medium">{trackingData.servicio.nombre}</p>
                        <p className="text-sm text-[#6c7a89] mb-2">{trackingData.servicio.descripcion}</p>
                        <div className="text-sm text-[#6c7a89]">
                          <span className="font-medium">Calzado:</span>{' '}
                          {trackingData.servicio.calzado.marca} {trackingData.servicio.calzado.modelo}
                          {trackingData.servicio.calzado.descripcion && (
                            <span> - {trackingData.servicio.calzado.descripcion}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-[#313D52] font-medium">
                          {formatCurrency(trackingData.servicio.precio)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : trackingData.servicios && trackingData.servicios.length > 0 ? (
                  // Vista para órdenes con múltiples servicios
                  <div className="space-y-3">
                    {trackingData.servicios.map((servicio, index) => (
                      <div key={index} className="bg-[#f5f9f8] p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-[#313D52] font-medium">{servicio.servicio_nombre}</p>
                            <p className="text-sm text-[#6c7a89] mb-2">{servicio.servicio_descripcion}</p>
                            <div className="text-sm text-[#6c7a89]">
                              <span className="font-medium">Calzado:</span>{' '}
                              {servicio.marca_calzado || servicio.marca} {servicio.modelo_calzado || servicio.modelo}
                              {servicio.descripcion_calzado && (
                                <span> - {servicio.descripcion_calzado}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-[#313D52] font-medium">
                              {formatCurrency(servicio.subtotal)}
                            </p>
                            <p className="text-xs text-[#6c7a89]">
                              {servicio.cantidad}x {formatCurrency(servicio.precio_unitario)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#6c7a89]">No hay servicios disponibles</p>
                )}
              </div>

              {/* Información adicional para órdenes */}
              {!isReservation && (
                <div className="p-6 border-b border-[#e0e6e5]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {trackingData.fechas && (
                      <div>
                        <h4 className="text-sm font-medium text-[#6c7a89] mb-1">Fecha de Recepción</h4>
                        <p className="text-[#313D52]">{formatDate(trackingData.fechas.recepcion)}</p>
                      </div>
                    )}
                    
                    {trackingData.fechas?.entregaEstimada && (
                      <div>
                        <h4 className="text-sm font-medium text-[#6c7a89] mb-1">Entrega Estimada</h4>
                        <p className="text-[#313D52]">{formatDate(trackingData.fechas.entregaEstimada)}</p>
                      </div>
                    )}
                    
                    {trackingData.pago && (
                      <div>
                        <h4 className="text-sm font-medium text-[#6c7a89] mb-1">Estado del Pago</h4>
                        <div className="flex items-center">
                          <CreditCard size={16} className="text-[#6c7a89] mr-1" />
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            trackingData.pago.estado === 'pagado' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {trackingData.pago.estado}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {trackingData.totales && (
                    <div className="mt-6 bg-[#f5f9f8] p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-[#313D52] font-medium">Total del Servicio</span>
                        <span className="text-[#313D52] font-bold text-lg">
                          {formatCurrency(trackingData.totales.total)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dirección para reservaciones */}
              {isReservation && trackingData.direccion && (
                <div className="p-6 border-b border-[#e0e6e5]">
                  <div className="flex items-center mb-3">
                    <MapPin size={18} className="text-[#78f3d3] mr-2" />
                    <h3 className="font-semibold text-[#313D52]">Dirección de Servicio</h3>
                  </div>
                  <p className="text-[#313D52] whitespace-pre-line">{trackingData.direccion.completa}</p>
                </div>
              )}

              {/* Estado del servicio */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[#313D52] mb-6">Estado del Servicio</h3>
                
                {isReservation ? (
                  // Vista especial para reservaciones
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e0f7f0] rounded-full mb-4">
                      <Calendar size={32} className="text-[#78f3d3]" />
                    </div>
                    <h4 className="text-lg font-semibold text-[#313D52] mb-2">Reservación Confirmada</h4>
                    <p className="text-[#6c7a89] mb-4">
                      Tu reservación está confirmada. Te contactaremos pronto para coordinar la recolección.
                    </p>
                    <div className="bg-[#e0f7f0] p-4 rounded-lg inline-block">
                      <p className="text-sm text-[#313D52]">
                        <strong>Fecha de reservación:</strong> {formatDate(trackingData.fechaCreacion)}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Vista de progreso para órdenes
                  <>
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
                        <p className="text-[#313D52] font-medium">
                          Estado actual: {trackingData.estadoActual?.nombre || 'En proceso'}
                        </p>
                        <p className="text-sm text-[#6c7a89]">
                          {trackingData.estadoActual?.descripcion || getStatusDescription(currentStep)}
                        </p>
                      </div>
                    </div>

                    {/* Historial de estados */}
                    {trackingData.historial && trackingData.historial.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-[#313D52] mb-4">Historial de Estados</h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {trackingData.historial.map((evento, index) => (
                            <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="text-[#313D52] font-medium">{evento.estado}</p>
                                <p className="text-sm text-[#6c7a89]">{evento.descripcion}</p>
                                {evento.comentario && (
                                  <p className="text-xs text-[#6c7a89] mt-1">{evento.comentario}</p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-xs text-[#6c7a89]">{formatDate(evento.fecha)}</p>
                                {evento.empleado && (
                                  <p className="text-xs text-[#6c7a89]">{evento.empleado}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Notas adicionales */}
              {trackingData.notas && (
                <div className="p-6 border-t border-[#e0e6e5]">
                  <div className="flex items-center mb-3">
                    <FileText size={18} className="text-[#78f3d3] mr-2" />
                    <h3 className="font-semibold text-[#313D52]">Notas</h3>
                  </div>
                  <p className="text-[#313D52] whitespace-pre-wrap">{trackingData.notas}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </main>
  );
};

export default TrackingPage;