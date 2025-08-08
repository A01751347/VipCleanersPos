'use client'
import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  Search, 
  Loader2, 
  AlertCircle, 
  Package, 
  Phone,
  Clock, 
  Calendar, 
  Truck, 
  User,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle,
  X
} from 'lucide-react';

// Types and interfaces
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

// Utility functions
const getStatusStep = (estadoActual: any, tipo: string): number => {
  if (tipo === 'reservacion') return 0; // Reservations start at "Pendiente"
  if (!estadoActual?.nombre) return 0;
  
  const estado = estadoActual.nombre.toLowerCase().trim();
  const statusMap: { [key: string]: number } = {
    'pendiente': 0,
    'recibido': 1, 'creada': 1, 'received': 1,
    'en proceso': 2, 'procesando': 2, 'lavando': 2, 'secando': 2, 'en limpieza': 2,
    'listo': 3, 'completado': 3, 'terminado': 3, 'listo para entrega': 3,
    'entregado': 4, 'entregada': 4, 'finalizado': 4
  };
  
  return statusMap[estado] !== undefined ? statusMap[estado] : 0;
};

const getStatusLabel = (step: number): string => {
  const labels = ['Pendiente', 'Recibido', 'En Proceso', 'Listo', 'Entregado'];
  return labels[step] || 'Desconocido';
};

const getStatusDescription = (step: number): string => {
  const descriptions = [
    'Tu pedido ha sido recibido y está pendiente de procesamiento',
    'Tu calzado ha sido recibido en nuestra lavandería',
    'Tu calzado está siendo procesado y limpiado',
    'Tu calzado está listo para ser entregado',
    'Tu calzado ha sido entregado exitosamente'
  ];
  return descriptions[step] || 'Estado no disponible';
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

// Main component
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
      
      if (!response.ok) {
        throw new Error(data.error || 'No se encontró el pedido');
      }
      
      setTrackingData(data.data);
      setSearchStatus({
        status: 'success',
        message: 'Pedido encontrado'
      });
    } catch (error) {
      setSearchStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'No se encontró el pedido'
      });
      setTrackingData(null);
    }
  };

  const handleNewSearch = () => {
    setReference('');
    setTrackingData(null);
    setSearchStatus({ status: 'idle', message: '' });
  };

  const showCompactSearch = trackingData || searchStatus.status === 'error';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f5f9f8] to-white">
      <Navbar />
      
      {/* Main Content - Smooth layout without jarring transitions */}
      <main className="flex-1 pt-20">
        {/* Hero and Search Section - Always show, but modify when results exist */}
        {!trackingData && searchStatus.status !== 'error' ? (
          <>
            <HeroSection />
            <SearchSection 
              reference={reference}
              setReference={setReference}
              handleSearch={handleSearch}
              searchStatus={searchStatus}
            />
          </>
        ) : (
          // Compact search - Only appears in content area, not sticky
          <div className="py-6">
            <CompactSearchBar 
              reference={reference}
              setReference={setReference}
              handleSearch={handleSearch}
              handleNewSearch={handleNewSearch}
              searchStatus={searchStatus}
            />
          </div>
        )}
        
        {/* Results Section */}
        {trackingData && (
          <ResultsSection trackingData={trackingData} />
        )}
        
        {/* Error State */}
        {searchStatus.status === 'error' && !trackingData && (
          <ErrorSection searchStatus={searchStatus} />
        )}
        
        {/* Empty State */}
        {!trackingData && searchStatus.status === 'idle' && (
          <EmptyState />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

// Compact search bar component - Much more subtle and integrated
const CompactSearchBar: React.FC<{
  reference: string;
  setReference: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  handleNewSearch: () => void;
  searchStatus: SearchStatus;
}> = ({ reference, setReference, handleSearch, handleNewSearch, searchStatus }) => (
  <div className="bg-white/80 backdrop-blur-sm border-b border-[#e0e6e5]/50">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-[#6c7a89]" />
              </div>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder="Buscar otro pedido..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-1 focus:ring-[#78f3d3] focus:ring-opacity-20 transition-all bg-white/90"
              />
            </div>
            <button
              type="submit"
              disabled={searchStatus.status === 'searching'}
              className="px-4 py-2 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center text-sm"
            >
              {searchStatus.status === 'searching' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
            </button>
          </form>
        </div>
        <button
          onClick={handleNewSearch}
          className="p-2 text-[#6c7a89] hover:text-[#313D52] hover:bg-[#f5f9f8] rounded-lg transition-colors"
          title="Nueva búsqueda"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  </div>
);

// Hero section component
const HeroSection: React.FC = () => (
  <section className="relative py-16 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-[#78f3d3] bg-opacity-20 rounded-full mb-6">
        <Search size={40} className="text-[#313D52]" />
      </div>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#313D52] mb-6">
        Rastrear mi <span className="text-[#78f3d3]">Pedido</span>
      </h1>
      <p className="text-lg md:text-xl text-[#6c7a89] max-w-3xl mx-auto leading-relaxed">
        Mantente informado sobre el estado de tu servicio de limpieza. 
        Introduce tu código de referencia para conocer cada paso del proceso.
      </p>
    </div>
  </section>
);

// Search section component
const SearchSection: React.FC<{
  reference: string;
  setReference: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  searchStatus: SearchStatus;
}> = ({ reference, setReference, handleSearch, searchStatus }) => (
  <section className="py-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="relative">
            <label htmlFor="reference" className="block text-sm font-medium text-[#313D52] mb-2">
              Código de Referencia
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-[#6c7a89]" />
              </div>
              <input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder="ORD123456 o RES123456"
                className="w-full pl-12 pr-4 py-4 border-2 border-[#e0e6e5] rounded-xl focus:outline-none focus:border-[#78f3d3] focus:ring-4 focus:ring-[#78f3d3] focus:ring-opacity-20 transition-all text-lg"
              />
            </div>
            <p className="mt-2 text-sm text-[#6c7a89]">
              Puedes encontrar tu código en el email de confirmación
            </p>
          </div>
          
          <button
            type="submit"
            disabled={searchStatus.status === 'searching'}
            className="w-full py-4 bg-[#78f3d3] text-[#313D52] font-semibold rounded-xl hover:bg-[#4de0c0] transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {searchStatus.status === 'searching' ? (
              <>
                <Loader2 size={24} className="animate-spin mr-3" />
                Buscando pedido...
              </>
            ) : (
              <>
                <Search size={24} className="mr-3" />
                Buscar mi Pedido
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  </section>
);

// Error section component
const ErrorSection: React.FC<{ searchStatus: SearchStatus }> = ({ searchStatus }) => (
  <section className="py-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-[#313D52] mb-4">
            No se pudo encontrar tu pedido
          </h3>
          <p className="text-[#6c7a89] mb-6">
            {searchStatus.message}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
            <h4 className="font-medium text-red-800 mb-2">Consejos para encontrar tu pedido:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Verifica que el código esté escrito correctamente</li>
              <li>• Asegúrate de incluir las letras al inicio (ORD o RES)</li>
              <li>• Revisa tu email de confirmación</li>
              <li>• Contacta nuestro servicio al cliente si persiste el problema</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Results section component
const ResultsSection: React.FC<{ trackingData: TrackingData }> = ({ trackingData }) => {
  const currentStep = getStatusStep(trackingData.estadoActual, trackingData.tipo);
  const isReservation = trackingData.tipo === 'reservacion';

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <OrderHeader trackingData={trackingData} isReservation={isReservation} />
          
          {/* Client Info */}
          <ClientInfo cliente={trackingData.cliente} />
          
          {/* Services */}
          <ServicesSection trackingData={trackingData} isReservation={isReservation} />
          
          {/* Status Progress */}
          <StatusSection 
            trackingData={trackingData} 
            isReservation={isReservation} 
            currentStep={currentStep} 
          />
          
          {/* Additional Info */}
          {trackingData.notas && <NotesSection notas={trackingData.notas} />}
        </div>
      </div>
    </section>
  );
};

// Order header component
const OrderHeader: React.FC<{ trackingData: TrackingData; isReservation: boolean }> = ({ 
  trackingData, 
  isReservation 
}) => (
  <div className="bg-gradient-to-r from-[#313D52] to-[#2a3441] p-6 text-white">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          {isReservation ? 'Reservación de Servicio' : 'Orden de Servicio'}
        </h2>
        <p className="text-[#78f3d3] opacity-90">
          Creado el {formatDate(trackingData.fechaCreacion)}
        </p>
        {trackingData.reservacionOriginal && (
          <p className="text-sm text-[#61c9ae mt-1">
            Originalmente reservación: {trackingData.reservacionOriginal}
          </p>
        )}
      </div>
      <div className="mt-4 sm:mt-0">
        <span className="inline-block px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-full font-bold text-lg">
          {trackingData.codigo}
        </span>
      </div>
    </div>
  </div>
);

// Client info component
const ClientInfo: React.FC<{ cliente: TrackingData['cliente'] }> = ({ cliente }) => (
  <div className="p-6 border-b border-[#e0e6e5]">
    <div className="flex items-center mb-4">
      <User size={20} className="text-[#61c9ae mr-3" />
      <h3 className="text-lg font-semibold text-[#313D52]">Información del Cliente</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#6c7a89]">Nombre Completo</p>
        <p className="text-[#313D52] font-medium text-lg">
          {cliente.nombre}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#6c7a89]">Información de Contacto</p>
        <div className="space-y-1">
          <p className="text-[#313D52]">{cliente.email}</p>
          <p className="text-[#313D52]">{cliente.telefono}</p>
        </div>
      </div>
    </div>
  </div>
);

// Services section component
const ServicesSection: React.FC<{ 
  trackingData: TrackingData; 
  isReservation: boolean 
}> = ({ trackingData, isReservation }) => (
  <div className="p-6 border-b border-[#e0e6e5]">
    <div className="flex items-center mb-4">
      <Package size={20} className="text-[#61c9ae mr-3" />
      <h3 className="text-lg font-semibold text-[#313D52]">
        {isReservation ? 'Servicio Reservado' : 'Servicios Solicitados'}
      </h3>
    </div>
    
    {isReservation && trackingData.servicio ? (
      <ServiceCard service={trackingData.servicio} />
    ) : trackingData.servicios && trackingData.servicios.length > 0 ? (
      <div className="space-y-4">
        {trackingData.servicios.map((servicio, index) => (
          <ServiceItemCard key={index} servicio={servicio} />
        ))}
        {trackingData.totales && (
          <div className="mt-6 bg-gradient-to-r from-[#78f3d3] to-[#4de0c0] p-4 rounded-xl text-[#313D52]">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total del Servicio</span>
              <span className="font-bold text-2xl">
                {formatCurrency(trackingData.totales.total)}
              </span>
            </div>
          </div>
        )}
      </div>
    ) : (
      <p className="text-[#6c7a89] text-center py-8">No hay servicios disponibles</p>
    )}
  </div>
);

// Service card for reservations
const ServiceCard: React.FC<{ service: any }> = ({ service }) => (
  <div className="bg-gradient-to-r from-[#f5f9f8] to-[#e0f7f0] p-6 rounded-xl">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h4 className="text-[#313D52] font-semibold text-lg mb-2">{service.nombre}</h4>
        <p className="text-[#6c7a89] mb-3">{service.descripcion}</p>
        <div className="text-sm text-[#6c7a89]">
          <span className="font-medium">Calzado:</span>{' '}
          {service.calzado.marca} {service.calzado.modelo}
          {service.calzado.descripcion && (
            <span> - {service.calzado.descripcion}</span>
          )}
        </div>
      </div>
      <div className="ml-6">
        <span className="text-2xl font-bold text-[#313D52]">
          {formatCurrency(service.precio)}
        </span>
      </div>
    </div>
  </div>
);

// Service item card for orders
const ServiceItemCard: React.FC<{ servicio: TrackingService }> = ({ servicio }) => (
  <div className="bg-[#f5f9f8] p-4 rounded-xl border border-[#e0e6e5]">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h4 className="text-[#313D52] font-semibold mb-2">{servicio.servicio_nombre}</h4>
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
        <p className="text-[#313D52] font-bold text-lg">
          {formatCurrency(servicio.subtotal)}
        </p>
        <p className="text-xs text-[#6c7a89]">
          {servicio.cantidad}x {formatCurrency(servicio.precio_unitario)}
        </p>
      </div>
    </div>
  </div>
);

// Status section component
const StatusSection: React.FC<{ 
  trackingData: TrackingData; 
  isReservation: boolean; 
  currentStep: number 
}> = ({ trackingData, isReservation, currentStep }) => (
  <div className="p-6">
    <h3 className="text-xl font-bold text-[#313D52] mb-6">Estado del Servicio</h3>
    
    {isReservation ? (
      <ReservationStatus trackingData={trackingData} />
    ) : (
      <OrderProgressStatus currentStep={currentStep} trackingData={trackingData} />
    )}
  </div>
);

// Reservation status component - Updated for step 0
const ReservationStatus: React.FC<{ trackingData: TrackingData }> = ({ trackingData }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#78f3d3] to-[#4de0c0] rounded-full mb-6 shadow-lg">
      <Calendar size={40} className="text-[#313D52]" />
    </div>
    <h4 className="text-2xl font-bold text-[#313D52] mb-4">Reservación Pendiente</h4>
    <p className="text-[#6c7a89] mb-6 max-w-md mx-auto">
      Tu reservación ha sido recibida y está pendiente de confirmación. Te contactaremos pronto para coordinar la recolección.
    </p>
    <div className="bg-gradient-to-r from-[#e0f7f0] to-[#f0fdf7] p-6 rounded-xl inline-block">
      <p className="text-[#313D52] font-medium">
        <strong>Fecha de reservación:</strong> {formatDate(trackingData.fechaCreacion)}
      </p>
    </div>
  </div>
);

// Order progress status component - Updated with step 0 "Pendiente"
const OrderProgressStatus: React.FC<{ 
  currentStep: number; 
  trackingData: TrackingData 
}> = ({ currentStep, trackingData }) => (
  <div>
    {/* Progress Bar */}
    <div className="relative mb-12">
      <div className="absolute top-6 left-0 right-0 h-2 bg-[#e0e6e5] rounded-full"></div>
      <div 
        className="absolute top-6 left-0 h-2 bg-gradient-to-r from-[#78f3d3] to-[#4de0c0] transition-all duration-1000 rounded-full"
        style={{ width: `${(currentStep / 4) * 100}%` }}
      ></div>
      
      <div className="flex justify-between">
        {[0, 1, 2, 3, 4].map((step) => {
          const isActive = step <= currentStep;
          const isCurrent = step === currentStep;
          
          return (
            <div key={step} className="flex flex-col items-center">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                  isCurrent 
                    ? 'bg-[#78f3d3] text-[#313D52] ring-4 ring-[#e0f7f0] shadow-xl scale-125'
                    : isActive 
                      ? 'bg-[#78f3d3] text-[#313D52] shadow-lg' 
                      : 'bg-[#e0e6e5] text-[#6c7a89]'
                }`}
              >
                {step === 0 && <Clock size={20} />}
                {step === 1 && <Package size={20} />}
                {step === 2 && <Truck size={20} />}
                {step === 3 && <CheckCircle size={20} />}
                {step === 4 && <Phone size={20} />}
              </div>
              <p className={`text-sm font-medium mt-3 text-center transition-colors ${
                isCurrent ? 'text-[#61c9ae font-bold' : isActive ? 'text-[#313D52]' : 'text-[#6c7a89]'
              }`}>
                {getStatusLabel(step)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
    
    {/* Current Status */}
    <div className="bg-gradient-to-r from-[#e0f7f0] to-[#f0fdf7] p-6 rounded-xl">
      <div className="flex items-start">
        <Calendar size={24} className="text-[#78f3d3] flex-shrink-0 mr-4 mt-1" />
        <div>
          <h4 className="text-lg font-bold text-[#313D52] mb-2">
            Estado actual: {trackingData.estadoActual?.nombre || getStatusLabel(currentStep)}
          </h4>
          <p className="text-[#6c7a89]">
            {trackingData.estadoActual?.descripcion || getStatusDescription(currentStep)}
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Notes section component
const NotesSection: React.FC<{ notas: string }> = ({ notas }) => (
  <div className="p-6 border-t border-[#e0e6e5]">
    <div className="flex items-center mb-4">
      <FileText size={20} className="text-[#78f3d3] mr-3" />
      <h3 className="text-lg font-semibold text-[#313D52]">Notas Adicionales</h3>
    </div>
    <div className="bg-[#f5f9f8] p-4 rounded-xl">
      <p className="text-[#313D52] whitespace-pre-wrap">{notas}</p>
    </div>
  </div>
);

// Empty state component
const EmptyState: React.FC = () => (
  <section className="py-16 px-4 sm:px-6 lg:px-8">
    <div className="max-w-2xl mx-auto text-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e0e6e5]">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#78f3d3] bg-opacity-20 rounded-full mb-4">
            <Package size={24} className="text-[#313D52]" />
          </div>
          <h3 className="font-semibold text-[#313D52] mb-2">Órdenes de Servicio</h3>
          <p className="text-sm text-[#6c7a89]">
            Comienzan con <code className="bg-[#f5f9f8] px-2 py-1 rounded text-[#313D52] font-mono">ORD</code>
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e0e6e5]">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#78f3d3] bg-opacity-20 rounded-full mb-4">
            <Calendar size={24} className="text-[#313D52]" />
          </div>
          <h3 className="font-semibold text-[#313D52] mb-2">Reservaciones</h3>
          <p className="text-sm text-[#6c7a89]">
            Comienzan con <code className="bg-[#f5f9f8] px-2 py-1 rounded text-[#313D52] font-mono">RES</code>
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default TrackingPage;