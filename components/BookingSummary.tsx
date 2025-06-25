// components/BookingSummary.tsx
'use client'
import React from 'react';
import { Info, AlertCircle, DollarSign, Calendar, Clock, MapPin, User, Mail, Phone, Footprints, Truck, Home } from 'lucide-react';
import { useBooking, useServices } from '../context/BookingContext';
import { calculateTotalPrice } from '../utils/bookingUtils';

const BookingSummary: React.FC = () => {
  const { formData, zoneInfo } = useBooking();
  const { services: serviceOptions, getById } = useServices();

  // Obtener el servicio seleccionado
  const selectedService = getById(formData.serviceType);

  // Calcular precio total
  const totalPrice = calculateTotalPrice(
    formData.serviceType, 
    serviceOptions, 
    formData.deliveryMethod, 
    zoneInfo
  );

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="bg-gradient-to-br from-[#f5f9f8] to-white p-6 rounded-xl border border-[#e0e6e5] shadow-sm mt-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-[#78f3d3] bg-opacity-20 rounded-full flex items-center justify-center mr-3">
          <Info size={20} className="text-[#78f3d3]" />
        </div>
        <h4 className="font-semibold text-[#313D52] text-xl">
          Resumen de tu reserva
        </h4>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Información del cliente */}
        <div className="space-y-4">
          <h5 className="font-medium text-[#313D52] text-lg mb-4 flex items-center">
            <User size={18} className="mr-2 text-[#78f3d3]" />
            Información del Cliente
          </h5>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <User size={16} className="text-[#6c7a89] mr-3 flex-shrink-0" />
              <div>
                <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Nombre</span>
                <p className="font-medium text-[#313D52]">{formData.fullName || 'No especificado'}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Mail size={16} className="text-[#6c7a89] mr-3 flex-shrink-0" />
              <div>
                <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Email</span>
                <p className="font-medium text-[#313D52]">{formData.email || 'No especificado'}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Phone size={16} className="text-[#6c7a89] mr-3 flex-shrink-0" />
              <div>
                <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Teléfono</span>
                <p className="font-medium text-[#313D52]">{formData.phone || 'No especificado'}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Footprints size={16} className="text-[#6c7a89] mr-3 flex-shrink-0" />
              <div>
                <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Calzado</span>
                <p className="font-medium text-[#313D52]">{formData.shoesType || 'No especificado'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información del servicio y entrega */}
        <div className="space-y-4">
          <h5 className="font-medium text-[#313D52] text-lg mb-4 flex items-center">
            <Calendar size={18} className="mr-2 text-[#78f3d3]" />
            Detalles del Servicio
          </h5>
          
          <div className="space-y-3">
            {/* Servicio seleccionado */}
            <div>
              <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Servicio</span>
              <div className="flex items-center justify-between">
                <p className="font-medium text-[#313D52]">
                  {selectedService?.name || 'No seleccionado'}
                </p>
                {selectedService && (
                  <div className="flex items-center text-[#78f3d3]">
                    <DollarSign size={14} />
                    <span className="font-semibold">{selectedService.price}</span>
                  </div>
                )}
              </div>
              {selectedService && (
                <p className="text-xs text-[#6c7a89] mt-1">
                  Duración: {selectedService.duration} minutos
                </p>
              )}
            </div>

            {/* Método de entrega */}
            <div>
              <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Entrega</span>
              <div className="flex items-center">
                {formData.deliveryMethod === 'store' ? (
                  <Home size={16} className="text-[#6c7a89] mr-2" />
                ) : (
                  <Truck size={16} className="text-[#6c7a89] mr-2" />
                )}
                <p className="font-medium text-[#313D52]">
                  {formData.deliveryMethod === 'store' 
                    ? 'Recoger en tienda' 
                    : `Pickup a domicilio`
                  }
                </p>
              </div>
              
              {formData.deliveryMethod === 'pickup' && zoneInfo && (
                <div className="mt-2 p-3 bg-[#78f3d3] bg-opacity-10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#313D52]">Zona: {zoneInfo.zone}</span>
                    <span className="text-sm font-medium text-[#78f3d3]">+${zoneInfo.additionalCost}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Dirección si es pickup */}
            {formData.deliveryMethod === 'pickup' && formData.address.street && (
              <div>
                <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Dirección</span>
                <div className="flex items-start">
                  <MapPin size={16} className="text-[#6c7a89] mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#313D52]">
                    <p>{formData.address.street} {formData.address.number}</p>
                    {formData.address.interior && <p>Int. {formData.address.interior}</p>}
                    <p>{formData.address.neighborhood}, {formData.address.city}</p>
                    <p>CP {formData.address.zipCode}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Fecha</span>
                <div className="flex items-center">
                  <Calendar size={16} className="text-[#6c7a89] mr-2" />
                  <p className="font-medium text-[#313D52] text-sm">
                    {formData.bookingDate ? formatDate(formData.bookingDate) : 'No seleccionada'}
                  </p>
                </div>
              </div>
              
              <div>
                <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Hora</span>
                <div className="flex items-center">
                  <Clock size={16} className="text-[#6c7a89] mr-2" />
                  <p className="font-medium text-[#313D52] text-sm">
                    {formData.bookingTime || 'No seleccionada'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="mt-8 pt-6 border-t border-[#e0e6e5]">
        <div className="bg-gradient-to-r from-[#78f3d3] to-[#4de0c0] p-6 rounded-xl text-[#313D52]">
          <div className="flex items-center justify-between">
            <div>
              <h6 className="font-medium text-lg">Total a Pagar</h6>
              {formData.deliveryMethod === 'pickup' && zoneInfo?.additionalCost && (
                <div className="text-sm opacity-90 mt-1">
                  <div className="flex justify-between">
                    <span>Servicio:</span>
                    <span>${selectedService?.price || 0} MXN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pickup:</span>
                    <span>+${zoneInfo.additionalCost} MXN</span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center">
                <DollarSign size={28} className="mr-2" />
                <span className="text-3xl font-bold">{totalPrice}</span>
                <span className="text-lg ml-2 opacity-90">MXN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas importantes */}
      {selectedService?.requiresIdentification && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center text-amber-800">
            <AlertCircle size={18} className="mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Identificación requerida</p>
              <p className="text-sm mt-1">
                Este servicio requiere presentar identificación oficial al momento de la entrega.
              </p>
            </div>
          </div>
        </div>
      )}

      {formData.deliveryMethod === 'pickup' && !zoneInfo && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-blue-800">
            <Info size={18} className="mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Validación de zona pendiente</p>
              <p className="text-sm mt-1">
                El costo de pickup se calculará según tu zona de entrega.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingSummary;