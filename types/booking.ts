// types/booking.ts
export interface FormData {
    fullName: string;
    email: string;
    phone: string;
    shoesType: string;
    serviceType: string;
    deliveryMethod: string;
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
  
  export interface ServiceOption {
    id: string;
    name: string;
    price: number;
    description: string;
    duration: number;
  }
  
  export interface FormStatus {
    status: 'idle' | 'submitting' | 'success' | 'error';
    message: string;
    bookingReference?: string;
  }
  
  export interface ZoneInfo {
    zone: string;
    cost: number;
    estimatedTime: string;
    available: boolean;
    message?: string;
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
    serviceOptions: ServiceOption[];
  }
  
  export interface StepProps {
    onNext: () => void;
    onPrev: () => void;
  }