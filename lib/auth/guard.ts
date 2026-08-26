import 'server-only';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth';
import { BusinessError, NotFoundError, describeDbError } from '../db/client';

export type Rol = 'admin' | 'empleado';

export interface Actor {
  usuarioId: number;
  empleadoId: number;
  rol: Rol;
  nombre: string;
  email: string;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/**
 * Exige sesión y, opcionalmente, uno de los roles indicados.
 *
 * Antes cada ruta repetía `session.user.role !== 'admin'`, lo que dejaba al rol
 * `empleado` sin acceso a nada: para que un cajero pudiera trabajar había que
 * hacerlo administrador, con acceso a reportes, salarios y precios.
 *
 * Por omisión permite admin y empleado; las rutas sensibles piden ['admin'].
 */
export async function requireActor(roles: Rol[] = ['admin', 'empleado']): Promise<Actor> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new AuthError('No autenticado', 401);
  }

  const rol = session.user.role as Rol;
  if (!roles.includes(rol)) {
    throw new AuthError('No tienes permiso para esta acción', 403);
  }

  // Toda acción que escribe queda atribuida a un empleado real. Si el usuario
  // no tiene ficha de empleado, no puede operar: antes se caía a `empleado_id = 1`.
  const empleadoId = session.user.empleadoId;
  if (!empleadoId) {
    throw new AuthError(
      'Tu usuario no tiene una ficha de empleado asociada. Pide a un administrador que la cree.',
      403
    );
  }

  return {
    usuarioId: parseInt(session.user.id, 10),
    empleadoId,
    rol,
    nombre: session.user.name ?? '',
    email: session.user.email ?? '',
  };
}

/** Sólo administradores. Para precios, reportes, ajustes y personal. */
export async function requireAdmin(): Promise<Actor> {
  return requireActor(['admin']);
}

/**
 * Envuelve un handler de ruta y traduce cualquier excepción a una respuesta
 * JSON coherente, sin filtrar detalles internos al cliente.
 */
export function rutaProtegida<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (err) {
      return manejarError(err);
    }
  };
}

export function manejarError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof BusinessError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
  if (err instanceof SyntaxError) {
    return NextResponse.json({ error: 'JSON inválido en la solicitud.' }, { status: 400 });
  }

  const { message, status } = describeDbError((err as { cause?: unknown })?.cause ?? err);
  if (status >= 500) {
    console.error('[api] error no manejado', err);
  }
  return NextResponse.json({ error: message }, { status });
}
