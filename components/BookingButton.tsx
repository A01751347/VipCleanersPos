import React, { useEffect, useState } from 'react';
import { X, Loader2, CheckCircle, ChevronRight, AlertCircle, User, Package, Truck, Calendar, Mail, Phone, MapPin, Clock, DollarSign, Brush, Sparkles, Wrench, Shield, Home, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

// Types
interface ServiceOption {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number;
  requiresIdentification?: boolean;
}

interface ZoneInfo {
  zone: string;
  isSupported: boolean;
  additionalCost: number;
  estimatedTime: string;
  cost?: number;
}

interface FormData {
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

interface FormStatus {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string;
  bookingReference?: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
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
  });
  const [formStatus, setFormStatus] = useState<FormStatus>({
    status: 'idle',
    message: ''
  });
  const [zoneInfo, setZoneInfo] = useState<ZoneInfo | null>(null);
  const [isValidatingZone, setIsValidatingZone] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const response = await fetch('/api/admin/services');
        
        if (response.ok) {
          const data = await response.json();
          const activeServices = (data.services || []).filter((service: any) => service.activo);
          const convertedServices = activeServices.map((service: any) => ({
            id: service.servicio_id.toString(),
            name: service.nombre,
            price: Number(service.precio),
            description: service.descripcion,
            duration: service.tiempo_estimado || 60,
            requiresIdentification: service.requiere_identificacion
          }));
          setServiceOptions(convertedServices);
        } else {
          // Fallback services
          setServiceOptions([
            { 
              id: '1', 
              name: 'Limpieza Básica', 
              price: 139,
              description: 'Limpieza exterior, agujetas y tratamiento desodorizante',
              duration: 60,
              requiresIdentification: false
            },
            { 
              id: '2', 
              name: 'Limpieza Premium', 
              price: 189,
              description: 'Servicio completo + protección avanzada',
              duration: 90,
              requiresIdentification: false
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading services:', error);
        setServiceOptions([
          { 
            id: '1', 
            name: 'Limpieza Básica', 
            price: 139,
            description: 'Limpieza exterior, agujetas y tratamiento desodorizante',
            duration: 60,
            requiresIdentification: false
          }
        ]);
      } finally {
        setServicesLoading(false);
      }
    };

    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  // Control body scroll
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

  // Close with ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Zone validation with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.address.zipCode && formData.address.zipCode.length === 5) {
        validateZone();
      } else {
        setZoneInfo(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.address.zipCode]);

  const validateZone = async () => {
    if (!formData.address.zipCode || formData.address.zipCode.length !== 5) {
      return;
    }

    try {
      setIsValidatingZone(true);
      
      const response = await fetch('/api/booking', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate-zone',
          zipCode: formData.address.zipCode
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.zoneInfo) {
          setZoneInfo(result.zoneInfo);
        } else {
          setZoneInfo(null);
        }
      } else {
        setZoneInfo(null);
      }
    } catch (error) {
      console.error('Error validating zone:', error);
      setZoneInfo(null);
    } finally {
      setIsValidatingZone(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormStatus({ status: 'idle', message: '' });
    setFormData({
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
    });
    setZoneInfo(null);
    onClose();
  };

  // Validations
  const validateStep = (step: number): boolean => {
    let isValid = true;
    let message = '';

    switch (step) {
      case 1:
        if (!formData.fullName || !formData.email || !formData.phone) {
          message = 'Por favor completa todos los campos obligatorios';
          isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          message = 'Por favor ingresa un email válido';
          isValid = false;
        } else if (formData.phone.length !== 10) {
          message = 'El teléfono debe tener 10 dígitos';
          isValid = false;
        }
        break;
      case 2:
        if (!formData.shoesType || !formData.serviceType) {
          message = 'Por favor completa la información del servicio';
          isValid = false;
        }
        break;
      case 3:
        if (formData.deliveryMethod === 'pickup') {
          if (!formData.address.street || !formData.address.number || !formData.address.neighborhood || !formData.address.zipCode || !formData.address.phone) {
            message = 'Por favor completa la información de dirección para pickup';
            isValid = false;
          } else if (zoneInfo && !zoneInfo.isSupported) {
            message = 'No ofrecemos pickup en tu zona';
            isValid = false;
          }
        }
        break;
      case 4:
        if (!formData.bookingDate || !formData.bookingTime) {
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

  const handleSubmit = async () => {
    setFormStatus({ status: 'submitting', message: 'Procesando tu reserva...' });

    try {
      const bookingData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        shoesType: formData.shoesType.trim(),
        serviceType: formData.serviceType,
        deliveryMethod: formData.deliveryMethod,
        requiresPickup: formData.deliveryMethod === 'pickup',
        address: formData.deliveryMethod === 'pickup' ? {
          street: formData.address.street.trim(),
          number: formData.address.number.trim(),
          interior: formData.address.interior.trim(),
          neighborhood: formData.address.neighborhood.trim(),
          municipality: formData.address.municipality.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          zipCode: formData.address.zipCode.trim(),
          instructions: formData.address.instructions.trim(),
          timeWindowStart: formData.address.timeWindowStart,
          timeWindowEnd: formData.address.timeWindowEnd,
          phone: formData.address.phone.trim()
        } : null,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        pickupCost: formData.deliveryMethod === 'pickup' && zoneInfo ? (zoneInfo.additionalCost || zoneInfo.cost || 0) : 0,
        pickupZone: formData.deliveryMethod === 'pickup' && zoneInfo ? zoneInfo.zone : null,
        timestamp: new Date().toISOString(),
        source: 'booking_modal'
      };

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al procesar la reserva');
      }

      const bookingReference = result.bookingReference || result.id || `VIP-${Date.now().toString().slice(-6)}`;
      
      setFormStatus({
        status: 'success',
        message: '¡Reserva confirmada exitosamente!',
        bookingReference
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      setFormStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Hubo un error al procesar tu reserva. Intenta nuevamente.'
      });
    }
  };

  const stepTitles = [
    'Información Personal',
    'Servicio y Calzado', 
    'Método de Entrega',
    'Fecha y Hora'
  ];

  const stepIcons = [User, Package, Truck, Calendar];

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('básica') || name.includes('basica')) {
      return <Brush size={20} className="text-[#78f3d3]" />;
    } else if (name.includes('premium')) {
      return <Sparkles size={20} className="text-[#78f3d3]" />;
    } else if (name.includes('restauración') || name.includes('restauracion')) {
      return <Wrench size={20} className="text-[#78f3d3]" />;
    }
    return <Brush size={20} className="text-[#78f3d3]" />;
  };

  const calculateTotalPrice = () => {
    const selectedService = serviceOptions.find(service => service.id === formData.serviceType);
    const servicePrice = selectedService ? selectedService.price : 0;
    let pickupCost = 0;
    if (formData.deliveryMethod === 'pickup' && zoneInfo?.isSupported) {
      pickupCost = zoneInfo.additionalCost || zoneInfo.cost || 0;
    }
    return servicePrice + pickupCost;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const timeOptions = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (field === 'phone') {
      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [field]: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    }
  };

  const handleAddressChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (field === 'zipCode') {
      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 5);
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: cleaned }
      }));
    } else if (field === 'phone') {
      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: cleaned }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: e.target.value }
      }));
    }
  };

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

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <User size={24} className="text-[#78f3d3] mr-3" />
              <h3 className="text-xl font-semibold text-[#313D52]">Información Personal</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#313D52] mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
                placeholder="Tu nombre completo"
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
                placeholder="10 dígitos"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Package size={24} className="text-[#78f3d3] mr-3" />
              <h3 className="text-xl font-semibold text-[#313D52]">Servicio y Calzado</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#313D52] mb-2">
                Marca y Modelo del Calzado *
              </label>
              <input
                type="text"
                value={formData.shoesType}
                onChange={handleInputChange('shoesType')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
                placeholder="Ej. Nike Air Jordan 1, Adidas Ultraboost, etc."
              />
            </div>

            {servicesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={32} className="animate-spin text-[#78f3d3]" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#313D52] mb-4">
                  Tipo de servicio *
                </label>
                <div className="space-y-4">
                  {serviceOptions.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setFormData(prev => ({ ...prev, serviceType: service.id }))}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.serviceType === service.id
                          ? 'border-[#78f3d3] bg-[#78f3d3]/10'
                          : 'border-gray-200 hover:border-[#78f3d3]/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {getServiceIcon(service.name)}
                          <h4 className="font-medium text-[#313D52] ml-3">{service.name}</h4>
                        </div>
                        <div className="flex items-center">
                          <DollarSign size={18} className="text-[#78f3d3]" />
                          <span className="text-lg font-bold text-[#78f3d3]">{service.price}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                        <div className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          <span>{service.duration} min</span>
                        </div>
                        {service.requiresIdentification && (
                          <div className="flex items-center text-amber-600">
                            <Shield size={12} className="mr-1" />
                            <span>Requiere ID</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Truck size={24} className="text-[#78f3d3] mr-3" />
              <h3 className="text-xl font-semibold text-[#313D52]">Método de Entrega</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#313D52] mb-4">
                ¿Cómo prefieres entregar tu calzado? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    deliveryMethod: 'store',
                    requiresPickup: false
                  }))}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.deliveryMethod === 'store'
                      ? 'border-[#78f3d3] bg-[#78f3d3]/10'
                      : 'border-gray-200 hover:border-[#78f3d3]/50'
                  }`}
                >
                  <Home size={32} className="mx-auto mb-3 text-[#78f3d3]" />
                  <h4 className="font-semibold mb-2 text-center">Traer a la tienda</h4>
                  <p className="text-sm text-center">Sin costo adicional</p>
                </div>
                
                <div
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    deliveryMethod: 'pickup',
                    requiresPickup: true
                  }))}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.deliveryMethod === 'pickup'
                      ? 'border-[#78f3d3] bg-[#78f3d3]/10'
                      : 'border-gray-200 hover:border-[#78f3d3]/50'
                  }`}
                >
                  <Truck size={32} className="mx-auto mb-3 text-[#78f3d3]" />
                  <h4 className="font-semibold mb-2 text-center">Pickup a domicilio</h4>
                  <p className="text-sm text-center">
                    {zoneInfo && zoneInfo.isSupported 
                      ? `+$${zoneInfo.additionalCost || zoneInfo.cost || 0}` 
                      : 'Costo según zona'}
                  </p>
                </div>
              </div>
            </div>

            {formData.deliveryMethod === 'pickup' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <MapPin size={18} className="text-blue-600 mr-2" />
                    <h4 className="font-medium text-blue-900">Dirección de Recolección</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Proporciona la dirección donde recogeremos tu calzado.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#313D52] mb-2">
                      Calle *
                    </label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={handleAddressChange('street')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
                      placeholder="Nombre de la calle"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#313D52] mb-2">
                      Número *
                    </label>
                    <input
                      type="text"
                      value={formData.address.number}
                      onChange={handleAddressChange('number')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
                      placeholder="Número exterior"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#313D52] mb-2">
                      Colonia *
                    </label>
                    <input
                      type="text"
                      value={formData.address.neighborhood}
                      onChange={handleAddressChange('neighborhood')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
                      placeholder="Nombre de la colonia"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#313D52] mb-2">
                      Código Postal *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.address.zipCode}
                        onChange={handleAddressChange('zipCode')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all pr-10"
                        placeholder="5 dígitos"
                        maxLength={5}
                      />
                      {isValidatingZone && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 size={16} className="animate-spin text-[#78f3d3]" />
                        </div>
                      )}
                    </div>
                    
                    {/* Zone validation message */}
                    {formData.address.zipCode.length === 5 && zoneInfo && (
                      <div className={`mt-2 p-2 rounded text-sm flex items-center ${
                        zoneInfo.isSupported
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {zoneInfo.isSupported ? (
                          <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                        )}
                        <span>
                          {zoneInfo.isSupported 
                            ? `✅ Zona: ${zoneInfo.zone} - Costo adicional: ${zoneInfo.additionalCost || zoneInfo.cost || 0}`
                            : `❌ Lo sentimos, no tenemos cobertura en la zona: ${zoneInfo.zone}`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#313D52] mb-2">
                      Teléfono de Contacto *
                    </label>
                    <input
                      type="tel"
                      value={formData.address.phone}
                      onChange={handleAddressChange('phone')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
                      placeholder="10 dígitos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#313D52] mb-2">
                      Número Interior
                    </label>
                    <input
                      type="text"
                      value={formData.address.interior}
                      onChange={handleAddressChange('interior')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
                      placeholder="Depto, piso, etc. (opcional)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#313D52] mb-2">
                    Instrucciones Adicionales
                  </label>
                  <textarea
                    value={formData.address.instructions}
                    onChange={handleAddressChange('instructions')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="Referencias adicionales, instrucciones especiales, etc. (opcional)"
                  />
                </div>

                {/* Zone confirmation */}
                {zoneInfo && zoneInfo.isSupported && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center mb-2">
                      <CheckCircle size={18} className="text-green-600 mr-2" />
                      <h4 className="font-medium text-green-900">Zona de Cobertura Confirmada</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-green-700 font-medium">Zona:</span>
                        <p className="text-green-800">{zoneInfo.zone}</p>
                      </div>
                      <div>
                        <span className="text-green-700 font-medium">Costo adicional:</span>
                        <p className="text-green-800 font-semibold">${zoneInfo.additionalCost || zoneInfo.cost || 0} MXN</p>
                      </div>
                      <div>
                        <span className="text-green-700 font-medium">Tiempo estimado:</span>
                        <p className="text-green-800">{zoneInfo.estimatedTime}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* No coverage warning */}
                {zoneInfo && !zoneInfo.isSupported && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center mb-2">
                      <AlertCircle size={18} className="text-red-600 mr-2" />
                      <h4 className="font-medium text-red-900">Zona Sin Cobertura</h4>
                    </div>
                    <p className="text-sm text-red-700">
                      Lo sentimos, actualmente no ofrecemos servicio de pickup en tu zona. 
                      Puedes seleccionar "Traer a la tienda" como método de entrega.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Calendar size={24} className="text-[#78f3d3] mr-3" />
              <h3 className="text-xl font-semibold text-[#313D52]">Fecha y Hora</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#313D52] mb-2">
                  Selecciona fecha *
                </label>
                <input
                  type="date"
                  value={formData.bookingDate}
                  onChange={handleInputChange('bookingDate')}
                  min={getMinDate()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#313D52] mb-2">
                  Selecciona hora *
                </label>
                <select
                  value={formData.bookingTime}
                  onChange={handleInputChange('bookingTime')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
                >
                  <option value="">Selecciona una hora</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-gradient-to-br from-[#f5f9f8] to-white p-6 rounded-xl border border-[#e0e6e5] shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-[#78f3d3] bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <Info size={20} className="text-[#78f3d3]" />
                </div>
                <h4 className="font-semibold text-[#313D52] text-xl">
                  Resumen de tu reserva
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Client Info */}
                <div className="space-y-4">
                  <h5 className="font-medium text-[#313D52] text-lg mb-4 flex items-center">
                    <User size={18} className="mr-2 text-[#78f3d3]" />
                    Información del Cliente
                  </h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User size={16} className="text-[#6c7a89] mr-3 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Nombre</span>
                        <p className="font-medium text-[#313D52]">{formData.fullName || 'No especificado'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Mail size={16} className="text-[#6c7a89] mr-3 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Email</span>
                        <p className="font-medium text-[#313D52]">{formData.email || 'No especificado'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Phone size={16} className="text-[#6c7a89] mr-3 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Teléfono</span>
                        <p className="font-medium text-[#313D52]">{formData.phone || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Info */}
                <div className="space-y-4">
                  <h5 className="font-medium text-[#313D52] text-lg mb-4 flex items-center">
                    <Calendar size={18} className="mr-2 text-[#78f3d3]" />
                    Detalles del Servicio
                  </h5>
                  
                  <div className="space-y-3">
                    {/* Selected service */}
                    <div>
                      <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Servicio</span>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-[#313D52]">
                          {serviceOptions.find(s => s.id === formData.serviceType)?.name || 'No seleccionado'}
                        </p>
                        {formData.serviceType && (
                          <div className="flex items-center text-[#78f3d3]">
                            <DollarSign size={14} />
                            <span className="font-semibold">
                              {serviceOptions.find(s => s.id === formData.serviceType)?.price || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delivery method */}
                    <div>
                      <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Entrega</span>
                      <div className="flex items-center">
                        {formData.deliveryMethod === 'store' ? (
                          <Home size={16} className="text-[#6c7a89] mr-2" />
                        ) : (
                          <Truck size={16} className="text-[#6c7a89] mr-2" />
                        )}
                        <p className="font-medium text-[#313D52]">
                          {formData.deliveryMethod === 'store' 
                            ? 'Recoger en tienda' 
                            : 'Pickup a domicilio'
                          }
                        </p>
                      </div>
                      
                      {formData.deliveryMethod === 'pickup' && zoneInfo && (
                        <div className="mt-2 p-3 bg-[#78f3d3] bg-opacity-10 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#313D52]">Zona: {zoneInfo.zone}</span>
                            <span className="text-sm font-medium text-[#78f3d3]">+${zoneInfo.additionalCost || zoneInfo.cost || 0}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date and time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Fecha</span>
                        <div className="flex items-center">
                          <Calendar size={16} className="text-[#6c7a89] mr-2" />
                          <p className="font-medium text-[#313D52] text-sm">
                            {formData.bookingDate || 'No seleccionada'}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-xs text-[#6c7a89] uppercase tracking-wide">Hora</span>
                        <div className="flex items-center">
                          <Clock size={16} className="text-[#6c7a89] mr-2" />
                          <p className="font-medium text-[#313D52] text-sm">
                            {formData.bookingTime || 'No seleccionada'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="mt-8 pt-6 border-t border-[#e0e6e5]">
                <div className="bg-gradient-to-r from-[#78f3d3] to-[#4de0c0] p-6 rounded-xl text-[#313D52]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="font-medium text-lg">Total a Pagar</h6>
                      {formData.deliveryMethod === 'pickup' && zoneInfo?.additionalCost && (
                        <div className="text-sm opacity-90 mt-1">
                          <div className="flex justify-between">
                            <span>Servicio:</span>
                            <span>${serviceOptions.find(s => s.id === formData.serviceType)?.price || 0} MXN</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pickup:</span>
                            <span>+${zoneInfo.additionalCost} MXN</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <DollarSign size={28} className="mr-2" />
                        <span className="text-3xl font-bold">{calculateTotalPrice()}</span>
                        <span className="text-lg ml-2 opacity-90">MXN</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
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

// BookingButton component to trigger the modal
const BookingButton: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className = "px-6 py-3 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-all cursor-pointer", 
  children 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        className={className}
        onClick={() => setIsModalOpen(true)}
      >
        {children ? children : 'Reserva Ahora'}
      </button>
      
      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default BookingButton;