'use client'
// components/admin/OrdersTable.tsx
import React, { useState } from 'react';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical, 
  ChevronDown, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2,
  Banknote,
  User,
  AlertCircle,
  Inbox,
  X
} from 'lucide-react';
import Link from 'next/link';

interface Order {
  orden_id: number;
  codigo_orden: string;estado_servicio: string | undefined;

  cliente_nombre: string;
  cliente_apellidos: string;
  cliente_email: string;
  total: number;
  estado_nombre: string;
  fecha_recepcion: string;
  fecha_entrega_estimada: string;
  estado_servicio_id: number;
  estado_actual: string;
  estado_actual_id: number;
  estado_pago: string;
  empleado_recepcion_nombre: string;
}
export type { Order };
interface OrdersTableProps {
  orders: Order[];
  onStatusChange?: () => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders = [], onStatusChange }) => {
  const [sortField, setSortField] = useState('fecha_recepcion');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const getStatusColor = (status?: string) => {
    if (typeof status !== 'string') return 'bg-gray-100 text-gray-500';
  
    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'recibido':
        return 'bg-blue-100 text-blue-800';
      case 'en proceso':
        return 'bg-orange-100 text-orange-800';
        case 'listo para entrega':
          return 'bg-green-100 text-green-600';
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'parcial':
        return 'bg-blue-100 text-blue-800';
      case 'pagado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
const getStatusIcon = (status?: string) => {
  if (typeof status !== 'string') return <AlertCircle size={14} className="text-gray-400" />;

  switch (status.toLowerCase()) {
    case 'pendiente':
      return <Package size={14} />;
      case 'listo para entrega':
        return <Package size={14} />;
    case 'recibido':
      return <Inbox size={14} />;
    case 'en proceso':
      return <Loader2 size={14} className="animate-spin" />;
    case 'entregado':
      return <CheckCircle size={14} />;
    case 'cancelado':
      return <X size={14} />;
    default:
      return <AlertCircle size={14} />;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
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

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
      return;
    }
    
    try {
      setIsUpdating(id);
      
      // Aquí iría la llamada a la API para eliminar la orden
      console.log(`Deleting order with ID: ${id}`);
      
      // Notificar cambio al componente padre para refrescar datos
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error al eliminar la orden:', error);
      alert('Error al eliminar la orden');
    } finally {
      setActiveDropdown(null);
      setIsUpdating(null);
    }
  };

  const handleUpdateStatus = async (id: number, statusId: number) => {
    try {
      setIsUpdating(id);
      
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estadoId: statusId }),
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar el estado de la orden');
      }
      
      // Notificar cambio al componente padre para refrescar datos
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error al actualizar el estado de la orden:', error);
      alert('Error al actualizar el estado de la orden');
    } finally {
      setActiveDropdown(null);
      setIsUpdating(null);
    }
  };

  return (
    <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
      <table className="min-w-full divide-y divide-[#e0e6e5]">
        <thead>
          <tr>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
              onClick={() => toggleSort('codigo_orden')}
            >
              <div className="flex items-center">
                <span>Código</span>
                {sortField === 'codigo_orden' && (
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
              onClick={() => toggleSort('cliente_nombre')}
            >
              <div className="flex items-center">
                <span>Cliente</span>
                {sortField === 'cliente_nombre' && (
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
              onClick={() => toggleSort('fecha_recepcion')}
            >
              <div className="flex items-center">
                <span>Fecha</span>
                {sortField === 'fecha_recepcion' && (
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
              onClick={() => toggleSort('total')}
            >
              <div className="flex items-center">
                <span>Total</span>
                {sortField === 'total' && (
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
              onClick={() => toggleSort('estado_actual')}
            >
              <div className="flex items-center">
                <span>Estado</span>
                {sortField === 'estado_actual' && (
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
              onClick={() => toggleSort('estado_pago')}
            >
              <div className="flex items-center">
                <span>Pago</span>
                {sortField === 'estado_pago' && (
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
          {orders.map((order) => (
            <tr key={order.orden_id} className={`hover:bg-[#f5f9f8] ${isUpdating === order.orden_id ? 'opacity-50' : ''}`}>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52]">
                {order.codigo_orden}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-[#f5f9f8] rounded-full flex items-center justify-center">
                    <User size={16} className="text-[#6c7a89]" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-[#313D52]">
                      {order.cliente_nombre} 
                    </div>
                    <div className="text-xs text-[#6c7a89]">{order.cliente_email}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                {formatDate(order.fecha_recepcion)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52]">
                {formatCurrency(order.total)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {isUpdating === order.orden_id ? (
                  <div className="flex items-center">
                    <Loader2 size={16} className="animate-spin mr-2 text-[#78f3d3]" />
                    <span className="text-[#6c7a89] text-xs">Actualizando...</span>
                  </div>
                ) : (
                  <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.estado_nombre)}`}>
                    <span className="mr-1">{getStatusIcon(order.estado_nombre)}</span>
                    {order.estado_nombre}

                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.estado_pago)}`}>
                  <Banknote size={14} className="mr-1" />
                  {order.estado_pago}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                <div className="relative inline-block text-left">
                  <button
                    onClick={() => toggleDropdown(order.orden_id)}
                    className="p-1 rounded-full hover:bg-[#e0e6e5] text-[#6c7a89]"
                    disabled={isUpdating === order.orden_id}
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {activeDropdown === order.orden_id && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white z-50 ring-1 ring-[#e0e6e5] divide-y divide-[#e0e6e5]">
                      <div className="py-1">
                        <Link 
                          href={`/admin/orders/${order.orden_id}`} 
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8]"
                        >
                          <Eye size={16} className="mr-3 text-[#6c7a89]" />
                          Ver detalles
                        </Link>
                        <Link 
                          href={`/admin/orders/${order.orden_id}/edit`} 
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8]"
                        >
                          <Edit size={16} className="mr-3 text-[#6c7a89]" />
                          Editar
                        </Link>
                      </div>
                      
                      <div className="py-1">

                      <button
                          onClick={() => handleUpdateStatus(order.orden_id, 9)} // Estado 5: Entregado
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          disabled={order.estado_servicio_id === 9}
                        >
                          <span className="w-4 h-4 mr-3 rounded-full bg-purple-100 flex items-center justify-center">
                            <CheckCircle size={12} className="text-yellow-800" />
                          </span>
                          Marcar como Pendiente
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.orden_id, 1)} 
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          disabled={order.estado_servicio_id === 1}
                        >
                          <span className="w-4 h-4 mr-3 rounded-full bg-blue-100 flex items-center justify-center">
                            <CheckCircle size={12} className="text-blue-800" />
                          </span>
                          Marcar como Recibido
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.orden_id, 2)} 
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          disabled={order.estado_servicio_id === 2}
                        >
                          <span className="w-4 h-4 mr-3 rounded-full bg-orange-100 flex items-center justify-center">
                            <Clock size={12} className="text-orange-800" />
                          </span>
                          Marcar como En Proceso
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.orden_id, 6)} 
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          disabled={order.estado_servicio_id === 6}
                        >
                          <span className="w-4 h-4 mr-3 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle size={12} className="text-green-800" />
                          </span>
                          Marcar como Completado
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.orden_id, 7)} 
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          disabled={order.estado_servicio_id === 7}
                        >
                          <span className="w-4 h-4 mr-3 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle size={12} className="text-green-800" />
                          </span>
                          Marcar como Entregado
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.orden_id, 8)} // Estado 5: Entregado
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          disabled={order.estado_servicio_id === 8}
                        >
                          <span className="w-4 h-4 mr-3 rounded-full bg-red-100 flex items-center justify-center">
                            <CheckCircle size={12} className="text-red-800" />
                          </span>
                          Marcar como Cancelado
                        </button>
                      </div>
                      
                      <div className="py-1">
                        <button
                          onClick={() => handleDelete(order.orden_id)}
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
  );
};

export default OrdersTable;