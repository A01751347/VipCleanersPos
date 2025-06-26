// components/steps/StepDelivery.tsx - Versión Corregida
'use client'
import React from 'react';
import { Home, Truck, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { StepProps } from '../../types/booking';
import AddressForm from '../AddressForm';

const StepDelivery: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const { formData, setFormData, zoneInfo } = useBooking();

  const handleDeliveryMethodChange = (method: string) => {
    setFormData(prev => ({ 
      ...prev, 
      deliveryMethod: method as 'store' | 'pickup',
      requiresPickup: method === 'pickup'
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Truck size={24} className="text-[#78f3d3] mr-3" />
        <h3 className="text-xl font-semibold text-[#313D52]">Método de Entrega</h3>
      </div>
      
      <div>
        <p className="block text-[#313D52] font-medium mb-4">¿Cómo prefieres entregar tu calzado? *</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            className={`p-6 rounded-lg border-2 text-center transition-all hover:shadow-md ${
              formData.deliveryMethod === 'store'
                ? 'bg-[#78f3d3] text-[#313D52] border-[#78f3d3] shadow-lg'
                : 'bg-white text-[#313D52] border-[#e0e6e5] hover:border-[#78f3d3]'
            }`}
            onClick={() => handleDeliveryMethodChange('store')}
          >
            <Home size={32} className="mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Traer a la tienda</h4>
            <p className="text-sm opacity-80">Sin costo adicional</p>
            <p className="text-xs mt-2 opacity-70">Lleva tu calzado directamente a nuestra tienda</p>
          </button>
          
          <button
            type="button"
            className={`p-6 rounded-lg border-2 text-center transition-all hover:shadow-md ${
              formData.deliveryMethod === 'pickup'
                ? 'bg-[#78f3d3] text-[#313D52] border-[#78f3d3] shadow-lg'
                : 'bg-white text-[#313D52] border-[#e0e6e5] hover:border-[#78f3d3]'
            }`}
            onClick={() => handleDeliveryMethodChange('pickup')}
          >
            <Truck size={32} className="mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Recolección a domicilio</h4>
            <p className="text-sm opacity-80">
              {zoneInfo && zoneInfo.isSupported 
                ? `+$${zoneInfo.additionalCost || zoneInfo.cost || 0}` 
                : 'Costo según zona'}
            </p>
            <p className="text-xs mt-2 opacity-70">Recogemos tu calzado en tu domicilio</p>
          </button>
        </div>
      </div>

      {/* Información sobre el método seleccionado */}
      {formData.deliveryMethod === 'store' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <CheckCircle size={18} className="text-green-600 mr-2" />
            <h4 className="font-medium text-green-900">Entrega en Tienda</h4>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p>📍 <strong>Dirección:</strong> Av. Universidad 123, Centro, Querétaro</p>
            <p>🕒 <strong>Horarios:</strong> Lunes a Sábado de 9:00 AM a 7:00 PM</p>
            <p>🅿️ <strong>Estacionamiento:</strong> Disponible sin costo</p>
            <p>💰 <strong>Costo:</strong> Sin costo adicional por entrega</p>
          </div>
        </div>
      )}

      {formData.deliveryMethod === 'pickup' && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center mb-2">
            <MapPin size={18} className="text-blue-600 mr-2" />
            <h4 className="font-medium text-blue-900">Pickup a Domicilio</h4>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>🚚 Recolectamos tu calzado en la comodidad de tu hogar</p>
            <p>📞 Te contactamos 30 minutos antes de llegar</p>
            <p>⏰ Horarios de pickup: Lunes a Sábado de 9:00 AM a 6:00 PM</p>
            <p>💵 El costo varía según tu zona de ubicación</p>
          </div>
        </div>
      )}

      {/* Mostrar información de zona si ya se validó */}
      {formData.deliveryMethod === 'pickup' && zoneInfo && zoneInfo.isSupported && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <CheckCircle size={18} className="text-green-600 mr-2" />
            <h4 className="font-medium text-green-900">Zona Confirmada</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-700 font-medium">Zona:</span>
              <p className="text-green-800">{zoneInfo.zone}</p>
            </div>
            <div>
              <span className="text-green-700 font-medium">Costo adicional:</span>
              <p className="text-green-800 font-semibold">${zoneInfo.additionalCost || zoneInfo.cost || 0} MXN</p>
            </div>
            <div>
              <span className="text-green-700 font-medium">Tiempo estimado:</span>
              <p className="text-green-800">{zoneInfo.estimatedTime}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar advertencia si la zona no tiene cobertura */}
      {formData.deliveryMethod === 'pickup' && zoneInfo && !zoneInfo.isSupported && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center mb-2">
            <AlertCircle size={18} className="text-red-600 mr-2" />
            <h4 className="font-medium text-red-900">Zona Sin Cobertura</h4>
          </div>
          <p className="text-sm text-red-700">
            Lo sentimos, actualmente no ofrecemos servicio de pickup en la zona: <strong>{zoneInfo.zone}</strong>. 
            Te recomendamos seleccionar "Traer a la tienda" como método de entrega.
          </p>
        </div>
      )}

      {/* Formulario de dirección para pickup */}
      {formData.deliveryMethod === 'pickup' && <AddressForm />}

      {/* Información adicional sobre ambos métodos */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
        <div className="flex items-center mb-2">
          <AlertCircle size={18} className="text-amber-600 mr-2" />
          <h4 className="font-medium text-amber-900">Información Importante</h4>
        </div>
        <div className="text-sm text-amber-700 space-y-2">
          {formData.deliveryMethod === 'store' ? (
            <ul className="space-y-1">
              <li>• Lleva tu calzado en el horario y fecha programados</li>
              <li>• El tiempo de entrega será de 2-3 días hábiles</li>
              <li>• Podrás pagar al momento de recoger tu calzado limpio</li>
              <li>• Trae una identificación oficial para el retiro</li>
            </ul>
          ) : (
            <ul className="space-y-1">
              <li>• Asegúrate de estar disponible en el horario programado</li>
              <li>• Ten el calzado listo para la recolección</li>
              <li>• El pago se realiza al momento de la entrega del calzado limpio</li>
              <li>• Podrías necesitar identificación oficial según el tipo de servicio</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepDelivery;