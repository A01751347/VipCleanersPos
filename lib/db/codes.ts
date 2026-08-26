import { randomBytes, randomInt } from 'crypto';

/**
 * Códigos de orden y de seguimiento.
 *
 * Antes ambos eran lo mismo: prefijo + fecha + 5 dígitos de `RAND()` de MySQL.
 * Eso son 100,000 combinaciones por día contra un endpoint público sin límite
 * de peticiones — enumerar un día entero era cuestión de minutos, y devolvía
 * nombre, teléfono y domicilio de cada cliente.
 *
 * Ahora se separan las dos responsabilidades:
 *  - `codigo_orden`: corto y legible, para decirlo por teléfono y buscarlo en
 *    el mostrador. No sirve como credencial.
 *  - `codigo_seguimiento`: token de 160 bits, imposible de adivinar. Es el
 *    único que abre la consulta pública.
 */

// Sin I, O, 0, 1: se confunden al dictar por teléfono o leer de un ticket.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generarCodigoOrden(prefijo = 'ORD'): string {
  const fecha = new Date();
  const yy = String(fecha.getFullYear()).slice(-2);
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  let sufijo = '';
  for (let i = 0; i < 5; i++) {
    sufijo += ALFABETO[randomInt(0, ALFABETO.length)];
  }
  return `${prefijo}-${yy}${mm}${dd}-${sufijo}`;
}

/** Token de seguimiento público: 160 bits en base64url. */
export function generarCodigoSeguimiento(): string {
  return randomBytes(20).toString('base64url');
}

/**
 * Código de ubicación de almacén: <caja>-<consecutivo>.
 * El consecutivo se calcula en la base dentro de la transacción, no aquí.
 */
export function formatearCodigoUbicacion(caja: string, consecutivo: number): string {
  return `${caja.trim().toUpperCase()}-${String(consecutivo).padStart(3, '0')}`;
}
