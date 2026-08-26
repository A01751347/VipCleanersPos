import 'server-only';
import type { PoolClient } from 'pg';
import {
  query,
  queryOne,
  withTransaction,
  BusinessError,
  NotFoundError,
  placeholders,
} from './client';
import { generarCodigoOrden, generarCodigoSeguimiento } from './codes';
import {
  aCentavos,
  aPesos,
  desglosarIvaIncluido,
  agregarIva,
  aplicarDescuentoPorcentaje,
  type Centavos,
} from './money';
import { getTasaIva, preciosIncluyenIva, getConfigNumero } from './config';
import { registrarMovimiento } from './inventory';

export const ESTADO_PENDIENTE = 1;
export const ESTADO_RECIBIDO = 2;
export const ESTADO_ENTREGADO = 8;
export const ESTADO_CANCELADA = 9;

export interface LineaServicio {
  servicioId: number;
  cantidad: number;
  modeloId?: number | null;
  marca?: string | null;
  modelo?: string | null;
  talla?: string | null;
  color?: string | null;
  descripcion?: string | null;
}

export interface LineaProducto {
  productoId: number;
  cantidad: number;
}

export interface DatosPago {
  metodo: 'efectivo' | 'tarjeta' | 'transferencia' | 'mercado_pago';
  /** Importe a aplicar a la orden, en pesos. */
  monto: number;
  /** Sólo efectivo: billete entregado por el cliente, para calcular el cambio. */
  efectivoRecibido?: number | null;
  referencia?: string | null;
  terminalId?: string | null;
}

export interface CrearOrdenInput {
  clienteId: number;
  empleadoId: number;
  origen?: 'pos' | 'online';
  servicios: LineaServicio[];
  productos?: LineaProducto[];
  descuentoPorcentaje?: number;
  motivoDescuento?: string | null;
  notas?: string | null;
  tieneIdentificacion?: boolean;
  requierePickup?: boolean;
  direccionId?: number | null;
  costoPickup?: number;
  zonaPickup?: string | null;
  fechaReservacion?: Date | null;
  fechaEntregaEstimada?: Date | null;
  aceptaTerminos?: boolean;
  aceptaWhatsapp?: boolean;
  estadoInicialId?: number;
  pago?: DatosPago | null;
}

export interface OrdenCreada {
  ordenId: number;
  codigoOrden: string;
  codigoSeguimiento: string;
  subtotal: number;
  impuestos: number;
  total: number;
  requiereIdentificacion: boolean;
  /** En el mismo orden en que llegaron los pares. Necesario para las fotos. */
  detallesServicios: Array<{
    detalleServicioId: number;
    indice: number;
    servicioId: number;
    marca: string | null;
    modelo: string | null;
  }>;
}

/**
 * Crea una orden completa dentro de UNA transacción.
 *
 * Sustituye a `createPosOrder`, que ejecutaba ocho o más consultas sueltas sin
 * transacción: cualquier fallo a la mitad dejaba órdenes sin pago, stock
 * descontado sin venta, o pagos sin renglones, sin forma de revertir. Además
 * leía el id de la orden con `SELECT @orden_id` en otra conexión del pool, así
 * que bajo concurrencia podía devolver el id de la orden de otro cajero.
 *
 * Los importes se calculan aquí, a partir de los precios de la base. El
 * navegador ya no decide cuánto cuesta una orden.
 */
export async function crearOrden(input: CrearOrdenInput): Promise<OrdenCreada> {
  if (!input.servicios || input.servicios.length === 0) {
    throw new BusinessError('La orden debe incluir al menos un servicio.');
  }
  if (!input.empleadoId) {
    throw new BusinessError('Falta el empleado que registra la orden.');
  }

  const tasaIva = await getTasaIva();
  const incluyenIva = await preciosIncluyenIva();
  const diasProceso = await getConfigNumero('dias_procesamiento', 3);
  const descuentoMaximo = await getConfigNumero('descuento_maximo', 20);

  const descuentoPorc = input.descuentoPorcentaje ?? 0;
  if (descuentoPorc < 0 || descuentoPorc > descuentoMaximo) {
    throw new BusinessError(
      `El descuento debe estar entre 0% y ${descuentoMaximo}%.`
    );
  }

  return withTransaction(async (client) => {
    // ---- 1. Precios reales del catálogo, bloqueando los renglones -----------
    const idsServicio = [...new Set(input.servicios.map((s) => s.servicioId))];
    const serviciosDb = await query<{
      servicio_id: number;
      precio: number;
      nombre: string;
      requiere_identificacion: boolean;
      tiempo_estimado_minutos: number;
      activo: boolean;
    }>(
      `SELECT servicio_id, precio, nombre, requiere_identificacion,
              tiempo_estimado_minutos, activo
       FROM servicios WHERE servicio_id IN (${placeholders(idsServicio.length)})`,
      idsServicio,
      client
    );

    const mapaServicios = new Map(serviciosDb.map((s) => [s.servicio_id, s]));
    for (const id of idsServicio) {
      const s = mapaServicios.get(id);
      if (!s) throw new BusinessError(`El servicio ${id} no existe.`);
      if (!s.activo) throw new BusinessError(`El servicio "${s.nombre}" está desactivado.`);
    }

    const productos = input.productos ?? [];
    const idsProducto = [...new Set(productos.map((p) => p.productoId))];
    const productosDb = idsProducto.length
      ? await query<{
          producto_id: number;
          precio: number;
          nombre: string;
          stock: number;
          activo: boolean;
        }>(
          `SELECT producto_id, precio, nombre, stock, activo
           FROM productos WHERE producto_id IN (${placeholders(idsProducto.length)})
           ORDER BY producto_id
           FOR UPDATE`,
          idsProducto,
          client
        )
      : [];
    const mapaProductos = new Map(productosDb.map((p) => [p.producto_id, p]));

    // ---- 2. Importes, en centavos enteros ----------------------------------
    let brutoCentavos: Centavos = 0;
    let requiereIdentificacion = false;
    let minutosEstimados = 0;

    for (const linea of input.servicios) {
      const s = mapaServicios.get(linea.servicioId)!;
      const cantidad = Math.max(1, Math.trunc(linea.cantidad || 1));
      brutoCentavos += aCentavos(s.precio) * cantidad;
      minutosEstimados += s.tiempo_estimado_minutos * cantidad;
      if (s.requiere_identificacion) requiereIdentificacion = true;
    }

    for (const linea of productos) {
      const p = mapaProductos.get(linea.productoId);
      if (!p) throw new BusinessError(`El producto ${linea.productoId} no existe.`);
      if (!p.activo) throw new BusinessError(`El producto "${p.nombre}" está desactivado.`);
      const cantidad = Math.max(1, Math.trunc(linea.cantidad || 1));
      if (p.stock < cantidad) {
        throw new BusinessError(
          `Sin existencia suficiente de "${p.nombre}": quedan ${p.stock}, se piden ${cantidad}.`
        );
      }
      brutoCentavos += aCentavos(p.precio) * cantidad;
    }

    const costoPickupCentavos = input.requierePickup ? aCentavos(input.costoPickup ?? 0) : 0;
    brutoCentavos += costoPickupCentavos;

    const descuentoCentavos = aplicarDescuentoPorcentaje(brutoCentavos, descuentoPorc);
    const netoCentavos = brutoCentavos - descuentoCentavos;

    const desglose = incluyenIva
      ? desglosarIvaIncluido(netoCentavos, tasaIva)
      : agregarIva(netoCentavos, tasaIva);

    // ---- 3. Cabecera de la orden ------------------------------------------
    const fechaEntrega =
      input.fechaEntregaEstimada ??
      new Date(Date.now() + diasProceso * 24 * 3600 * 1000 + minutosEstimados * 60 * 1000);

    const codigoOrden = await generarCodigoUnico(client, input.origen === 'online' ? 'RES' : 'ORD');

    const orden = await queryOne<{ orden_id: number; codigo_seguimiento: string }>(
      `INSERT INTO ordenes (
         codigo_orden, codigo_seguimiento, origen, cliente_id, empleado_recepcion_id,
         direccion_id, subtotal, descuento, impuestos, total, motivo_descuento,
         descuento_autorizado_por, estado_actual_id, estado_pago,
         requiere_identificacion, tiene_identificacion_registrada,
         requiere_pickup, costo_pickup, zona_pickup,
         fecha_reservacion, fecha_entrega_estimada,
         acepta_terminos, acepta_whatsapp, consent_at, notas
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pendiente',
         $14,$15,$16,$17,$18,$19,$20,$21,$22,
         CASE WHEN $21 OR $22 THEN now() ELSE NULL END, $23
       )
       RETURNING orden_id, codigo_seguimiento`,
      [
        codigoOrden,
        generarCodigoSeguimiento(),
        input.origen ?? 'pos',
        input.clienteId,
        input.empleadoId,
        input.direccionId ?? null,
        aPesos(desglose.subtotal),
        aPesos(descuentoCentavos),
        aPesos(desglose.impuestos),
        aPesos(desglose.total),
        input.motivoDescuento ?? null,
        descuentoPorc > 0 ? input.empleadoId : null,
        input.estadoInicialId ?? (input.origen === 'online' ? ESTADO_PENDIENTE : ESTADO_RECIBIDO),
        requiereIdentificacion,
        input.tieneIdentificacion ?? false,
        input.requierePickup ?? false,
        aPesos(costoPickupCentavos),
        input.zonaPickup ?? null,
        input.fechaReservacion ?? null,
        fechaEntrega,
        input.aceptaTerminos ?? false,
        input.aceptaWhatsapp ?? false,
        input.notas ?? null,
      ],
      client
    );
    const ordenId = orden!.orden_id;

    // ---- 4. Un renglón por par --------------------------------------------
    const detallesServicios: OrdenCreada['detallesServicios'] = [];
    let indice = 0;

    for (const linea of input.servicios) {
      const s = mapaServicios.get(linea.servicioId)!;
      const precio = aCentavos(s.precio);
      const tieneDetalleCalzado = Boolean(
        linea.marca?.trim() || linea.modelo?.trim() || linea.descripcion?.trim()
      );
      // Con detalle de calzado se crea un registro por par, para poder darle a
      // cada uno su ubicación de almacén y sus fotos. Sin detalle, se agrupa.
      const repeticiones = tieneDetalleCalzado ? Math.max(1, Math.trunc(linea.cantidad || 1)) : 1;
      const cantidadPorFila = tieneDetalleCalzado ? 1 : Math.max(1, Math.trunc(linea.cantidad || 1));

      for (let i = 0; i < repeticiones; i++) {
        const fila = await queryOne<{ detalle_servicio_id: number }>(
          `INSERT INTO detalles_orden_servicios (
             orden_id, servicio_id, cantidad, precio_unitario, descuento, subtotal,
             modelo_id, marca, modelo, talla, color, descripcion_calzado
           ) VALUES ($1,$2,$3,$4,0,$5,$6,$7,$8,$9,$10,$11)
           RETURNING detalle_servicio_id`,
          [
            ordenId,
            linea.servicioId,
            cantidadPorFila,
            aPesos(precio),
            aPesos(precio * cantidadPorFila),
            linea.modeloId ?? null,
            limpiar(linea.marca),
            limpiar(linea.modelo),
            limpiar(linea.talla),
            limpiar(linea.color),
            limpiar(linea.descripcion),
          ],
          client
        );
        detallesServicios.push({
          detalleServicioId: fila!.detalle_servicio_id,
          indice: indice++,
          servicioId: linea.servicioId,
          marca: limpiar(linea.marca),
          modelo: limpiar(linea.modelo),
        });
      }
    }

    // ---- 5. Productos y descuento de existencias --------------------------
    for (const linea of productos) {
      const p = mapaProductos.get(linea.productoId)!;
      const cantidad = Math.max(1, Math.trunc(linea.cantidad || 1));
      const precio = aCentavos(p.precio);

      await query(
        `INSERT INTO detalles_orden_productos (
           orden_id, producto_id, cantidad, precio_unitario, descuento, subtotal
         ) VALUES ($1,$2,$3,$4,0,$5)`,
        [ordenId, linea.productoId, cantidad, aPesos(precio), aPesos(precio * cantidad)],
        client
      );

      // Pasa por el registro de movimientos: antes era un UPDATE condicional
      // que al no haber existencia afectaba cero filas sin avisar a nadie.
      await registrarMovimiento(
        {
          productoId: linea.productoId,
          tipo: 'salida',
          cantidad,
          ordenId,
          empleadoId: input.empleadoId,
          motivo: `Venta en orden ${codigoOrden}`,
        },
        client
      );
    }

    // ---- 6. Costo de recolección como concepto aparte ----------------------
    if (costoPickupCentavos > 0) {
      await query(
        `INSERT INTO costos_adicionales_orden (orden_id, concepto, descripcion, monto)
         VALUES ($1, 'pickup', $2, $3)`,
        [ordenId, `Recolección zona ${input.zonaPickup ?? 'sin zona'}`, aPesos(costoPickupCentavos)],
        client
      );
    }

    // ---- 7. Estado inicial en el historial ---------------------------------
    await query(
      `INSERT INTO historial_estados (orden_id, estado_id, empleado_id, comentario)
       VALUES ($1, $2, $3, $4)`,
      [
        ordenId,
        input.estadoInicialId ?? (input.origen === 'online' ? ESTADO_PENDIENTE : ESTADO_RECIBIDO),
        input.empleadoId,
        input.origen === 'online' ? 'Reserva creada en línea' : 'Orden creada en mostrador',
      ],
      client
    );

    // ---- 8. Pago -----------------------------------------------------------
    if (input.pago && input.pago.monto > 0) {
      await registrarPagoInterno(client, {
        ordenId,
        empleadoId: input.empleadoId,
        pago: input.pago,
      });
    }

    return {
      ordenId,
      codigoOrden,
      codigoSeguimiento: orden!.codigo_seguimiento,
      subtotal: aPesos(desglose.subtotal),
      impuestos: aPesos(desglose.impuestos),
      total: aPesos(desglose.total),
      requiereIdentificacion,
      detallesServicios,
    };
  });
}

function limpiar(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

/**
 * Genera un código único reintentando ante colisión.
 * El esquema anterior usaba 5 dígitos de RAND() contra una columna UNIQUE: la
 * colisión hacía fallar la orden con un error opaco y sin reintento.
 */
async function generarCodigoUnico(client: PoolClient, prefijo: string): Promise<string> {
  for (let intento = 0; intento < 6; intento++) {
    const codigo = generarCodigoOrden(prefijo);
    const existe = await queryOne(
      `SELECT 1 FROM ordenes WHERE codigo_orden = $1`,
      [codigo],
      client
    );
    if (!existe) return codigo;
  }
  throw new BusinessError('No se pudo generar un código de orden único. Intenta de nuevo.');
}

/** Inserta el pago y recalcula el estado de pago de la orden. */
export async function registrarPagoInterno(
  client: PoolClient,
  args: {
    ordenId: number;
    empleadoId: number;
    pago: DatosPago;
  }
): Promise<number> {
  const { ordenId, empleadoId, pago } = args;

  const montoCentavos = aCentavos(pago.monto);
  if (montoCentavos <= 0) {
    throw new BusinessError('El monto del pago debe ser mayor a cero.');
  }

  // Lo pagado hasta ahora, bloqueando para que dos cobros simultáneos no
  // sobrepasen el total de la orden.
  const previo = await queryOne<{ pagado: number; total: number }>(
    `SELECT COALESCE((
       SELECT SUM(monto) FROM pagos WHERE orden_id = o.orden_id AND estado = 'completado'
     ), 0) AS pagado, o.total
     FROM ordenes o WHERE o.orden_id = $1 FOR UPDATE`,
    [ordenId],
    client
  );
  if (!previo) throw new NotFoundError(`La orden ${ordenId} no existe.`);

  const totalCentavos = aCentavos(previo.total);
  const pagadoCentavos = aCentavos(previo.pagado);
  const restante = totalCentavos - pagadoCentavos;

  if (montoCentavos > restante) {
    throw new BusinessError(
      `El pago excede el saldo pendiente (${aPesos(restante).toFixed(2)}).`
    );
  }

  // En efectivo se registra el importe aplicado a la orden, y el billete
  // recibido y el cambio se guardan aparte. Antes se guardaba el billete como
  // monto del pago, lo que inflaba los ingresos con el cambio devuelto.
  let efectivoRecibido: number | null = null;
  let cambio: number | null = null;
  if (pago.metodo === 'efectivo' && pago.efectivoRecibido != null) {
    const recibidoCentavos = aCentavos(pago.efectivoRecibido);
    if (recibidoCentavos < montoCentavos) {
      throw new BusinessError('El efectivo recibido es menor al monto a cobrar.');
    }
    efectivoRecibido = aPesos(recibidoCentavos);
    cambio = aPesos(recibidoCentavos - montoCentavos);
  }

  const corte = await queryOne<{ corte_id: number }>(
    `SELECT corte_id FROM cortes_caja WHERE empleado_id = $1 AND estado = 'abierto' LIMIT 1`,
    [empleadoId],
    client
  );

  const fila = await queryOne<{ pago_id: number }>(
    `INSERT INTO pagos (
       orden_id, monto, efectivo_recibido, cambio_entregado, metodo,
       referencia, terminal_id, empleado_id, corte_id, estado
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'completado')
     RETURNING pago_id`,
    [
      ordenId,
      aPesos(montoCentavos),
      efectivoRecibido,
      cambio,
      pago.metodo,
      pago.referencia ?? null,
      pago.terminalId ?? null,
      // El empleado real, no un 1 escrito a mano en la consulta.
      empleadoId,
      corte?.corte_id ?? null,
    ],
    client
  );

  await recalcularEstadoPago(client, ordenId);
  return fila!.pago_id;
}

export async function recalcularEstadoPago(client: PoolClient, ordenId: number): Promise<void> {
  await query(
    `UPDATE ordenes o SET
       estado_pago = CASE
         WHEN p.pagado <= 0 THEN 'pendiente'::estado_pago_orden
         WHEN p.pagado >= o.total THEN 'pagado'::estado_pago_orden
         ELSE 'parcial'::estado_pago_orden
       END,
       metodo_pago = COALESCE(p.ultimo_metodo, o.metodo_pago)
     FROM (
       SELECT COALESCE(SUM(monto), 0) AS pagado,
              (SELECT metodo FROM pagos
                WHERE orden_id = $1 AND estado = 'completado'
                ORDER BY fecha_pago DESC LIMIT 1) AS ultimo_metodo
       FROM pagos WHERE orden_id = $1 AND estado = 'completado'
     ) p
     WHERE o.orden_id = $1`,
    [ordenId],
    client
  );
}

// =============================================================================
// Consultas
// =============================================================================

export interface FiltrosOrdenes {
  pagina?: number;
  porPagina?: number;
  estadoIds?: number[];
  estadoPago?: string | null;
  origen?: 'pos' | 'online' | null;
  desde?: string | null;
  hasta?: string | null;
  busqueda?: string | null;
  empleadoId?: number | null;
  incluirCanceladas?: boolean;
}

export async function getOrdenes(filtros: FiltrosOrdenes = {}) {
  const pagina = Math.max(1, Math.trunc(filtros.pagina ?? 1));
  const porPagina = Math.min(100, Math.max(1, Math.trunc(filtros.porPagina ?? 10)));
  const offset = (pagina - 1) * porPagina;

  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (!filtros.incluirCanceladas) condiciones.push('NOT cancelada');

  if (filtros.estadoIds?.length) {
    valores.push(filtros.estadoIds);
    condiciones.push(`estado_actual_id = ANY($${valores.length}::int[])`);
  }
  if (filtros.estadoPago) {
    valores.push(filtros.estadoPago);
    condiciones.push(`estado_pago = $${valores.length}::estado_pago_orden`);
  }
  if (filtros.origen) {
    valores.push(filtros.origen);
    condiciones.push(`origen = $${valores.length}::origen_orden`);
  }
  if (filtros.desde) {
    valores.push(filtros.desde);
    condiciones.push(`fecha_recepcion >= $${valores.length}::date`);
  }
  if (filtros.hasta) {
    valores.push(filtros.hasta);
    condiciones.push(`fecha_recepcion < ($${valores.length}::date + interval '1 day')`);
  }
  if (filtros.empleadoId) {
    valores.push(filtros.empleadoId);
    condiciones.push(
      `(empleado_recepcion_id = $${valores.length} OR empleado_entrega_id = $${valores.length})`
    );
  }
  if (filtros.busqueda?.trim()) {
    valores.push(`%${filtros.busqueda.trim()}%`);
    const i = valores.length;
    condiciones.push(
      `(codigo_orden ILIKE $${i} OR cliente_nombre ILIKE $${i}
        OR cliente_apellidos ILIKE $${i} OR cliente_telefono ILIKE $${i}
        OR cliente_email ILIKE $${i})`
    );
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM vw_ordenes_detalle ${where}`,
    valores
  );

  const ordenes = await query(
    `SELECT * FROM vw_ordenes_detalle ${where}
     ORDER BY fecha_recepcion DESC, orden_id DESC
     LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, porPagina, offset]
  );

  return {
    ordenes,
    orders: ordenes, // compatibilidad con el panel actual
    total,
    pagina,
    page: pagina,
    porPagina,
    pageSize: porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
    totalPages: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export async function getOrdenPorId(ordenId: number) {
  const orden = await queryOne(`SELECT * FROM vw_ordenes_detalle WHERE orden_id = $1`, [ordenId]);
  if (!orden) return null;

  const [servicios, productos, historial, pagos, imagenes, costos, direccion] = await Promise.all([
    query(`SELECT * FROM vw_detalles_orden_servicios WHERE orden_id = $1 ORDER BY detalle_servicio_id`, [ordenId]),
    query(`SELECT * FROM vw_detalles_orden_productos WHERE orden_id = $1`, [ordenId]),
    query(`SELECT * FROM vw_historial_estados WHERE orden_id = $1 ORDER BY fecha_cambio DESC`, [ordenId]),
    query(
      `SELECT p.*, NULLIF(TRIM(CONCAT_WS(' ', e.nombre, e.apellidos)), '') AS empleado_nombre
       FROM pagos p LEFT JOIN empleados e ON e.empleado_id = p.empleado_id
       WHERE p.orden_id = $1 ORDER BY p.fecha_pago DESC`,
      [ordenId]
    ),
    query(
      `SELECT archivo_id, tipo, detalle_servicio_id, nombre_archivo, extension,
              tamano, content_type, descripcion, fecha_creacion
       FROM archivos_media
       WHERE entidad_tipo = 'orden' AND entidad_id = $1
       ORDER BY tipo, fecha_creacion DESC`,
      [ordenId]
    ),
    query(`SELECT * FROM costos_adicionales_orden WHERE orden_id = $1`, [ordenId]),
    query(
      `SELECT d.* FROM direcciones d
       JOIN ordenes o ON o.direccion_id = d.direccion_id
       WHERE o.orden_id = $1`,
      [ordenId]
    ),
  ]);

  return {
    ...orden,
    servicios,
    productos,
    historial,
    estados: historial,
    pagos,
    imagenes,
    costos_adicionales: costos,
    direccion,
  };
}

/**
 * Consulta pública de seguimiento.
 *
 * Devuelve EXCLUSIVAMENTE lo que el cliente necesita ver. El endpoint anterior
 * propagaba el objeto entero de la orden: nombre, correo, teléfono, domicilio
 * completo y hasta el historial de pagos, a quien tuviera el código.
 */
export async function getSeguimientoPublico(codigoSeguimiento: string) {
  const orden = await queryOne<any>(
    `SELECT o.orden_id, o.codigo_orden, o.origen,
            es.nombre AS estado, es.color AS estado_color, es.orden AS estado_orden,
            es.es_final AS estado_es_final,
            o.fecha_recepcion, o.fecha_entrega_estimada, o.fecha_entrega_real,
            o.fecha_reservacion, o.cancelada,
            o.estado_pago,
            c.nombre AS cliente_nombre
     FROM ordenes o
     JOIN estados_servicio es ON es.estado_id = o.estado_actual_id
     JOIN clientes c ON c.cliente_id = o.cliente_id
     WHERE o.codigo_seguimiento = $1`,
    [codigoSeguimiento]
  );
  if (!orden) return null;

  const [servicios, historial] = await Promise.all([
    query(
      `SELECT s.nombre AS servicio, d.marca, d.modelo, d.talla, d.color
       FROM detalles_orden_servicios d
       JOIN servicios s ON s.servicio_id = d.servicio_id
       WHERE d.orden_id = $1 ORDER BY d.detalle_servicio_id`,
      [orden.orden_id]
    ),
    query(
      `SELECT e.nombre AS estado, e.color, h.fecha_cambio
       FROM historial_estados h
       JOIN estados_servicio e ON e.estado_id = h.estado_id
       WHERE h.orden_id = $1 ORDER BY h.fecha_cambio ASC`,
      [orden.orden_id]
    ),
  ]);

  return {
    codigo: orden.codigo_orden,
    // Sólo el nombre de pila, para que el cliente reconozca que es su orden.
    nombre: String(orden.cliente_nombre ?? '').split(' ')[0],
    estado: orden.estado,
    estado_color: orden.estado_color,
    estado_orden: orden.estado_orden,
    finalizada: orden.estado_es_final,
    cancelada: orden.cancelada,
    pagada: orden.estado_pago === 'pagado',
    fecha_recepcion: orden.fecha_recepcion,
    fecha_entrega_estimada: orden.fecha_entrega_estimada,
    fecha_entrega_real: orden.fecha_entrega_real,
    fecha_reservacion: orden.fecha_reservacion,
    pares: servicios,
    historial,
  };
}

/** Busca por código de orden legible. Requiere un segundo dato del cliente. */
export async function getSeguimientoPorCodigo(codigoOrden: string, ultimos4Telefono: string) {
  const fila = await queryOne<{ codigo_seguimiento: string }>(
    `SELECT o.codigo_seguimiento
     FROM ordenes o JOIN clientes c ON c.cliente_id = o.cliente_id
     WHERE upper(o.codigo_orden) = upper($1)
       AND right(regexp_replace(COALESCE(c.telefono,''), '\\D', '', 'g'), 4) = $2`,
    [codigoOrden.trim(), ultimos4Telefono.trim()]
  );
  if (!fila) return null;
  return getSeguimientoPublico(fila.codigo_seguimiento);
}

// =============================================================================
// Cambios de estado y cancelación
// =============================================================================

export interface ResultadoCambioEstado {
  ordenId: number;
  estadoAnteriorId: number;
  estadoNuevoId: number;
  estadoNombre: string;
  notificaCliente: boolean;
}

export async function cambiarEstadoOrden(
  ordenId: number,
  estadoId: number,
  empleadoId: number,
  comentario: string | null
): Promise<ResultadoCambioEstado> {
  return withTransaction(async (client) => {
    const orden = await queryOne<{ estado_actual_id: number; cancelada: boolean }>(
      `SELECT estado_actual_id, cancelada FROM ordenes WHERE orden_id = $1 FOR UPDATE`,
      [ordenId],
      client
    );
    if (!orden) throw new NotFoundError(`La orden ${ordenId} no existe.`);
    if (orden.cancelada) throw new BusinessError('La orden está cancelada.');
    if (orden.estado_actual_id === estadoId) {
      throw new BusinessError('La orden ya está en ese estado.');
    }

    const estado = await queryOne<{ nombre: string; notifica_cliente: boolean; es_final: boolean }>(
      `SELECT nombre, notifica_cliente, es_final FROM estados_servicio
       WHERE estado_id = $1 AND activo`,
      [estadoId],
      client
    );
    if (!estado) throw new BusinessError(`El estado ${estadoId} no existe.`);

    await query(
      `UPDATE ordenes SET
         estado_actual_id = $2,
         fecha_entrega_real = CASE WHEN $3 THEN now() ELSE fecha_entrega_real END,
         empleado_entrega_id = CASE WHEN $3 THEN $4 ELSE empleado_entrega_id END
       WHERE orden_id = $1`,
      [ordenId, estadoId, estadoId === ESTADO_ENTREGADO, empleadoId],
      client
    );

    await query(
      `INSERT INTO historial_estados (orden_id, estado_id, empleado_id, comentario)
       VALUES ($1,$2,$3,$4)`,
      [ordenId, estadoId, empleadoId, comentario],
      client
    );

    // Al entregar se libera la ubicación física. Antes el código de ubicación
    // quedaba ocupado para siempre y los espacios de cada caja se agotaban.
    if (estadoId === ESTADO_ENTREGADO) {
      await liberarUbicaciones(client, ordenId, empleadoId);
    }

    return {
      ordenId,
      estadoAnteriorId: orden.estado_actual_id,
      estadoNuevoId: estadoId,
      estadoNombre: estado.nombre,
      notificaCliente: estado.notifica_cliente,
    };
  });
}

async function liberarUbicaciones(client: PoolClient, ordenId: number, empleadoId: number) {
  const liberados = await query<{
    detalle_servicio_id: number;
    caja_almacenamiento: string | null;
    codigo_ubicacion: string | null;
  }>(
    `UPDATE detalles_orden_servicios
     SET caja_almacenamiento = NULL, codigo_ubicacion = NULL
     WHERE orden_id = $1 AND codigo_ubicacion IS NOT NULL
     RETURNING detalle_servicio_id, caja_almacenamiento, codigo_ubicacion`,
    [ordenId],
    client
  );

  for (const l of liberados) {
    await query(
      `INSERT INTO historial_ubicaciones (
         detalle_servicio_id, orden_id, caja_almacenamiento, codigo_ubicacion,
         accion, empleado_id, notas
       ) VALUES ($1,$2,$3,$4,'liberada',$5,'Entrega al cliente')`,
      [l.detalle_servicio_id, ordenId, l.caja_almacenamiento, l.codigo_ubicacion, empleadoId],
      client
    );
  }
}

/**
 * Cancela una orden: revierte inventario y deja el saldo listo para reembolso.
 * Antes no había manera de corregir un cobro equivocado dentro del sistema.
 */
export async function cancelarOrden(
  ordenId: number,
  empleadoId: number,
  motivo: string
): Promise<{ ordenId: number; montoPagado: number }> {
  if (!motivo?.trim()) throw new BusinessError('Se requiere un motivo de cancelación.');

  return withTransaction(async (client) => {
    const orden = await queryOne<{ cancelada: boolean; codigo_orden: string }>(
      `SELECT cancelada, codigo_orden FROM ordenes WHERE orden_id = $1 FOR UPDATE`,
      [ordenId],
      client
    );
    if (!orden) throw new NotFoundError(`La orden ${ordenId} no existe.`);
    if (orden.cancelada) throw new BusinessError('La orden ya estaba cancelada.');

    const productos = await query<{ producto_id: number; cantidad: number }>(
      `SELECT producto_id, cantidad FROM detalles_orden_productos WHERE orden_id = $1`,
      [ordenId],
      client
    );
    for (const p of productos) {
      await registrarMovimiento(
        {
          productoId: p.producto_id,
          tipo: 'devolucion',
          cantidad: p.cantidad,
          ordenId,
          empleadoId,
          motivo: `Cancelación de orden ${orden.codigo_orden}`,
        },
        client
      );
    }

    await liberarUbicaciones(client, ordenId, empleadoId);

    await query(
      `UPDATE ordenes SET
         cancelada = TRUE, cancelada_en = now(), cancelada_por = $2,
         motivo_cancelacion = $3, estado_actual_id = $4
       WHERE orden_id = $1`,
      [ordenId, empleadoId, motivo.trim(), ESTADO_CANCELADA],
      client
    );

    await query(
      `INSERT INTO historial_estados (orden_id, estado_id, empleado_id, comentario)
       VALUES ($1,$2,$3,$4)`,
      [ordenId, ESTADO_CANCELADA, empleadoId, `Cancelada: ${motivo.trim()}`],
      client
    );

    const [{ pagado }] = await query<{ pagado: number }>(
      `SELECT COALESCE(SUM(monto), 0)::numeric AS pagado
       FROM pagos WHERE orden_id = $1 AND estado = 'completado'`,
      [ordenId],
      client
    );

    return { ordenId, montoPagado: Number(pagado) };
  });
}
