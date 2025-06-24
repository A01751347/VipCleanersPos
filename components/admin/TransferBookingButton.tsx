// components/admin/TransferBookingButton.tsx
'use client'
import React, { useState } from 'react';
import { ArrowRight, Package, Loader2, CheckCircle } from 'lucide-react';

interface TransferBookingButtonProps {
  bookingId: number;
  bookingReference: string;
  onSuccess?: (data: any) => void;
  disabled?: boolean;
}

const TransferBookingButton: React.FC<TransferBookingButtonProps> = ({
  bookingId,
  bookingReference,
  onSuccess,
  disabled = false
}) => {
  const [isTransferring, setIsTransferring] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleTransfer = async () => {
    if (!showNotesModal) {
      setShowNotesModal(true);
      return;
    }

    try {
      setIsTransferring(true);
      
      const response = await fetch(`/api/admin/bookings/${bookingId}/transfer-to-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notasAdicionales: additionalNotes.trim() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al transferir la reservación');
      }

      const result = await response.json();
      
      // Mostrar notificación de éxito
      alert(`¡Reservación transferida exitosamente!\n\nCódigo de Orden: ${result.data.codigoOrden}\nTotal: $${result.data.total}`);
      
      // Cerrar modal
      setShowNotesModal(false);
      setAdditionalNotes('');
      
      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess(result.data);
      }

    } catch (error) {
      console.error('Error transfiriendo reservación:', error);
      alert(error instanceof Error ? error.message : 'Error al transferir la reservación');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCancel = () => {
    setShowNotesModal(false);
    setAdditionalNotes('');
  };

  return (
    <>
      {/* Botón principal */}
      <button
        onClick={handleTransfer}
        disabled={disabled || isTransferring}
        className={`
          inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${disabled || isTransferring
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[#78f3d3] text-[#313D52] hover:bg-[#4de0c0] shadow-md hover:shadow-lg'
          }
        `}
      >
        {isTransferring ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Transfiriendo...
          </>
        ) : (
          <>
            <Package size={16} className="mr-2" />
            Transferir a Orden
            <ArrowRight size={16} className="ml-2" />
          </>
        )}
      </button>

      {/* Modal de notas adicionales */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <Package size={20} className="text-[#78f3d3] mr-2" />
              <h3 className="text-lg font-semibold text-[#313D52]">
                Transferir Reservación
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-[#6c7a89] mb-2">
                <strong>Reservación:</strong> {bookingReference}
              </p>
              <p className="text-sm text-[#6c7a89] mb-4">
                Se creará una nueva orden manteniendo toda la información de la reservación.
              </p>
              
              <label className="block text-sm font-medium text-[#313D52] mb-2">
                Notas adicionales (opcional):
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Agregar cualquier información adicional..."
                className="w-full px-3 py-2 border border-[#e0e6e5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#78f3d3] resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-[#6c7a89] mt-1">
                {additionalNotes.length}/500 caracteres
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isTransferring}
                className="flex-1 px-4 py-2 bg-gray-100 text-[#6c7a89] rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransfer}
                disabled={isTransferring}
                className="flex-1 px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-md hover:bg-[#4de0c0] transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isTransferring ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Transfiriendo...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransferBookingButton;