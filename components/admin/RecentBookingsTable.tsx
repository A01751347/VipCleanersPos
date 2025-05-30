'use client'
// components/admin/RecentBookingsTable.tsx
import React from 'react';
import { Eye } from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: number;
  booking_reference: string;
  full_name: string;
  service_type: string;
  booking_date: string;
  status: string;
  created_at: string;
}

interface RecentBookingsTableProps {
  bookings: Booking[];
}

const RecentBookingsTable: React.FC<RecentBookingsTableProps> = ({ bookings = [] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'received':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
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
      case 'received':
        return 'Recibido';
      case 'in_progress':
        return 'En Proceso';
      case 'completed':
        return 'Completado';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  };

  // Si no hay reservaciones, mostrar mensaje
  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-[#6c7a89]">
        No hay reservaciones recientes
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" style={{ minHeight: '300px' }}>
      <table className="min-w-full divide-y divide-[#e0e6e5]">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
              Referencia
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
              Servicio
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
              Estado
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#e0e6e5]">
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-[#f5f9f8]">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52]">
                {booking.booking_reference}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                {booking.full_name}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                {booking.service_type === 'basic' ? 'Limpieza Básica' : 
                 booking.service_type === 'premium' ? 'Limpieza Premium' : 
                 booking.service_type}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                {formatDate(booking.booking_date)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                <Link href={`/admin/bookings/${booking.id}`} className="text-[#78f3d3] hover:text-[#4de0c0]">
                  <Eye size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentBookingsTable;