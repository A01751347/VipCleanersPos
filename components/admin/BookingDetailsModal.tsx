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
  Loader2
} from 'lucide-react';

interface BookingDetails {
  id: number;
  booking_reference: string;
  client_name: string;
  client_lastname: string;
  full_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  client_city: string;
  client_postal_code: string;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
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
                    
                    {booking.client_address && (
                      <div>
                        <label className="block text-xs font-medium text-[#6c7a89] mb-1">Dirección</label>
                        <div className="flex items-start">
                          <MapPin size={14} className="text-[#6c7a89] mr-2 mt-0.5" />
                          <div>
                            <p className="text-[#313D52]">{booking.client_address}</p>
                            {booking.client_city && (
                              <p className="text-xs text-[#6c7a89]">
                                {booking.client_city}{booking.client_postal_code && `, ${booking.client_postal_code}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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
                {/* Status Actions */}
                <div className="border border-[#e0e6e5] rounded-lg p-4">
                  <h3 className="font-semibold text-[#313D52] mb-4">Acciones</h3>
                  
                  <div className="space-y-2">
                    {booking.status !== 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate('pending')}
                        disabled={isUpdating}
                        className="w-full flex items-center justify-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors disabled:opacity-50 text-sm"
                      >
                        <Clock size={14} className="mr-2" />
                        Pendiente
                      </button>
                    )}
                    
                    {booking.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusUpdate('completed')}
                        disabled={isUpdating}
                        className="w-full flex items-center justify-center px-3 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 text-sm"
                      >
                        <CheckCircle size={14} className="mr-2" />
                        Completado
                      </button>
                    )}
                    
                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => handleStatusUpdate('cancelled')}
                        disabled={isUpdating}
                        className="w-full flex items-center justify-center px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                      >
                        <XCircle size={14} className="mr-2" />
                        Cancelar
                      </button>
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