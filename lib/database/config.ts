import { executeQuery } from './connection';

// Obtener una configuración por clave
export async function getConfigValue(clave: string): Promise<string | null> {
  try {
    const result = await executeQuery<any[]>({
      query: 'SELECT valor FROM configuracion WHERE clave = ?',
      values: [clave]
    });
    
    return result.length > 0 ? result[0].valor : null;
  } catch (error) {
    console.error(`Error obteniendo configuración ${clave}:`, error);
    return null;
  }
}

// Obtener múltiples configuraciones por claves
export async function getConfigValues(claves: string[]): Promise<{[key: string]: string}> {
  try {
    const placeholders = claves.map(() => '?').join(',');
    const result = await executeQuery<any[]>({
      query: `SELECT clave, valor FROM configuracion WHERE clave IN (${placeholders})`,
      values: claves
    });
    
    const config: {[key: string]: string} = {};
    result.forEach(row => {
      config[row.clave] = row.valor;
    });
    
    return config;
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    return {};
  }
}

// Actualizar o crear una configuración
export async function setConfigValue(clave: string, valor: string, descripcion?: string): Promise<void> {
  try {
    // Verificar si la configuración ya existe
    const existing = await executeQuery<any[]>({
      query: 'SELECT config_id FROM configuracion WHERE clave = ?',
      values: [clave]
    });
    
    if (existing.length > 0) {
      // Actualizar configuración existente
      await executeQuery({
        query: 'UPDATE configuracion SET valor = ?, fecha_actualizacion = NOW() WHERE clave = ?',
        values: [valor, clave]
      });
    } else {
      // Crear nueva configuración
      const desc = descripcion || `Configuración para ${clave}`;
      await executeQuery({
        query: 'INSERT INTO configuracion (clave, valor, descripcion, fecha_creacion, fecha_actualizacion) VALUES (?, ?, ?, NOW(), NOW())',
        values: [clave, valor, desc]
      });
    }
  } catch (error) {
    console.error(`Error actualizando configuración ${clave}:`, error);
    throw error;
  }
}

// Obtener todas las configuraciones organizadas
export async function getAllSettings() {
  try {
    const settings = await executeQuery<any[]>({
      query: 'SELECT clave, valor, descripcion FROM configuracion ORDER BY clave',
      values: []
    });
    
    const organizedSettings = {
      business: {} as any,
      system: {} as any,
      pricing: {} as any
    };
    
    // Mapear configuraciones a las categorías apropiadas
    settings.forEach((setting) => {
      const { clave, valor } = setting;
      
      switch (clave) {
        // Configuración del negocio
        case 'nombre_empresa':
          organizedSettings.business.nombre_negocio = valor;
          break;
        case 'telefono_contacto':
          organizedSettings.business.telefono = valor;
          break;
        case 'email_contacto':
          organizedSettings.business.email = valor;
          break;
        case 'direccion_empresa':
          organizedSettings.business.direccion = valor;
          break;
        case 'website_empresa':
          organizedSettings.business.website = valor;
          break;
        case 'horario_atencion':
          // Extraer horarios de apertura y cierre del texto
          const horarioMatch = valor.match(/(\d{1,2}):(\d{2})\s*a\s*(\d{1,2}):(\d{2})/);
          if (horarioMatch) {
            organizedSettings.business.horario_apertura = `${horarioMatch[1].padStart(2, '0')}:${horarioMatch[2]}`;
            organizedSettings.business.horario_cierre = `${horarioMatch[3].padStart(2, '0')}:${horarioMatch[4]}`;
          } else {
            organizedSettings.business.horario_apertura = '10:00';
            organizedSettings.business.horario_cierre = '18:00';
          }
          // Extraer días de operación del texto
          if (valor.includes('Domingo a Sábado')) {
            organizedSettings.business.dias_operacion = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
          } else if (valor.includes('Lunes a Sábado')) {
            organizedSettings.business.dias_operacion = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
          } else {
            organizedSettings.business.dias_operacion = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
          }
          break;
        
        // Configuración de precios
        case 'iva_porcentaje':
          organizedSettings.pricing.iva_porcentaje = parseFloat(valor);
          break;
        case 'precio_minimo_requiere_id':
          organizedSettings.pricing.precio_minimo_id = parseFloat(valor);
          break;
        case 'descuento_maximo':
          organizedSettings.pricing.descuento_maximo = parseFloat(valor);
          break;
        case 'precio_delivery':
          organizedSettings.pricing.precio_delivery = parseFloat(valor);
          break;
        case 'tiempo_gracia_minutos':
          organizedSettings.pricing.tiempo_gracia_minutos = parseInt(valor);
          break;
        case 'propina_sugerida':
          try {
            organizedSettings.pricing.propina_sugerida = JSON.parse(valor);
          } catch {
            organizedSettings.pricing.propina_sugerida = [10, 15, 20];
          }
          break;
        
        // Configuraciones del sistema
        case 'notificaciones_email':
          organizedSettings.system.notificaciones_email = valor === 'true';
          break;
        case 'notificaciones_sms':
          organizedSettings.system.notificaciones_sms = valor === 'true';
          break;
        case 'backup_automatico':
          organizedSettings.system.backup_automatico = valor === 'true';
          break;
        case 'retencion_datos_dias':
          organizedSettings.system.retencion_datos_dias = parseInt(valor);
          break;
        case 'impresora_tickets':
          organizedSettings.system.impresora_tickets = valor;
          break;
        case 'formato_fecha':
          organizedSettings.system.formato_fecha = valor;
          break;
        case 'idioma':
          organizedSettings.system.idioma = valor;
          break;
        case 'tema_oscuro':
          organizedSettings.system.tema_oscuro = valor === 'true';
          break;
        
        default:
          break;
      }
    });
    
    // Establecer valores por defecto para configuraciones faltantes
    const defaultSettings = {
      business: {
        nombre_negocio: organizedSettings.business.nombre_negocio || 'VipCleaners',
        direccion: organizedSettings.business.direccion || '',
        telefono: organizedSettings.business.telefono || '',
        email: organizedSettings.business.email || '',
        website: organizedSettings.business.website || '',
        horario_apertura: organizedSettings.business.horario_apertura || '10:00',
        horario_cierre: organizedSettings.business.horario_cierre || '18:00',
        dias_operacion: organizedSettings.business.dias_operacion || ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
        moneda: 'MXN',
        timezone: 'America/Mexico_City',
        logo_url: ''
      },
      system: {
        notificaciones_email: organizedSettings.system.notificaciones_email ?? true,
        notificaciones_sms: organizedSettings.system.notificaciones_sms ?? false,
        backup_automatico: organizedSettings.system.backup_automatico ?? true,
        retencion_datos_dias: organizedSettings.system.retencion_datos_dias || 365,
        impresora_tickets: organizedSettings.system.impresora_tickets || '',
        formato_fecha: organizedSettings.system.formato_fecha || 'DD/MM/YYYY',
        idioma: organizedSettings.system.idioma || 'es',
        tema_oscuro: organizedSettings.system.tema_oscuro ?? false
      },
      pricing: {
        iva_porcentaje: organizedSettings.pricing.iva_porcentaje || 16,
        descuento_maximo: organizedSettings.pricing.descuento_maximo || 50,
        propina_sugerida: organizedSettings.pricing.propina_sugerida || [10, 15, 20],
        precio_delivery: organizedSettings.pricing.precio_delivery || 50,
        tiempo_gracia_minutos: organizedSettings.pricing.tiempo_gracia_minutos || 15,
        precio_minimo_id: organizedSettings.pricing.precio_minimo_id || 1000
      }
    };
    
    return defaultSettings;
  } catch (error) {
    console.error('Error obteniendo todas las configuraciones:', error);
    throw error;
  }
}

// Actualizar múltiples configuraciones
export async function updateSettings(settings: {
  business?: any;
  system?: any;
  pricing?: any;
}): Promise<void> {
  try {
    // Actualizar configuraciones del negocio
    if (settings.business) {
      const { business } = settings;
      
      if (business.nombre_negocio) {
        await setConfigValue('nombre_empresa', business.nombre_negocio, 'Nombre de la empresa');
      }
      if (business.telefono) {
        await setConfigValue('telefono_contacto', business.telefono, 'Teléfono de contacto principal');
      }
      if (business.email) {
        await setConfigValue('email_contacto', business.email, 'Email de contacto principal');
      }
      if (business.direccion) {
        await setConfigValue('direccion_empresa', business.direccion, 'Dirección física de la empresa');
      }
      if (business.website) {
        await setConfigValue('website_empresa', business.website, 'Sitio web de la empresa');
      }
      
      // Crear string de horario de atención
      if (business.horario_apertura && business.horario_cierre && business.dias_operacion) {
        const diasArray = business.dias_operacion;
        let diasTexto = 'Lunes a Viernes';
        
        if (diasArray.includes('sabado') && diasArray.includes('domingo')) {
          diasTexto = 'Domingo a Sábado';
        } else if (diasArray.includes('sabado')) {
          diasTexto = 'Lunes a Sábado';
        }
        
        const horarioTexto = `${diasTexto} de ${business.horario_apertura} a ${business.horario_cierre}`;
        await setConfigValue('horario_atencion', horarioTexto, 'Horario de atención al público');
      }
    }
    
    // Actualizar configuraciones de precios
    if (settings.pricing) {
      const { pricing } = settings;
      
      if (pricing.iva_porcentaje !== undefined) {
        await setConfigValue('iva_porcentaje', pricing.iva_porcentaje.toString(), 'Porcentaje de IVA aplicable');
      }
      if (pricing.precio_minimo_id !== undefined) {
        await setConfigValue('precio_minimo_requiere_id', pricing.precio_minimo_id.toString(), 'Precio mínimo a partir del cual se requiere identificación');
      }
      if (pricing.descuento_maximo !== undefined) {
        await setConfigValue('descuento_maximo', pricing.descuento_maximo.toString(), 'Descuento máximo permitido');
      }
      if (pricing.precio_delivery !== undefined) {
        await setConfigValue('precio_delivery', pricing.precio_delivery.toString(), 'Precio del servicio de delivery');
      }
      if (pricing.tiempo_gracia_minutos !== undefined) {
        await setConfigValue('tiempo_gracia_minutos', pricing.tiempo_gracia_minutos.toString(), 'Tiempo de gracia en minutos');
      }
      if (pricing.propina_sugerida) {
        await setConfigValue('propina_sugerida', JSON.stringify(pricing.propina_sugerida), 'Porcentajes sugeridos para propinas');
      }
    }
    
    // Actualizar configuraciones del sistema
    if (settings.system) {
      const { system } = settings;
      
      if (system.notificaciones_email !== undefined) {
        await setConfigValue('notificaciones_email', system.notificaciones_email.toString(), 'Habilitar notificaciones por email');
      }
      if (system.notificaciones_sms !== undefined) {
        await setConfigValue('notificaciones_sms', system.notificaciones_sms.toString(), 'Habilitar notificaciones por SMS');
      }
      if (system.backup_automatico !== undefined) {
        await setConfigValue('backup_automatico', system.backup_automatico.toString(), 'Habilitar respaldo automático');
      }
      if (system.retencion_datos_dias !== undefined) {
        await setConfigValue('retencion_datos_dias', system.retencion_datos_dias.toString(), 'Días de retención de datos');
      }
      if (system.impresora_tickets !== undefined) {
        await setConfigValue('impresora_tickets', system.impresora_tickets, 'Impresora para tickets');
      }
      if (system.formato_fecha !== undefined) {
        await setConfigValue('formato_fecha', system.formato_fecha, 'Formato de fecha del sistema');
      }
      if (system.idioma !== undefined) {
        await setConfigValue('idioma', system.idioma, 'Idioma del sistema');
      }
      if (system.tema_oscuro !== undefined) {
        await setConfigValue('tema_oscuro', system.tema_oscuro.toString(), 'Habilitar tema oscuro');
      }
    }
  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    throw error;
  }
}

// Función helper para obtener configuraciones específicas que se usan frecuentemente
export async function getBusinessConfig() {
  const keys = ['nombre_empresa', 'telefono_contacto', 'email_contacto', 'direccion_empresa', 'horario_atencion'];
  return await getConfigValues(keys);
}

export async function getPricingConfig() {
  const keys = ['iva_porcentaje', 'precio_minimo_requiere_id', 'descuento_maximo', 'precio_delivery'];
  return await getConfigValues(keys);
}

export async function getSystemConfig() {
  const keys = ['notificaciones_email', 'backup_automatico', 'formato_fecha', 'idioma'];
  return await getConfigValues(keys);
}