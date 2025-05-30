'use client'
// components/admin/BookingsTable.tsx
import React, { useState } from 'react';
import { 
  Eye, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  ChevronDown, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import BookingDetailsModal from './BookingDetailsModal';
import { useClickOutside } from './useClickOutside';

interface Booking {
  id: number;
  booking_reference: string;
  full_name: string;
  email: string;
  service_type: string;
  marca: string;
  modelo: string;
  shoes_type: string;
  booking_date: string;
  status: string;
  created_at: string;
}

interface BookingsTableProps {
  bookings: Booking[];
  onStatusChange?: () => void;
}

// Esta tabla muestra todas las reservaciones con opciones de ordenamiento
const BookingsTable: React.FC<BookingsTableProps> = ({ bookings = [], onStatusChange }) => {
  const [sortField, setSortField] = useState('booking_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hook para cerrar dropdown al hacer clic fuera
  const dropdownRef = useClickOutside(() => setActiveDropdown(null));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} />;
      case 'completed':
        return <CheckCircle size={14} />;
      case 'cancelled':
        return <XCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleDropdown = (id: number) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleViewDetails = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBookingId(null);
  };

  const handleModalStatusUpdate = () => {
    if (onStatusChange) {
      onStatusChange();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta reservación?')) {
      return;
    }
    
    try {
      setIsUpdating(id);
      
      // Aquí iría la llamada a la API para eliminar la reserva
      console.log(`Deleting booking with ID: ${id}`);
      
      // Notificar cambio al componente padre para refrescar datos
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error al eliminar la reserva:', error);
      alert('Error al eliminar la reserva');
    } finally {
      setActiveDropdown(null);
      setIsUpdating(null);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      setIsUpdating(id);
      
      const response = await fetch(`/api/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar el estado de la reserva');
      }
      
      // Notificar cambio al componente padre para refrescar datos
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error al actualizar el estado de la reserva:', error);
      alert('Error al actualizar el estado de la reserva');
    } finally {
      setActiveDropdown(null);
      setIsUpdating(null);
    }
  };

  // Obtener el nombre "humanizado" del servicio
  const getServiceName = (serviceType: string) => {
    switch (serviceType) {
      case 'basic':
        return 'Limpieza Básica';
      case 'premium':
        return 'Limpieza Premium';
      default:
        return serviceType;
    }
  };

  // Si no hay reservaciones, mostrar mensaje
  if (bookings.length === 0) {
    return (
      <div className="text-center py-10 text-[#6c7a89]">
        No se encontraron reservaciones que coincidan con los criterios de búsqueda
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
        <table className="min-w-full divide-y divide-[#e0e6e5]">
        <thead>
          <tr>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
              onClick={() => toggleSort('booking_reference')}
            >
              <div className="flex items-center">
                <span>Referencia</span>
                {sortField === 'booking_reference' && (
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
              onClick={() => toggleSort('full_name')}
            >
              <div className="flex items-center">
                <span>Cliente</span>
                {sortField === 'full_name' && (
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
              onClick={() => toggleSort('service_type')}
            >
              <div className="flex items-center">
                <span>Servicio</span>
                {sortField === 'service_type' && (
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
              onClick={() => toggleSort('booking_date')}
            >
              <div className="flex items-center">
                <span>Fecha</span>
                {sortField === 'booking_date' && (
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
              onClick={() => toggleSort('status')}
            >
              <div className="flex items-center">
                <span>Estado</span>
                {sortField === 'status' && (
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#e0e6e5]">
          {bookings.map((booking) => (
            <tr key={booking.id} className={`hover:bg-[#f5f9f8] ${isUpdating === booking.id ? 'opacity-50' : ''}`}>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52]">
                {booking.booking_reference}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-[#313D52]">{booking.full_name}</div>
                <div className="text-xs text-[#6c7a89]">{booking.email}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-[#313D52]">{getServiceName(booking.service_type)}</div>
                <div className="text-xs text-[#6c7a89]">{booking.marca} {booking.modelo}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                {formatDate(booking.booking_date)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {isUpdating === booking.id ? (
                  <div className="flex items-center">
                    <Loader2 size={16} className="animate-spin mr-2 text-[#78f3d3]" />
                    <span className="text-[#6c7a89] text-xs">Actualizando...</span>
                  </div>
                ) : (
                  <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    <span className="mr-1">{getStatusIcon(booking.status)}</span>
                    {getStatusText(booking.status)}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                <div className="relative inline-block text-left" ref={activeDropdown === booking.id ? dropdownRef : null}>
                  <button
                    onClick={() => toggleDropdown(booking.id)}
                    className="p-1 rounded-full hover:bg-[#e0e6e5] text-[#6c7a89]"
                    disabled={isUpdating === booking.id}
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {activeDropdown === booking.id && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white z-50 ring-1 ring-[#e0e6e5] divide-y divide-[#e0e6e5]">
                      <div className="py-1">
                        <button
                          onClick={() => handleViewDetails(booking.id)}
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                        >
                          <Eye size={16} className="mr-3 text-[#6c7a89]" />
                          Ver detalles
                        </button>
                        <Link 
                          href={`/admin/bookings/${booking.id}`} 
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8]"
                        >
                          <Package size={16} className="mr-3 text-[#6c7a89]" />
                          Página completa
                        </Link>
                        <Link 
                          href={`/admin/bookings/${booking.id}/edit`} 
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8]"
                        >
                          <Edit2 size={16} className="mr-3 text-[#6c7a89]" />
                          Editar
                        </Link>
                      </div>
                      
                      <div className="py-1">
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'pending')}
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          disabled={booking.status === 'pending'}
                        >
                          <span className="w-4 h-4 mr-3 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock size={12} className="text-yellow-800" />
                          </span>
                          Marcar como Pendiente
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'completed')}
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          disabled={booking.status === 'completed'}
                        >
                          <span className="w-4 h-4 mr-3 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle size={12} className="text-green-800" />
                          </span>
                          Marcar como Completado
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          disabled={booking.status === 'cancelled'}
                        >
                          <span className="w-4 h-4 mr-3 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle size={12} className="text-red-800" />
                          </span>
                          Cancelar Reservación
                        </button>
                      </div>
                      
                      <div className="py-1">
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <Trash2 size={16} className="mr-3" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Modal de detalles */}
    <BookingDetailsModal
      bookingId={selectedBookingId}
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      onStatusUpdate={handleModalStatusUpdate}
    />
  </>
  );
};

export default BookingsTable;