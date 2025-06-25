// components/AddressForm.tsx
'use client'
import React, { useEffect } from 'react';
import { MapPin, Loader2, CheckCircle, AlertCircle, Calculator, Clock, Phone, Home, RefreshCw } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { validatePickupZone, getMunicipalities, formatPhoneForDisplay, cleanPhoneNumber } from '../utils/bookingUtils';

const AddressForm: React.FC = () => {
  const { 
    formData, 
    setFormData, 
    zoneInfo, 
    setZoneInfo, 
    isValidatingZone, 
    setIsValidatingZone 
  } = useBooking();

  const municipalities = getMunicipalities();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      
      // Manejar teléfono con limpieza especial
      if (addressField === 'phone') {
        const cleaned = cleanPhoneNumber(value);
        setFormData(prev => ({
          ...prev,
          address: { ...prev.address, phone: cleaned }
        }));
        return;
      }
      
      // Manejar código postal con validación
      if (addressField === 'zipCode') {
        const cleaned = value.replace(/\D/g, '').slice(0, 5);
        setFormData(prev => ({
          ...prev,
          address: { ...prev.address, zipCode: cleaned }
        }));
        
        // Validar zona cuando el código postal tenga 5 dígitos
        if (cleaned.length === 5) {
          handleZoneValidation();
        } else {
          // Limpiar info de zona si el CP es incompleto
          setZoneInfo(null);
        }
        return;
      }
      
      // Actualizar otros campos de dirección
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    }
  };

  const handleZoneValidation = async () => {
    // Verificar que tenemos los datos mínimos necesarios
    if (!formData.address.zipCode || formData.address.zipCode.length !== 5) {
      return;
    }

    setIsValidatingZone(true);
    try {
      const addressForValidation = {
        street: formData.address.street || '',
        number: formData.address.number || '',
        neighborhood: formData.address.neighborhood || '',
        zipCode: formData.address.zipCode,
        municipality: formData.address.municipality || '',
        city: formData.address.city || 'Santiago de Querétaro',
        state: formData.address.state || 'Querétaro'
      };

      const result = await validatePickupZone(addressForValidation);
      setZoneInfo(result);
    } catch (error) {
      console.error('Error validating zone:', error);
      setZoneInfo({
        zone: 'Error de validación',
        isSupported: false,
        additionalCost: 0,
        estimatedTime: 'No disponible'
      });
    } finally {
      setIsValidatingZone(false);
    }
  };

  // Revalidar zona cuando cambian datos importantes de la dirección
  useEffect(() => {
    if (formData.address.zipCode.length === 5 && 
        formData.address.street && 
        formData.address.number && 
        formData.address.neighborhood) {
      const timeoutId = setTimeout(() => {
        handleZoneValidation();
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    formData.address.street, 
    formData.address.number, 
    formData.address.neighborhood, 
    formData.address.municipality
  ]);

  return (
    <div className="space-y-6 bg-gradient-to-br from-[#f5f9f8] to-white p-6 rounded-xl border border-[#e0e6e5] shadow-sm">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-[#78f3d3] bg-opacity-20 rounded-full flex items-center justify-center mr-3">
          <MapPin size={20} className="text-[#78f3d3]" />
        </div>
        <div>
          <h4 className="font-semibold text-[#313D52] text-lg">Dirección de Recolección</h4>
          <p className="text-sm text-[#6c7a89]">Proporciona la dirección donde recogeremos tu calzado</p>
        </div>
      </div>

      {/* Dirección principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-[#313D52] font-medium mb-2">
            <Home size={16} className="inline mr-2" />
            Calle *
          </label>
          <input
            type="text"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            placeholder="Av. Universidad, Calle Hidalgo, etc."
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] transition-colors"
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
            placeholder="123, 45-A, etc."
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] transition-colors"
            required
          />
        </div>
      </div>

      {/* Detalles adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#313D52] font-medium mb-2">Interior (opcional)</label>
          <input
            type="text"
            name="address.interior"
            value={formData.address.interior}
            onChange={handleChange}
            placeholder="Depto 4, Int B, Piso 2, etc."
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-[#313D52] font-medium mb-2">Colonia *</label>
          <input
            type="text"
            name="address.neighborhood"
            value={formData.address.neighborhood}
            onChange={handleChange}
            placeholder="Centro Histórico, Del Valle, etc."
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] transition-colors"
            required
          />
        </div>
      </div>

      {/* Código postal y municipio */}
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
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] transition-colors"
            required
          />
          <p className="text-xs text-[#6c7a89] mt-1">5 dígitos, ej: 76000</p>
        </div>
        
        <div>
          <label className="block text-[#313D52] font-medium mb-2">Municipio</label>
          <select
            name="address.municipality"
            value={formData.address.municipality}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] transition-colors"
          >
            <option value="">Selecciona municipio</option>
            {municipalities.map((municipality) => (
              <option key={municipality.name} value={municipality.name}>
                {municipality.name}
                {!municipality.isSupported && ' (Sin cobertura)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teléfono de contacto */}
      <div>
        <label className="block text-[#313D52] font-medium mb-2">
          <Phone size={16} className="inline mr-2" />
          Teléfono de contacto (opcional)
        </label>
        <input
          type="tel"
          name="address.phone"
          value={formData.address.phone}
          onChange={handleChange}
          placeholder="4421234567"
          maxLength={10}
          className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] transition-colors"
        />
        {formData.address.phone && (
          <p className="text-xs text-[#6c7a89] mt-1">
            Formato: {formatPhoneForDisplay(formData.address.phone)}
          </p>
        )}
      </div>

      {/* Instrucciones especiales */}
      <div>
        <label className="block text-[#313D52] font-medium mb-2">Instrucciones especiales</label>
        <textarea
          name="address.instructions"
          value={formData.address.instructions}
          onChange={handleChange}
          placeholder="Referencias adicionales, indicaciones de acceso, horarios preferidos, etc."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] resize-none transition-colors"
        />
      </div>

      {/* Validación de zona */}
      {formData.address.zipCode.length === 5 && (
        <div className="mt-6">
          {isValidatingZone ? (
            <div className="flex items-center justify-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <Loader2 size={20} className="animate-spin mr-3 text-blue-500" />
              <div>
                <p className="text-blue-700 font-medium">Validando zona de cobertura...</p>
                <p className="text-blue-600 text-sm">Verificando disponibilidad y costos</p>
              </div>
            </div>
          ) : zoneInfo ? (
            <div className={`p-6 rounded-xl border-2 transition-all ${
              zoneInfo.isSupported 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
            }`}>
              <div className="flex items-start">
                {zoneInfo.isSupported ? (
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <CheckCircle size={20} className="text-green-500" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <AlertCircle size={20} className="text-amber-500" />
                  </div>
                )}
                
                <div className="flex-1">
                  <h5 className={`font-semibold text-lg mb-2 ${
                    zoneInfo.isSupported ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    {zoneInfo.isSupported ? '✅ ¡Zona con cobertura!' : '⚠️ Zona sin cobertura'}
                  </h5>
                  
                  <p className={`text-sm mb-3 ${
                    zoneInfo.isSupported ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    Zona: <strong>{zoneInfo.zone}</strong>
                  </p>
                  
                  {zoneInfo.isSupported ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center p-3 bg-white bg-opacity-50 rounded-lg">
                        <Calculator size={16} className="mr-2 text-green-500" />
                        <div>
                          <p className="text-xs text-green-600">Costo de pickup</p>
                          <p className="font-semibold text-green-700">${zoneInfo.additionalCost} MXN</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center p-3 bg-white bg-opacity-50 rounded-lg">
                        <Clock size={16} className="mr-2 text-green-500" />
                        <div>
                          <p className="text-xs text-green-600">Tiempo estimado</p>
                          <p className="font-semibold text-green-700">{zoneInfo.estimatedTime}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white bg-opacity-50 rounded-lg">
                      <p className="text-amber-700 text-sm">
                        Lo sentimos, actualmente no ofrecemos servicio de pickup en esta zona.
                        Puedes traer tu calzado directamente a nuestra tienda.
                      </p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleZoneValidation}
                  className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                  title="Revalidar zona"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center text-gray-600">
                <MapPin size={16} className="mr-2" />
                <p className="text-sm">
                  Completa la dirección para verificar la disponibilidad de pickup
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Información adicional sobre zonas */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h6 className="font-medium text-blue-700 mb-2">ℹ️ Información sobre pickup</h6>
        <div className="text-sm text-blue-600 space-y-1">
          <p>• El servicio de pickup está disponible en zonas seleccionadas</p>
          <p>• Los costos varían según la distancia y zona</p>
          <p>• El tiempo estimado incluye ida y vuelta</p>
          <p>• Para zonas sin cobertura, puedes traer tu calzado a la tienda</p>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;