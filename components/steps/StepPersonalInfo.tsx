// components/steps/StepPersonalInfo.tsx
'use client'
import React from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { StepProps } from '../../types/booking';

const StepPersonalInfo: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const { formData, setFormData } = useBooking();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phone: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <User size={24} className="text-[#78f3d3] mr-3" />
        <h3 className="text-xl font-semibold text-[#313D52]">Información Personal</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="fullName">
            Nombre Completo *
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Tu nombre completo"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg"
            required
          />
        </div>
        
        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="email">
            <Mail size={16} className="inline mr-2" />
            Correo Electrónico *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg"
            required
          />
        </div>
        
        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="phone">
            <Phone size={16} className="inline mr-2" />
            Teléfono *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="10 dígitos"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default StepPersonalInfo;