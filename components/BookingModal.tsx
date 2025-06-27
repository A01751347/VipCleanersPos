'use client'
import React, { useEffect, useState } from 'react';
import { X, Loader2, CheckCircle, ChevronRight, AlertCircle, User, Package, Truck, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  // Información personal
  name: string;
  email: string;
  phone: string;
  
  // Servicio
  serviceType: 'basic' | 'premium';
  shoeCount: number;
  specialInstructions: string;
  
  // Entrega
  deliveryMethod: 'pickup' | 'delivery';
  address: string;
  
  // Fecha y hora
  date: string;
  time: string;
}

interface FormStatus {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string;
  bookingReference?: string;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    serviceType: 'basic',
    shoeCount: 1,
    specialInstructions: '',
    deliveryMethod: 'pickup',
    address: '',
    date: '',
    time: ''
  });
  const [formStatus, setFormStatus] = useState<FormStatus>({
    status: 'idle',
    message: ''
  });
  const [mounted, setMounted] = useState(false);

  // Asegurar que el componente esté montado en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Control del scroll del body
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Reset al cerrar
  const handleClose = () => {
    setCurrentStep(1);
    setFormStatus({ status: 'idle', message: '' });
    setFormData({
      name: '',
      email: '',
      phone: '',
      serviceType: 'basic',
      shoeCount: 1,
      specialInstructions: '',
      deliveryMethod: 'pickup',
      address: '',
      date: '',
      time: ''
    });
    onClose();
  };

  // Validaciones
  const validateStep = (step: number): boolean => {
    let isValid = true;
    let message = '';

    switch (step) {
      case 1:
        if (!formData.name || !formData.email || !formData.phone) {
          message = 'Por favor completa todos los campos obligatorios';
          isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          message = 'Por favor ingresa un email válido';
          isValid = false;
        }
        break;
      case 2:
        if (formData.shoeCount < 1) {
          message = 'Debe ser al menos un par de zapatos';
          isValid = false;
        }
        break;
      case 3:
        if (formData.deliveryMethod === 'delivery' && !formData.address) {
          message = 'Por favor ingresa tu dirección para el servicio a domicilio';
          isValid = false;
        }
        break;
      case 4:
        if (!formData.date || !formData.time) {
          message = 'Por favor selecciona fecha y hora';
          isValid = false;
        }
        break;
    }

    if (!isValid) {
      setFormStatus({ status: 'error', message });
    } else {
      setFormStatus({ status: 'idle', message: '' });
    }

    return isValid;
  };

  // Navegación
  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setFormStatus({ status: 'idle', message: '' });
    }
  };

  // Envío del formulario
  const handleSubmit = async () => {
    setFormStatus({ status: 'submitting', message: 'Procesando tu reserva...' });

    try {
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const bookingReference = `VIP-${Date.now().toString().slice(-6)}`;
      
      setFormStatus({
        status: 'success',
        message: '¡Reserva confirmada exitosamente!',
        bookingReference
      });
    } catch (error) {
      setFormStatus({
        status: 'error',
        message: 'Hubo un error al procesar tu reserva. Intenta nuevamente.'
      });
    }
  };

  // Títulos de pasos
  const stepTitles = [
    'Información Personal',
    'Servicio y Calzado',
    'Método de Entrega',
    'Fecha y Hora'
  ];

  // Iconos de pasos
  const stepIcons = [User, Package, Truck, Calendar];

  // Indicador de progreso
  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {stepTitles.map((title, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const Icon = stepIcons[index];
        
        return (
          <div key={stepNumber} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isCompleted 
                  ? 'bg-[#78f3d3] text-[#313D52]' 
                  : isActive 
                    ? 'bg-[#313D52] text-white' 
                    : 'bg-gray-200 text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckCircle size={20} />
                ) : (
                  <Icon size={20} />
                )}
              </div>
              <span className={`text-xs mt-2 text-center transition-all ${
                isActive ? 'text-[#313D52] font-medium' : 'text-gray-500'
              }`}>
                {title}
              </span>
            </div>
            {index < stepTitles.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 transition-all ${
                stepNumber < currentStep ? 'bg-[#78f3d3]' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // Manejadores de cambio optimizados
  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleNumberChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: parseInt(e.target.value) }));
  };

  const handleServiceTypeChange = (serviceType: 'basic' | 'premium') => {
    setFormData(prev => ({ ...prev, serviceType }));
  };

  const handleDeliveryMethodChange = (deliveryMethod: 'pickup' | 'delivery') => {
    setFormData(prev => ({ ...prev, deliveryMethod }));
  };

  const handleTimeChange = (time: string) => {
    setFormData(prev => ({ ...prev, time }));
  };

  // Componentes de pasos optimizados
  const StepPersonalInfo = React.memo(() => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[#313D52] mb-2">
          Nombre completo *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={handleInputChange('name')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
          placeholder="Tu nombre completo"
          autoComplete="name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#313D52] mb-2">
          Email *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
          placeholder="tu@email.com"
          autoComplete="email"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#313D52] mb-2">
          Teléfono *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={handleInputChange('phone')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
          placeholder="442-123-4567"
          autoComplete="tel"
        />
      </div>
    </div>
  ));

  const StepService = React.memo(() => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[#313D52] mb-4">
          Tipo de servicio
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'basic', name: 'Limpieza Básica', price: '$139', description: 'Limpieza completa y desodorización' },
            { id: 'premium', name: 'Limpieza Premium', price: '$189', description: 'Servicio completo + protección avanzada' }
          ].map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceTypeChange(service.id as 'basic' | 'premium')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.serviceType === service.id
                  ? 'border-[#78f3d3] bg-[#78f3d3]/10'
                  : 'border-gray-200 hover:border-[#78f3d3]/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-[#313D52]">{service.name}</h3>
                <span className="text-lg font-bold text-[#78f3d3]">{service.price}</span>
              </div>
              <p className="text-sm text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#313D52] mb-2">
          Número de pares
        </label>
        <select
          value={formData.shoeCount}
          onChange={handleNumberChange('shoeCount')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
        >
          {[1, 2, 3, 4, 5].map(count => (
            <option key={count} value={count}>{count} par{count > 1 ? 'es' : ''}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#313D52] mb-2">
          Instrucciones especiales (opcional)
        </label>
        <textarea
          value={formData.specialInstructions}
          onChange={handleInputChange('specialInstructions')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
          rows={3}
          placeholder="Algún detalle especial sobre tus zapatos..."
        />
      </div>
    </div>
  ));

  const StepDelivery = React.memo(() => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[#313D52] mb-4">
          Método de entrega
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'pickup', name: 'Recoger en tienda', description: 'Roma Norte, CDMX', price: 'Gratis' },
            { id: 'delivery', name: 'Entrega a domicilio', description: 'En la comodidad de tu hogar', price: '+$50' }
          ].map((method) => (
            <div
              key={method.id}
              onClick={() => handleDeliveryMethodChange(method.id as 'pickup' | 'delivery')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.deliveryMethod === method.id
                  ? 'border-[#78f3d3] bg-[#78f3d3]/10'
                  : 'border-gray-200 hover:border-[#78f3d3]/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-[#313D52]">{method.name}</h3>
                <span className="text-sm font-medium text-[#78f3d3]">{method.price}</span>
              </div>
              <p className="text-sm text-gray-600">{method.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {formData.deliveryMethod === 'delivery' && (
        <div>
          <label className="block text-sm font-medium text-[#313D52] mb-2">
            Dirección de entrega *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={handleInputChange('address')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
            placeholder="Calle, número, colonia, CDMX"
            autoComplete="street-address"
          />
        </div>
      )}
    </div>
  ));

  const StepDateTime = React.memo(() => {
    const today = new Date().toISOString().split('T')[0];
    const timeSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#313D52] mb-2">
            Fecha preferida *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={handleInputChange('date')}
            min={today}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#313D52] mb-4">
            Hora preferida *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {timeSlots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => handleTimeChange(time)}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  formData.time === time
                    ? 'border-[#78f3d3] bg-[#78f3d3] text-[#313D52] font-medium'
                    : 'border-gray-200 hover:border-[#78f3d3]/50 text-gray-700'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  });

  const SuccessScreen = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-[#313D52] mb-4">¡Reserva Confirmada!</h3>
      <p className="text-gray-600 mb-6">
        Tu reserva ha sido procesada exitosamente.
      </p>
      {formStatus.bookingReference && (
        <div className="bg-[#78f3d3]/10 border border-[#78f3d3] rounded-lg p-4 mb-6">
          <p className="text-sm text-[#313D52]">
            <strong>Número de referencia:</strong> {formStatus.bookingReference}
          </p>
        </div>
      )}
      <button
        onClick={handleClose}
        className="px-8 py-3 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-all"
      >
        Cerrar
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return <StepPersonalInfo />;
      case 2: return <StepService />;
      case 3: return <StepDelivery />;
      case 4: return <StepDateTime />;
      default: return <StepPersonalInfo />;
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#313D52] text-white p-6 rounded-t-2xl relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
          >
            <X size={24} />
          </button>
          
          <h2 className="text-2xl font-bold mb-2">
            {formStatus.status === 'success' ? '¡Reserva Exitosa!' : 'Reserva tu Servicio'}
          </h2>
          {formStatus.status !== 'success' && (
            <p className="text-white/80">
              {stepTitles[currentStep - 1]} - Paso {currentStep} de 4
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {formStatus.status === 'success' ? (
            <SuccessScreen />
          ) : (
            <>
              <StepIndicator />
              
              {renderCurrentStep()}

              {/* Error message */}
              {formStatus.status === 'error' && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle size={20} className="text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700">{formStatus.message}</span>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                {currentStep > 1 ? (
                  <button
                    onClick={prevStep}
                    disabled={formStatus.status === 'submitting'}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    ← Atrás
                  </button>
                ) : (
                  <div />
                )}
                
                <button
                  onClick={nextStep}
                  disabled={formStatus.status === 'submitting'}
                  className="px-8 py-3 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-all disabled:opacity-50 flex items-center"
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
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BookingModal;