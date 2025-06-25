// components/steps/StepService.tsx
'use client'
import React from 'react';
import { Loader2, AlertCircle, RefreshCw, Shield, Clock, DollarSign, Brush, Sparkles, Wrench } from 'lucide-react';
import { useBooking, useServices } from '../../context/BookingContext';
import { StepProps } from '../../types/booking';

const StepService: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const { formData, setFormData } = useBooking();
  const { 
    services: serviceOptions, 
    loading: servicesLoading, 
    error: servicesError, 
    reload: reloadServices,
    hasServices 
  } = useServices();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (serviceId: string) => {
    setFormData(prev => ({ ...prev, serviceType: serviceId }));
  };

  // Función para obtener icono según el tipo de servicio
  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    
    if (name.includes('básica') || name.includes('basica')) {
      return <Brush size={20} className="text-[#78f3d3]" />;
    } else if (name.includes('premium')) {
      return <Sparkles size={20} className="text-[#78f3d3]" />;
    } else if (name.includes('restauración') || name.includes('restauracion') || name.includes('completa')) {
      return <Wrench size={20} className="text-[#78f3d3]" />;
    }
    
    return <Brush size={20} className="text-[#78f3d3]" />;
  };

  // Renderizar estado de carga
  if (servicesLoading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-[#313D52] mb-4">Detalles del Servicio</h3>
        
        {/* Campo de calzado - siempre visible */}
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

        {/* Estado de carga para servicios */}
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={48} className="animate-spin text-[#78f3d3] mb-4" />
          <p className="text-[#6c7a89] text-lg">Cargando servicios disponibles...</p>
          <p className="text-[#6c7a89] text-sm mt-2">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  // Renderizar estado de error
  if (servicesError) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-[#313D52] mb-4">Detalles del Servicio</h3>
        
        {/* Campo de calzado - siempre visible */}
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

        {/* Estado de error para servicios */}
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <p className="text-[#313D52] font-medium text-lg mb-2">Error al cargar servicios</p>
          <p className="text-[#6c7a89] text-sm mb-6 text-center max-w-md">
            {servicesError}
          </p>
          <button
            onClick={reloadServices}
            className="flex items-center px-6 py-3 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors font-medium"
          >
            <RefreshCw size={16} className="mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Renderizar si no hay servicios
  if (!hasServices) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-[#313D52] mb-4">Detalles del Servicio</h3>
        
        {/* Campo de calzado - siempre visible */}
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

        {/* Estado sin servicios */}
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle size={48} className="text-amber-500 mb-4" />
          <p className="text-[#313D52] font-medium text-lg mb-2">No hay servicios disponibles</p>
          <p className="text-[#6c7a89] text-sm text-center max-w-md">
            Actualmente no hay servicios disponibles. Por favor, contacta con el administrador.
          </p>
        </div>
      </div>
    );
  }

  // Renderizar contenido normal con servicios
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#313D52] mb-4">Detalles del Servicio</h3>
      
      {/* Campo de información del calzado */}
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
      
      {/* Selección de servicios */}
      <div>
        <p className="block text-[#313D52] font-medium mb-4">
          Tipo de Servicio *
          <span className="text-sm font-normal text-[#6c7a89] ml-2">
            ({serviceOptions.length} servicio{serviceOptions.length !== 1 ? 's' : ''} disponible{serviceOptions.length !== 1 ? 's' : ''})
          </span>
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          {serviceOptions.map((service) => (
            <div 
              key={service.id}
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                formData.serviceType === service.id
                  ? 'border-[#78f3d3] bg-gradient-to-r from-[#78f3d3] bg-opacity-5 to-transparent ring-2 ring-[#78f3d3] ring-opacity-20'
                  : 'border-[#e0e6e5] hover:border-[#78f3d3] hover:border-opacity-50 bg-white'
              }`}
              onClick={() => handleServiceChange(service.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  {getServiceIcon(service.name)}
                  <h4 className="font-semibold text-[#313D52] text-lg ml-3">
                    {service.name}
                  </h4>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center">
                    <DollarSign size={18} className="text-[#78f3d3]" />
                    <span className="text-[#313D52] font-bold text-xl">
                      {service.price}
                    </span>
                    <span className="text-[#6c7a89] text-sm ml-1">MXN</span>
                  </div>
                </div>
              </div>
              
              <p className="text-[#6c7a89] text-sm mb-4 leading-relaxed">
                {service.description}
              </p>
              
              {/* Información adicional */}
              <div className="flex items-center justify-between text-xs text-[#6c7a89] pt-3 border-t border-[#e0e6e5]">
                <div className="flex items-center">
                  <Clock size={12} className="mr-1" />
                  <span>Duración: {service.duration} min</span>
                </div>
                
                {service.requiresIdentification && (
                  <div className="flex items-center text-amber-600">
                    <Shield size={12} className="mr-1" />
                    <span>Requiere ID</span>
                  </div>
                )}
              </div>
              
              {/* Indicador de selección */}
              {formData.serviceType === service.id && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="w-4 h-4 bg-[#78f3d3] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#313D52] rounded-full"></div>
                  </div>
                  <span className="text-[#78f3d3] text-sm font-medium ml-2">
                    Servicio seleccionado
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Información adicional del servicio seleccionado */}
      {formData.serviceType && (
        <div className="mt-6 p-4 bg-gradient-to-r from-[#78f3d3] bg-opacity-5 to-transparent rounded-xl border border-[#78f3d3] border-opacity-20">
          {(() => {
            const selectedService = serviceOptions.find(s => s.id === formData.serviceType);
            if (!selectedService) return null;
            
            return (
              <div>
                <h5 className="font-semibold text-[#313D52] mb-2">
                  ✅ Has seleccionado: {selectedService.name}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#6c7a89]">Precio:</span>
                    <p className="font-medium text-[#313D52]">${selectedService.price} MXN</p>
                  </div>
                  <div>
                    <span className="text-[#6c7a89]">Duración estimada:</span>
                    <p className="font-medium text-[#313D52]">{selectedService.duration} minutos</p>
                  </div>
                </div>
                
                {selectedService.requiresIdentification && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center text-amber-800">
                      <Shield size={16} className="mr-2" />
                      <span className="text-sm font-medium">
                        Este servicio requiere identificación oficial
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default StepService;