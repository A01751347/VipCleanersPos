// components/AddressForm.tsx
'use client'
import React from 'react';
import { MapPin, Loader2, CheckCircle, AlertCircle, Calculator, Clock } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { validatePickupZone } from '../utils/bookingUtils';

const AddressForm: React.FC = () => {
  const { 
    formData, 
    setFormData, 
    zoneInfo, 
    setZoneInfo, 
    isValidatingZone, 
    setIsValidatingZone 
  } = useBooking();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));

      // Validar zona cuando cambia el código postal
      if (addressField === 'zipCode' && value.length === 5 && formData.deliveryMethod === 'pickup') {
        handleZoneValidation(value);
      }
    } else if (name === 'address.phone') {
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, phone: cleaned }
      }));
    }
  };

  const handleZoneValidation = async (zipCode: string) => {
    setIsValidatingZone(true);
    try {
      const result = await validatePickupZone(zipCode);
      setZoneInfo(result);
    } catch (error) {
      console.error('Error validating zone:', error);
      setZoneInfo({
        zone: 'Error',
        cost: 0,
        estimatedTime: '',
        available: false,
        message: 'Error validando la zona. Intenta nuevamente.'
      });
    } finally {
      setIsValidatingZone(false);
    }
  };

  return (
    <div className="space-y-6 bg-[#f5f9f8] p-6 rounded-lg">
      <div className="flex items-center mb-4">
        <MapPin size={20} className="text-[#78f3d3] mr-2" />
        <h4 className="font-semibold text-[#313D52]">Dirección de Recolección</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-[#313D52] font-medium mb-2">Calle *</label>
          <input
            type="text"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            placeholder="Nombre de la calle"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            required
          />
        </div>
        
        <div>
          <label className="block text-[#313D52] font-medium mb-2">Número *</label>
          <input
            type="text"
            name="address.number"
            value={formData.address.number}
            onChange={handleChange}
            placeholder="123"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#313D52] font-medium mb-2">Interior (opcional)</label>
          <input
            type="text"
            name="address.interior"
            value={formData.address.interior}
            onChange={handleChange}
            placeholder="Depto, int, etc."
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
          />
        </div>
        
        <div>
          <label className="block text-[#313D52] font-medium mb-2">Colonia *</label>
          <input
            type="text"
            name="address.neighborhood"
            value={formData.address.neighborhood}
            onChange={handleChange}
            placeholder="Nombre de la colonia"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#313D52] font-medium mb-2">Código Postal *</label>
          <input
            type="text"
            name="address.zipCode"
            value={formData.address.zipCode}
            onChange={handleChange}
            placeholder="76000"
            maxLength={5}
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            required
          />
        </div>
        
        <div>
          <label className="block text-[#313D52] font-medium mb-2">Teléfono de contacto (opcional)</label>
          <input
            type="tel"
            name="address.phone"
            value={formData.address.phone}
            onChange={handleChange}
            placeholder="Teléfono alternativo"
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[#313D52] font-medium mb-2">Instrucciones especiales</label>
        <textarea
          name="address.instructions"
          value={formData.address.instructions}
          onChange={handleChange}
          placeholder="Referencias adicionales, indicaciones de acceso, etc."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] resize-none"
        />
      </div>

      {/* Validación de zona */}
      {formData.address.zipCode.length === 5 && (
        <div className="mt-4">
          {isValidatingZone ? (
            <div className="flex items-center text-[#6c7a89]">
              <Loader2 size={16} className="animate-spin mr-2" />
              Validando zona de cobertura...
            </div>
          ) : zoneInfo ? (
            <div className={`p-4 rounded-lg ${
              zoneInfo.available 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-amber-50 border border-amber-200'
            }`}>
              <div className="flex items-start">
                {zoneInfo.available ? (
                  <CheckCircle size={20} className="text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    zoneInfo.available ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    {zoneInfo.available ? '¡Zona con cobertura!' : 'Zona sin cobertura'}
                  </p>
                  <p className={`text-sm ${
                    zoneInfo.available ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {zoneInfo.message}
                  </p>
                  {zoneInfo.available && (
                    <div className="mt-2 flex items-center space-x-4 text-sm text-green-600">
                      <span className="flex items-center">
                        <Calculator size={14} className="mr-1" />
                        Costo: ${zoneInfo.cost}
                      </span>
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {zoneInfo.estimatedTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AddressForm;