// components/steps/StepDelivery.tsx
'use client'
import React from 'react';
import { Home, Truck } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { StepProps } from '../../types/booking';
import AddressForm from '../AddressForm';

const StepDelivery: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const { formData, setFormData, zoneInfo } = useBooking();

  const handleDeliveryMethodChange = (method: string) => {
    setFormData(prev => ({ 
      ...prev, 
      deliveryMethod: method,
      requiresPickup: method === 'pickup'
    }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#313D52] mb-4">Método de Entrega</h3>
      
      <div>
        <p className="block text-[#313D52] font-medium mb-4">¿Cómo prefieres entregar tu calzado? *</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            className={`p-6 rounded-lg border-2 text-center transition-all ${
              formData.deliveryMethod === 'store'
                ? 'bg-[#78f3d3] text-[#313D52] border-[#78f3d3]'
                : 'bg-white text-[#313D52] border-[#e0e6e5] hover:border-[#78f3d3]'
            }`}
            onClick={() => handleDeliveryMethodChange('store')}
          >
            <Home size={32} className="mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Traer a la tienda</h4>
            <p className="text-sm opacity-80">Sin costo adicional</p>
          </button>
          
          <button
            type="button"
            className={`p-6 rounded-lg border-2 text-center transition-all ${
              formData.deliveryMethod === 'pickup'
                ? 'bg-[#78f3d3] text-[#313D52] border-[#78f3d3]'
                : 'bg-white text-[#313D52] border-[#e0e6e5] hover:border-[#78f3d3]'
            }`}
            onClick={() => handleDeliveryMethodChange('pickup')}
          >
            <Truck size={32} className="mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Recolección a domicilio</h4>
            <p className="text-sm opacity-80">
              {zoneInfo ? `+$${zoneInfo.cost}` : 'Costo según zona'}
            </p>
          </button>
        </div>
      </div>

      {formData.deliveryMethod === 'pickup' && <AddressForm />}
    </div>
  );
};

export default StepDelivery;