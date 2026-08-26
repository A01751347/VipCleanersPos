import 'server-only';
import { BusinessError } from './db/client';

/**
 * Verificación de Cloudflare Turnstile.
 *
 * `SKIP_TURNSTILE=true` sólo se respeta fuera de producción: antes esa variable
 * desactivaba la protección en cualquier entorno.
 */
export async function verificarTurnstile(token: string | undefined, ip?: string): Promise<void> {
  const secreto = process.env.TURNSTILE_SECRET_KEY;

  if (!secreto) {
    if (process.env.NODE_ENV === 'production') {
      throw new BusinessError('La verificación de seguridad no está configurada.', 503);
    }
    console.warn('[turnstile] sin TURNSTILE_SECRET_KEY; se omite fuera de producción');
    return;
  }

  if (process.env.SKIP_TURNSTILE === 'true' && process.env.NODE_ENV !== 'production') {
    return;
  }

  if (!token) throw new BusinessError('Falta la verificación de seguridad.');

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      cache: 'no-store',
      body: new URLSearchParams({
        secret: secreto,
        response: token,
        ...(ip && ip !== 'desconocida' ? { remoteip: ip } : {}),
      }),
    });
    const datos = (await res.json()) as { success?: boolean };
    if (!datos.success) throw new BusinessError('La verificación de seguridad no pasó.');
  } catch (err) {
    if (err instanceof BusinessError) throw err;
    console.error('[turnstile] error al verificar', err);
    throw new BusinessError('No se pudo completar la verificación de seguridad.', 503);
  }
}
