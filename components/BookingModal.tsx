// components/BookingModal.tsx
'use client'
import React, { useEffect } from 'react';
import { X, Loader2, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { BookingProvider, useBooking } from '../context/BookingContext';
import { 
  validateStep1, 
  validateStep2, 
  validateStep3, 
  validateStep4, 
  submitBooking 
} from '../utils/bookingUtils';

// Importar componentes de pasos
import StepPersonalInfo from './steps/StepPersonalInfo';
import StepService from './steps/StepService';
import StepDelivery from './steps/StepDelivery';
import StepDateTime from './steps/StepDateTime';
import SuccessScreen from './SuccessScreen';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente interno que usa el contexto
const BookingModalContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    currentStep,
    setCurrentStep,
    formData,
    formStatus,
    setFormStatus,
    zoneInfo
  } = useBooking();

  // Validaciones por paso
  const validateCurrentStep = (): boolean => {
    let errors: string[] = [];
    
    switch (currentStep) {
      case 1:
        errors = validateStep1(formData);
        break;
      case 2:
        errors = validateStep2(formData);
        break;
      case 3:
        errors = validateStep3(formData, zoneInfo);
        break;
      case 4:
        errors = validateStep4(formData);
        break;
    }
    
    if (errors.length > 0) {
      setFormStatus({ status: 'error', message: errors.join(', ') });
      return false;
    }
    
    setFormStatus({ status: 'idle', message: '' });
    return true;
  };

  // Navegación
  const nextStep = async () => {
    if (!validateCurrentStep()) return;
    
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 4) {
      await handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setFormStatus({ status: 'idle', message: '' });
    }
  };

  // Envío del formulario
  const handleSubmit = async () => {
    setFormStatus({
      status: 'submitting',
      message: 'Procesando tu reserva...'
    });
    
    try {
      const bookingReference = await submitBooking(formData, zoneInfo);
      setFormStatus({
        status: 'success',
        message: '¡Reserva confirmada!',
        bookingReference
      });
    } catch (error) {
      console.error('Error enviando reserva:', error);
      setFormStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Hubo un error al procesar tu reserva'
      });
    }
  };

  // Componente del indicador de pasos
  const StepIndicator = () => (
    <div className="flex mt-6">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex-1 relative">
          <div className={`h-2 ${step <= currentStep ? 'bg-[#78f3d3]' : 'bg-white bg-opacity-30'}`}>
          </div>
          {step < 4 && (
            <div className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full 
              ${step < currentStep ? 'bg-[#78f3d3]' : 'bg-white bg-opacity-30'}`}>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Componente de mensaje de error
  const ErrorMessage = () => (
    formStatus.status === 'error' && (
      <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start">
        <AlertCircle size={20} className="mr-3 flex-shrink-0 mt-0.5" />
        <span>{formStatus.message}</span>
      </div>
    )
  );

  // Componente de botones de navegación
  const NavigationButtons = () => (
    <div className="flex justify-between mt-8 pt-6 border-t border-[#e0e6e5]">
      {currentStep > 1 ? (
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-3 border border-[#e0e6e5] text-[#313D52] font-medium rounded-lg hover:bg-[#f5f9f8] transition-colors"
        >
          ← Atrás
        </button>
      ) : (
        <div></div>
      )}
      
      <button
        type="button"
        onClick={nextStep}
        disabled={formStatus.status === 'submitting'}
        className={`px-8 py-3 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center ${
          formStatus.status === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {formStatus.status === 'submitting' ? (
          <>
            <Loader2 size={20} className="animate-spin mr-2" />
            Procesando...
          </>
        ) : currentStep === 4 ? (
          <>
            Confirmar Reserva
            <CheckCircle size={20} className="ml-2" />
          </>
        ) : (
          <>
            Siguiente
            <ChevronRight size={20} className="ml-2" />
          </>
        )}
      </button>
    </div>
  );

  // Renderizar el paso actual
  const renderCurrentStep = () => {
    const stepProps = { onNext: nextStep, onPrev: prevStep };
    
    switch (currentStep) {
      case 1:
        return <StepPersonalInfo {...stepProps} />;
      case 2:
        return <StepService {...stepProps} />;
      case 3:
        return <StepDelivery {...stepProps} />;
      case 4:
        return <StepDateTime {...stepProps} />;
      default:
        return <StepPersonalInfo {...stepProps} />;
    }
  };

  return (
    <>
      {/* Header */}
      <div className="bg-[#313D52] p-6 text-white rounded-t-xl">
        <h2 className="text-2xl font-bold pr-8">Reserva tu Servicio</h2>
        <p className="opacity-90 mt-1">Agenda tu limpieza de calzado con pickup opcional</p>
        
        {/* Step indicator */}
        <StepIndicator />
      </div>
      
      {/* Form content */}
      <div className="p-8">
        {formStatus.status === 'success' ? (
          <SuccessScreen onClose={onClose} />
        ) : (
          <>
            <form onSubmit={(e) => e.preventDefault()}>
              {/* Render current step */}
              {renderCurrentStep()}
              
              {/* Error message */}
              <ErrorMessage />
              
              {/* Navigation buttons */}
              <NavigationButtons />
            </form>
          </>
        )}
      </div>
    </>
  );
};

// Componente principal con Provider
const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  // Control de scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <BookingProvider>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-3xl xl:max-w-5xl relative max-h-[95vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none z-10 p-1"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          
          <BookingModalContent onClose={onClose} />
        </div>
      </div>
    </BookingProvider>
  );
};

export default BookingModal;