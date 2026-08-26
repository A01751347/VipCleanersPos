import 'server-only';
import { getConfigMultiple } from './db/config';

export interface BusinessConfig {
  nombre_empresa: string;
  telefono_contacto: string;
  email_contacto: string;
  direccion_empresa: string;
  website_empresa: string;
  horario_atencion: string;
}

/**
 * Datos del negocio para las plantillas de correo.
 * Lee de `configuracion_sistema` y cae a las variables de entorno.
 */
export async function getBusinessConfig(): Promise<BusinessConfig> {
  let config: Record<string, string> = {};
  try {
    config = await getConfigMultiple([
      'nombre_empresa', 'telefono_contacto', 'email_contacto',
      'direccion_empresa', 'website_empresa', 'horario_apertura', 'horario_cierre',
    ]);
  } catch (err) {
    console.error('[business-config] no se pudo leer la configuración', err);
  }

  const apertura = config.horario_apertura ?? '10:00';
  const cierre = config.horario_cierre ?? '19:00';

  return {
    nombre_empresa: config.nombre_empresa || process.env.COMPANY_NAME || 'VIP Cleaners',
    telefono_contacto: config.telefono_contacto || process.env.COMPANY_PHONE || '',
    email_contacto: config.email_contacto || process.env.COMPANY_EMAIL || '',
    direccion_empresa: config.direccion_empresa || process.env.COMPANY_ADDRESS || '',
    website_empresa: config.website_empresa || process.env.COMPANY_WEBSITE || '',
    horario_atencion: `${apertura} a ${cierre}`,
  };
}
