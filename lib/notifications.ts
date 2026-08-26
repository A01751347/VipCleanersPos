import 'server-only';
import { queryOne } from './db/client';
import { getConfigBool } from './db/config';
import { sendOrderStatusUpdateEmail } from './email';

/**
 * Avisos al cliente.
 *
 * `sendOrderStatusUpdateEmail` existía completa en lib/email.ts pero ninguna
 * ruta la llamaba: el cliente nunca se enteraba de que sus tenis estaban
 * listos. Es el mensaje de mayor valor del negocio — sin él la gente llama al
 * mostrador o deja los pares sin recoger ocupando lugar en el almacén.
 *
 * Nada de lo que hay aquí puede tumbar una operación: los errores se registran
 * y se devuelven, nunca se propagan a la transacción que ya se confirmó.
 */

export interface ResultadoNotificacion {
  email: boolean;
  whatsapp: boolean;
  motivo?: string;
}

export async function notificarCambioEstado(
  ordenId: number,
  nombreEstado: string,
  comentario?: string | null
): Promise<ResultadoNotificacion> {
  const salida: ResultadoNotificacion = { email: false, whatsapp: false };

  const orden = await queryOne<{
    codigo_orden: string;
    codigo_seguimiento: string;
    cliente_nombre: string;
    cliente_email: string | null;
    cliente_telefono: string | null;
    acepta_whatsapp: boolean;
    total: number;
  }>(
    `SELECT o.codigo_orden, o.codigo_seguimiento, o.total, o.acepta_whatsapp,
            c.nombre AS cliente_nombre, c.email AS cliente_email, c.telefono AS cliente_telefono
     FROM ordenes o JOIN clientes c ON c.cliente_id = o.cliente_id
     WHERE o.orden_id = $1`,
    [ordenId]
  );

  if (!orden) {
    salida.motivo = 'orden no encontrada';
    return salida;
  }

  if (await getConfigBool('notificaciones_email', true)) {
    if (orden.cliente_email) {
      try {
        const r = await sendOrderStatusUpdateEmail(orden, nombreEstado, comentario ?? undefined);
        salida.email = Boolean(r?.success);
      } catch (err) {
        console.error('[notificaciones] error enviando correo', err);
      }
    } else {
      salida.motivo = 'el cliente no tiene correo registrado';
    }
  }

  if (orden.acepta_whatsapp && (await getConfigBool('notificaciones_whatsapp', false))) {
    salida.whatsapp = await enviarWhatsApp(
      orden.cliente_telefono,
      mensajeEstado(orden.cliente_nombre, orden.codigo_orden, nombreEstado)
    );
  }

  return salida;
}

function mensajeEstado(nombre: string, codigo: string, estado: string): string {
  const primerNombre = String(nombre ?? '').split(' ')[0];
  return `Hola ${primerNombre}, tu orden ${codigo} cambió a: ${estado}.`;
}

/**
 * Envío por WhatsApp.
 *
 * El consentimiento (`acepta_whatsapp`) ya se captura desde hace tiempo y los
 * términos y condiciones prometen este canal, pero no existía ningún código
 * que enviara mensajes. Queda conectado detrás de configuración: mientras no
 * haya credenciales de la API, no se intenta nada y se registra por qué.
 */
async function enviarWhatsApp(telefono: string | null, mensaje: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.info('[notificaciones] WhatsApp sin configurar; no se envía');
    return false;
  }
  if (!telefono) return false;

  const destino = telefono.replace(/\D/g, '');
  const e164 = destino.length === 10 ? `52${destino}` : destino;

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: e164,
        type: 'text',
        text: { body: mensaje },
      }),
    });
    if (!res.ok) {
      console.error('[notificaciones] WhatsApp respondió', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notificaciones] error enviando WhatsApp', err);
    return false;
  }
}

/** Confirmación de reserva en línea. Antes no se enviaba ningún correo. */
export async function notificarReservaCreada(ordenId: number): Promise<ResultadoNotificacion> {
  return notificarCambioEstado(
    ordenId,
    'Reserva confirmada',
    'Te esperamos en la fecha y hora que elegiste. Guarda tu código para dar seguimiento.'
  );
}
