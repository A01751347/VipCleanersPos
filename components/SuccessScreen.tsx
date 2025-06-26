// components/SuccessScreen.tsx - Versión Corregida
'use client'
import React, { useState } from 'react';
import { CheckCircle, Copy, Phone, Mail, MapPin, Calendar, Clock, X } from 'lucide-react';
import { useBooking } from '../context/BookingContext';

interface SuccessScreenProps {
  onClose: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ onClose }) => {
  const { formData, formStatus } = useBooking();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (formStatus.bookingReference) {
      try {
        await navigator.clipboard.writeText(formStatus.bookingReference);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="text-center space-y-6">
      {/* Icono de éxito */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={48} className="text-green-600" />
        </div>
      </div>

      {/* Título y mensaje principal */}
      <div>
        <h2 className="text-2xl font-bold text-[#313D52] mb-2">
          ¡Reserva Confirmada!
        </h2>
        <p className="text-[#6c7a89] text-lg">
          Tu solicitud ha sido procesada exitosamente
        </p>
      </div>

      {/* Código de referencia */}
      {formStatus.bookingReference && (
        <div className="bg-gradient-to-r from-[#78f3d3] to-[#4de0c0] p-6 rounded-xl">
          <h3 className="text-[#313D52] font-semibold mb-2">Código de Referencia</h3>
          <div className="flex items-center justify-center space-x-3">
            <span className="text-2xl font-bold text-[#313D52] tracking-wider">
              {formStatus.bookingReference}
            </span>
            <button
              onClick={copyToClipboard}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              title="Copiar código"
            >
              <Copy size={20} className="text-[#313D52]" />
            </button>
          </div>
          {copied && (
            <p className="text-sm text-[#313D52] mt-2 opacity-90">
              ✓ Código copiado al portapapeles
            </p>
          )}
        </div>
      )}

      {/* Resumen de la reserva */}
      <div className="bg-white border border-[#e0e6e5] rounded-xl p-6 space-y-4 text-left">
        <h3 className="text-lg font-semibold text-[#313D52] text-center mb-4">
          Resumen de tu Reserva
        </h3>

        {/* Información del cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#f5f9f8] rounded-full flex items-center justify-center mr-3">
                <CheckCircle size={16} className="text-[#78f3d3]" />
              </div>
              <div>
                <p className="text-xs text-[#6c7a89] uppercase tracking-wide">Cliente</p>
                <p className="font-medium text-[#313D52]">{formData.fullName}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#f5f9f8] rounded-full flex items-center justify-center mr-3">
                <Mail size={16} className="text-[#78f3d3]" />
              </div>
              <div>
                <p className="text-xs text-[#6c7a89] uppercase tracking-wide">Email</p>
                <p className="font-medium text-[#313D52]">{formData.email}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#f5f9f8] rounded-full flex items-center justify-center mr-3">
                <Phone size={16} className="text-[#78f3d3]" />
              </div>
              <div>
                <p className="text-xs text-[#6c7a89] uppercase tracking-wide">Teléfono</p>
                <p className="font-medium text-[#313D52]">{formData.phone}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#f5f9f8] rounded-full flex items-center justify-center mr-3">
                <Calendar size={16} className="text-[#78f3d3]" />
              </div>
              <div>
                <p className="text-xs text-[#6c7a89] uppercase tracking-wide">Fecha</p>
                <p className="font-medium text-[#313D52]">{formatDate(formData.bookingDate)}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#f5f9f8] rounded-full flex items-center justify-center mr-3">
                <Clock size={16} className="text-[#78f3d3]" />
              </div>
              <div>
                <p className="text-xs text-[#6c7a89] uppercase tracking-wide">Hora</p>
                <p className="font-medium text-[#313D52]">{formatTime(formData.bookingTime)}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#f5f9f8] rounded-full flex items-center justify-center mr-3">
                <MapPin size={16} className="text-[#78f3d3]" />
              </div>
              <div>
                <p className="text-xs text-[#6c7a89] uppercase tracking-wide">Entrega</p>
                <p className="font-medium text-[#313D52]">
                  {formData.deliveryMethod === 'store' ? 'En tienda' : 'Pickup a domicilio'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información del calzado */}
        <div className="border-t border-[#e0e6e5] pt-4">
          <p className="text-xs text-[#6c7a89] uppercase tracking-wide mb-1">Calzado</p>
          <p className="font-medium text-[#313D52]">{formData.shoesType}</p>
        </div>

        {/* Dirección si es pickup */}
        {formData.deliveryMethod === 'pickup' && formData.address.street && (
          <div className="border-t border-[#e0e6e5] pt-4">
            <p className="text-xs text-[#6c7a89] uppercase tracking-wide mb-2">Dirección de Pickup</p>
            <div className="bg-[#f5f9f8] p-3 rounded-lg">
              <p className="text-sm text-[#313D52]">
                {formData.address.street} {formData.address.number}
                {formData.address.interior && `, Int. ${formData.address.interior}`}
              </p>
              <p className="text-sm text-[#313D52]">
                {formData.address.neighborhood}, {formData.address.city}
              </p>
              <p className="text-sm text-[#313D52]">CP {formData.address.zipCode}</p>
              {formData.address.phone && (
                <p className="text-sm text-[#6c7a89] mt-1">
                  Contacto: {formData.address.phone}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Información importante */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
        <h4 className="font-semibold text-blue-900 mb-3">Información Importante</h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Recibirás un email de confirmación con todos los detalles</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Guarda tu código de referencia para futuras consultas</span>
          </li>
          {formData.deliveryMethod === 'pickup' && (
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Te contactaremos 30 minutos antes de la recolección</span>
            </li>
          )}
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>El pago se realiza al momento de la entrega del calzado limpio</span>
          </li>
        </ul>
      </div>

      {/* Información de contacto */}
      <div className="bg-[#f5f9f8] border border-[#e0e6e5] rounded-xl p-4">
        <h4 className="font-semibold text-[#313D52] mb-3">¿Necesitas ayuda?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Phone size={16} className="text-[#78f3d3] mr-2" />
            <div>
              <p className="text-[#6c7a89]">Teléfono:</p>
              <p className="font-medium text-[#313D52]">442-123-4567</p>
            </div>
          </div>
          <div className="flex items-center">
            <Mail size={16} className="text-[#78f3d3] mr-2" />
            <div>
              <p className="text-[#6c7a89]">Email:</p>
              <p className="font-medium text-[#313D52]">info@sneakerspa.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón para cerrar */}
      <div className="pt-4">
        <button
          onClick={onClose}
          className="w-full py-3 px-6 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center justify-center"
        >
          <X size={20} className="mr-2" />
          Cerrar
        </button>
      </div>

      {/* Mensaje adicional */}
      <p className="text-xs text-[#6c7a89] text-center">
        ¡Gracias por confiar en nosotros para el cuidado de tu calzado!
      </p>
    </div>
  );
};

export default SuccessScreen;