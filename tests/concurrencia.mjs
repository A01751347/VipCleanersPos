#!/usr/bin/env node
/**
 * Prueba de concurrencia.
 *
 * El bug original: `CALL CrearOrden(..., @orden_id)` y `SELECT @orden_id`
 * corrían en llamadas separadas de `pool.query()`, o sea potencialmente en
 * conexiones distintas del pool. Las variables de sesión de MySQL viven en la
 * conexión, así que la segunda consulta podía devolver NULL — o el id de la
 * orden que otro cajero acababa de crear. El resultado era adjuntar los tenis
 * y el pago al ticket de otro cliente.
 *
 * Con una sola conexión dedicada por transacción y RETURNING, eso ya no puede
 * pasar. Esta prueba lo demuestra lanzando N ventas a la vez.
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL ?? 'admin@vipcleaners.mx';
const PASSWORD = process.env.TEST_PASSWORD ?? 'ClaveLocalDePrueba2026';
const N = Number(process.env.N ?? 30);

let cookies = '';

function guardarCookies(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [par] = c.split(';');
    const [nombre] = par.split('=');
    const otras = cookies.split('; ').filter((x) => x && !x.startsWith(`${nombre}=`));
    cookies = [...otras, par].join('; ');
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

async function main() {
  const { csrfToken } = await (await pedir('/api/auth/csrf')).json();
  await pedir('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD, json: 'true' }),
  });

  const { servicios } = await (await pedir('/api/admin/services')).json();
  const servicio = servicios[0];
  const precio = Number(servicio.precio);

  console.log(`\nLanzando ${N} ventas simultáneas…\n`);
  const inicio = Date.now();

  // Cada venta lleva una marca única para poder verificar después que sus
  // renglones quedaron en SU orden y no en la de otro.
  const resultados = await Promise.all(
    Array.from({ length: N }, (_, i) =>
      pedir('/api/admin/pos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cliente: { nombre: `Concurrente${i}`, telefono: `442${String(1000000 + i)}` },
          servicios: [{
            servicioId: servicio.servicio_id,
            cantidad: 1,
            marca: `MARCA-${i}`,
            modelo: `MODELO-${i}`,
          }],
          pago: { metodo: 'tarjeta', monto: precio },
        }),
      }).then(async (r) => ({ i, status: r.status, cuerpo: await r.json() }))
    )
  );

  const ms = Date.now() - inicio;
  const exitosas = resultados.filter((r) => r.status === 201 && r.cuerpo.success);
  const fallidas = resultados.filter((r) => r.status !== 201);

  console.log(`  ${exitosas.length}/${N} creadas en ${ms} ms`);
  if (fallidas.length) {
    console.log(`  ${fallidas.length} fallaron:`);
    for (const f of fallidas.slice(0, 5)) {
      console.log(`    #${f.i}: ${f.status} ${JSON.stringify(f.cuerpo).slice(0, 100)}`);
    }
  }

  let problemas = 0;

  // 1. Todos los ids de orden deben ser distintos
  const ids = exitosas.map((r) => r.cuerpo.ordenId);
  const idsUnicos = new Set(ids);
  if (idsUnicos.size !== ids.length) {
    console.log(`  ✗ ids de orden repetidos: ${ids.length} órdenes, ${idsUnicos.size} ids únicos`);
    problemas++;
  } else {
    console.log(`  ✓ ${idsUnicos.size} ids de orden únicos`);
  }

  // 2. Todos los códigos deben ser distintos
  const codigos = exitosas.map((r) => r.cuerpo.codigoOrden);
  if (new Set(codigos).size !== codigos.length) {
    console.log('  ✗ códigos de orden repetidos');
    problemas++;
  } else {
    console.log(`  ✓ ${codigos.length} códigos de orden únicos`);
  }

  // 3. Cada par debe estar en la orden que lo creó, con SU marca
  let cruzadas = 0;
  for (const r of exitosas) {
    const { orden } = await (await pedir(`/api/admin/orders/${r.cuerpo.ordenId}`)).json();
    const marcas = (orden?.servicios ?? []).map((s) => s.marca);
    if (marcas.length !== 1 || marcas[0] !== `MARCA-${r.i}`) {
      cruzadas++;
      if (cruzadas <= 3) {
        console.log(`  ✗ orden ${r.cuerpo.codigoOrden} esperaba MARCA-${r.i}, tiene ${JSON.stringify(marcas)}`);
      }
    }
  }
  if (cruzadas === 0) {
    console.log(`  ✓ ningún par quedó en la orden equivocada`);
  } else {
    console.log(`  ✗ ${cruzadas} órdenes con pares cruzados`);
    problemas++;
  }

  // 4. Cada orden debe tener exactamente un pago, por su importe
  let pagosMal = 0;
  for (const r of exitosas) {
    const { orden } = await (await pedir(`/api/admin/orders/${r.cuerpo.ordenId}`)).json();
    const pagos = orden?.pagos ?? [];
    if (pagos.length !== 1 || Math.abs(Number(pagos[0].monto) - precio) > 0.01) {
      pagosMal++;
    }
  }
  if (pagosMal === 0) {
    console.log(`  ✓ cada orden tiene exactamente un pago correcto`);
  } else {
    console.log(`  ✗ ${pagosMal} órdenes con pagos incorrectos`);
    problemas++;
  }

  // 5. Sin renglones huérfanos
  const { ordenes } = await (await pedir('/api/admin/orders?pageSize=100')).json();
  const sinPares = (ordenes ?? []).filter((o) => Number(o.total_pares) === 0);
  if (sinPares.length === 0) {
    console.log('  ✓ ninguna orden quedó sin renglones');
  } else {
    console.log(`  ✗ ${sinPares.length} órdenes sin renglones (transacción a medias)`);
    problemas++;
  }

  console.log(`\n${problemas === 0 ? '✓ Sin cruces bajo concurrencia' : `✗ ${problemas} problema(s)`}\n`);
  process.exit(problemas > 0 || fallidas.length > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
