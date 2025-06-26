// utils/bookingUtils.ts - Versión Corregida
import { FormData, ServiceOption, ZoneInfo } from '../types/booking';

// Validaciones por paso
export const validateStep1 = (formData: FormData): string[] => {
  const errors: string[] = [];
  
  if (!formData.fullName.trim()) {
    errors.push('El nombre completo es requerido');
  }
  
  if (!formData.email.trim()) {
    errors.push('El correo electrónico es requerido');
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.push('El correo electrónico no es válido');
  }
  
  if (!formData.phone.trim()) {
    errors.push('El teléfono es requerido');
  } else if (formData.phone.length !== 10) {
    errors.push('El teléfono debe tener 10 dígitos');
  }
  
  return errors;
};

export const validateStep2 = (formData: FormData): string[] => {
  const errors: string[] = [];
  
  if (!formData.shoesType.trim()) {
    errors.push('La marca y modelo del calzado es requerida');
  }
  
  if (!formData.serviceType) {
    errors.push('Debes seleccionar un tipo de servicio');
  }
  
  return errors;
};

export const validateStep3 = (formData: FormData, zoneInfo: ZoneInfo | null): string[] => {
  const errors: string[] = [];
  
  if (!formData.deliveryMethod) {
    errors.push('Debes seleccionar un método de entrega');
  }
  
  if (formData.deliveryMethod === 'pickup') {
    // Validar dirección
    if (!formData.address.street.trim()) {
      errors.push('La calle es requerida para pickup');
    }
    if (!formData.address.number.trim()) {
      errors.push('El número es requerido para pickup');
    }
    if (!formData.address.neighborhood.trim()) {
      errors.push('La colonia es requerida para pickup');
    }
    if (!formData.address.zipCode.trim()) {
      errors.push('El código postal es requerido para pickup');
    } else if (!/^\d{5}$/.test(formData.address.zipCode)) {
      errors.push('El código postal debe tener 5 dígitos');
    }
    if (!formData.address.phone.trim()) {
      errors.push('El teléfono de contacto es requerido para pickup');
    }
    
    // Validar zona si es necesario
    if (zoneInfo && !zoneInfo.isSupported) {
      errors.push('Lo sentimos, no ofrecemos pickup en tu zona');
    }
  }
  
  return errors;
};

export const validateStep4 = (formData: FormData): string[] => {
  const errors: string[] = [];
  
  if (!formData.bookingDate) {
    errors.push('Debes seleccionar una fecha');
  } else {
    // Validar que la fecha no sea en el pasado
    const selectedDate = new Date(formData.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.push('La fecha no puede ser en el pasado');
    }
  }
  
  if (!formData.bookingTime) {
    errors.push('Debes seleccionar una hora');
  }
  
  return errors;
};

// Función para calcular el precio total
export const calculateTotalPrice = (
  serviceId: string,
  serviceOptions: ServiceOption[],
  deliveryMethod: string,
  zoneInfo: ZoneInfo | null
): number => {
  // Encontrar el precio del servicio seleccionado
  const selectedService = serviceOptions.find(service => service.id === serviceId);
  const servicePrice = selectedService ? selectedService.price : 0;
  
  // Agregar costo de pickup si aplica
  let pickupCost = 0;
  if (deliveryMethod === 'pickup' && zoneInfo?.isSupported) {
    pickupCost = zoneInfo.additionalCost || zoneInfo.cost || 0;
  }
  
  return servicePrice + pickupCost;
};

// Función para generar opciones de tiempo
export const generateTimeOptions = (): string[] => {
  const times: string[] = [];
  const startHour = 9; // 9:00 AM
  const endHour = 18; // 6:00 PM
  
  for (let hour = startHour; hour <= endHour; hour++) {
    // Agregar hora en punto
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    times.push(timeString);
    
    // Agregar media hora (excepto para la última hora)
    if (hour < endHour) {
      const halfHourString = `${hour.toString().padStart(2, '0')}:30`;
      times.push(halfHourString);
    }
  }
  
  return times;
};

// Función para obtener la fecha mínima (mañana)
export const getMinDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Función para formatear fecha
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

// Función para formatear hora
export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

// Función para validar zona de pickup
export const validatePickupZone = async (zipCode: string): Promise<ZoneInfo | null> => {
  try {
    if (!/^\d{5}$/.test(zipCode)) {
      return null;
    }

    const response = await fetch('/api/booking', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validate-zone',
        zipCode: zipCode
      }),
    });
    
    if (!response.ok) {
      console.warn('Error validating zone:', response.statusText);
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.zoneInfo) {
      return result.zoneInfo;
    }
    
    return null;
    
  } catch (error) {
    console.error('Error validating pickup zone:', error);
    return null;
  }
};

// Función para enviar la reserva
export const submitBooking = async (
  formData: FormData,
  zoneInfo: ZoneInfo | null
): Promise<string> => {
  try {
    console.log('🚀 Enviando reserva:', {
      fullName: formData.fullName,
      email: formData.email,
      deliveryMethod: formData.deliveryMethod,
      hasZoneInfo: !!zoneInfo
    });

    // Preparar los datos para enviar
    const bookingData = {
      // Información personal
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      
      // Información del servicio
      shoesType: formData.shoesType.trim(),
      serviceType: formData.serviceType,
      
      // Información de entrega
      deliveryMethod: formData.deliveryMethod,
      requiresPickup: formData.deliveryMethod === 'pickup',
      
      // Dirección (solo si es pickup)
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
      
      // Fecha y hora - combinar correctamente
      bookingDate: formData.bookingDate,
      bookingTime: formData.bookingTime,
      
      // Información de zona (para pickup)
      pickupCost: formData.deliveryMethod === 'pickup' && zoneInfo ? (zoneInfo.additionalCost || zoneInfo.cost || 0) : 0,
      pickupZone: formData.deliveryMethod === 'pickup' && zoneInfo ? zoneInfo.zone : null,
      
      // Metadata
      timestamp: new Date().toISOString(),
      source: 'booking_modal'
    };

    console.log('📤 Datos a enviar:', {
      ...bookingData,
      address: bookingData.address ? 'Dirección incluida' : 'Sin dirección'
    });

    // Hacer la petición al API
    const response = await fetch('/api/booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error response:', errorData);
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error al procesar la reserva');
    }

    console.log('✅ Reserva creada exitosamente:', result);

    // Retornar el código de referencia
    return result.bookingReference || result.id || 'BOOKING_CONFIRMED';
    
  } catch (error) {
    console.error('❌ Error submitting booking:', error);
    
    // Manejar diferentes tipos de errores
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Error de conexión. Por favor, verifica tu conexión a internet.');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Error inesperado al procesar la reserva');
  }
};

// Función para validar código postal
export const validateZipCode = async (zipCode: string): Promise<ZoneInfo | null> => {
  try {
    if (!/^\d{5}$/.test(zipCode)) {
      return null;
    }

    const response = await fetch('/api/booking', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validate-zone',
        zipCode: zipCode
      }),
    });
    
    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.zoneInfo) {
      return result.zoneInfo;
    }
    
    return null;
    
  } catch (error) {
    console.error('Error validating zip code:', error);
    return null;
  }
};

// Función para validar zona de pickup con información completa de dirección
export const validatePickupZone_Complete = async (address: {
  street: string;
  number: string;
  neighborhood: string;
  zipCode: string;
  municipality: string;
  city: string;
  state: string;
}): Promise<ZoneInfo | null> => {
  try {
    // Validar que el código postal tenga el formato correcto
    if (!/^\d{5}$/.test(address.zipCode)) {
      return {
        zone: 'Desconocida',
        isSupported: false,
        additionalCost: 0,
        estimatedTime: 'No disponible'
      };
    }

    // Primero intentar validar solo con código postal (más simple)
    return await validateZipCode(address.zipCode);
    
  } catch (error) {
    console.error('Error validating pickup zone:', error);
    return null;
  }
};

// Función para obtener información detallada de zona
export const getZoneDetails = async (zipCode: string): Promise<{
  zone: string;
  isSupported: boolean;
  additionalCost: number;
  estimatedTime: string;
  coordinates?: { lat: number; lng: number };
  restrictions?: string[];
  availableTimeSlots?: string[];
} | null> => {
  try {
    const response = await fetch('/api/booking', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validate-zone',
        zipCode: zipCode
      }),
    });
    
    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.zoneInfo) {
      return {
        zone: result.zoneInfo.zone,
        isSupported: result.zoneInfo.isSupported,
        additionalCost: result.zoneInfo.additionalCost || 0,
        estimatedTime: result.zoneInfo.estimatedTime || '2-3 horas',
        coordinates: {lat:0, lng:0},
        restrictions: [],
        availableTimeSlots: []
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting zone details:', error);
    return null;
  }
};

// Función para obtener información de municipios con sus códigos postales
export const getMunicipalities = (): Array<{
  name: string;
  zipCodes: string[];
  isSupported: boolean;
  basePickupCost: number;
}> => {
  return [
    {
      name: 'Querétaro Centro',
      zipCodes: ['76000', '76010', '76020', '76030', '76040', '76050', '76060', '76070', '76080', '76090'],
      isSupported: true,
      basePickupCost: 49
    },
    {
      name: 'Querétaro Norte',
      zipCodes: ['76100', '76110', '76120', '76130', '76140', '76150', '76160', '76170', '76180', '76190'],
      isSupported: true,
      basePickupCost: 69
    },
    {
      name: 'Querétaro Sur',
      zipCodes: ['76200', '76210', '76220', '76230', '76240', '76250', '76260', '76270', '76280', '76290'],
      isSupported: true,
      basePickupCost: 79
    },
    {
      name: 'Querétaro Este',
      zipCodes: ['76300', '76310', '76320', '76330', '76340', '76350', '76360', '76370', '76380', '76390'],
      isSupported: true,
      basePickupCost: 59
    },
    {
      name: 'Querétaro Oeste',
      zipCodes: ['76400', '76410', '76420', '76430', '76440', '76450', '76460', '76470', '76480', '76490'],
      isSupported: true,
      basePickupCost: 64
    }
  ];
};

// Función para obtener municipio por código postal
export const getMunicipalityByZipCode = (zipCode: string): {
  name: string;
  isSupported: boolean;
  basePickupCost: number;
} | null => {
  const municipalities = getMunicipalities();
  
  for (const municipality of municipalities) {
    if (municipality.zipCodes.some(zip => zip.startsWith(zipCode.substring(0, 3)))) {
      return {
        name: municipality.name,
        isSupported: municipality.isSupported,
        basePickupCost: municipality.basePickupCost
      };
    }
  }
  
  return null;
};

// Función para verificar si un código postal está soportado
export const isZipCodeSupported = (zipCode: string): boolean => {
  const municipality = getMunicipalityByZipCode(zipCode);
  return municipality ? municipality.isSupported : false;
};

// Función para calcular el costo de pickup basado en el código postal
export const calculatePickupCost = (zipCode: string): number => {
  const municipality = getMunicipalityByZipCode(zipCode);
  return municipality ? municipality.basePickupCost : 0;
};

// Función para obtener códigos postales soportados
export const getSupportedZipCodes = (): string[] => {
  const municipalities = getMunicipalities();
  const supportedZips: string[] = [];
  
  municipalities.forEach(municipality => {
    if (municipality.isSupported) {
      supportedZips.push(...municipality.zipCodes);
    }
  });
  
  return supportedZips;
};

// Función para validar horarios de pickup
export const validatePickupTime = (time: string, zipCode: string): {
  isValid: boolean;
  message?: string;
  suggestedTimes?: string[];
} => {
  const municipality = getMunicipalityByZipCode(zipCode);
  
  if (!municipality || !municipality.isSupported) {
    return {
      isValid: false,
      message: 'No ofrecemos pickup en esta zona'
    };
  }
  
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  // Horarios base: 9:00 AM - 6:00 PM
  const startTime = 9 * 60; // 9:00 AM
  const endTime = 18 * 60;  // 6:00 PM
  
  if (timeInMinutes < startTime || timeInMinutes > endTime) {
    return {
      isValid: false,
      message: 'El pickup está disponible de 9:00 AM a 6:00 PM',
      suggestedTimes: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
    };
  }
  
  return { isValid: true };
};

// Función para obtener horarios disponibles por zona
export const getAvailableTimeSlots = (zipCode: string): string[] => {
  const municipality = getMunicipalityByZipCode(zipCode);
  
  if (!municipality || !municipality.isSupported) {
    return [];
  }
  
  // Horario normal: 9:00 AM - 6:00 PM
  return [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];
};

// Función para validar el formulario completo
export const validateCompleteForm = (
  formData: FormData,
  zoneInfo: ZoneInfo | null
): { isValid: boolean; errors: string[] } => {
  const allErrors: string[] = [];
  
  // Validar todos los pasos
  allErrors.push(...validateStep1(formData));
  allErrors.push(...validateStep2(formData));
  allErrors.push(...validateStep3(formData, zoneInfo));
  allErrors.push(...validateStep4(formData));
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

// Función para sanitizar datos de entrada
export const sanitizeFormData = (formData: FormData): FormData => {
  return {
    ...formData,
    fullName: formData.fullName.trim(),
    email: formData.email.trim().toLowerCase(),
    phone: formData.phone.replace(/\D/g, '').slice(0, 10),
    shoesType: formData.shoesType.trim(),
    address: {
      ...formData.address,
      street: formData.address.street.trim(),
      number: formData.address.number.trim(),
      interior: formData.address.interior.trim(),
      neighborhood: formData.address.neighborhood.trim(),
      municipality: formData.address.municipality.trim(),
      city: formData.address.city.trim(),
      state: formData.address.state.trim(),
      zipCode: formData.address.zipCode.replace(/\D/g, '').slice(0, 5),
      instructions: formData.address.instructions.trim(),
      phone: formData.address.phone.replace(/\D/g, '').slice(0, 10)
    }
  };
};

// Función para crear un resumen de la reserva
export const createBookingSummary = (
  formData: FormData,
  serviceOptions: ServiceOption[],
  zoneInfo: ZoneInfo | null
) => {
  const selectedService = serviceOptions.find(s => s.id === formData.serviceType);
  const totalPrice = calculateTotalPrice(formData.serviceType, serviceOptions, formData.deliveryMethod, zoneInfo);
  
  return {
    cliente: {
      nombre: formData.fullName,
      email: formData.email,
      telefono: formData.phone
    },
    servicio: {
      nombre: selectedService?.name || 'No seleccionado',
      precio: selectedService?.price || 0,
      duracion: selectedService?.duration || 0,
      requiereId: selectedService?.requiresIdentification || false
    },
    calzado: formData.shoesType,
    entrega: {
      metodo: formData.deliveryMethod,
      direccion: formData.deliveryMethod === 'pickup' ? {
        calle: `${formData.address.street} ${formData.address.number}`,
        colonia: formData.address.neighborhood,
        codigoPostal: formData.address.zipCode,
        telefono: formData.address.phone
      } : null,
      zona: zoneInfo?.zone || null,
      costoAdicional: zoneInfo?.additionalCost || zoneInfo?.cost || 0
    },
    cita: {
      fecha: formData.bookingDate,
      hora: formData.bookingTime,
      fechaFormateada: formatDate(formData.bookingDate),
      horaFormateada: formatTime(formData.bookingTime)
    },
    precio: {
      servicio: selectedService?.price || 0,
      pickup: formData.deliveryMethod === 'pickup' ? (zoneInfo?.additionalCost || zoneInfo?.cost || 0) : 0,
      total: totalPrice
    }
  };
};

// Función para formatear número de teléfono para display
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone || phone.length !== 10) return phone;
  
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
};

// Función para limpiar y validar número de teléfono
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '').slice(0, 10);
};

// Función para validar email con regex más estricta
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

// Función para obtener días de la semana disponibles (excluir domingos)
export const getAvailableDays = (): string[] => {
  return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
};

// Función para verificar si una fecha es día hábil
export const isBusinessDay = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 6; // Lunes (1) a Sábado (6)
};

// Función para obtener la próxima fecha hábil
export const getNextBusinessDay = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  
  while (!isBusinessDay(date)) {
    date.setDate(date.getDate() + 1);
  }
  
  return date;
};

// Función para debugging - mostrar estado del formulario
export const debugFormData = (formData: FormData): void => {
  console.group('🔍 Form Data Debug');
  console.log('Personal Info:', {
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone
  });
  console.log('Service Info:', {
    shoesType: formData.shoesType,
    serviceType: formData.serviceType
  });
  console.log('Delivery Info:', {
    deliveryMethod: formData.deliveryMethod,
    requiresPickup: formData.requiresPickup
  });
  console.log('Address Info:', formData.address);
  console.log('Date/Time Info:', {
    bookingDate: formData.bookingDate,
    bookingTime: formData.bookingTime
  });
  console.groupEnd();
};

// Función para logging de errores
export const logBookingError = (error: any, context: string): void => {
  console.group('❌ Booking Error');
  console.error('Context:', context);
  console.error('Error:', error);
  console.error('Stack:', error?.stack);
  console.error('Timestamp:', new Date().toISOString());
  console.groupEnd();
};

// Función para generar ID único de sesión
export const generateSessionId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};