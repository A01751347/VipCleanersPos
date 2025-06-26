// components/AddressForm.tsx - Versión Corregida
'use client'
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { validatePickupZone } from '../utils/bookingUtils';

const AddressForm: React.FC = () => {
  const { formData, setFormData, zoneInfo, setZoneInfo, isValidatingZone, setIsValidatingZone } = useBooking();
  const [validationMessage, setValidationMessage] = useState<string>('');

  // Debounce para validación de zona
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.address.zipCode && formData.address.zipCode.length === 5) {
        validateZone();
      } else {
        setZoneInfo(null);
        setValidationMessage('');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.address.zipCode]);

  const validateZone = async () => {
    if (!formData.address.zipCode || formData.address.zipCode.length !== 5) {
      return;
    }

    try {
      setIsValidatingZone(true);
      setValidationMessage('');
      
      console.log('🔍 Validating zone for:', formData.address.zipCode);
      
      const result = await validatePickupZone(formData.address.zipCode);
      
      if (result) {
        setZoneInfo(result);
        if (result.isSupported) {
          setValidationMessage(`✅ Zona: ${result.zone} - Costo adicional: $${result.additionalCost || result.cost || 0}`);
        } else {
          setValidationMessage(`❌ Lo sentimos, no tenemos cobertura en la zona: ${result.zone}`);
        }
      } else {
        setZoneInfo(null);
        setValidationMessage('❌ Código postal no válido o sin cobertura');
      }
    } catch (error) {
      console.error('Error validating zone:', error);
      setZoneInfo(null);
      setValidationMessage('⚠️ Error al validar la zona. Intenta nuevamente.');
    } finally {
      setIsValidatingZone(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Formatear código postal
    if (name === 'zipCode') {
      const cleanValue = value.replace(/\D/g, '').slice(0, 5);
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [name]: cleanValue }
      }));
      return;
    }
    
    // Formatear teléfono
    if (name === 'phone') {
      const cleanValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [name]: cleanValue }
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value }
    }));
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center mb-2">
          <MapPin size={18} className="text-blue-600 mr-2" />
          <h4 className="font-medium text-blue-900">Dirección de Recolección</h4>
        </div>
        <p className="text-sm text-blue-700">
          Proporciona la dirección donde recogeremos tu calzado. El costo se calculará según la zona.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="street">
            Calle *
          </label>
          <input
            type="text"
            id="street"
            name="street"
            value={formData.address.street}
            onChange={handleChange}
            placeholder="Nombre de la calle"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            required
          />
        </div>

        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="number">
            Número *
          </label>
          <input
            type="text"
            id="number"
            name="number"
            value={formData.address.number}
            onChange={handleChange}
            placeholder="Número exterior"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            required
          />
        </div>

        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="interior">
            Número Interior
          </label>
          <input
            type="text"
            id="interior"
            name="interior"
            value={formData.address.interior}
            onChange={handleChange}
            placeholder="Depto, piso, etc. (opcional)"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
          />
        </div>

        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="neighborhood">
            Colonia *
          </label>
          <input
            type="text"
            id="neighborhood"
            name="neighborhood"
            value={formData.address.neighborhood}
            onChange={handleChange}
            placeholder="Nombre de la colonia"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            required
          />
        </div>

        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="municipality">
            Municipio
          </label>
          <input
            type="text"
            id="municipality"
            name="municipality"
            value={formData.address.municipality}
            onChange={handleChange}
            placeholder="Municipio o delegación"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
          />
        </div>

        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="zipCode">
            Código Postal *
          </label>
          <div className="relative">
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.address.zipCode}
              onChange={handleChange}
              placeholder="5 dígitos"
              maxLength={5}
              className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] pr-10"
              required
            />
            {isValidatingZone && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 size={16} className="animate-spin text-[#78f3d3]" />
              </div>
            )}
          </div>
          
          {/* Mensaje de validación de zona */}
          {validationMessage && (
            <div className={`mt-2 p-2 rounded text-sm flex items-center ${
              validationMessage.includes('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : validationMessage.includes('❌')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              {validationMessage.includes('✅') && <CheckCircle size={16} className="mr-2 flex-shrink-0" />}
              {validationMessage.includes('❌') && <AlertCircle size={16} className="mr-2 flex-shrink-0" />}
              {validationMessage.includes('⚠️') && <AlertCircle size={16} className="mr-2 flex-shrink-0" />}
              <span>{validationMessage}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="city">
            Ciudad
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.address.city}
            onChange={handleChange}
            placeholder="Ciudad"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
          />
        </div>

        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="state">
            Estado
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.address.state}
            onChange={handleChange}
            placeholder="Estado"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
          />
        </div>
      </div>

      {/* Teléfono de contacto */}
      <div>
        <label className="block text-[#313D52] font-medium mb-2" htmlFor="phone">
          <Phone size={16} className="inline mr-2" />
          Teléfono de Contacto para Pickup *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.address.phone}
          onChange={handleChange}
          placeholder="10 dígitos (puede ser diferente al principal)"
          className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
          required
        />
        <p className="text-xs text-[#6c7a89] mt-1">
          Este número se usará para coordinar la recolección de tu calzado
        </p>
      </div>

      {/* Ventana de horario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="timeWindowStart">
            <Clock size={16} className="inline mr-2" />
            Horario disponible desde
          </label>
          <select
            id="timeWindowStart"
            name="timeWindowStart"
            value={formData.address.timeWindowStart}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
          >
            <option value="09:00">9:00 AM</option>
            <option value="10:00">10:00 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="12:00">12:00 PM</option>
            <option value="13:00">1:00 PM</option>
            <option value="14:00">2:00 PM</option>
            <option value="15:00">3:00 PM</option>
            <option value="16:00">4:00 PM</option>
            <option value="17:00">5:00 PM</option>
          </select>
        </div>

        <div>
          <label className="block text-[#313D52] font-medium mb-2" htmlFor="timeWindowEnd">
            <Clock size={16} className="inline mr-2" />
            Horario disponible hasta
          </label>
          <select
            id="timeWindowEnd"
            name="timeWindowEnd"
            value={formData.address.timeWindowEnd}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
          >
            <option value="10:00">10:00 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="12:00">12:00 PM</option>
            <option value="13:00">1:00 PM</option>
            <option value="14:00">2:00 PM</option>
            <option value="15:00">3:00 PM</option>
            <option value="16:00">4:00 PM</option>
            <option value="17:00">5:00 PM</option>
            <option value="18:00">6:00 PM</option>
          </select>
        </div>
      </div>

      {/* Instrucciones adicionales */}
      <div>
        <label className="block text-[#313D52] font-medium mb-2" htmlFor="instructions">
          Instrucciones Adicionales
        </label>
        <textarea
          id="instructions"
          name="instructions"
          value={formData.address.instructions}
          onChange={handleChange}
          rows={3}
          placeholder="Referencias adicionales, instrucciones especiales, etc. (opcional)"
          className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] resize-none"
        />
        <p className="text-xs text-[#6c7a89] mt-1">
          Ejemplo: "Casa azul con portón blanco", "Tocar el timbre dos veces", etc.
        </p>
      </div>

      {/* Información de costo si hay zona válida */}
      {zoneInfo && zoneInfo.isSupported && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <CheckCircle size={18} className="text-green-600 mr-2" />
            <h4 className="font-medium text-green-900">Zona de Cobertura Confirmada</h4>
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

      {/* Información si no hay cobertura */}
      {zoneInfo && !zoneInfo.isSupported && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center mb-2">
            <AlertCircle size={18} className="text-red-600 mr-2" />
            <h4 className="font-medium text-red-900">Zona Sin Cobertura</h4>
          </div>
          <p className="text-sm text-red-700">
            Lo sentimos, actualmente no ofrecemos servicio de pickup en tu zona. 
            Puedes seleccionar "Traer a la tienda" como método de entrega.
          </p>
        </div>
      )}

      {/* Advertencia sobre horarios */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
        <div className="flex items-center mb-2">
          <Clock size={18} className="text-amber-600 mr-2" />
          <h4 className="font-medium text-amber-900">Importante sobre el Pickup</h4>
        </div>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• El pickup se realiza en días hábiles de 9:00 AM a 6:00 PM</li>
          <li>• Te contactaremos 30 minutos antes de llegar</li>
          <li>• Asegúrate de tener el calzado listo para la recolección</li>
          <li>• El pago del servicio se realiza al momento de la entrega</li>
        </ul>
      </div>
    </div>
  );
};

export default AddressForm;