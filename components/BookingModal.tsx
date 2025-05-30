'use client'
// components/BookingModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Loader2, Clock } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  shoesType: string;
  serviceType: string;
  deliveryMethod: string;
  bookingDate: string;
  bookingTime: string;
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface FormStatus {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string;
  bookingReference?: string;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    shoesType: '',
    serviceType: '',
    deliveryMethod: 'store',
    bookingDate: '',
    bookingTime: '',
  });
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<FormStatus>({
    status: 'idle',
    message: ''
  });

  // Opciones de servicio con precios (usando IDs reales de la base de datos)
  const serviceOptions: ServiceOption[] = [
    { 
      id: '1', 
      name: 'Limpieza Básica', 
      price: 139,
      description: 'Limpieza exterior, agujetas y tratamiento desodorizante'
    },
    { 
      id: '2', 
      name: 'Limpieza Premium', 
      price: 189,
      description: 'Limpieza profunda, tratamiento contra manchas e impermeabilización'
    }
  ];

  // Generar horas disponibles en intervalos de 15 minutos
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 10; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        times.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Para el campo de teléfono, formatear solo dígitos
    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setFormData(prev => ({ ...prev, serviceType: serviceId }));
  };

  const handleDeliveryMethodChange = (method: string) => {
    setFormData(prev => ({ ...prev, deliveryMethod: method }));
  };

  const nextStep = () => {
    // Validación básica según el paso actual
    if (currentStep === 1) {
      if (!formData.fullName || !formData.email || !formData.phone) {
        setFormStatus({
          status: 'error',
          message: 'Por favor, completa todos los campos'
        });
        return;
      }
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setFormStatus({
          status: 'error',
          message: 'El correo electrónico no es válido'
        });
        return;
      }
      
      // Validar que el teléfono tenga al menos 10 dígitos
      if (formData.phone.length !== 10) {
        setFormStatus({
          status: 'error',
          message: 'El número de teléfono debe tener 10 dígitos'
        });
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!formData.shoesType || !formData.serviceType) {
        setFormStatus({
          status: 'error',
          message: 'Por favor, completa todos los campos'
        });
        return;
      }
    }
    
    // Resetear status y avanzar al siguiente paso
    setFormStatus({ status: 'idle', message: '' });
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setFormStatus({ status: 'idle', message: '' });
  };

  const submitForm = async () => {
    if (!formData.bookingDate || !formData.bookingTime) {
      setFormStatus({
        status: 'error',
        message: 'Por favor, selecciona una fecha y hora'
      });
      return;
    }
    
    setFormStatus({
      status: 'submitting',
      message: 'Procesando tu reserva...'
    });
    
    try {
      // Combinar fecha y hora en un solo campo
      const combinedDateTime = `${formData.bookingDate}T${formData.bookingTime}:00`;
      
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          bookingDate: combinedDateTime
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Hubo un error al procesar tu reserva');
      }
      
      setFormStatus({
        status: 'success',
        message: '¡Reserva confirmada!',
        bookingReference: data.bookingReference
      });
    } catch (error) {
      setFormStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Hubo un error al procesar tu reserva'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      shoesType: '',
      serviceType: '',
      deliveryMethod: 'store',
      bookingDate: '',
      bookingTime: ''
    });
    setCurrentStep(1);
    setFormStatus({ status: 'idle', message: '' });
    onClose();
  };

  // Calcular el precio total basado en las selecciones
  const calculateTotalPrice = () => {
    let basePrice = 0;
    const selectedService = serviceOptions.find(service => service.id === formData.serviceType);
    
    if (selectedService) {
      basePrice = selectedService.price;
    }
    
    const deliveryFee = formData.deliveryMethod === 'delivery' ? 49 : 0;
    
    return basePrice + deliveryFee;
  };

  // Obtener fecha mínima (hoy)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (isOpen) {
      // Bloquear el scroll del body cuando el modal está abierto
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none z-10"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        
        {/* Header */}
        <div className="bg-[#313D52] p-6 text-white rounded-t-xl">
          <h2 className="text-2xl font-bold">Reserva tu Servicio</h2>
          <p className="opacity-90 mt-1">Completa el formulario para agendar tu limpieza de zapatillas</p>
          
          {/* Step indicator */}
          <div className="flex mt-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1 relative">
                <div className={`h-2 ${step <= currentStep ? 'bg-[#78f3d3]' : 'bg-white bg-opacity-30'}`}>
                </div>
                {step < 3 && (
                  <div className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full 
                    ${step < currentStep ? 'bg-[#78f3d3]' : 'bg-white bg-opacity-30'}`}>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Form content */}
        <div className="p-8">
          {formStatus.status === 'success' ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-[#e0f7f0] rounded-full flex items-center justify-center">
                  <CheckCircle size={64} className="text-[#78f3d3]" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-[#313D52] mb-2">¡Reserva Exitosa!</h3>
              <p className="text-[#6c7a89] mb-4 text-lg">
                Tu reserva ha sido confirmada. Te enviaremos un correo electrónico con los detalles.
              </p>
              <div className="bg-[#f5f9f8] p-6 rounded-lg mb-8 max-w-md mx-auto">
                <p className="text-[#6c7a89] mb-2">Código de Referencia:</p>
                <p className="text-3xl font-bold text-[#313D52] mb-4">{formStatus.bookingReference}</p>
                <p className="text-sm text-[#6c7a89]">
                  Guarda este código para dar seguimiento a tu servicio
                </p>
              </div>
              <button
                onClick={resetForm}
                className="px-8 py-4 bg-[#78f3d3] text-[#313D52] font-semibold rounded-lg hover:bg-[#4de0c0] transition-colors text-lg"
              >
                Finalizar
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={(e) => e.preventDefault()}>
                {/* Step 1: Información personal */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-[#313D52] mb-4">Información Personal</h3>
                    
                    <div>
                      <label className="block text-[#313D52] font-medium mb-2" htmlFor="fullName">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Tu nombre completo"
                        className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[#313D52] font-medium mb-2" htmlFor="email">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[#313D52] font-medium mb-2" htmlFor="phone">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10 dígitos"
                        className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg"
                        required
                      />
                    </div>
                  </div>
                )}
                
                {/* Step 2: Detalles del servicio */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-[#313D52] mb-4">Detalles del Servicio</h3>
                    
                    <div>
                      <label className="block text-[#313D52] font-medium mb-2" htmlFor="shoesType">
                        Marca y Modelo de Zapatillas
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
                    
                    <div>
                      <p className="block text-[#313D52] font-medium mb-4">Tipo de Servicio</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {serviceOptions.map((service) => (
                          <div 
                            key={service.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              formData.serviceType === service.id
                                ? 'border-[#78f3d3] bg-[#e0f7f0] ring-2 ring-[#78f3d3]'
                                : 'border-[#e0e6e5] hover:border-[#78f3d3]'
                            }`}
                            onClick={() => handleServiceChange(service.id)}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold text-[#313D52]">{service.name}</h4>
                              <span className="text-[#313D52] font-bold">${service.price}</span>
                            </div>
                            <p className="text-[#6c7a89] text-sm">{service.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="block text-[#313D52] font-medium mb-4">Método de Entrega</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          type="button"
                          className={`flex-1 py-3 px-4 rounded-lg border text-center transition-all ${
                            formData.deliveryMethod === 'store'
                              ? 'bg-[#78f3d3] text-[#313D52] border-[#78f3d3]'
                              : 'bg-white text-[#313D52] border-[#e0e6e5] hover:border-[#78f3d3]'
                          }`}
                          onClick={() => handleDeliveryMethodChange('store')}
                        >
                          Entrega en tienda
                          <span className="block text-sm mt-1 font-normal opacity-80">
                            {formData.deliveryMethod === 'store' ? 'Seleccionado' : 'Sin costo adicional'}
                          </span>
                        </button>
                        
                        <button
                          type="button"
                          className={`flex-1 py-3 px-4 rounded-lg border text-center transition-all ${
                            formData.deliveryMethod === 'delivery'
                              ? 'bg-[#78f3d3] text-[#313D52] border-[#78f3d3]'
                              : 'bg-white text-[#313D52] border-[#e0e6e5] hover:border-[#78f3d3]'
                          }`}
                          onClick={() => handleDeliveryMethodChange('delivery')}
                        >
                          Recolección a domicilio
                          <span className="block text-sm mt-1 font-normal opacity-80">
                            +$49 pesos
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Fecha y hora */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-[#313D52] mb-4">Fecha y Hora</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[#313D52] font-medium mb-2" htmlFor="bookingDate">
                          Selecciona fecha
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Calendar size={18} className="text-gray-500" />
                          </div>
                          <input
                            type="date"
                            id="bookingDate"
                            name="bookingDate"
                            value={formData.bookingDate}
                            onChange={handleChange}
                            min={getMinDate()}
                            className="w-full pl-10 px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-[#313D52] font-medium mb-2" htmlFor="bookingTime">
                          Selecciona hora
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Clock size={18} className="text-gray-500" />
                          </div>
                          <select
                            id="bookingTime"
                            name="bookingTime"
                            value={formData.bookingTime}
                            onChange={handleChange}
                            className="w-full pl-10 px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg appearance-none"
                            required
                          >
                            <option value="">Selecciona una hora</option>
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#f5f9f8] p-6 rounded-lg mt-6">
                      <h4 className="font-medium text-[#313D52] text-lg mb-4">Resumen de tu reserva</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <ul className="space-y-3 text-[#313D52]">
                            <li><span className="font-medium">Cliente:</span> {formData.fullName}</li>
                            <li><span className="font-medium">Zapatillas:</span> {formData.shoesType}</li>
                            <li>
                              <span className="font-medium">Servicio:</span> {
                                serviceOptions.find(s => s.id === formData.serviceType)?.name || ''
                              }
                            </li>
                            <li>
                              <span className="font-medium">Entrega:</span> {
                                formData.deliveryMethod === 'store' ? 'En tienda' : 'A domicilio (+$49)'
                              }
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <ul className="space-y-3 text-[#313D52]">
                            <li>
                              <span className="font-medium">Fecha:</span> {
                                formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) : ''
                              }
                            </li>
                            <li><span className="font-medium">Hora:</span> {formData.bookingTime}</li>
                            <li className="pt-3 text-xl font-bold text-[#313D52]">
                              Total: ${calculateTotalPrice()} MXN
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mensaje de error */}
                {formStatus.status === 'error' && (
                  <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
                    {formStatus.message}
                  </div>
                )}
                
                {/* Botones de navegación */}
                <div className="flex justify-between mt-8">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 border border-[#e0e6e5] text-[#313D52] font-medium rounded-lg hover:bg-[#f5f9f8] transition-colors"
                    >
                      Atrás
                    </button>
                  ) : (
                    <div></div>
                  )}
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-3 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-colors"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={submitForm}
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
                      ) : (
                        'Confirmar Reserva'
                      )}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
