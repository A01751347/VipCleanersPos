'use client'
// components/admin/OrderStatusUpdateModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Package, CheckCircle, Clock, Truck, XCircle, Loader2, Inbox } from 'lucide-react';

interface OrderStatusUpdateModalProps {
  currentStatus: number;
  onClose: () => void;
  onSubmit: (statusId: number, comments: string) => void;
}

interface StatusOption {
  id: number;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const OrderStatusUpdateModal: React.FC<OrderStatusUpdateModalProps> = ({ 
  currentStatus,
  onClose, 
  onSubmit 
}) => {
  const [selectedStatus, setSelectedStatus] = useState<number>(currentStatus);
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Lista de estados disponibles - usando los mismos IDs que OrdersTable
  const statusOptions: StatusOption[] = [
    {
      id: 9,
      name: 'Pendiente',
      icon: <Package size={16} />,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      description: 'La orden ha sido creada pero aún no ha sido recibida físicamente.'
    },
    {
      id: 1,
      name: 'Recibido',
      icon: <Inbox size={16} />,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Se ha recibido físicamente el producto o calzado para servicio.'
    },
    {
      id: 2,
      name: 'En Proceso',
      icon: <Clock size={16} />,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      description: 'Se está trabajando activamente en el servicio o producto.'
    },
    {
      id: 6,
      name: 'Completado',
      icon: <CheckCircle size={16} />,
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'El servicio ha sido completado y está listo para entrega.'
    },
    {
      id: 7,
      name: 'Entregado',
      icon: <Truck size={16} />,
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'El producto o calzado ha sido entregado al cliente.'
    },
    {
      id: 8,
      name: 'Cancelado',
      icon: <XCircle size={16} />,
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'La orden ha sido cancelada.'
    }
  ];

  // Encontrar el estado actual
  const currentStatusOption = statusOptions.find(option => option.id === currentStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStatus === currentStatus) {
      // No hay cambio de estado
      onClose();
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Llamar a la función onSubmit proporcionada por el padre
      await onSubmit(selectedStatus, comments);
      
      // El componente padre se encargará de cerrar el modal después de la actualización exitosa
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      // Mostrar mensaje de error si es necesario
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6c7a89] hover:text-[#313D52] p-1 rounded-full hover:bg-[#f5f9f8]"
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>
        
        <div className="p-6 border-b border-[#e0e6e5]">
          <h2 className="text-lg font-semibold text-[#313D52]">Actualizar Estado de la Orden</h2>
          <p className="text-[#6c7a89] text-sm mt-1">
            Estado actual: 
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center ${currentStatusOption?.color}`}>
              {currentStatusOption?.icon}
              <span className="ml-1">{currentStatusOption?.name}</span>
            </span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#313D52] mb-2">
                Seleccionar Nuevo Estado
              </label>
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`p-3 rounded-lg border ${
                      selectedStatus === option.id
                        ? `${option.color} border-2`
                        : 'border-[#e0e6e5] hover:border-[#78f3d3] hover:bg-[#f5f9f8]'
                    } transition-all flex flex-col items-center text-center`}
                    onClick={() => setSelectedStatus(option.id)}
                    disabled={isSubmitting}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                      option.color.split(' ')[0]
                    }`}>
                      {option.icon}
                    </div>
                    <span className="font-medium text-[#313D52]">{option.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Mostrar descripción del estado seleccionado */}
              {selectedStatus !== currentStatus && statusOptions.find(option => option.id === selectedStatus)?.description && (
                <div className="mt-3 text-sm text-[#6c7a89] bg-[#f5f9f8] p-3 rounded-lg">
                  {statusOptions.find(option => option.id === selectedStatus)?.description}
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-[#313D52] mb-2">
                Comentarios (opcional)
              </label>
              <textarea
                id="comments"
                rows={3}
                className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm resize-none"
                placeholder="Añade comentarios o notas sobre este cambio de estado..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={isSubmitting}
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e0e6e5] text-[#6c7a89] rounded-lg hover:bg-[#f5f9f8] transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || selectedStatus === currentStatus}
              className={`px-6 py-2 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center ${
                (isSubmitting || selectedStatus === currentStatus) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Estado'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderStatusUpdateModal;