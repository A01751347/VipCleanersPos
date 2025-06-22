// components/steps/StepDateTime.tsx
'use client'
import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { StepProps } from '../../types/booking';
import { generateTimeOptions, getMinDate } from '../../utils/bookingUtils';
import BookingSummary from '../BookingSummary';

const StepDateTime: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const { formData, setFormData } = useBooking();
  const timeOptions = generateTimeOptions();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Calendar size={24} className="text-[#78f3d3] mr-3" />
        <h3 className="text-xl font-semibold text-[#313D52]">Fecha y Hora</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="bookingDate">
            Selecciona fecha *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Calendar size={18} className="text-gray-500" />
            </div>
            <input
              type="date"
              id="bookingDate"
              name="bookingDate"
              value={formData.bookingDate}
              onChange={handleChange}
              min={getMinDate()}
              className="w-full pl-10 px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="bookingTime">
            Selecciona hora *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Clock size={18} className="text-gray-500" />
            </div>
            <select
              id="bookingTime"
              name="bookingTime"
              value={formData.bookingTime}
              onChange={handleChange}
              className="w-full pl-10 px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg appearance-none"
              required
            >
              <option value="">Selecciona una hora</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <BookingSummary />
    </div>
  );
};

export default StepDateTime;