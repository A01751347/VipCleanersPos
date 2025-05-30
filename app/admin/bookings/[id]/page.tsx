'use client'
// app/admin/bookings/[id]/page.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
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
  Edit,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

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

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const bookingId = parseInt(params.id as string, 10);

  useEffect(() => {
    if (isNaN(bookingId)) {
      setError('ID de reservación inválido');
      setIsLoading(false);
      return;
    }

    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/bookings/${bookingId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Reservación no encontrada');
        }
        throw new Error('Error al cargar los detalles de la reservación');
      }
      
      const data = await response.json();
      setBooking(data);
      setError(null);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <XCircle size={48} className="mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-[#313D52] mb-2">Error</h2>
            <p className="text-[#6c7a89] mb-4">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={fetchBookingDetails}
                className="px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
              >
                Reintentar
              </button>
              <Link 
                href="/admin/bookings"
                className="px-4 py-2 bg-gray-100 text-[#313D52] rounded-lg hover:bg-gray-200 transition-colors"
              >
                Volver a Reservaciones
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/bookings"
              className="p-2 hover:bg-white rounded-lg transition-colors border border-[#e0e6e5]"
            >
              <ArrowLeft size={20} className="text-[#6c7a89]" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#313D52]">
                Reservación #{booking.booking_reference}
              </h1>
              <p className="text-[#6c7a89]">Detalles completos de la reservación</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Information Cards */}
          <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <div className="bg-white rounded-lg border border-[#e0e6e5] p-6">
            <div className="flex items-center mb-4">
              <User size={20} className="text-[#78f3d3] mr-2" />
              <h2 className="text-lg font-semibold text-[#313D52]">Información del Cliente</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">Nombre Completo</label>
                <p className="text-[#313D52]">{booking.full_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">Email</label>
                <div className="flex items-center">
                  <Mail size={16} className="text-[#6c7a89] mr-2" />
                  <a href={`mailto:${booking.client_email}`} className="text-[#78f3d3] hover:underline">
                    {booking.client_email}
                  </a>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">Teléfono</label>
                <div className="flex items-center">
                  <Phone size={16} className="text-[#6c7a89] mr-2" />
                  <a href={`tel:${booking.client_phone}`} className="text-[#78f3d3] hover:underline">
                    {booking.client_phone}
                  </a>
                </div>
              </div>
              
              {booking.client_address && (
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">Dirección</label>
                  <div className="flex items-start">
                    <MapPin size={16} className="text-[#6c7a89] mr-2 mt-0.5" />
                    <div>
                      <p className="text-[#313D52]">{booking.client_address}</p>
                      {booking.client_city && (
                        <p className="text-sm text-[#6c7a89]">
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
          <div className="bg-white rounded-lg border border-[#e0e6e5] p-6">
            <div className="flex items-center mb-4">
              <Package size={20} className="text-[#78f3d3] mr-2" />
              <h2 className="text-lg font-semibold text-[#313D52]">Información del Servicio</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">Servicio</label>
                <p className="text-[#313D52] font-medium">{booking.service_name}</p>
                <p className="text-sm text-[#6c7a89]">{booking.service_description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">Precio</label>
                  <p className="text-[#313D52] font-semibold text-lg">{formatCurrency(booking.service_price)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">Duración Estimada</label>
                  <div className="flex items-center">
                    <Clock size={16} className="text-[#6c7a89] mr-2" />
                    <p className="text-[#313D52]">{booking.service_duration} minutos</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">Calzado</label>
                <p className="text-[#313D52]">{booking.marca} {booking.modelo}</p>
                {booking.shoes_description && (
                  <p className="text-sm text-[#6c7a89] mt-1">{booking.shoes_description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="bg-white rounded-lg border border-[#e0e6e5] p-6">
              <div className="flex items-center mb-4">
                <FileText size={20} className="text-[#78f3d3] mr-2" />
                <h2 className="text-lg font-semibold text-[#313D52]">Notas</h2>
              </div>
              <p className="text-[#313D52] whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white rounded-lg border border-[#e0e6e5] p-6">
              <h3 className="text-lg font-semibold text-[#313D52] mb-4">Acciones</h3>
              
              <div className="space-y-3">
              {booking.status !== 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('pending')}
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                >
                  <Clock size={16} className="mr-2" />
                  Marcar como Pendiente
                </button>
              )}
              
              {booking.status !== 'completed' && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Marcar como Completado
                </button>
              )}
              
              {booking.status !== 'cancelled' && (
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <XCircle size={16} className="mr-2" />
                  Cancelar Reservación
                </button>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-[#e0e6e5] p-6">
            <div className="flex items-center mb-4">
              <Calendar size={20} className="text-[#78f3d3] mr-2" />
              <h3 className="text-lg font-semibold text-[#313D52]">Fechas Importantes</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">Fecha de Reservación</label>
                <p className="text-[#313D52]">{formatDate(booking.booking_date)}</p>
              </div>
              
              {booking.estimated_delivery && (
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">Entrega Estimada</label>
                  <p className="text-[#313D52]">{formatDate(booking.estimated_delivery)}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">Creado</label>
                <p className="text-[#313D52]">{formatDate(booking.created_at)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">Última Actualización</label>
                <p className="text-[#313D52]">{formatDate(booking.updated_at)}</p>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}