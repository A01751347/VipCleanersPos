import { z } from 'zod';
import { BusinessError } from '../db/client';

/** Valida un cuerpo JSON y lanza BusinessError con un mensaje legible. */
export function validar<T extends z.ZodTypeAny>(esquema: T, datos: unknown): z.infer<T> {
  const r = esquema.safeParse(datos);
  if (!r.success) {
    const primero = r.error.issues[0];
    const campo = primero.path.join('.');
    throw new BusinessError(campo ? `${campo}: ${primero.message}` : primero.message);
  }
  return r.data;
}

export const telefonoMX = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 10, 'debe tener 10 dígitos');

export const dinero = z.coerce.number().finite().nonnegative();
export const idPositivo = z.coerce.number().int().positive();

export const metodoPagoSchema = z.enum(['efectivo', 'tarjeta', 'transferencia', 'mercado_pago']);

export const lineaServicioSchema = z.object({
  servicioId: idPositivo,
  cantidad: z.coerce.number().int().min(1).max(50).default(1),
  modeloId: idPositivo.nullish(),
  marca: z.string().trim().max(120).nullish(),
  modelo: z.string().trim().max(120).nullish(),
  talla: z.string().trim().max(20).nullish(),
  color: z.string().trim().max(60).nullish(),
  descripcion: z.string().trim().max(2000).nullish(),
});

export const lineaProductoSchema = z.object({
  productoId: idPositivo,
  cantidad: z.coerce.number().int().min(1).max(999),
});

export const pagoSchema = z.object({
  metodo: metodoPagoSchema,
  monto: dinero.positive(),
  efectivoRecibido: dinero.nullish(),
  referencia: z.string().trim().max(120).nullish(),
  terminalId: z.string().trim().max(60).nullish(),
});

// -------------------------------------------------------------------- POS
export const crearOrdenPosSchema = z.object({
  cliente: z.object({
    cliente_id: idPositivo.nullish(),
    nombre: z.string().trim().min(1).max(100),
    apellidos: z.string().trim().max(100).optional().default(''),
    telefono: z.string().trim().optional().default(''),
    email: z.string().trim().email().or(z.literal('')).optional().default(''),
  }),
  servicios: z.array(lineaServicioSchema).min(1, 'la orden necesita al menos un servicio'),
  productos: z.array(lineaProductoSchema).default([]),
  descuentoPorcentaje: z.coerce.number().min(0).max(100).default(0),
  motivoDescuento: z.string().trim().max(200).nullish(),
  notas: z.string().trim().max(2000).nullish(),
  tieneIdentificacion: z.boolean().default(false),
  pago: pagoSchema.nullish(),
});

// --------------------------------------------------------------- Reservas
export const direccionSchema = z.object({
  street: z.string().trim().min(1, 'la calle es obligatoria'),
  number: z.string().trim().min(1, 'el número es obligatorio'),
  interior: z.string().trim().optional().default(''),
  neighborhood: z.string().trim().min(1, 'la colonia es obligatoria'),
  municipality: z.string().trim().optional().default(''),
  city: z.string().trim().optional().default('Santiago de Querétaro'),
  state: z.string().trim().optional().default('Querétaro'),
  zipCode: z.string().trim().regex(/^\d{5}$/, 'el código postal debe tener 5 dígitos'),
  phone: z.string().trim().optional().default(''),
  instructions: z.string().trim().max(500).optional().default(''),
  timeWindowStart: z.string().trim().optional().default(''),
  timeWindowEnd: z.string().trim().optional().default(''),
});

export const reservaSchema = z.object({
  fullName: z.string().trim().min(2, 'el nombre es obligatorio').max(150),
  email: z.string().trim().email('el correo no es válido'),
  phone: telefonoMX,
  services: z
    .array(
      z.object({
        serviceId: idPositivo,
        quantity: z.coerce.number().int().min(1).max(20),
        shoesType: z.string().trim().min(1, 'describe el calzado').max(120),
      })
    )
    .min(1, 'selecciona al menos un servicio'),
  deliveryMethod: z.enum(['store', 'pickup']),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'formato de fecha inválido'),
  bookingTime: z.string().regex(/^\d{2}:\d{2}$/, 'formato de hora inválido'),
  requiresPickup: z.boolean().default(false),
  address: direccionSchema.nullish(),
  acceptTerms: z.literal(true, { message: 'debes aceptar los términos' }),
  acceptWhatsapp: z.boolean().default(false),
  turnstileToken: z.string().optional(),
});

// -------------------------------------------------------------- Contacto
export const contactoSchema = z.object({
  name: z.string().trim().min(2, 'el nombre es obligatorio').max(150),
  email: z.string().trim().email('el correo no es válido'),
  phone: z.string().trim().max(30).optional().default(''),
  subject: z.string().trim().min(2, 'el asunto es obligatorio').max(200),
  message: z.string().trim().min(5, 'el mensaje es muy corto').max(5000),
  turnstileToken: z.string().optional(),
});

// ------------------------------------------------------------- Inventario
export const movimientoSchema = z.object({
  productoId: idPositivo,
  tipo: z.enum(['entrada', 'salida', 'ajuste', 'merma', 'devolucion']),
  cantidad: z.coerce.number().int().min(0),
  motivo: z.string().trim().max(500).nullish(),
});

// ------------------------------------------------------------------ Caja
export const abrirCajaSchema = z.object({
  fondoInicial: dinero,
  notas: z.string().trim().max(500).nullish(),
});

export const cerrarCajaSchema = z.object({
  corteId: idPositivo,
  efectivoDeclarado: dinero,
  notas: z.string().trim().max(500).nullish(),
});

// ------------------------------------------------------------- Almacén
export const asignarUbicacionSchema = z.object({
  locations: z
    .array(
      z.object({
        detalleServicioId: idPositivo,
        ordenId: idPositivo,
        cajaAlmacenamiento: z.string().trim().min(1, 'la caja es obligatoria').max(40),
        codigoUbicacion: z.string().trim().max(40).nullish(),
        notasEspeciales: z.string().trim().max(500).nullish(),
      })
    )
    .min(1, 'no se recibieron ubicaciones'),
});

// -------------------------------------------------------------- Empleados
export const crearEmpleadoSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  apellidos: z.string().trim().max(100).optional().default(''),
  email: z.string().trim().email(),
  password: z.string().min(8, 'mínimo 8 caracteres').max(128),
  rol: z.enum(['admin', 'empleado']),
  telefono: z.string().trim().max(30).nullish(),
  puesto: z.string().trim().max(60).nullish(),
});

// ------------------------------------------------------------- Seguimiento
export const seguimientoSchema = z.object({
  codigo: z.string().trim().min(4).max(64),
  telefono: z.string().trim().regex(/^\d{4}$/, 'ingresa los últimos 4 dígitos del teléfono'),
});
