// components/TrackingSection.tsx - Componente de seguimiento mejorado
'use client'
import React, { useState } from 'react';
import { 
  Search, 
  Package, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Navigation,
  Home,
  CreditCard,
  Star,
  ArrowRight,
  User
} from 'lucide-react';

interface TrackingData {
  id: number;
  type: 'order' | 'reservation';
  booking_reference: string;
  cliente_nombre: string;
  cliente_apellidos: string;
  cliente_email: string;
  cliente_telefono: string;
  servicio_nombre: string;
  shoes_type: string;
  status: string;
  estado: string;
  fecha_recepcion?: string;
  fecha_reservacion?: string;
  fecha_entrega_estimada?: string;
  total?: number;
  costo_pickup?: number;
  zona_pickup?: string;
  direccion_pickup?: any;
  servicios?: any[];
  historial?: any[];
  notas?: string;
}

const TrackingSection: React.FC = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingCode.trim()) {
      setError('Por favor ingresa un código de seguimiento');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const response = await fetch(`/api/booking?reference=${encodeURIComponent(trackingCode.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar el código');
      }

      setTrackingData(data.booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string, type: string) => {
    const statusMap = {
      // Estados de reservaciones
      pendiente: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock, 
        text: 'Reserva Pendiente',
        description: 'Tu reserva está confirmada y en espera'
      },
      procesada: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: Package, 
        text: 'En Proceso',
        description: 'Tu calzado está siendo procesado'
      },
      completada: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        text: 'Completada',
        description: 'Servicio completado exitosamente'
      },
      
      // Estados de órdenes  
      recibido: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: Package, 
        text: 'Recibido',
        description: 'Tu calzado ha sido recibido en nuestra tienda'
      },
      'en proceso': { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: Package, 
        text: 'En Proceso',
        description: 'Estamos trabajando en tu calzado'
      },
      'listo para entrega': { 
        color: 'bg-green-100 text-green-600 border-green-200', 
        icon: CheckCircle, 
        text: 'Listo para Entrega',
        description: 'Tu calzado está listo para ser recogido'
      },
      entregado: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        text: 'Entregado',
        description: 'Orden completada y entregada'
      },
      cancelado: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: AlertCircle, 
        text: 'Cancelado',
        description: 'La orden ha sido cancelada'
      }
    };

    return statusMap[status as keyof typeof statusMap] || {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Info,
      text: status,
      description: 'Estado desconocido'
    };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const renderOrderTimeline = (historial: any[]) => {
    if (!historial || historial.length === 0) return null;

    return (
      <div className="mt-6">
        <h4 className="font-semibold text-[#313D52] mb-4 flex items-center">
          <Clock size={18} className="mr-2 text-[#78f3d3]" />
          Historial del Servicio
        </h4>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#e0e6e5]"></div>
          <div className="space-y-4">
            {historial.map((item, index) => (
              <div key={item.historial_id || index} className="relative flex items-start ml-8">
                <div 
                  className="absolute -left-8 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white"
                  style={{ 
                    borderColor: item.estado_color ? `#${item.estado_color}` : '#78f3d3'
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: item.estado_color ? `#${item.estado_color}` : '#78f3d3'
                    }}
                  ></div>
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-[#313D52]">{item.estado_nombre}</h5>
                  <p className="text-sm text-[#6c7a89]">{formatDate(item.fecha_cambio)}</p>
                  {item.empleado_nombre && (
                    <p className="text-sm text-[#6c7a89]">Por: {item.empleado_nombre}</p>
                  )}
                  {item.comentario && (
                    <p className="text-sm italic text-[#6c7a89] bg-[#f5f9f8] p-2 rounded mt-2">
                      "{item.comentario}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPickupInfo = (data: TrackingData) => {
    if (!data.direccion_pickup && !data.zona_pickup) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <div className="flex items-center mb-3">
          <Truck size={18} className="text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-800">Información de Pickup</h4>
        </div>
        
        {data.zona_pickup && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <span className="text-sm font-medium text-blue-700">Zona:</span>
              <p className="text-blue-600">{data.zona_pickup}</p>
            </div>
            {data.costo_pickup && (
              <div>
                <span className="text-sm font-medium text-blue-700">Costo de pickup:</span>
                <p className="text-blue-600 font-semibold">{formatCurrency(data.costo_pickup)}</p>
              </div>
            )}
          </div>
        )}

        {data.direccion_pickup && (
          <div>
            <span className="text-sm font-medium text-blue-700">Dirección:</span>
            <div className="text-blue-600 mt-1">
              <p>
                {data.direccion_pickup.calle} {data.direccion_pickup.numero_exterior}
                {data.direccion_pickup.numero_interior && ` ${data.direccion_pickup.numero_interior}`}
              </p>
              <p>{data.direccion_pickup.colonia}, {data.direccion_pickup.ciudad}</p>
              <p>CP {data.direccion_pickup.codigo_postal}</p>
              
              {data.direccion_pickup.ventana_hora_inicio && data.direccion_pickup.ventana_hora_fin && (
                <p className="text-sm mt-2">
                  <Clock size={14} className="inline mr-1" />
                  Horario: {data.direccion_pickup.ventana_hora_inicio} - {data.direccion_pickup.ventana_hora_fin}
                </p>
              )}
              
              {data.direccion_pickup.instrucciones_entrega && (
                <p className="text-sm mt-2 italic">
                  <Info size={14} className="inline mr-1" />
                  {data.direccion_pickup.instrucciones_entrega}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderServiceDetails = (data: TrackingData) => {
    if (data.type === 'order' && data.servicios && data.servicios.length > 0) {
      return (
        <div className="mt-6">
          <h4 className="font-semibold text-[#313D52] mb-4 flex items-center">
            <Package size={18} className="mr-2 text-[#78f3d3]" />
            Servicios Incluidos
          </h4>
          <div className="space-y-3">
            {data.servicios.map((servicio, index) => (
              <div key={servicio.detalle_servicio_id || index} className="border border-[#e0e6e5] rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-[#313D52]">{servicio.servicio_nombre}</h5>
                    {(servicio.marca || servicio.modelo) && (
                      <p className="text-sm text-[#6c7a89] mt-1">
                        {servicio.marca} {servicio.modelo}
                      </p>
                    )}
                    {servicio.descripcion && (
                      <p className="text-sm text-[#6c7a89] mt-1">{servicio.descripcion}</p>
                    )}
                    
                    {/* Información de almacenamiento si existe */}
                    {servicio.caja_almacenamiento && (
                      <div className="mt-2 inline-flex items-center bg-[#e0f7f0] text-[#00a67e] px-2 py-1 rounded text-xs">
                        <Navigation size={12} className="mr-1" />
                        Ubicación: {servicio.caja_almacenamiento}
                        {servicio.codigo_ubicacion && ` - ${servicio.codigo_ubicacion}`}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-[#313D52]">
                      {formatCurrency(servicio.precio_unitario * (servicio.cantidad || 1))}
                    </p>
                    {servicio.cantidad && servicio.cantidad > 1 && (
                      <p className="text-xs text-[#6c7a89]">
                        {servicio.cantidad} x {formatCurrency(servicio.precio_unitario)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Para reservaciones, mostrar información básica del servicio
    return (
      <div className="mt-6">
        <h4 className="font-semibold text-[#313D52] mb-4 flex items-center">
          <Package size={18} className="mr-2 text-[#78f3d3]" />
          Servicio Solicitado
        </h4>
        <div className="border border-[#e0e6e5] rounded-lg p-4">
          <h5 className="font-medium text-[#313D52]">{data.servicio_nombre}</h5>
          <p className="text-sm text-[#6c7a89] mt-1">Calzado: {data.shoes_type}</p>
          {data.notas && (
            <p className="text-sm text-[#6c7a89] mt-2 italic bg-[#f5f9f8] p-2 rounded">
              {data.notas}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="py-16 bg-[#f5f9f8]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#313D52] mb-4">
            Seguimiento de tu Servicio
          </h2>
          <p className="text-[#6c7a89] text-lg">
            Ingresa tu código de seguimiento para ver el estado de tu reserva u orden
          </p>
        </div>

        {/* Formulario de búsqueda */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="trackingCode" className="block text-sm font-medium text-[#313D52] mb-2">
                Código de Seguimiento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-[#6c7a89]" />
                </div>
                <input
                  type="text"
                  id="trackingCode"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  placeholder="Ej. RES123456, ORD789012"
                  className="block w-full pl-10 pr-4 py-3 border border-[#e0e6e5] rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-[#78f3d3] text-lg"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-[#78f3d3] text-[#313D52] font-semibold rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#313D52] mr-2"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search size={18} className="mr-2" />
                    Buscar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-start">
            <AlertCircle size={20} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Error al buscar</h4>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Resultados del seguimiento */}
        {trackingData && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header con estado */}
            <div className="bg-[#313D52] text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {trackingData.type === 'order' ? 'Orden' : 'Reservación'} #{trackingData.booking_reference}
                  </h3>
                  <p className="opacity-90">
                    {trackingData.cliente_nombre} {trackingData.cliente_apellidos}
                  </p>
                </div>
                
                <div className="mt-4 md:mt-0">
                  {(() => {
                    const statusInfo = getStatusInfo(trackingData.status, trackingData.type);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div className={`inline-flex items-center px-4 py-2 rounded-full border ${statusInfo.color}`}>
                        <StatusIcon size={16} className="mr-2" />
                        <span className="font-medium">{statusInfo.text}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="p-6">
              {/* Información general */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-[#313D52] mb-3 flex items-center">
                    <User size={18} className="mr-2 text-[#78f3d3]" />
                    Información de Contacto
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Mail size={14} className="mr-2 text-[#6c7a89]" />
                      <span>{trackingData.cliente_email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone size={14} className="mr-2 text-[#6c7a89]" />
                      <span>{trackingData.cliente_telefono}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-[#313D52] mb-3 flex items-center">
                    <Calendar size={18} className="mr-2 text-[#78f3d3]" />
                    Fechas Importantes
                  </h4>
                  <div className="space-y-2 text-sm">
                    {trackingData.fecha_reservacion && (
                      <div>
                        <span className="text-[#6c7a89]">Reservación:</span>
                        <span className="ml-2 font-medium">{formatDate(trackingData.fecha_reservacion)}</span>
                      </div>
                    )}
                    {trackingData.fecha_recepcion && (
                      <div>
                        <span className="text-[#6c7a89]">Recepción:</span>
                        <span className="ml-2 font-medium">{formatDate(trackingData.fecha_recepcion)}</span>
                      </div>
                    )}
                    {trackingData.fecha_entrega_estimada && (
                      <div>
                        <span className="text-[#6c7a89]">Entrega estimada:</span>
                        <span className="ml-2 font-medium">{formatDate(trackingData.fecha_entrega_estimada)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de pickup si existe */}
              {renderPickupInfo(trackingData)}

              {/* Detalles del servicio */}
              {renderServiceDetails(trackingData)}

              {/* Total si es una orden */}
              {trackingData.type === 'order' && trackingData.total && (
                <div className="mt-6 bg-[#f5f9f8] rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#313D52]">Total de la orden:</span>
                    <span className="text-xl font-bold text-[#313D52]">
                      {formatCurrency(trackingData.total)}
                    </span>
                  </div>
                  {trackingData.costo_pickup && trackingData.costo_pickup > 0 && (
                    <p className="text-sm text-[#6c7a89] mt-1">
                      Incluye pickup: {formatCurrency(trackingData.costo_pickup)}
                    </p>
                  )}
                </div>
              )}

              {/* Timeline para órdenes */}
              {trackingData.type === 'order' && trackingData.historial && 
                renderOrderTimeline(trackingData.historial)
              }

              {/* Mensaje de estado */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Info size={18} className="text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">Estado actual</h5>
                    <p className="text-blue-700 text-sm">
                      {getStatusInfo(trackingData.status, trackingData.type).description}
                    </p>
                    {trackingData.type === 'reservation' && trackingData.status === 'pendiente' && (
                      <p className="text-blue-700 text-sm mt-2">
                        Tu reservación está confirmada. Te contactaremos para coordinar 
                        {trackingData.zona_pickup ? ' la recolección' : ' los detalles del servicio'}.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-semibold text-[#313D52] mb-4">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-[#6c7a89] mb-6">
              Si tienes alguna pregunta sobre tu servicio, no dudes en contactarnos
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-center">
                <Phone size={18} className="text-[#78f3d3] mr-2" />
                <span className="text-[#313D52]">442-123-4567</span>
              </div>
              <div className="flex items-center justify-center">
                <Mail size={18} className="text-[#78f3d3] mr-2" />
                <span className="text-[#313D52]">contacto@vipcleaners.com</span>
              </div>
              <div className="flex items-center justify-center">
                <MapPin size={18} className="text-[#78f3d3] mr-2" />
                <span className="text-[#313D52]">Visítanos en tienda</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrackingSection;