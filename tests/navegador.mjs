#!/usr/bin/env node
/**
 * Recorrido del panel en un navegador real: login, punto de venta, almacén y caja.
 * Guarda capturas en tests/capturas/ para revisar que la interfaz se ve bien.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL ?? 'admin@vipcleaners.mx';
const PASSWORD = process.env.TEST_PASSWORD ?? 'ClaveLocalDePrueba2026';
const DIR = 'tests/capturas';

let paso = 0;
const errores = [];
const consola = [];

async function capturar(page, nombre) {
  paso++;
  const ruta = `${DIR}/${String(paso).padStart(2, '0')}-${nombre}.png`;
  await page.screenshot({ path: ruta, fullPage: false });
  console.log(`   📸 ${ruta}`);
  return ruta;
}

function comprobar(nombre, ok, detalle = '') {
  console.log(`   ${ok ? '✓' : '✗'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!ok) errores.push(`${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

async function main() {
  await mkdir(DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (m) => {
    if (m.type() === 'error') consola.push(m.text());
  });
  page.on('pageerror', (e) => consola.push(`pageerror: ${e.message}`));

  try {
    // ---- 1. Redirección al login -------------------------------------------
    console.log('\n▸ Acceso sin sesión');
    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
    comprobar('redirige al login', page.url().includes('/admin/login'), page.url());
    await capturar(page, 'login');

    // ---- 2. Login ----------------------------------------------------------
    console.log('\n▸ Login');
    await page.fill('input[type="email"], input[name="email"]', EMAIL);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin(?!\/login)/, { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('networkidle');
    comprobar('entra al panel', !page.url().includes('/login'), page.url());
    await capturar(page, 'tablero');

    const textoTablero = await page.textContent('body');
    comprobar('el tablero carga datos', !/error al cargar/i.test(textoTablero ?? ''));

    // ---- 3. Punto de venta -------------------------------------------------
    console.log('\n▸ Punto de venta');
    await page.goto(`${BASE}/admin/pos`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await capturar(page, 'pos-vacio');

    const hayServicios = await page.locator('text=/limpieza/i').first().isVisible().catch(() => false);
    comprobar('el catálogo de servicios se muestra', hayServicios);

    // Cliente nuevo
    await page.click('text=Nuevo Cliente');
    await page.waitForTimeout(600);
    await capturar(page, 'pos-nuevo-cliente');

    const campos = await page.locator('form input:visible').count();
    comprobar('el formulario de cliente abre', campos > 0, `${campos} campos`);

    await page.fill('input[name="nombre"]', 'Navegador');
    await page.fill('input[name="apellidos"]', 'De Prueba');
    await page.fill('input[name="telefono"]', '4423001122');
    await page.fill('input[name="email"]', `nav${Date.now()}@ejemplo.mx`);
    await capturar(page, 'pos-cliente-lleno');

    await page.click('button:has-text("Guardar Cliente")');
    // Esperar a que el modal se cierre de verdad, no un tiempo fijo.
    await page
      .locator('h2:has-text("Nuevo Cliente")')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});
    await page.waitForTimeout(500);
    await capturar(page, 'pos-cliente-guardado');

    const textoTrasGuardar = await page.textContent('body');
    comprobar('el cliente queda seleccionado', /Navegador De Prueba/.test(textoTrasGuardar ?? ''));

    // Agregar un servicio de calzado
    // "Agregar detalles" abre el modal del par (marca, modelo, talla, fotos)
    await page.locator('button:has-text("Agregar detalles")').first().click();
    await page.waitForTimeout(1000);
    await capturar(page, 'pos-modal-par');

    const inputsModal = page.locator('input:visible');
    const n = await inputsModal.count();
    comprobar('el modal del par abre', n > 0, `${n} campos`);

    await page.getByPlaceholder('Nike, Adidas, Puma...').fill('Nike');
    await page.getByPlaceholder('Air Force 1, Stan Smith...').fill('Air Max 90');
    await page.getByPlaceholder('7, 7.5, 8, 8.5...').fill('27');
    await page.getByPlaceholder('Blanco, Negro, Azul...').fill('Blanco');
    await capturar(page, 'pos-par-lleno');

    await page.click('button:has-text("Agregar al Carrito")');
    await page.waitForTimeout(1200);
    await capturar(page, 'pos-carrito');

    const carrito = await page.textContent('body');
    comprobar('el par entra al carrito', /Nike/i.test(carrito ?? ''));
    comprobar('no aparece "carrito está vacío"', !/carrito está vacío/i.test(carrito ?? ''));

    // ---- 4. Almacén --------------------------------------------------------
    console.log('\n▸ Almacén');
    await page.goto(`${BASE}/admin/warehouse`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await capturar(page, 'almacen');
    const textoAlmacen = await page.textContent('body');
    comprobar('el almacén carga sin error',
      !/error al cargar|no autorizado|internal server/i.test(textoAlmacen ?? ''));

    // ---- 5. Caja -----------------------------------------------------------
    console.log('\n▸ Caja');
    await page.goto(`${BASE}/admin/payments`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await capturar(page, 'caja-cerrada');

    let abrirVisible = await page.locator('button:has-text("Abrir caja")').isVisible().catch(() => false);

    if (!abrirVisible) {
      // Quedó abierta de una corrida anterior: se cierra para empezar limpio.
      const declarado = page.locator('#declarado');
      if (await declarado.isVisible().catch(() => false)) {
        await declarado.fill('0');
        await page.click('button:has-text("Cerrar caja")');
        await page.waitForTimeout(1800);
        abrirVisible = await page.locator('button:has-text("Abrir caja")').isVisible().catch(() => false);
      }
    }
    comprobar('ofrece abrir caja', abrirVisible);

    if (abrirVisible) {
      await page.fill('#fondo', '500');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1500);
      await capturar(page, 'caja-abierta');

      const textoCaja = await page.textContent('body');
      comprobar('la caja queda abierta', /cerrar caja/i.test(textoCaja ?? ''));
      comprobar('muestra el efectivo esperado', /efectivo esperado/i.test(textoCaja ?? ''));
    }

    // ---- 6. Resto del panel ------------------------------------------------
    console.log('\n▸ Resto del panel');
    for (const [ruta, nombre] of [
      ['/admin/orders', 'ordenes'],
      ['/admin/bookings', 'reservas'],
      ['/admin/inventory', 'inventario'],
      ['/admin/clients', 'clientes'],
      ['/admin/reports', 'reportes'],
      ['/admin/services', 'servicios'],
      ['/admin/settings', 'ajustes'],
      ['/admin/messages', 'mensajes'],
    ]) {
      await page.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const txt = await page.textContent('body');
      const roto = /error al cargar|no autorizado|internal server error|Application error/i.test(txt ?? '');
      comprobar(`${ruta} carga`, !roto);
      await capturar(page, nombre);
    }

    // ---- 7. Sitio público --------------------------------------------------
    console.log('\n▸ Sitio público');
    const anon = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pub = await anon.newPage();
    pub.on('pageerror', (e) => consola.push(`público pageerror: ${e.message}`));

    await pub.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await pub.waitForTimeout(2500);
    await pub.screenshot({ path: `${DIR}/${String(++paso).padStart(2,'0')}-portada.png` });
    console.log(`   📸 ${DIR}/${String(paso).padStart(2,'0')}-portada.png`);
    comprobar('la portada carga', (await pub.title()).length > 0);

    await pub.goto(`${BASE}/tracking`, { waitUntil: 'domcontentloaded' });
    await pub.waitForTimeout(800);
    await pub.screenshot({ path: `${DIR}/${String(++paso).padStart(2,'0')}-seguimiento.png` });
    console.log(`   📸 ${DIR}/${String(paso).padStart(2,'0')}-seguimiento.png`);
    const txtSeg = await pub.textContent('body');
    comprobar('el seguimiento pide el teléfono', /últimos 4 dígitos/i.test(txtSeg ?? ''));

    await pub.goto(`${BASE}/no-existe-esta-pagina`, { waitUntil: 'domcontentloaded' });
    await pub.waitForTimeout(500);
    await pub.screenshot({ path: `${DIR}/${String(++paso).padStart(2,'0')}-404.png` });
    console.log(`   📸 ${DIR}/${String(paso).padStart(2,'0')}-404.png`);
    const txt404 = await pub.textContent('body');
    comprobar('hay página 404 propia', /no encontramos esta página/i.test(txt404 ?? ''));

    await anon.close();
  } finally {
    await browser.close();
  }

  console.log(`\n${'─'.repeat(60)}`);
  if (consola.length) {
    console.log(`\n  ⚠ ${consola.length} error(es) de consola:`);
    for (const c of [...new Set(consola)].slice(0, 12)) console.log(`   · ${c.slice(0, 160)}`);
  } else {
    console.log('\n  ✓ Sin errores de consola');
  }

  if (errores.length) {
    console.log(`\n  ✗ ${errores.length} comprobación(es) fallida(s):`);
    for (const e of errores) console.log(`   · ${e}`);
  } else {
    console.log('  ✓ Todas las comprobaciones pasaron');
  }
  console.log('');
  process.exit(errores.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
