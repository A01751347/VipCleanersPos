// types/booking.ts - Actualización del tipo ZoneInfo
export interface ZoneInfo {
  zone: string;
  isSupported: boolean;
  additionalCost: number;
  estimatedTime: string;
  // Propiedades opcionales adicionales para compatibilidad
  cost?: number; // Alias para additionalCost (compatibilidad hacia atrás)
  available?: boolean; // Alias para isSupported (compatibilidad hacia atrás)
  message?: string; // Mensaje adicional opcional
  coordinates?: { lat: number; lng: number }; // Coordenadas opcionales
  restrictions?: string[]; // Restricciones opcionales
  availableTimeSlots?: string[]; // Horarios disponibles opcionales
}

export interface ServiceOption {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number; // en minutos
  requiresIdentification?: boolean;
}

export interface FormData {
  fullName: string;
  email: string;
  phone: string;
  shoesType: string;
  serviceType: string;
  deliveryMethod: 'store' | 'pickup';
  bookingDate: string;
  bookingTime: string;
  address: {
    street: string;
    number: string;
    interior: string;
    neighborhood: string;
    municipality: string;
    city: string;
    state: string;
    zipCode: string;
    instructions: string;
    timeWindowStart: string;
    timeWindowEnd: string;
    phone: string;
  };
  requiresPickup: boolean;
}

export interface FormStatus {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string;
  bookingReference?: string; // Para cuando el envío es exitoso
}

export interface BookingContextType {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  formStatus: FormStatus;
  setFormStatus: React.Dispatch<React.SetStateAction<FormStatus>>;
  zoneInfo: ZoneInfo | null;
  setZoneInfo: React.Dispatch<React.SetStateAction<ZoneInfo | null>>;
  isValidatingZone: boolean;
  setIsValidatingZone: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Propiedades relacionadas con servicios de API
  serviceOptions: ServiceOption[];
  servicesLoading: boolean;
  servicesError: string | null;
  reloadServices: () => void;
  getServiceById: (serviceId: string) => ServiceOption | undefined;
  getFilteredServices: (filterFn: (service: ServiceOption) => boolean) => ServiceOption[];
  getServicesRequiringID: () => ServiceOption[];
}

// Tipos adicionales para el sistema
export interface StepProps {
  onNext: () => void;
  onPrev: () => void;
}

export interface Municipality {
  name: string;
  zipCodes: string[];
  isSupported: boolean;
  basePickupCost: number;
}

export interface BookingSummaryData {
  cliente: {
    nombre: string;
    email: string;
    telefono: string;
  };
  servicio: {
    nombre: string;
    precio: number;
    duracion: number;
    requiereId: boolean;
  };
  calzado: string;
  entrega: {
    metodo: string;
    direccion: {
      calle: string;
      colonia: string;
      codigoPostal: string;
      telefono: string;
    } | null;
    zona: string | null;
    costoAdicional: number;
  };
  cita: {
    fecha: string;
    hora: string;
    fechaFormateada: string;
    horaFormateada: string;
  };
  precio: {
    servicio: number;
    pickup: number;
    total: number;
  };
}