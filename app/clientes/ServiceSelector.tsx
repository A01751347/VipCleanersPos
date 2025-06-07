'use client'
// components/admin/pos/ServiceSelector.tsx
import React, { useState, useEffect } from 'react';
import { Brush, Shield, PlusCircle, Loader2, AlertCircle, Play, Footprints } from 'lucide-react';

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
  onAddShoesService?: (serviceId: number, serviceName: string, servicePrice: number) => void; // 🆕 Nueva prop opcional
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ 
  onAddToCart, 
  searchTerm, 
  onAddShoesService 
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  
  // 🆕 Función para detectar si es un servicio de tenis y decidir qué modal usar
  const isShoeService = (service: Service): boolean => {
    const shoesKeywords = ['limpieza', 'restauracion', 'tenis', 'sneaker', 'zapato', 'calzado'];
    const serviceName = service.nombre.toLowerCase();
    const serviceDescription = service.descripcion.toLowerCase();
    
    return shoesKeywords.some(keyword => 
      serviceName.includes(keyword) || serviceDescription.includes(keyword)
    );
  };
  
  // 🆕 Función actualizada para manejar agregar servicio
  const handleAddServiceClick = (service: Service) => {
    // Si es un servicio de tenis y tenemos la función del modal mejorado
    if (isShoeService(service) && onAddShoesService) {
      onAddShoesService(service.servicio_id, service.nombre, service.precio);
    } else {
      // Para servicios normales, agregar directamente al carrito
      onAddToCart({
        id: service.servicio_id,
        tipo: 'servicio',
        nombre: service.nombre,
        precio: service.precio,
        cantidad: 1
      });
    }
  };
  
  // 🚫 Eliminar función antigua del modal (ya no se usa)
  // const handleAddToCart = () => { ... }
  
  // Renderizar un servicio
  const renderServiceCard = (service: Service) => {
    const getServiceIcon = () => {
      // 🆕 Agregar icono especial para servicios de tenis
      if (isShoeService(service)) {
        return <Footprints size={18} className="mr-2 text-[#78f3d3]" />;
      }
      if (service.nombre.toLowerCase().includes('premium')) {
        return <Shield size={18} className="mr-2" />;
      }
      return <Brush size={18} className="mr-2" />;
    };

    // 🆕 Función para obtener el texto del botón
    const getButtonText = () => {
      if (isShoeService(service) && onAddShoesService) {
        return "Agregar Detalles";
      }
      return "Agregar";
    };

    // 🆕 Función para obtener el color del botón
    const getButtonStyle = () => {
      if (isShoeService(service) && onAddShoesService) {
        return "flex items-center text-sm text-white bg-[#78f3d3] hover:bg-[#4de0c0] rounded-lg px-3 py-1.5 font-medium";
      }
      return "flex items-center text-sm text-[#313D52] bg-[#f5f9f8] hover:bg-[#e0e6e5] rounded-lg px-3 py-1";
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
            ) : null}
          </div>
          <div className="text-[#313D52] font-bold">
            ${Number(service.precio).toFixed(2)}
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleAddServiceClick(service)}
            className={getButtonStyle()}
          >
            <PlusCircle size={16} className="mr-1" />
            {getButtonText()}
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
          {searchTerm && (
            <p className="text-sm mt-2">
              Búsqueda: "{searchTerm}"
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredServices.map(renderServiceCard)}
        </div>
      )}
      
      {/* 🚫 Eliminar modal anterior - ahora se usa el modal mejorado del POS */}
      {/* Modal para detalles del calzado - ELIMINADO */}
    </div>
  );
};

export default ServiceSelector;