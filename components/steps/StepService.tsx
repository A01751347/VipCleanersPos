// components/steps/StepService.tsx
'use client'
import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { StepProps } from '../../types/booking';

const StepService: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const { formData, setFormData, serviceOptions } = useBooking();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (serviceId: string) => {
    setFormData(prev => ({ ...prev, serviceType: serviceId }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#313D52] mb-4">Detalles del Servicio</h3>
      
      <div>
        <label className="block text-[#313D52] font-medium mb-2" htmlFor="shoesType">
          Marca y Modelo del Calzado *
        </label>
        <input
          type="text"
          id="shoesType"
          name="shoesType"
          value={formData.shoesType}
          onChange={handleChange}
          placeholder="Ej. Nike Air Jordan 1, Adidas Ultraboost, etc."
          className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg"
          required
        />
      </div>
      
      <div>
        <p className="block text-[#313D52] font-medium mb-4">Tipo de Servicio *</p>
        <div className="grid grid-cols-1 gap-4">
          {serviceOptions.map((service) => (
            <div 
              key={service.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                formData.serviceType === service.id
                  ? 'border-[#78f3d3] bg-[#e0f7f0] ring-2 ring-[#78f3d3]'
                  : 'border-[#e0e6e5] hover:border-[#78f3d3]'
              }`}
              onClick={() => handleServiceChange(service.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-[#313D52]">{service.name}</h4>
                <div className="text-right">
                  <span className="text-[#313D52] font-bold text-lg">${service.price}</span>
                  <p className="text-xs text-[#6c7a89]">{service.duration} min</p>
                </div>
              </div>
              <p className="text-[#6c7a89] text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepService;