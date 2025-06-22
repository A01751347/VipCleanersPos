// context/BookingContext.tsx
'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FormData, FormStatus, ZoneInfo, BookingContextType, ServiceOption } from '../types/booking';

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Servicios disponibles
const serviceOptions: ServiceOption[] = [
  { 
    id: '1', 
    name: 'Limpieza Básica', 
    price: 139,
    description: 'Limpieza exterior, agujetas y tratamiento desodorizante',
    duration: 60
  },
  { 
    id: '2', 
    name: 'Limpieza Premium', 
    price: 189,
    description: 'Limpieza profunda, tratamiento contra manchas e impermeabilización',
    duration: 90
  },
  { 
    id: '3', 
    name: 'Restauración Completa', 
    price: 259,
    description: 'Limpieza profunda, reparación menor, protección y cuidado especial',
    duration: 120
  }
];

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

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<FormStatus>({
    status: 'idle',
    message: ''
  });
  const [zoneInfo, setZoneInfo] = useState<ZoneInfo | null>(null);
  const [isValidatingZone, setIsValidatingZone] = useState(false);

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
    serviceOptions
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