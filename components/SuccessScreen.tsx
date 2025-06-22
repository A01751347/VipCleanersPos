// components/SuccessScreen.tsx
'use client'
import React from 'react';
import { CheckCircle, Truck } from 'lucide-react';
import { useBooking, useResetForm } from '../context/BookingContext';

interface SuccessScreenProps {
  onClose: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ onClose }) => {
  const { formData, formStatus, zoneInfo } = useBooking();
  const resetForm = useResetForm();

  const handleFinish = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-4">
        <div className="w-24 h-24 bg-[#e0f7f0] rounded-full flex items-center justify-center">
          <CheckCircle size={64} className="text-[#78f3d3]" />
        </div>
      </div>
      <h3 className="text-2xl font-semibold text-[#313D52] mb-2">¡Reserva Exitosa!</h3>
      <p className="text-[#6c7a89] mb-4 text-lg">
        Tu reserva ha sido confirmada. Te enviaremos confirmación por email.
      </p>
      <div className="bg-[#f5f9f8] p-6 rounded-lg mb-8 max-w-md mx-auto">
        <p className="text-[#6c7a89] mb-2">Código de Seguimiento:</p>
        <p className="text-3xl font-bold text-[#313D52] mb-4">{formStatus.bookingReference}</p>
        <p className="text-sm text-[#6c7a89]">
          Guarda este código para dar seguimiento a tu servicio
        </p>
      </div>
      {formData.deliveryMethod === 'pickup' && zoneInfo && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-2">
            <Truck size={20} className="text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">Pickup Programado</span>
          </div>
          <p className="text-blue-700 text-sm">
            Recogeremos en {zoneInfo.zone} • Tiempo estimado: {zoneInfo.estimatedTime}
          </p>
        </div>
      )}
      <button
        onClick={handleFinish}
        className="px-8 py-4 bg-[#78f3d3] text-[#313D52] font-semibold rounded-lg hover:bg-[#4de0c0] transition-colors text-lg"
      >
        Finalizar
      </button>
    </div>
  );
};

export default SuccessScreen;