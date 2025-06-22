// utils/bookingUtils.ts
import { FormData, ZoneInfo } from '../types/booking';

// Generar opciones de tiempo
export const generateTimeOptions = (): string[] => {
  const times = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      times.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return times;
};

// Obtener fecha mínima (mañana)
export const getMinDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Calcular precio total
export const calculateTotalPrice = (
  serviceType: string, 
  serviceOptions: any[], 
  deliveryMethod: string, 
  zoneInfo: ZoneInfo | null
): number => {
  let basePrice = 0;
  const selectedService = serviceOptions.find(service => service.id === serviceType);
  
  if (selectedService) {
    basePrice = selectedService.price;
  }
  
  const pickupFee = (deliveryMethod === 'pickup' && zoneInfo?.available) ? zoneInfo.cost : 0;
  
  return basePrice + pickupFee;
};

// Validación de zona mediante API
export const validatePickupZone = async (zipCode: string): Promise<ZoneInfo> => {
  if (!zipCode || zipCode.length !== 5) {
    throw new Error('Código postal debe tener 5 dígitos');
  }

  try {
    const response = await fetch('/api/booking', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validate-zone',
        zipCode: zipCode
      })
    });

    const data = await response.json();

    if (data.success && data.zoneInfo) {
      const { zoneInfo: zone } = data;
      return {
        zone: zone.zone,
        cost: zone.cost,
        estimatedTime: zone.time,
        available: zone.available,
        message: zone.available 
          ? `Zona ${zone.zone} disponible` 
          : 'Esta zona no tiene cobertura de pickup. Puedes traer tus tenis directamente a la tienda.'
      };
    } else {
      return {
        zone: 'Fuera de cobertura',
        cost: 0,
        estimatedTime: '',
        available: false,
        message: 'Esta zona no tiene cobertura de pickup. Puedes traer tus tenis directamente a la tienda.'
      };
    }
  } catch (error) {
    console.error('Error validando zona:', error);
    return {
      zone: 'Error',
      cost: 0,
      estimatedTime: '',
      available: false,
      message: 'Error validando la zona. Intenta nuevamente.'
    };
  }
};

// Enviar reserva al API
export const submitBooking = async (formData: FormData, zoneInfo: ZoneInfo | null): Promise<string> => {
  const bookingDateTime = `${formData.bookingDate}T${formData.bookingTime}:00`;
  
  const payload = {
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    shoesType: formData.shoesType,
    serviceType: formData.serviceType,
    deliveryMethod: formData.deliveryMethod,
    bookingDate: bookingDateTime,
    address: formData.requiresPickup ? {
      street: formData.address.street || '',
      number: formData.address.number || '',
      interior: formData.address.interior || null,
      neighborhood: formData.address.neighborhood || '',
      municipality: formData.address.municipality || "Doremifasol",
      city: formData.address.city || 'Santiago de Querétaro',
      state: formData.address.state || 'Querétaro',
      zipCode: formData.address.zipCode || '',
      instructions: formData.address.instructions || null,
      timeWindowStart: formData.address.timeWindowStart || null,
      timeWindowEnd: formData.address.timeWindowEnd || null,
      phone: formData.address.phone || null
    } : null,
    requiresPickup: formData.requiresPickup || false,
    pickupCost: (formData.requiresPickup && zoneInfo) ? zoneInfo.cost : 0,
    pickupZone: (formData.requiresPickup && zoneInfo) ? zoneInfo.zone : null
  };

  console.log('Enviando reserva:', payload);

  const response = await fetch('/api/booking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (response.ok && data.success) {
    return data.bookingReference;
  } else {
    throw new Error(data.error || 'Error al procesar la reserva');
  }
};

// Validaciones por paso
export const validateStep1 = (formData: FormData): string[] => {
  const errors = [];
  
  if (!formData.fullName.trim()) errors.push('Nombre completo es requerido');
  if (!formData.email.trim()) errors.push('Email es requerido');
  if (!formData.phone.trim()) errors.push('Teléfono es requerido');
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.email && !emailRegex.test(formData.email)) {
    errors.push('Email no válido');
  }
  
  if (formData.phone && formData.phone.length !== 10) {
    errors.push('Teléfono debe tener 10 dígitos');
  }

  return errors;
};

export const validateStep2 = (formData: FormData): string[] => {
  const errors = [];
  
  if (!formData.shoesType.trim()) errors.push('Información del calzado es requerida');
  if (!formData.serviceType) errors.push('Selecciona un tipo de servicio');

  return errors;
};

export const validateStep3 = (formData: FormData, zoneInfo: ZoneInfo | null): string[] => {
  const errors = [];
  
  if (formData.deliveryMethod === 'pickup') {
    if (!formData.address.street.trim()) errors.push('Calle es requerida');
    if (!formData.address.number.trim()) errors.push('Número exterior es requerido');
    if (!formData.address.neighborhood.trim()) errors.push('Colonia es requerida');
    if (!formData.address.zipCode.trim()) errors.push('Código postal es requerido');
    if (formData.address.zipCode.length !== 5) errors.push('Código postal debe tener 5 dígitos');
    
    if (!zoneInfo?.available) {
      errors.push('La dirección no está en zona de cobertura');
    }
  }

  return errors;
};

export const validateStep4 = (formData: FormData): string[] => {
  const errors = [];
  
  if (!formData.bookingDate) errors.push('Fecha es requerida');
  if (!formData.bookingTime) errors.push('Hora es requerida');

  return errors;
};