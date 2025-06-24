'use client'
// components/admin/BookingDetailsModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Home
} from 'lucide-react';
import TransferBookingButton from './TransferBookingButton';

interface BookingDetails {
  id: number;
  booking_reference: string;
  client_name: string;
  client_lastname: string;
  full_name: string;
  client_email: string;
  client_phone: string;
  service_name: string;
  service_description: string;
  service_price: number;
  service_duration: number;
  marca: string;
  modelo: string;
  shoes_description: string;
  booking_date: string;
  estimated_delivery: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Address fields from getReservationWithDetails
  calle?: string;
  numero_exterior?: string;
  numero_interior?: string;
  colonia?: string;
  municipio_delegacion?: string;
  ciudad?: string;
  estado?: string;
  codigo_postal?: string;
  telefono_contacto?: string;
  destinatario?: string;
  instrucciones_entrega?: string;
  ventana_hora_inicio?: string;
  ventana_hora_fin?: string;
}

interface BookingDetailsModalProps {
  bookingId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: () => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ 
  bookingId, 
  isOpen, 
  onClose, 
  onStatusUpdate 
}) => {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchBookingDetails();
    }
  }, [isOpen, bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/bookings/${bookingId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Reservación no encontrada');
        }
        throw new Error('Error al cargar los detalles');
      }
      
      const data = await response.json();
      setBooking(data);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return;

    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/admin/bookings/${booking.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }
      
      // Refrescar los datos
      await fetchBookingDetails();
      
      // Notificar al componente padre
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error al actualizar el estado de la reservación');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTransferSuccess = (data: any) => {
    // Mostrar mensaje de éxito
    alert(`¡Reservación transferida exitosamente!\n\nCódigo de Orden: ${data.codigoOrden}\nTotal: $${data.total.toFixed(2)}`);
    
    // Refrescar los datos del booking
    fetchBookingDetails();
    
    // Notificar al componente padre
    if (onStatusUpdate) {
      onStatusUpdate();
    }
    
    // Opcionalmente cerrar el modal después de unos segundos
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'transferida_a_orden':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      case 'transferida_a_orden':
        return 'Transferida a Orden';
      default:
        return 'Desconocido';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
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

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // Format HH:MM
  };

  const buildAddress = (booking: BookingDetails) => {
    const addressParts = [];
    
    if (booking.calle) {
      let street = booking.calle;
      if (booking.numero_exterior) {
        street += ` ${booking.numero_exterior}`;
      }
      if (booking.numero_interior) {
        street += ` Int. ${booking.numero_interior}`;
      }
      addressParts.push(street);
    }
    
    if (booking.colonia) {
      addressParts.push(booking.colonia);
    }
    
    const cityParts = [];
    if (booking.municipio_delegacion) {
      cityParts.push(booking.municipio_delegacion);
    }
    if (booking.ciudad && booking.ciudad !== booking.municipio_delegacion) {
      cityParts.push(booking.ciudad);
    }
    if (booking.estado) {
      cityParts.push(booking.estado);
    }
    if (booking.codigo_postal) {
      cityParts.push(`CP ${booking.codigo_postal}`);
    }
    
    if (cityParts.length > 0) {
      addressParts.push(cityParts.join(', '));
    }
    
    return addressParts.join('\n');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e0e6e5]">
          <div>
            <h2 className="text-xl font-semibold text-[#313D52]">
              {booking ? `Reservación ${booking.booking_reference}` : 'Detalles de Reservación'}
            </h2>
            <p className="text-sm text-[#6c7a89]">Información completa de la reservación</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {booking && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                {getStatusText(booking.status)}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-[#6c7a89]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <XCircle size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-[#313D52] mb-2">Error</h3>
              <p className="text-[#6c7a89] mb-4">{error}</p>
              <button 
                onClick={fetchBookingDetails}
                className="px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : booking ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Client Information */}
                <div className="border border-[#e0e6e5] rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <User size={18} className="text-[#78f3d3] mr-2" />
                    <h3 className="font-semibold text-[#313D52]">Información del Cliente</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-[#6c7a89] mb-1">Nombre Completo</label>
                      <p className="text-[#313D52]">{booking.full_name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-[#6c7a89] mb-1">Email</label>
                      <div className="flex items-center">
                        <Mail size={14} className="text-[#6c7a89] mr-2" />
                        <a href={`mailto:${booking.client_email}`} className="text-[#78f3d3] hover:underline">
                          {booking.client_email}
                        </a>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-[#6c7a89] mb-1">Teléfono</label>
                      <div className="flex items-center">
                        <Phone size={14} className="text-[#6c7a89] mr-2" />
                        <a href={`tel:${booking.client_phone}`} className="text-[#78f3d3] hover:underline">
                          {booking.client_phone}
                        </a>
                      </div>
                    </div>
                    
                    {booking.telefono_contacto && booking.telefono_contacto !== booking.client_phone && (
                      <div>
                        <label className="block text-xs font-medium text-[#6c7a89] mb-1">Teléfono de Contacto</label>
                        <div className="flex items-center">
                          <Phone size={14} className="text-[#6c7a89] mr-2" />
                          <a href={`tel:${booking.telefono_contacto}`} className="text-[#78f3d3] hover:underline">
                            {booking.telefono_contacto}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                {(booking.calle || booking.destinatario) && (
                  <div className="border border-[#e0e6e5] rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <Home size={18} className="text-[#78f3d3] mr-2" />
                      <h3 className="font-semibold text-[#313D52]">Dirección de Entrega</h3>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      {booking.destinatario && (
                        <div>
                          <label className="block text-xs font-medium text-[#6c7a89] mb-1">Destinatario</label>
                          <p className="text-[#313D52]">{booking.destinatario}</p>
                        </div>
                      )}
                      
                      {booking.calle && (
                        <div>
                          <label className="block text-xs font-medium text-[#6c7a89] mb-1">Dirección</label>
                          <div className="flex items-start">
                            <MapPin size={14} className="text-[#6c7a89] mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-[#313D52] whitespace-pre-line">{buildAddress(booking)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(booking.ventana_hora_inicio || booking.ventana_hora_fin) && (
                        <div>
                          <label className="block text-xs font-medium text-[#6c7a89] mb-1">Ventana de Entrega</label>
                          <div className="flex items-center">
                            <Clock size={14} className="text-[#6c7a89] mr-2" />
                            <p className="text-[#313D52]">
                              {formatTime(booking.ventana_hora_inicio || '')} - {formatTime(booking.ventana_hora_fin || '')}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {booking.instrucciones_entrega && (
                        <div>
                          <label className="block text-xs font-medium text-[#6c7a89] mb-1">Instrucciones de Entrega</label>
                          <p className="text-[#313D52] whitespace-pre-wrap">{booking.instrucciones_entrega}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Service Information */}
                <div className="border border-[#e0e6e5] rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <Package size={18} className="text-[#78f3d3] mr-2" />
                    <h3 className="font-semibold text-[#313D52]">Información del Servicio</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-[#6c7a89] mb-1">Servicio</label>
                      <p className="text-[#313D52] font-medium">{booking.service_name}</p>
                      <p className="text-xs text-[#6c7a89]">{booking.service_description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#6c7a89] mb-1">Precio</label>
                        <p className="text-[#313D52] font-semibold">{formatCurrency(booking.service_price)}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-[#6c7a89] mb-1">Duración</label>
                        <div className="flex items-center">
                          <Clock size={14} className="text-[#6c7a89] mr-1" />
                          <p className="text-[#313D52]">{booking.service_duration} min</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-[#6c7a89] mb-1">Calzado</label>
                      <p className="text-[#313D52]">{booking.marca} {booking.modelo}</p>
                      {booking.shoes_description && (
                        <p className="text-xs text-[#6c7a89] mt-1">{booking.shoes_description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className="border border-[#e0e6e5] rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <FileText size={18} className="text-[#78f3d3] mr-2" />
                      <h3 className="font-semibold text-[#313D52]">Notas</h3>
                    </div>
                    <p className="text-sm text-[#313D52] whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Transfer to Order - Solo mostrar si está pendiente y no transferida */}
                {booking.status === 'pending' && (
                  <div className="border border-[#e0e6e5] rounded-lg p-4">
                    <h3 className="font-semibold text-[#313D52] mb-3">Procesar Reservación</h3>
                    <p className="text-sm text-[#6c7a89] mb-4">
                      Transferir esta reservación a una orden activa para comenzar el proceso de servicio.
                    </p>
                    <TransferBookingButton
                      bookingId={booking.id}
                      bookingReference={booking.booking_reference}
                      onSuccess={handleTransferSuccess}
                      disabled={isUpdating}
                    />
                  </div>
                )}

                {/* Status Information - Si ya fue transferida */}
                {booking.status === 'transferida_a_orden' && (
                  <div className="border border-[#e0e6e5] rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <CheckCircle size={18} className="text-green-500 mr-2" />
                      <h3 className="font-semibold text-[#313D52]">Estado de la Reservación</h3>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        ✓ Transferida a Orden
                      </p>
                      <p className="text-xs text-blue-600">
                        Esta reservación ha sido convertida exitosamente en una orden activa. 
                        El proceso de servicio ya puede comenzar.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Actions */}
                <div className="border border-[#e0e6e5] rounded-lg p-4">
                  <h3 className="font-semibold text-[#313D52] mb-4">Cambiar Estado</h3>
                  
                  <div className="space-y-2">
                    {booking.status !== 'pending' && booking.status !== 'transferida_a_orden' && (
                      <button
                        onClick={() => handleStatusUpdate('pending')}
                        disabled={isUpdating}
                        className="w-full flex items-center justify-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors disabled:opacity-50 text-sm"
                      >
                        <Clock size={14} className="mr-2" />
                        Pendiente
                      </button>
                    )}
                    
                    {booking.status !== 'completed' && booking.status !== 'transferida_a_orden' && (
                      <button
                        onClick={() => handleStatusUpdate('completed')}
                        disabled={isUpdating}
                        className="w-full flex items-center justify-center px-3 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 text-sm"
                      >
                        <CheckCircle size={14} className="mr-2" />
                        Completado
                      </button>
                    )}
                    
                    {booking.status !== 'cancelled' && booking.status !== 'transferida_a_orden' && (
                      <button
                        onClick={() => handleStatusUpdate('cancelled')}
                        disabled={isUpdating}
                        className="w-full flex items-center justify-center px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                      >
                        <XCircle size={14} className="mr-2" />
                        Cancelar
                      </button>
                    )}
                    
                    {booking.status === 'transferida_a_orden' && (
                      <div className="text-xs text-[#6c7a89] text-center py-2">
                        No se puede cambiar el estado de una reservación transferida
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="border border-[#e0e6e5] rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <Calendar size={18} className="text-[#78f3d3] mr-2" />
                    <h3 className="font-semibold text-[#313D52]">Fechas</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-[#6c7a89] mb-1">Reservación</label>
                      <p className="text-[#313D52]">{formatDate(booking.booking_date)}</p>
                    </div>
                    
                    {booking.estimated_delivery && (
                      <div>
                        <label className="block text-xs font-medium text-[#6c7a89] mb-1">Entrega Estimada</label>
                        <p className="text-[#313D52]">{formatDate(booking.estimated_delivery)}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-xs font-medium text-[#6c7a89] mb-1">Creado</label>
                      <p className="text-[#313D52]">{formatDate(booking.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;