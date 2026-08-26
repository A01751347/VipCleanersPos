import 'server-only';
import { query, queryOne, BusinessError } from './client';

export interface ClienteInput {
  nombre: string;
  apellidos?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  codigoPostal?: string | null;
  ciudad?: string | null;
  estado?: string | null;
  rfc?: string | null;
  razonSocial?: string | null;
  regimenFiscal?: string | null;
  usoCfdi?: string | null;
  cpFiscal?: string | null;
  notas?: string | null;
}

export function normalizarTelefono(tel?: string | null): string | null {
  const digitos = (tel ?? '').replace(/\D/g, '');
  return digitos.length >= 10 ? digitos.slice(-10) : digitos || null;
}

export function normalizarEmail(email?: string | null): string | null {
  const e = email?.trim().toLowerCase();
  return e || null;
}

/**
 * Crea el cliente, o devuelve el existente si ya hay uno con ese teléfono o
 * correo. Antes se creaban duplicados con facilidad porque la búsqueda previa
 * y la inserción eran dos pasos sin restricción única detrás.
 */
export async function crearOEncontrarCliente(input: ClienteInput): Promise<number> {
  const telefono = normalizarTelefono(input.telefono);
  const email = normalizarEmail(input.email);

  if (!input.nombre?.trim()) throw new BusinessError('El nombre del cliente es obligatorio.');
  if (!telefono && !email) {
    throw new BusinessError('Se requiere al menos teléfono o correo del cliente.');
  }

  const existente = await buscarClientePorContacto(telefono, email);
  if (existente) {
    await query(
      `UPDATE clientes SET
         nombre = COALESCE(NULLIF($2,''), nombre),
         apellidos = COALESCE(NULLIF($3,''), apellidos),
         telefono = COALESCE(telefono, $4),
         email = COALESCE(email, $5)
       WHERE cliente_id = $1`,
      [existente.cliente_id, input.nombre.trim(), input.apellidos?.trim() ?? '', telefono, email]
    );
    return existente.cliente_id;
  }

  const fila = await queryOne<{ cliente_id: number }>(
    `INSERT INTO clientes (
       nombre, apellidos, telefono, email, direccion, codigo_postal, ciudad, estado,
       rfc, razon_social, regimen_fiscal, uso_cfdi, cp_fiscal, notas
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING cliente_id`,
    [
      input.nombre.trim(),
      input.apellidos?.trim() ?? '',
      telefono,
      email,
      input.direccion ?? null,
      input.codigoPostal ?? null,
      input.ciudad ?? null,
      input.estado ?? null,
      input.rfc?.trim().toUpperCase() ?? null,
      input.razonSocial ?? null,
      input.regimenFiscal ?? null,
      input.usoCfdi ?? null,
      input.cpFiscal ?? null,
      input.notas ?? null,
    ]
  );
  return fila!.cliente_id;
}

export async function buscarClientePorContacto(
  telefono: string | null,
  email: string | null
) {
  if (!telefono && !email) return null;
  return queryOne<{ cliente_id: number; nombre: string; apellidos: string }>(
    `SELECT cliente_id, nombre, apellidos FROM clientes
     WHERE ($1::text IS NOT NULL AND telefono = $1)
        OR ($2::text IS NOT NULL AND lower(email) = $2)
     LIMIT 1`,
    [telefono, email]
  );
}

export async function getClientePorId(clienteId: number) {
  return queryOne(`SELECT * FROM clientes WHERE cliente_id = $1`, [clienteId]);
}

export async function getClientes(opciones: {
  busqueda?: string | null;
  pagina?: number;
  porPagina?: number;
} = {}) {
  const pagina = Math.max(1, Math.trunc(opciones.pagina ?? 1));
  const porPagina = Math.min(200, Math.max(1, Math.trunc(opciones.porPagina ?? 20)));
  const offset = (pagina - 1) * porPagina;

  const valores: unknown[] = [];
  let where = 'WHERE c.activo';
  if (opciones.busqueda?.trim()) {
    valores.push(`%${opciones.busqueda.trim()}%`);
    where += ` AND (c.nombre ILIKE $1 OR c.apellidos ILIKE $1
                    OR c.telefono ILIKE $1 OR c.email ILIKE $1)`;
  }

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM clientes c ${where}`,
    valores
  );

  const clientes = await query(
    `SELECT c.*,
            COALESCE(o.total_ordenes, 0)  AS total_ordenes,
            COALESCE(o.total_gastado, 0)  AS total_gastado,
            o.ultima_orden
     FROM clientes c
     LEFT JOIN (
       SELECT cliente_id, COUNT(*)::int AS total_ordenes,
              SUM(total) AS total_gastado, MAX(fecha_recepcion) AS ultima_orden
       FROM ordenes WHERE NOT cancelada GROUP BY cliente_id
     ) o ON o.cliente_id = c.cliente_id
     ${where}
     ORDER BY c.fecha_creacion DESC
     LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, porPagina, offset]
  );

  return {
    clientes,
    clients: clientes,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export async function actualizarCliente(clienteId: number, input: Partial<ClienteInput>) {
  const fila = await queryOne(
    `UPDATE clientes SET
       nombre = COALESCE($2, nombre),
       apellidos = COALESCE($3, apellidos),
       telefono = COALESCE($4, telefono),
       email = COALESCE($5, email),
       direccion = COALESCE($6, direccion),
       codigo_postal = COALESCE($7, codigo_postal),
       ciudad = COALESCE($8, ciudad),
       estado = COALESCE($9, estado),
       rfc = COALESCE($10, rfc),
       razon_social = COALESCE($11, razon_social),
       regimen_fiscal = COALESCE($12, regimen_fiscal),
       uso_cfdi = COALESCE($13, uso_cfdi),
       cp_fiscal = COALESCE($14, cp_fiscal),
       notas = COALESCE($15, notas)
     WHERE cliente_id = $1
     RETURNING *`,
    [
      clienteId,
      input.nombre?.trim() ?? null,
      input.apellidos?.trim() ?? null,
      normalizarTelefono(input.telefono),
      normalizarEmail(input.email),
      input.direccion ?? null,
      input.codigoPostal ?? null,
      input.ciudad ?? null,
      input.estado ?? null,
      input.rfc?.trim().toUpperCase() ?? null,
      input.razonSocial ?? null,
      input.regimenFiscal ?? null,
      input.usoCfdi ?? null,
      input.cpFiscal ?? null,
      input.notas ?? null,
    ]
  );
  return fila;
}

export async function crearDireccion(input: {
  clienteId: number;
  tipo?: 'domicilio' | 'pickup' | 'facturacion' | 'otro';
  calle: string;
  numeroExterior?: string;
  numeroInterior?: string | null;
  colonia?: string | null;
  delegacionMunicipio?: string | null;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  telefonoContacto?: string | null;
  destinatario?: string | null;
  instrucciones?: string | null;
  ventanaHoraInicio?: string | null;
  ventanaHoraFin?: string | null;
  alias?: string | null;
}): Promise<number> {
  const fila = await queryOne<{ direccion_id: number }>(
    `INSERT INTO direcciones (
       cliente_id, tipo, calle, numero_exterior, numero_interior, colonia,
       delegacion_municipio, ciudad, estado, codigo_postal, telefono_contacto,
       destinatario, instrucciones, ventana_hora_inicio, ventana_hora_fin, alias
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
               NULLIF($14,'')::time, NULLIF($15,'')::time, $16)
     RETURNING direccion_id`,
    [
      input.clienteId,
      input.tipo ?? 'domicilio',
      input.calle.trim(),
      input.numeroExterior?.trim() ?? '',
      input.numeroInterior?.trim() || null,
      input.colonia?.trim() || null,
      input.delegacionMunicipio?.trim() || null,
      input.ciudad.trim(),
      input.estado.trim(),
      input.codigoPostal.trim(),
      normalizarTelefono(input.telefonoContacto),
      input.destinatario?.trim() || null,
      input.instrucciones?.trim() || null,
      input.ventanaHoraInicio ?? '',
      input.ventanaHoraFin ?? '',
      input.alias ?? null,
    ]
  );
  return fila!.direccion_id;
}
