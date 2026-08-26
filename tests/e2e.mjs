#!/usr/bin/env node
/**
 * Prueba de extremo a extremo contra el servidor de desarrollo.
 *
 * Cubre los flujos que el audit marcó como rotos o inseguros, para que quede
 * demostrado que están arreglados y no vuelvan a romperse en silencio.
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL ?? 'admin@vipcleaners.mx';
const PASSWORD = process.env.TEST_PASSWORD ?? 'ClaveLocalDePrueba2026';

let cookies = '';
let ok = 0, fallos = 0;
const errores = [];

function guardarCookies(res) {
  const set = res.headers.getSetCookie?.() ?? [];
  for (const c of set) {
    const [par] = c.split(';');
    const [nombre] = par.split('=');
    const otras = cookies.split('; ').filter((x) => x && !x.startsWith(`${nombre}=`));
    cookies = [...otras, par].join(': ').replace(/: /g, '; ');
  }
}

async function pedir(ruta, opciones = {}) {
  const res = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: { ...(opciones.headers ?? {}), cookie: cookies },
    redirect: 'manual',
  });
  guardarCookies(res);
  return res;
}

function comprobar(nombre, condicion, detalle = '') {
  if (condicion) {
    ok++;
    console.log(`  ✓ ${nombre}`);
  } else {
    fallos++;
    errores.push(`${nombre}${detalle ? ` — ${detalle}` : ''}`);
    console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  }
}

async function json(res) {
  try { return await res.json(); } catch { return {}; }
}

// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nProbando ${BASE}\n`);

  // === 1. Rutas de administración sin sesión =================================
  console.log('▸ Seguridad: rutas de administración sin autenticar');
  const protegidas = [
    ['POST', '/api/admin/pos'],
    ['GET',  '/api/admin/storage-locations?action=map'],
    ['GET',  '/api/admin/storage-locations/generate-code?caja=A'],
    ['GET',  '/api/admin/dashboard/weekly-sales'],
    ['GET',  '/api/admin/orders'],
    ['GET',  '/api/admin/clients'],
    ['GET',  '/api/admin/reports?type=sales'],
    ['GET',  '/api/admin/employees'],
    ['GET',  '/api/admin/inventory'],
    ['GET',  '/api/admin/caja'],
    ['POST', '/api/admin/payments'],
    ['GET',  '/api/admin/settings'],
  ];
  for (const [metodo, ruta] of protegidas) {
    const res = await pedir(ruta, {
      method: metodo,
      ...(metodo === 'POST'
        ? { headers: { 'content-type': 'application/json' }, body: '{}' }
        : {}),
    });
    comprobar(`${metodo} ${ruta} → 401`, res.status === 401, `devolvió ${res.status}`);
  }

  // === 2. Login ==============================================================
  console.log('\n▸ Autenticación');
  const csrfRes = await pedir('/api/auth/csrf');
  const { csrfToken } = await json(csrfRes);
  comprobar('se obtiene token CSRF', Boolean(csrfToken));

  const malRes = await pedir('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, email: EMAIL, password: 'incorrecta', json: 'true' }),
  });
  const cuerpoMal = await json(malRes);
  comprobar('contraseña incorrecta no crea sesión', !String(cuerpoMal.url ?? '').includes('/admin'));

  const loginRes = await pedir('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD, json: 'true' }),
  });
  comprobar('login correcto', loginRes.status < 400, `status ${loginRes.status}`);

  const sesionRes = await pedir('/api/auth/session');
  const sesion = await json(sesionRes);
  comprobar('la sesión trae empleadoId', typeof sesion?.user?.empleadoId === 'number',
    `empleadoId=${sesion?.user?.empleadoId}`);
  comprobar('la sesión trae rol', sesion?.user?.role === 'admin');

  if (!sesion?.user?.empleadoId) {
    console.log('\n✗ Sin sesión válida no se puede continuar.\n');
    process.exit(1);
  }

  // === 3. Catálogo ===========================================================
  console.log('\n▸ Catálogo');
  const servRes = await pedir('/api/admin/services');
  const { servicios } = await json(servRes);
  comprobar('hay servicios en el catálogo', Array.isArray(servicios) && servicios.length > 0);
  const servicio = servicios[0];
  const servicioCaro = servicios.find((s) => s.requiere_identificacion) ?? servicio;

  // === 4. Venta en mostrador =================================================
  console.log('\n▸ Punto de venta');
  const precio = Number(servicio.precio);

  const ordenRes = await pedir('/api/admin/pos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      cliente: { nombre: 'Cliente', apellidos: 'De Prueba', telefono: '4421234567', email: 'prueba@ejemplo.mx' },
      servicios: [
        { servicioId: servicio.servicio_id, cantidad: 1, marca: 'Nike', modelo: 'Air Force 1', talla: '27', color: 'Blanco' },
        { servicioId: servicio.servicio_id, cantidad: 1, marca: 'Adidas', modelo: 'Superstar', talla: '26', color: 'Negro' },
      ],
      productos: [],
      pago: { metodo: 'efectivo', monto: precio * 2, efectivoRecibido: precio * 2 + 100 },
    }),
  });
  const orden = await json(ordenRes);
  comprobar('se crea la orden', ordenRes.status === 201 && orden.success, JSON.stringify(orden).slice(0, 160));

  comprobar('el total lo calcula el servidor', Math.abs(orden.total - precio * 2) < 0.01,
    `esperado ${precio * 2}, recibido ${orden.total}`);
  comprobar('subtotal + impuestos === total',
    Math.abs((orden.subtotal + orden.impuestos) - orden.total) < 0.001,
    `${orden.subtotal} + ${orden.impuestos} != ${orden.total}`);
  comprobar('devuelve un renglón por par', orden.servicios?.length === 2,
    `devolvió ${orden.servicios?.length}`);
  comprobar('cada par trae su detalleServicioId',
    orden.servicios?.every((s) => Number.isInteger(s.detalleServicioId)));

  // El navegador no puede fijar el precio
  const trampaRes = await pedir('/api/admin/pos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      cliente: { nombre: 'Trampa', telefono: '4429999999' },
      servicios: [{ servicioId: servicio.servicio_id, cantidad: 1 }],
      subtotal: 0, iva: 0, total: 0,
      pago: { metodo: 'efectivo', monto: 0.01 },
    }),
  });
  const trampa = await json(trampaRes);
  comprobar('ignora los totales enviados por el cliente',
    trampaRes.status !== 201 || Math.abs(trampa.total - precio) < 0.01,
    `total quedó en ${trampa.total}`);

  // === 5. Detalle de la orden y atribución ===================================
  console.log('\n▸ Detalle de la orden');
  const detRes = await pedir(`/api/admin/orders/${orden.ordenId}`);
  const { orden: detalle } = await json(detRes);
  comprobar('la orden se recupera', Boolean(detalle));
  comprobar('queda atribuida a un empleado real',
    detalle?.empleado_recepcion_id === sesion.user.empleadoId,
    `empleado_recepcion_id=${detalle?.empleado_recepcion_id}`);
  comprobar('el pago se atribuye al cajero de la sesión',
    detalle?.pagos?.[0]?.empleado_id === sesion.user.empleadoId,
    `empleado_id=${detalle?.pagos?.[0]?.empleado_id}`);
  comprobar('el pago guarda el importe aplicado, no el billete',
    Math.abs(Number(detalle?.pagos?.[0]?.monto) - precio * 2) < 0.01,
    `monto=${detalle?.pagos?.[0]?.monto}`);
  comprobar('guarda el efectivo recibido aparte',
    Math.abs(Number(detalle?.pagos?.[0]?.efectivo_recibido) - (precio * 2 + 100)) < 0.01);
  comprobar('calcula el cambio entregado',
    Math.abs(Number(detalle?.pagos?.[0]?.cambio_entregado) - 100) < 0.01,
    `cambio=${detalle?.pagos?.[0]?.cambio_entregado}`);
  comprobar('la orden queda pagada', detalle?.estado_pago === 'pagado');

  // No se puede cobrar de más
  const sobrepagoRes = await pedir('/api/admin/payments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ordenId: orden.ordenId, metodo: 'efectivo', monto: 500 }),
  });
  comprobar('rechaza un pago que excede el saldo', sobrepagoRes.status === 400,
    `status ${sobrepagoRes.status}`);

  // === 6. Almacén ============================================================
  console.log('\n▸ Almacén');
  const par1 = orden.servicios[0].detalleServicioId;
  const par2 = orden.servicios[1].detalleServicioId;

  const ubicRes = await pedir('/api/admin/storage-locations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      locations: [
        { detalleServicioId: par1, ordenId: orden.ordenId, cajaAlmacenamiento: 'A1' },
        { detalleServicioId: par2, ordenId: orden.ordenId, cajaAlmacenamiento: 'A1' },
      ],
    }),
  });
  const ubic = await json(ubicRes);
  comprobar('asigna ubicaciones', ubicRes.status === 200 && ubic.success, JSON.stringify(ubic).slice(0, 140));
  comprobar('genera códigos distintos por par',
    ubic.asignadas?.[0]?.codigoUbicacion !== ubic.asignadas?.[1]?.codigoUbicacion,
    JSON.stringify(ubic.asignadas));

  const codigoOcupado = ubic.asignadas?.[0]?.codigoUbicacion;
  const mapaRes = await pedir('/api/admin/storage-locations?action=map');
  const mapa = await json(mapaRes);
  comprobar('el mapa muestra los pares ubicados', (mapa.ubicaciones?.length ?? 0) >= 2);

  // === 7. Estados y notificación =============================================
  console.log('\n▸ Estados de la orden');
  const estadoRes = await pedir(`/api/admin/orders/${orden.ordenId}/status`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ estadoId: 7, comentario: 'Prueba automática' }),
  });
  const estado = await json(estadoRes);
  comprobar('cambia a "Listo para entrega"', estadoRes.status === 200 && estado.success);
  comprobar('marca que hay que avisar al cliente', estado.notificado === true,
    `notificado=${estado.notificado}`);

  const mismoRes = await pedir(`/api/admin/orders/${orden.ordenId}/status`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ estadoId: 7 }),
  });
  comprobar('rechaza cambiar al mismo estado', mismoRes.status === 400);

  // Entregar libera la ubicación
  await pedir(`/api/admin/orders/${orden.ordenId}/status`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ estadoId: 8, comentario: 'Entregado en prueba' }),
  });
  const detRes2 = await pedir(`/api/admin/orders/${orden.ordenId}`);
  const { orden: detalle2 } = await json(detRes2);
  comprobar('al entregar se libera la ubicación',
    detalle2?.servicios?.every((s) => !s.codigo_ubicacion),
    JSON.stringify(detalle2?.servicios?.map((s) => s.codigo_ubicacion)));

  // El código liberado se puede reutilizar
  const orden2Res = await pedir('/api/admin/pos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      cliente: { nombre: 'Segundo', telefono: '4425556666' },
      servicios: [{ servicioId: servicio.servicio_id, cantidad: 1, marca: 'Puma', modelo: 'Suede' }],
      pago: { metodo: 'tarjeta', monto: precio },
    }),
  });
  const orden2 = await json(orden2Res);
  const reusoRes = await pedir('/api/admin/storage-locations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      locations: [{
        detalleServicioId: orden2.servicios[0].detalleServicioId,
        ordenId: orden2.ordenId,
        cajaAlmacenamiento: 'A1',
        codigoUbicacion: codigoOcupado,
      }],
    }),
  });
  comprobar('el código liberado se puede reutilizar', reusoRes.status === 200,
    `status ${reusoRes.status}`);

  // === 8. Inventario =========================================================
  console.log('\n▸ Inventario');
  const catRes = await pedir('/api/admin/categories');
  const { categorias } = await json(catRes);
  const prodRes = await pedir('/api/admin/products', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      categoria_id: categorias[0].categoria_id,
      nombre: `Producto prueba ${Date.now()}`,
      precio: 120, costo: 60, stock: 10, stock_minimo: 3,
    }),
  });
  const { producto } = await json(prodRes);
  comprobar('se crea un producto', prodRes.status === 201 && producto?.producto_id);

  const movRes = await pedir('/api/admin/inventory?movimientos=true&productoId=' + producto.producto_id);
  const movs = await json(movRes);
  comprobar('la existencia inicial queda como movimiento',
    movs.movimientos?.some((m) => m.tipo_movimiento === 'entrada' && m.cantidad === 10),
    JSON.stringify(movs.movimientos?.map((m) => `${m.tipo_movimiento}:${m.cantidad}`)));

  const entradaRes = await pedir('/api/admin/inventory', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ productoId: producto.producto_id, tipo: 'entrada', cantidad: 5, motivo: 'Resurtido' }),
  });
  const entrada = await json(entradaRes);
  comprobar('se puede resurtir', entradaRes.status === 201 && entrada.stockNuevo === 15,
    `stock=${entrada.stockNuevo}`);

  // Sobreventa
  const sobreventaRes = await pedir('/api/admin/pos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      cliente: { nombre: 'Sobreventa', telefono: '4427778888' },
      servicios: [{ servicioId: servicio.servicio_id, cantidad: 1 }],
      productos: [{ productoId: producto.producto_id, cantidad: 999 }],
      pago: { metodo: 'efectivo', monto: 1 },
    }),
  });
  comprobar('rechaza vender sin existencia', sobreventaRes.status === 400,
    `status ${sobreventaRes.status}`);

  const stockRes = await pedir(`/api/admin/products/${producto.producto_id}`);
  const { producto: prodTrasFallo } = await json(stockRes);
  comprobar('la venta fallida no descontó existencia', prodTrasFallo?.stock === 15,
    `stock=${prodTrasFallo?.stock}`);

  // === 9. Corte de caja ======================================================
  console.log('\n▸ Corte de caja');
  const abrirRes = await pedir('/api/admin/caja', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fondoInicial: 500 }),
  });
  const abrir = await json(abrirRes);
  comprobar('abre caja', abrirRes.status === 201 && abrir.caja?.corte_id);

  const dobleRes = await pedir('/api/admin/caja', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fondoInicial: 200 }),
  });
  comprobar('no permite dos cajas abiertas', dobleRes.status === 400);

  const ventaCajaRes = await pedir('/api/admin/pos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      cliente: { nombre: 'Caja', telefono: '4421112222' },
      servicios: [{ servicioId: servicio.servicio_id, cantidad: 1 }],
      pago: { metodo: 'efectivo', monto: precio, efectivoRecibido: precio },
    }),
  });
  const ventaCaja = await json(ventaCajaRes);

  const cerrarRes = await pedir('/api/admin/caja', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      corteId: abrir.caja.corte_id,
      efectivoDeclarado: 500 + ventaCaja.total,
    }),
  });
  const cerrar = await json(cerrarRes);
  comprobar('cierra caja cuadrada', cerrarRes.status === 200 && Number(cerrar.corte?.diferencia) === 0,
    `diferencia=${cerrar.corte?.diferencia}`);

  // === 10. Seguimiento público ===============================================
  console.log('\n▸ Seguimiento público');
  const sinCookie = cookies;
  cookies = '';

  const trackMalRes = await fetch(`${BASE}/api/track/${orden.codigoOrden}`);
  comprobar('el código solo no basta', trackMalRes.status === 404,
    `status ${trackMalRes.status}`);

  const trackRes = await fetch(`${BASE}/api/track/${orden.codigoOrden}?tel=4567`);
  const track = await json(trackRes);
  comprobar('con los últimos 4 del teléfono sí responde', trackRes.status === 200 && track.success,
    `status ${trackRes.status}`);

  const textoTrack = JSON.stringify(track);
  comprobar('no expone el correo del cliente', !textoTrack.includes('prueba@ejemplo.mx'));
  comprobar('no expone el teléfono completo', !textoTrack.includes('4421234567'));
  comprobar('no expone importes ni pagos',
    !textoTrack.includes('"total"') && !textoTrack.includes('"pagos"'));
  comprobar('no expone apellidos', !textoTrack.includes('De Prueba'));
  comprobar('sí devuelve el estado', Boolean(track.data?.estado));
  comprobar('sí devuelve los pares', Array.isArray(track.data?.pares));

  cookies = sinCookie;

  // === 11. Reservas en línea =================================================
  console.log('\n▸ Reservas en línea');
  const dispRes = await fetch(`${BASE}/api/booking?dias=7`);
  const disp = await json(dispRes);
  comprobar('devuelve disponibilidad', Array.isArray(disp.dias) && disp.dias.length === 7);

  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const pasadoRes = await fetch(`${BASE}/api/booking`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Reserva Pasada', email: 'pasada@ejemplo.mx', phone: '4423334444',
      services: [{ serviceId: servicio.servicio_id, quantity: 1, shoesType: 'Tenis' }],
      deliveryMethod: 'store', bookingDate: ayer, bookingTime: '11:00',
      acceptTerms: true,
    }),
  });
  comprobar('rechaza reservar en el pasado', pasadoRes.status === 400,
    `status ${pasadoRes.status}`);

  const proximoDia = disp.dias?.find((d) => d.disponible);
  if (proximoDia) {
    const reservaRes = await fetch(`${BASE}/api/booking`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Reserva Valida', email: 'valida@ejemplo.mx', phone: '4424445555',
        services: [{ serviceId: servicio.servicio_id, quantity: 1, shoesType: 'Jordan 1' }],
        deliveryMethod: 'store',
        bookingDate: proximoDia.fecha,
        bookingTime: proximoDia.horaApertura,
        acceptTerms: true, acceptWhatsapp: true,
      }),
    });
    const reserva = await json(reservaRes);
    comprobar('crea reserva válida', reservaRes.status === 201 && reserva.success,
      JSON.stringify(reserva).slice(0, 140));
    comprobar('la reserva usa prefijo RES',
      String(reserva.bookingReference ?? '').startsWith('RES'));

    const listaRes = await pedir('/api/admin/orders?origen=online');
    const lista = await json(listaRes);
    comprobar('la reserva aparece en el panel',
      lista.ordenes?.some((o) => o.codigo_orden === reserva.bookingReference),
      `${lista.ordenes?.length ?? 0} reservas listadas`);
  }

  const horaMalaRes = await fetch(`${BASE}/api/booking`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Madrugada', email: 'x@ejemplo.mx', phone: '4426667777',
      services: [{ serviceId: servicio.servicio_id, quantity: 1, shoesType: 'Tenis' }],
      deliveryMethod: 'store',
      bookingDate: proximoDia?.fecha ?? new Date(Date.now() + 172800000).toISOString().slice(0, 10),
      bookingTime: '03:00', acceptTerms: true,
    }),
  });
  comprobar('rechaza reservar fuera de horario', horaMalaRes.status === 400);

  // === 12. Validación ========================================================
  console.log('\n▸ Validación de entrada');
  const vacioRes = await pedir('/api/admin/pos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ cliente: { nombre: 'X' }, servicios: [] }),
  });
  comprobar('rechaza orden sin servicios', vacioRes.status === 400);

  const inexistenteRes = await pedir('/api/admin/pos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      cliente: { nombre: 'X', telefono: '4420000000' },
      servicios: [{ servicioId: 999999, cantidad: 1 }],
    }),
  });
  comprobar('rechaza servicio inexistente', inexistenteRes.status === 400);

  const jsonMalRes = await pedir('/api/admin/pos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{ roto',
  });
  comprobar('maneja JSON inválido sin reventar', jsonMalRes.status === 400,
    `status ${jsonMalRes.status}`);

  // === 13. Reportes ==========================================================
  console.log('\n▸ Reportes');
  // Fecha local del negocio, no la UTC: en México toISOString() ya devuelve
  // el día siguiente a partir de las 18:00.
  const hoy = new Date().toLocaleDateString('en-CA');
  const ventasRes = await pedir(`/api/admin/reports?type=sales&startDate=${hoy}&endDate=${hoy}`);
  const ventas = await json(ventasRes);
  comprobar('reporte de ventas responde', ventasRes.status === 200 && ventas.totales);
  comprobar('el reporte cuenta las ventas del día', Number(ventas.totales?.ordenes) > 0,
    `ordenes=${ventas.totales?.ordenes}`);

  const empRes = await pedir(`/api/admin/reports?type=employees&startDate=${hoy}&endDate=${hoy}`);
  const emp = await json(empRes);
  comprobar('reporte de empleados atribuye ventas',
    emp.empleados?.some((e) => Number(e.ordenes_recibidas) > 0),
    JSON.stringify(emp.empleados?.map((e) => `${e.empleado}:${e.ordenes_recibidas}`)));

  const semanaRes = await pedir('/api/admin/dashboard/weekly-sales?dias=7');
  const semana = await json(semanaRes);
  comprobar('ventas semanales devuelve 7 días', semana.ventas?.length === 7);

  const statsRes = await pedir('/api/admin/dashboard/stats');
  const stats = await json(statsRes);
  comprobar('el tablero responde',
    statsRes.status === 200 && typeof stats.totalBookings === 'number',
    JSON.stringify({ totalBookings: stats.totalBookings, monthlySales: stats.monthlySales }));
  comprobar('el tablero trae las métricas de hoy',
    typeof stats.metricas?.ordenes_hoy === 'number' && stats.metricas.ordenes_hoy > 0,
    `ordenes_hoy=${stats.metricas?.ordenes_hoy}`);
  comprobar('el tablero cuenta los pares sin ubicar',
    typeof stats.pares_sin_ubicar === 'number');

  // === 14. Cancelación =======================================================
  console.log('\n▸ Cancelación');
  const cancelarRes = await pedir(`/api/admin/orders/${orden2.ordenId}`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ motivo: 'Prueba de cancelación' }),
  });
  const cancelar = await json(cancelarRes);
  comprobar('cancela la orden', cancelarRes.status === 200 && cancelar.success,
    JSON.stringify(cancelar).slice(0, 120));

  const sinMotivoRes = await pedir(`/api/admin/orders/${ventaCaja.ordenId}`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ motivo: '' }),
  });
  comprobar('exige motivo para cancelar', sinMotivoRes.status === 400);

  // === 15. Exportaciones =====================================================
  console.log('\n▸ Exportaciones');
  const expClientesRes = await pedir('/api/admin/clients/export');
  comprobar('exporta clientes en CSV',
    expClientesRes.status === 200 &&
    (expClientesRes.headers.get('content-type') ?? '').includes('text/csv'),
    `status ${expClientesRes.status}`);

  const expInvRes = await pedir('/api/admin/inventory/export');
  comprobar('exporta inventario en CSV',
    expInvRes.status === 200 &&
    (expInvRes.headers.get('content-type') ?? '').includes('text/csv'),
    `status ${expInvRes.status}`);

  const empleadosRes = await pedir('/api/admin/employees');
  const empleados = await json(empleadosRes);
  comprobar('lista de empleados responde',
    empleadosRes.status === 200 && (empleados.empleados?.length ?? 0) > 0);

  // === Resumen ===============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${ok} correctas, ${fallos} fallidas`);
  if (fallos > 0) {
    console.log('\n  Fallos:');
    for (const e of errores) console.log(`   · ${e}`);
  }
  console.log('');
  process.exit(fallos > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n✗ La prueba reventó:', err);
  process.exit(1);
});
