// context/BookingContext.tsx
'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FormData, FormStatus, ZoneInfo, BookingContextType, ServiceOption } from '../types/booking';

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Estado inicial del formulario
const initialFormData: FormData = {
  fullName: '',
  email: '',
  phone: '',
  shoesType: '',
  serviceType: '',
  deliveryMethod: 'store',
  bookingDate: '',
  bookingTime: '',
  address: {
    street: '',
    number: '',
    interior: '',
    neighborhood: '',
    municipality: '',
    city: 'Santiago de Querétaro',
    state: 'Querétaro',
    zipCode: '',
    instructions: '',
    timeWindowStart: '09:00',
    timeWindowEnd: '18:00',
    phone: ''
  },
  requiresPickup: false
};

interface BookingProviderProps {
  children: ReactNode;
}

// Interfaz para el servicio desde la API
interface APIService {
  servicio_id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_estimado?: number;
  requiere_identificacion: boolean;
  activo: boolean;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<FormStatus>({
    status: 'idle',
    message: ''
  });
  const [zoneInfo, setZoneInfo] = useState<ZoneInfo | null>(null);
  const [isValidatingZone, setIsValidatingZone] = useState(false);
  
  // Estados para los servicios desde la API
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Función para convertir servicio de API a ServiceOption
  const convertAPIServiceToOption = (apiService: APIService): ServiceOption => ({
    id: apiService.servicio_id.toString(),
    name: apiService.nombre,
    price: Number(apiService.precio),
    description: apiService.descripcion,
    duration: apiService.tiempo_estimado || 60, // Default 60 minutos si no está especificado
    requiresIdentification: apiService.requiere_identificacion
  });

  // Función para cargar servicios desde la API
  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      setServicesError(null);
      
      const response = await fetch('/api/admin/services');
      
      if (!response.ok) {
        throw new Error('Error al cargar servicios');
      }
      
      const data = await response.json();
      
      // Filtrar solo servicios activos
      const activeServices = (data.services || []).filter((service: APIService) => service.activo);
      
      // Convertir servicios de API al formato esperado
      const convertedServices = activeServices.map(convertAPIServiceToOption);
      
      setServiceOptions(convertedServices);
      
      console.log('✅ Servicios cargados desde API:', convertedServices);
      
    } catch (err) {
      console.error('❌ Error fetching services:', err);
      setServicesError('No se pudieron cargar los servicios');
      
      // Fallback a servicios predeterminados si falla la API
      const fallbackServices: ServiceOption[] = [
        { 
          id: '1', 
          name: 'Limpieza Básica', 
          price: 139,
          description: 'Limpieza exterior, agujetas y tratamiento desodorizante',
          duration: 60,
          requiresIdentification: false
        }
      ];
      
      setServiceOptions(fallbackServices);
      console.warn('⚠️ Usando servicios predeterminados debido a error en API');
      
    } finally {
      setServicesLoading(false);
    }
  };

  // Cargar servicios al montar el componente
  useEffect(() => {
    fetchServices();
  }, []);

  // Función para recargar servicios manualmente
  const reloadServices = () => {
    fetchServices();
  };

  // Función para obtener servicio por ID
  const getServiceById = (serviceId: string): ServiceOption | undefined => {
    return serviceOptions.find(service => service.id === serviceId);
  };

  // Función para obtener servicios filtrados por criterio
  const getFilteredServices = (filterFn: (service: ServiceOption) => boolean): ServiceOption[] => {
    return serviceOptions.filter(filterFn);
  };

  // Función para obtener servicios que requieren identificación
  const getServicesRequiringID = (): ServiceOption[] => {
    return serviceOptions.filter(service => service.requiresIdentification);
  };

  const value: BookingContextType = {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    formStatus,
    setFormStatus,
    zoneInfo,
    setZoneInfo,
    isValidatingZone,
    setIsValidatingZone,
    serviceOptions,
    servicesLoading,
    servicesError,
    reloadServices,
    getServiceById,
    getFilteredServices,
    getServicesRequiringID
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

// Hook personalizado para servicios
export const useServices = () => {
  const { 
    serviceOptions, 
    servicesLoading, 
    servicesError, 
    reloadServices,
    getServiceById,
    getFilteredServices,
    getServicesRequiringID
  } = useBooking();
  
  return {
    services: serviceOptions,
    loading: servicesLoading,
    error: servicesError,
    reload: reloadServices,
    getById: getServiceById,
    getFiltered: getFilteredServices,
    getRequiringID: getServicesRequiringID,
    // Utilidades adicionales
    hasServices: serviceOptions.length > 0,
    servicesCount: serviceOptions.length
  };
};

// Función helper para resetear el formulario
export const useResetForm = () => {
  const { setFormData, setCurrentStep, setFormStatus, setZoneInfo } = useBooking();
  
  return () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setFormStatus({ status: 'idle', message: '' });
    setZoneInfo(null);
  };
};

// Hook para validar si un servicio está disponible
export const useServiceValidation = () => {
  const { getServiceById } = useBooking();
  
  const validateService = (serviceId: string): { isValid: boolean; service?: ServiceOption; error?: string } => {
    if (!serviceId) {
      return { isValid: false, error: 'ID de servicio requerido' };
    }
    
    const service = getServiceById(serviceId);
    
    if (!service) {
      return { isValid: false, error: 'Servicio no encontrado' };
    }
    
    return { isValid: true, service };
  };
  
  return { validateService };
};