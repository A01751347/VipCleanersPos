// lib/config-helpers.ts
// Funciones auxiliares para obtener configuraciones en el sistema POS

import { getConfigValue, getConfigValues } from './database';

// Cache en memoria para configuraciones frecuentemente usadas
let configCache: { [key: string]: { value: any; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para obtener una configuración con cache
async function getCachedConfig(key: string): Promise<string | null> {
  const now = Date.now();
  const cached = configCache[key];
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.value;
  }
  
  const value = await getConfigValue(key);
  configCache[key] = { value, timestamp: now };
  
  return value;
}

// Limpiar cache cuando se actualicen configuraciones
export function clearConfigCache() {
  configCache = {};
}

// Obtener precio mínimo que requiere identificación
export async function getPrecioMinimoRequiereId(): Promise<number> {
  try {
    const valor = await getCachedConfig('precio_minimo_requiere_id');
    return valor ? parseFloat(valor) : 1000;
  } catch (error) {
    console.error('Error obteniendo precio mínimo ID:', error);
    return 1000; // Valor por defecto
  }
}

// Obtener porcentaje de IVA
export async function getIvaPercentage(): Promise<number> {
  try {
    const valor = await getCachedConfig('iva_porcentaje');
    return valor ? parseFloat(valor) : 16;
  } catch (error) {
    console.error('Error obteniendo porcentaje IVA:', error);
    return 16; // Valor por defecto
  }
}

// Obtener precio de delivery
export async function getPrecioDelivery(): Promise<number> {
  try {
    const valor = await getCachedConfig('precio_delivery');
    return valor ? parseFloat(valor) : 50;
  } catch (error) {
    console.error('Error obteniendo precio delivery:', error);
    return 50; // Valor por defecto
  }
}

// Obtener descuento máximo permitido
export async function getDescuentoMaximo(): Promise<number> {
  try {
    const valor = await getCachedConfig('descuento_maximo');
    return valor ? parseFloat(valor) : 50;
  } catch (error) {
    console.error('Error obteniendo descuento máximo:', error);
    return 50; // Valor por defecto
  }
}

// Obtener propinas sugeridas
export async function getPropinasSugeridas(): Promise<number[]> {
  try {
    const valor = await getCachedConfig('propina_sugerida');
    if (valor) {
      try {
        return JSON.parse(valor);
      } catch {
        return [10, 15, 20]; // Valor por defecto si no se puede parsear JSON
      }
    }
    return [10, 15, 20];
  } catch (error) {
    console.error('Error obteniendo propinas sugeridas:', error);
    return [10, 15, 20]; // Valor por defecto
  }
}

// Verificar si un monto requiere identificación
export async function requiereIdentificacion(monto: number): Promise<boolean> {
  const precioMinimo = await getPrecioMinimoRequiereId();
  return monto >= precioMinimo;
}

// Calcular IVA de un monto
export async function calcularIVA(subtotal: number): Promise<number> {
  const porcentaje = await getIvaPercentage();
  return Math.round((subtotal * (porcentaje / 100)) * 100) / 100;
}

// Obtener información completa del negocio
export async function getBusinessInfo() {
  try {
    const config = await getConfigValues([
      'nombre_empresa',
      'telefono_contacto', 
      'email_contacto',
      'direccion_empresa',
      'website_empresa',
      'horario_atencion'
    ]);
    
    return {
      nombre: config.nombre_empresa || 'VipCleaners',
      telefono: config.telefono_contacto || '',
      email: config.email_contacto || '',
      direccion: config.direccion_empresa || '',
      website: config.website_empresa || '',
      horario: config.horario_atencion || 'Lunes a Sábado de 10:00 a 18:00'
    };
  } catch (error) {
    console.error('Error obteniendo información del negocio:', error);
    return {
      nombre: 'VipCleaners',
      telefono: '',
      email: '',
      direccion: '',
      website: '',
      horario: 'Lunes a Sábado de 10:00 a 18:00'
    };
  }
}

// Obtener configuraciones POS críticas
export async function getPOSConfig() {
  try {
    const config = await getConfigValues([
      'precio_minimo_requiere_id',
      'iva_porcentaje',
      'precio_delivery',
      'descuento_maximo',
      'propina_sugerida',
      'imprimir_tickets_automatico',
      'solicitar_email_cliente'
    ]);
    
    let propinasSugeridas = [10, 15, 20];
    if (config.propina_sugerida) {
      try {
        propinasSugeridas = JSON.parse(config.propina_sugerida);
      } catch {
        // Mantener valor por defecto si no se puede parsear
      }
    }
    
    return {
      precioMinimoId: parseFloat(config.precio_minimo_requiere_id || '1000'),
      ivaPercentage: parseFloat(config.iva_porcentaje || '16'),
      precioDelivery: parseFloat(config.precio_delivery || '50'),
      descuentoMaximo: parseFloat(config.descuento_maximo || '50'),
      propinasSugeridas,
      imprimirTicketsAutomatico: config.imprimir_tickets_automatico === 'true',
      solicitarEmailCliente: config.solicitar_email_cliente === 'true'
    };
  } catch (error) {
    console.error('Error obteniendo configuraciones POS:', error);
    return {
      precioMinimoId: 1000,
      ivaPercentage: 16,
      precioDelivery: 50,
      descuentoMaximo: 50,
      propinasSugeridas: [10, 15, 20],
      imprimirTicketsAutomatico: true,
      solicitarEmailCliente: false
    };
  }
}

// Función para usar en API routes que necesiten verificar configuraciones
export async function validateOrderAmount(subtotal: number, total: number) {
  const config = await getPOSConfig();
  
  return {
    requiereId: total >= config.precioMinimoId,
    ivaCalculado: await calcularIVA(subtotal),
    configuracion: config
  };
}