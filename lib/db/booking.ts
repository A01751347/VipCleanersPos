import 'server-only';
import { query, queryOne, BusinessError } from './client';
import { getConfig, getConfigNumero } from './config';

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export interface Disponibilidad {
  fecha: string;
  disponible: boolean;
  motivo?: string;
  cupoTotal: number;
  cupoUsado: number;
  cupoRestante: number;
  horaApertura: string;
  horaCierre: string;
}

/**
 * Valida que una fecha y hora de reserva sean operables.
 *
 * Antes no había ninguna validación: `new Date(fecha + 'T' + hora)` se insertaba
 * tal cual. Se podía reservar en el pasado, a las 3 de la mañana, en un día
 * cerrado, o veinte clientes a la misma hora. Una cadena mal formada producía
 * `Invalid Date` que llegaba hasta el INSERT.
 */
export async function validarFechaReserva(
  fechaISO: string,
  hora: string,
  paresSolicitados: number
): Promise<Date> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
    throw new BusinessError('La fecha de reserva no tiene un formato válido.');
  }
  if (!/^\d{2}:\d{2}$/.test(hora)) {
    throw new BusinessError('La hora de reserva no tiene un formato válido.');
  }

  const cuando = new Date(`${fechaISO}T${hora}:00`);
  if (Number.isNaN(cuando.getTime())) {
    throw new BusinessError('La fecha y hora de reserva no son válidas.');
  }
  if (cuando.getTime() < Date.now()) {
    throw new BusinessError('No se puede reservar en una fecha u hora que ya pasó.');
  }

  const maxDias = await getConfigNumero('dias_max_anticipacion', 60);
  if (cuando.getTime() > Date.now() + maxDias * 24 * 3600 * 1000) {
    throw new BusinessError(`Sólo se puede reservar con ${maxDias} días de anticipación.`);
  }

  const disp = await getDisponibilidad(fechaISO);
  if (!disp.disponible) {
    throw new BusinessError(disp.motivo ?? 'Ese día no hay servicio.');
  }
  if (paresSolicitados > disp.cupoRestante) {
    throw new BusinessError(
      `Sólo quedan ${disp.cupoRestante} lugares para ese día. Elige otra fecha.`
    );
  }

  const [hIni, mIni] = disp.horaApertura.split(':').map(Number);
  const [hFin, mFin] = disp.horaCierre.split(':').map(Number);
  const minutos = cuando.getHours() * 60 + cuando.getMinutes();
  if (minutos < hIni * 60 + mIni || minutos > hFin * 60 + mFin) {
    throw new BusinessError(
      `El horario de atención es de ${disp.horaApertura} a ${disp.horaCierre}.`
    );
  }

  return cuando;
}

export async function getDisponibilidad(fechaISO: string): Promise<Disponibilidad> {
  const horaApertura = (await getConfig('horario_apertura')) ?? '10:00';
  const horaCierre = (await getConfig('horario_cierre')) ?? '19:00';
  const diasOperacion = ((await getConfig('dias_operacion')) ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const cupoDefault = await getConfigNumero('capacidad_diaria_default', 30);

  const fecha = new Date(`${fechaISO}T12:00:00`);
  const nombreDia = DIAS_SEMANA[fecha.getDay()];

  const override = await queryOne<{ max_pares: number; cerrado: boolean; motivo: string | null }>(
    `SELECT max_pares, cerrado, motivo FROM capacidad_dia WHERE fecha = $1::date`,
    [fechaISO]
  );

  const [{ usado }] = await query<{ usado: number }>(
    `SELECT COALESCE(COUNT(d.detalle_servicio_id), 0)::int AS usado
     FROM ordenes o
     JOIN detalles_orden_servicios d ON d.orden_id = o.orden_id
     WHERE o.origen = 'online' AND NOT o.cancelada
       AND o.fecha_reservacion::date = $1::date`,
    [fechaISO]
  );

  const cupoTotal = override?.max_pares ?? cupoDefault;
  const cupoRestante = Math.max(0, cupoTotal - usado);

  let disponible = true;
  let motivo: string | undefined;

  if (override?.cerrado) {
    disponible = false;
    motivo = override.motivo ?? 'Ese día permanecemos cerrados.';
  } else if (diasOperacion.length && !diasOperacion.includes(nombreDia)) {
    disponible = false;
    motivo = `No damos servicio los ${nombreDia}.`;
  } else if (cupoRestante <= 0) {
    disponible = false;
    motivo = 'No quedan lugares para ese día.';
  }

  return {
    fecha: fechaISO,
    disponible,
    motivo,
    cupoTotal,
    cupoUsado: usado,
    cupoRestante,
    horaApertura,
    horaCierre,
  };
}

/** Disponibilidad de los próximos N días, para pintar el calendario. */
export async function getCalendarioDisponibilidad(dias = 30): Promise<Disponibilidad[]> {
  const hoy = new Date();
  const resultados: Disponibilidad[] = [];
  for (let i = 0; i < dias; i++) {
    const d = new Date(hoy.getTime() + i * 24 * 3600 * 1000);
    const iso = d.toISOString().slice(0, 10);
    resultados.push(await getDisponibilidad(iso));
  }
  return resultados;
}

export async function setCapacidadDia(
  fechaISO: string,
  maxPares: number,
  cerrado: boolean,
  motivo?: string | null
) {
  return queryOne(
    `INSERT INTO capacidad_dia (fecha, max_pares, cerrado, motivo)
     VALUES ($1::date, $2, $3, $4)
     ON CONFLICT (fecha) DO UPDATE
       SET max_pares = EXCLUDED.max_pares,
           cerrado = EXCLUDED.cerrado,
           motivo = EXCLUDED.motivo
     RETURNING *`,
    [fechaISO, maxPares, cerrado, motivo ?? null]
  );
}
