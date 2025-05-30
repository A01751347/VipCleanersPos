'use client'
// components/admin/pos/ServiceSelector.tsx
import React, { useState, useEffect } from 'react';
import { Brush, Shield, PlusCircle, Loader2, AlertCircle } from 'lucide-react';

// Interfaz para servicio
interface Service {
  servicio_id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_estimado?: number;
  requiere_identificacion: boolean;
  activo: boolean;
}

interface ServiceSelectorProps {
  onAddToCart: (item: {
    id: number;
    tipo: 'servicio';
    nombre: string;
    precio: number;
    cantidad: number;
    modeloId?: number;
    marca?: string;
    modelo?: string;
    descripcion?: string;
  }) => void;
  searchTerm: string;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onAddToCart, searchTerm }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSneakerModal, setShowSneakerModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Campos para detalles del calzado
  const [sneakerBrand, setSneakerBrand] = useState('');
  const [sneakerModel, setSneakerModel] = useState('');
  const [sneakerDescription, setSneakerDescription] = useState('');
  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/admin/services');
        
        if (!response.ok) {
          throw new Error('Error al cargar servicios');
        }
        
        const data = await response.json();
        setServices(data.services || []);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('No se pudieron cargar los servicios');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);
  
  // Filtrar servicios por término de búsqueda
  const filteredServices = services.filter(service => 
    service.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddServiceClick = (service: Service) => {
    setSelectedService(service);
    setShowSneakerModal(true);
  };
  
  const handleAddToCart = () => {
    if (!selectedService) return;
    
    onAddToCart({
      id: selectedService.servicio_id,
      tipo: 'servicio',
      nombre: selectedService.nombre,
      precio: selectedService.precio,
      cantidad: 1,
      marca: sneakerBrand || undefined,
      modelo: sneakerModel || undefined,
      descripcion: sneakerDescription || undefined
    });
    
    // Reset form
    setShowSneakerModal(false);
    setSelectedService(null);
    setSneakerBrand('');
    setSneakerModel('');
    setSneakerDescription('');
  };
  
  // Renderizar un servicio
  const renderServiceCard = (service: Service) => {
    const getServiceIcon = () => {
      // Asignar iconos según tipo de servicio - esto dependerá de tu lógica de negocio
      if (service.nombre.toLowerCase().includes('premium')) {
        return <Shield size={18} className="mr-2" />;
      }
      return <Brush size={18} className="mr-2" />;
    };
    
    return (
      <div 
        key={service.servicio_id} 
        className="bg-white p-4 rounded-lg border border-[#e0e6e5] hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-[#313D52] flex items-center">
              {getServiceIcon()}
              {service.nombre}
            </h3>
            <p className="text-sm text-[#6c7a89] mt-1">{service.descripcion}</p>
            
            {service.requiere_identificacion ? (
              <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded inline-flex items-center">
                <AlertCircle size={12} className="mr-1" />
                Requiere identificación
              </div>
            ):(null)}
          </div>
          <div className="text-[#313D52] font-bold">
  ${Number(service.precio).toFixed(2)}
</div>

        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleAddServiceClick(service)}
            className="flex items-center text-sm text-[#313D52] bg-[#f5f9f8] hover:bg-[#e0e6e5] rounded-lg px-3 py-1"
          >
            <PlusCircle size={16} className="mr-1 text-[#78f3d3]" />
            Agregar
          </button>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={40} className="text-red-500 mb-4" />
        <p className="text-[#313D52]">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  return (
    <div>
      {filteredServices.length === 0 ? (
        <div className="text-center py-8 text-[#6c7a89]">
          <p>No se encontraron servicios</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredServices.map(renderServiceCard)}
        </div>
      )}
      
      {/* Modal para detalles del calzado */}
      {showSneakerModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-[#313D52] mb-4">
                Detalles del Calzado para {selectedService.nombre}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-[#6c7a89] mb-1">
                    Marca
                  </label>
                  <input
                    id="brand"
                    type="text"
                    value={sneakerBrand}
                    onChange={(e) => setSneakerBrand(e.target.value)}
                    placeholder="Ej. Nike, Adidas, etc."
                    className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  />
                </div>
                
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-[#6c7a89] mb-1">
                    Modelo
                  </label>
                  <input
                    id="model"
                    type="text"
                    value={sneakerModel}
                    onChange={(e) => setSneakerModel(e.target.value)}
                    placeholder="Ej. Air Force 1, Yeezy, etc."
                    className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[#6c7a89] mb-1">
                    Descripción Adicional
                  </label>
                  <textarea
                    id="description"
                    value={sneakerDescription}
                    onChange={(e) => setSneakerDescription(e.target.value)}
                    placeholder="Color, tamaño, detalles especiales..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] resize-none"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowSneakerModal(false)}
                  className="px-4 py-2 border border-[#e0e6e5] text-[#6c7a89] rounded-lg hover:bg-[#f5f9f8]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddToCart}
                  className="px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0]"
                >
                  Agregar al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;