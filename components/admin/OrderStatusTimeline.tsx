'use client'
// components/admin/OrderStatusTimeline.tsx
import React from 'react';
import { Package, CheckCircle, Clock, Truck, XCircle, Inbox } from 'lucide-react';

interface OrderStatusHistoryItem {
  historial_id: number;
  estado_id: number;
  estado_nombre: string;
  estado_color: string;
  fecha_cambio: string;
  empleado_nombre: string;
  comentario: string | null;
}

interface OrderStatusTimelineProps {
  history: OrderStatusHistoryItem[];
}

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ history }) => {
  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener icono para un estado - usando los mismos IDs que OrdersTable
  const getStatusIcon = (statusId: number) => {
    switch(statusId) {
      case 9: // Pendiente
        return <Package size={16} />;
      case 1: // Recibido
        return <Inbox size={16} />;
      case 2: // En Proceso
        return <Clock size={16} />;
      case 6: // Completado
        return <CheckCircle size={16} />;
      case 7: // Entregado
        return <Truck size={16} />;
      case 8: // Cancelado
        return <XCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <Package size={48} className="mx-auto text-[#6c7a89] mb-4" />
        <p className="text-[#6c7a89]">No hay historial de estados disponible</p>
      </div>
    );
  }
   console.log("history",history);

  return (
    <div className="relative">
      {/* Línea vertical conectora */}
      <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-[#e0e6e5]"></div>
      
      {/* Timeline items */}
      <div className="space-y-6">
        {history.map((item, index) => (
          <div key={item.historial_id} className="relative flex items-start">
            {/* Círculo indicador */}
            <div className="relative z-10 flex-shrink-0">
              <div className="w-12 h-12 bg-white border-4 border-[#78f3d3] rounded-full flex items-center justify-center shadow-sm">
                {index === 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#78f3d3] rounded-full border-2 border-white"></div>
                )}
                <div className="text-[#313D52]">
                  {getStatusIcon(item.estado_id)}
                </div>
              </div>
            </div>

            
            {/* Contenido */}
            <div className="ml-6 flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(item.estado_id)}
                </div>
                <h3 className="text-base font-semibold text-[#313D52]">
                  {item.estado_nombre}
                </h3>
              </div>
              
              <p className="text-sm text-[#6c7a89] mb-1">
                {formatDate(item.fecha_cambio)}
              </p>
              
              <p className="text-sm text-[#6c7a89] mb-2">
                Por: {item.empleado_nombre}
              </p>
              
              {item.comentario && (
                <div className="bg-[#f5f9f8] rounded-lg p-3 text-sm text-[#313D52] border-l-4 border-[#78f3d3]">
                  &quot{item.comentario}&quot
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStatusTimeline;