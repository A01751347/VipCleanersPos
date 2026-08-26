#!/usr/bin/env node
/**
 * Contención sobre el mismo producto.
 *
 * Verifica que N ventas simultáneas del mismo artículo no sobrevendan: el
 * descuento va bloqueando la fila, así que las que no alcanzan existencia
 * fallan limpio en vez de dejar el stock en negativo.
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL ?? 'admin@vipcleaners.mx';
const PASSWORD = process.env.TEST_PASSWORD ?? 'ClaveLocalDePrueba2026';
const STOCK = 10;
const INTENTOS = 25;

let cookies = '';
const guardar = (r) => {
  for (const c of r.headers.getSetCookie?.() ?? []) {
    const [par] = c.split(';'); const [n] = par.split('=');
    cookies = [...cookies.split('; ').filter(x => x && !x.startsWith(n + '=')), par].join('; ');
  }
};
const pedir = async (ruta, op = {}) => {
  const r = await fetch(`${BASE}${ruta}`, { ...op, headers: { ...(op.headers ?? {}), cookie: cookies }, redirect: 'manual' });
  guardar(r); return r;
};

async function main() {
  let r = await pedir('/api/auth/csrf'); const { csrfToken } = await r.json();
  await pedir('/api/auth/callback/credentials', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD, json: 'true' }),
  });

  const { servicios } = await (await pedir('/api/admin/services')).json();
  const { categorias } = await (await pedir('/api/admin/categories')).json();

  const { producto } = await (await pedir('/api/admin/products', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      categoria_id: categorias[0].categoria_id,
      nombre: `Contención ${Date.now()}`, precio: 50, costo: 20,
      stock: STOCK, stock_minimo: 0,
    }),
  })).json();

  console.log(`\nProducto con ${STOCK} unidades; ${INTENTOS} ventas simultáneas de 1 unidad…\n`);

  const res = await Promise.all(
    Array.from({ length: INTENTOS }, (_, i) =>
      pedir('/api/admin/pos', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cliente: { nombre: `Cont${i}`, telefono: `442${String(7000000 + i)}` },
          servicios: [{ servicioId: servicios[0].servicio_id, cantidad: 1 }],
          productos: [{ productoId: producto.producto_id, cantidad: 1 }],
          pago: { metodo: 'tarjeta', monto: Number(servicios[0].precio) + 50 },
        }),
      }).then(async (r) => ({ status: r.status, cuerpo: await r.json() }))
    )
  );

  const exito = res.filter((x) => x.status === 201).length;
  const rechazo = res.filter((x) => x.status === 400).length;
  const otros = res.filter((x) => x.status !== 201 && x.status !== 400);

  const { producto: final } = await (await pedir(`/api/admin/products/${producto.producto_id}`)).json();

  console.log(`  ventas aceptadas : ${exito}`);
  console.log(`  rechazadas       : ${rechazo}`);
  console.log(`  otros estados    : ${otros.length}${otros.length ? ' ' + JSON.stringify(otros.map(o=>o.status)) : ''}`);
  console.log(`  stock final      : ${final.stock}`);

  let fallos = 0;
  const chk = (n, ok, d='') => { console.log(`  ${ok?'✓':'✗'} ${n}${d?` — ${d}`:''}`); if(!ok) fallos++; };

  chk('se aceptan exactamente las que había en existencia', exito === STOCK, `${exito} de ${STOCK}`);
  chk('el resto se rechaza limpiamente', rechazo === INTENTOS - STOCK, `${rechazo}`);
  chk('el stock queda en cero, nunca negativo', final.stock === 0, `stock=${final.stock}`);
  chk('sin errores 500', otros.length === 0);

  // La bitácora debe cuadrar con lo vendido
  const { movimientos } = await (await pedir(
    `/api/admin/inventory?movimientos=true&productoId=${producto.producto_id}&pageSize=100`
  )).json();
  const salidas = movimientos.filter((m) => m.tipo_movimiento === 'salida').length;
  chk('hay un movimiento de salida por venta aceptada', salidas === exito, `${salidas} salidas / ${exito} ventas`);

  console.log(`\n${fallos === 0 ? '✓ Sin sobreventa bajo contención' : `✗ ${fallos} problema(s)`}\n`);
  process.exit(fallos ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
