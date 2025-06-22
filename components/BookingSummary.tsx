// components/BookingSummary.tsx
'use client'
import React from 'react';
import { Info } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { calculateTotalPrice } from '../utils/bookingUtils';

const BookingSummary: React.FC = () => {
  const { formData, serviceOptions, zoneInfo } = useBooking();

  const totalPrice = calculateTotalPrice(
    formData.serviceType, 
    serviceOptions, 
    formData.deliveryMethod, 
    zoneInfo
  );

  return (
    <div className="bg-[#f5f9f8] p-6 rounded-lg mt-6">
      <h4 className="font-medium text-[#313D52] text-lg mb-4 flex items-center">
        <Info size={20} className="mr-2" />
        Resumen de tu reserva
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ul className="space-y-3 text-[#313D52]">
            <li><span className="font-medium">Cliente:</span> {formData.fullName}</li>
            <li><span className="font-medium">Email:</span> {formData.email}</li>
            <li><span className="font-medium">Teléfono:</span> {formData.phone}</li>
            <li><span className="font-medium">Calzado:</span> {formData.shoesType}</li>
            <li>
              <span className="font-medium">Servicio:</span> {
                serviceOptions.find(s => s.id === formData.serviceType)?.name || ''
              }
            </li>
          </ul>
        </div>
        
        <div>
          <ul className="space-y-3 text-[#313D52]">
            <li>
              <span className="font-medium">Entrega:</span> {
                formData.deliveryMethod === 'store' 
                  ? 'En tienda' 
                  : `Pickup - ${zoneInfo?.zone || 'Pendiente validación'}`
              }
            </li>
            {formData.deliveryMethod === 'pickup' && formData.address.street && (
              <li>
                <span className="font-medium">Dirección:</span>
                <div className="text-sm mt-1">
                  {formData.address.street} {formData.address.number}
                  {formData.address.interior && `, ${formData.address.interior}`}
                  <br />
                  {formData.address.neighborhood}, {formData.address.city}
                  <br />
                  CP {formData.address.zipCode}
                </div>
              </li>
            )}
            <li>
              <span className="font-medium">Fecha:</span> {
                formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : ''
              }
            </li>
            <li><span className="font-medium">Hora:</span> {formData.bookingTime}</li>
            <li className="pt-3 border-t border-[#e0e6e5]">
              <div className="text-xl font-bold text-[#313D52]">
                Total: ${totalPrice} MXN
              </div>
              {formData.deliveryMethod === 'pickup' && zoneInfo?.available && (
                <div className="text-sm text-[#6c7a89] mt-1">
                  Incluye pickup: ${zoneInfo.cost}
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;