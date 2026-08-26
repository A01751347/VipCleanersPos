#!/usr/bin/env node
/**
 * Traslada los datos de la base MySQL vieja a PostgreSQL.
 *
 * Lee de MYSQL_* y escribe en DATABASE_URL. Es idempotente: se puede correr
 * varias veces; usa ON CONFLICT DO NOTHING y respeta los ids originales.
 *
 * Uso:
 *   node scripts/migrate-from-mysql.mjs --dry-run     cuenta sin escribir
 *   node scripts/migrate-from-mysql.mjs               migra de verdad
 *
 * Requiere que el esquema ya esté aplicado (npm run db:migrate).
 * Instala mysql2 temporalmente si hace falta:  bun add -d mysql2
 */
import pg from 'pg';
import 'dotenv/config';

const DRY = process.argv.includes('--dry-run');

let mysql;
try {
  mysql = (await import('mysql2/promise')).default;
} catch {
  console.error('✗ Falta mysql2. Instálalo temporalmente:  bun add -d mysql2');
  process.exit(1);
}

const log = (...a) => console.log(...a);

/** Convierte los DATETIME de MySQL respetando que venían en horario -06:00. */
function fecha(v) {
  if (!v) return null;
  return v instanceof Date ? v : new Date(v);
}

function tel(v) {
  const d = String(v ?? '').replace(/\D/g, '');
  return d ? d.slice(-10) : null;
}

function correo(v) {
  const e = String(v ?? '').trim().toLowerCase();
  return e || null;
}

async function main() {
  for (const v of ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE', 'DATABASE_URL']) {
    if (!process.env[v]) {
      console.error(`✗ Falta ${v} en .env`);
      process.exit(1);
    }
  }

  const my = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    dateStrings: false,
  });

  const pgc = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
  });
  await pgc.connect();

  const leer = async (sql) => {
    try {
      const [filas] = await my.query(sql);
      return filas;
    } catch (err) {
      log(`  ⚠ no se pudo leer (${err.code}): ${sql.slice(0, 60)}…`);
      return [];
    }
  };

  const resumen = {};
  const contar = (tabla, n) => { resumen[tabla] = (resumen[tabla] ?? 0) + n; };

  try {
    if (!DRY) await pgc.query('BEGIN');

    // ---- usuarios y empleados ---------------------------------------------
    log('\n▸ usuarios');
    for (const u of await leer('SELECT * FROM usuarios')) {
      if (DRY) { contar('usuarios', 1); continue; }
      await pgc.query(
        `INSERT INTO usuarios (usuario_id, email, password, rol, activo, fecha_creacion)
         VALUES ($1,$2,$3,$4::rol_usuario,$5,$6) ON CONFLICT (usuario_id) DO NOTHING`,
        [u.usuario_id, correo(u.email), u.password, u.rol, !!u.activo, fecha(u.fecha_creacion)]
      );
      contar('usuarios', 1);
    }

    log('▸ empleados');
    for (const e of await leer('SELECT * FROM empleados')) {
      if (DRY) { contar('empleados', 1); continue; }
      await pgc.query(
        `INSERT INTO empleados (empleado_id, usuario_id, nombre, apellidos, telefono,
                                direccion, codigo_postal, ciudad, estado, puesto, salario,
                                fecha_contratacion, activo, fecha_creacion)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (empleado_id) DO NOTHING`,
        [e.empleado_id, e.usuario_id, e.nombre, e.apellidos ?? '', tel(e.telefono),
         e.direccion, e.codigo_postal, e.ciudad, e.estado, e.puesto, e.salario,
         e.fecha_contratacion, !!e.activo, fecha(e.fecha_creacion)]
      );
      contar('empleados', 1);
    }

    // ---- catálogo ----------------------------------------------------------
    log('▸ catálogo');
    for (const c of await leer('SELECT * FROM categorias_productos')) {
      if (DRY) { contar('categorias', 1); continue; }
      await pgc.query(
        `INSERT INTO categorias_productos (categoria_id, nombre, descripcion, activo)
         VALUES ($1,$2,$3,$4) ON CONFLICT (categoria_id) DO NOTHING`,
        [c.categoria_id, c.nombre, c.descripcion, !!c.activo]
      );
      contar('categorias', 1);
    }

    for (const s of await leer('SELECT * FROM servicios')) {
      if (DRY) { contar('servicios', 1); continue; }
      await pgc.query(
        `INSERT INTO servicios (servicio_id, nombre, descripcion, precio,
                                tiempo_estimado_minutos, requiere_identificacion,
                                imagen_url, activo, fecha_creacion)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (servicio_id) DO NOTHING`,
        [s.servicio_id, s.nombre, s.descripcion ?? '', s.precio,
         s.tiempo_estimado_minutos ?? 60, !!s.requiere_identificacion,
         s.imagen_url, !!s.activo, fecha(s.fecha_creacion)]
      );
      contar('servicios', 1);
    }

    for (const p of await leer('SELECT * FROM productos')) {
      if (DRY) { contar('productos', 1); continue; }
      await pgc.query(
        `INSERT INTO productos (producto_id, categoria_id, nombre, descripcion, precio,
                                costo, stock, stock_minimo, codigo_barras, imagen_url,
                                activo, fecha_creacion)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULLIF($9,''),$10,$11,$12)
         ON CONFLICT (producto_id) DO NOTHING`,
        [p.producto_id, p.categoria_id, p.nombre, p.descripcion ?? '', p.precio,
         p.costo ?? 0, Math.max(0, p.stock ?? 0), p.stock_minimo ?? 5,
         p.codigo_barras ?? '', p.imagen_url, !!p.activo, fecha(p.fecha_creacion)]
      );
      contar('productos', 1);
    }

    for (const m of await leer('SELECT * FROM marcas')) {
      if (DRY) { contar('marcas', 1); continue; }
      await pgc.query(
        `INSERT INTO marcas (marca_id, nombre, descripcion, logo_url, activo)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (marca_id) DO NOTHING`,
        [m.marca_id, m.nombre, m.descripcion, m.logo_url, !!m.activo]
      );
      contar('marcas', 1);
    }

    for (const m of await leer('SELECT * FROM modelos_calzado')) {
      if (DRY) { contar('modelos', 1); continue; }
      await pgc.query(
        `INSERT INTO modelos_calzado (modelo_id, marca_id, nombre, descripcion, activo)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (modelo_id) DO NOTHING`,
        [m.modelo_id, m.marca_id, m.nombre, m.descripcion, !!m.activo]
      );
      contar('modelos', 1);
    }

    // ---- clientes y direcciones -------------------------------------------
    log('▸ clientes');
    for (const c of await leer('SELECT * FROM clientes')) {
      if (DRY) { contar('clientes', 1); continue; }
      await pgc.query(
        `INSERT INTO clientes (cliente_id, usuario_id, nombre, apellidos, telefono, email,
                               direccion, codigo_postal, ciudad, estado, puntos_fidelidad,
                               fecha_creacion)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (cliente_id) DO NOTHING`,
        [c.cliente_id, c.usuario_id, c.nombre, c.apellidos ?? '', tel(c.telefono),
         correo(c.email), c.direccion, c.codigo_postal, c.ciudad, c.estado,
         c.puntos_fidelidad ?? 0, fecha(c.fecha_creacion)]
      );
      contar('clientes', 1);
    }

    log('▸ direcciones');
    for (const d of await leer('SELECT * FROM direcciones')) {
      if (DRY) { contar('direcciones', 1); continue; }
      await pgc.query(
        `INSERT INTO direcciones (direccion_id, cliente_id, tipo, alias, calle,
                                  numero_exterior, numero_interior, colonia,
                                  delegacion_municipio, ciudad, estado, codigo_postal,
                                  telefono_contacto, destinatario, instrucciones, activo)
         VALUES ($1,$2,$3::tipo_direccion,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (direccion_id) DO NOTHING`,
        [d.direccion_id, d.cliente_id, d.tipo ?? 'domicilio', d.alias, d.calle,
         d.numero_exterior ?? '', d.numero_interior, d.colonia, d.delegacion_municipio,
         d.ciudad, d.estado, d.codigo_postal, tel(d.telefono_contacto),
         d.destinatario, d.instrucciones, !!d.activo]
      );
      contar('direcciones', 1);
    }

    // ---- órdenes -----------------------------------------------------------
    // El esquema viejo separaba `ordenes` de `reservaciones`; aquí todo queda
    // como orden, distinguido por `origen`.
    log('▸ órdenes');
    const empleadoPorDefecto = (await pgc.query(
      'SELECT empleado_id FROM empleados ORDER BY empleado_id LIMIT 1'
    )).rows[0]?.empleado_id ?? null;

    for (const o of await leer('SELECT * FROM ordenes')) {
      if (DRY) { contar('ordenes', 1); continue; }
      const esOnline = String(o.codigo_orden ?? '').startsWith('RES');
      await pgc.query(
        `INSERT INTO ordenes (
           orden_id, codigo_orden, codigo_seguimiento, origen, cliente_id,
           empleado_recepcion_id, empleado_entrega_id, direccion_id,
           subtotal, descuento, impuestos, total,
           estado_actual_id, estado_pago, metodo_pago,
           requiere_identificacion, tiene_identificacion_registrada,
           requiere_pickup, costo_pickup, zona_pickup,
           fecha_recepcion, fecha_entrega_estimada, fecha_entrega_real,
           acepta_terminos, acepta_whatsapp, notas, fecha_creacion
         ) VALUES ($1,$2,encode(gen_random_bytes(20),'base64'),$3::origen_orden,$4,
                   $5,$6,$7,$8,$9,$10,$11,
                   $12,$13::estado_pago_orden,$14::metodo_pago,
                   $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
         ON CONFLICT (orden_id) DO NOTHING`,
        [o.orden_id, o.codigo_orden, esOnline ? 'online' : 'pos', o.cliente_id,
         o.empleado_recepcion_id ?? empleadoPorDefecto, o.empleado_entrega_id,
         o.direccion_id ?? null,
         o.subtotal ?? 0, o.descuento ?? 0, o.impuestos ?? 0, o.total ?? 0,
         // Los estados viejos 1-7 se recorren uno: se insertó 'Pendiente' al inicio.
         Math.min(9, (o.estado_actual_id ?? 1) + 1),
         o.estado_pago ?? 'pendiente',
         o.metodo_pago === 'pendiente' ? null : o.metodo_pago,
         !!o.requiere_identificacion, !!o.tiene_identificacion_registrada,
         !!o.requiere_pickup, o.costo_pickup ?? 0, o.zona_pickup,
         fecha(o.fecha_recepcion), fecha(o.fecha_entrega_estimada), fecha(o.fecha_entrega_real),
         !!o.acepta_terminos, !!o.acepta_whatsapp, o.notas, fecha(o.fecha_creacion)]
      );
      contar('ordenes', 1);
    }

    log('▸ detalles de servicios');
    for (const d of await leer('SELECT * FROM detalles_orden_servicios')) {
      if (DRY) { contar('detalles_servicios', 1); continue; }
      await pgc.query(
        `INSERT INTO detalles_orden_servicios (
           detalle_servicio_id, orden_id, servicio_id, cantidad, precio_unitario,
           descuento, subtotal, modelo_id, marca, modelo, talla, color,
           descripcion_calzado, caja_almacenamiento, codigo_ubicacion, notas_especiales
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (detalle_servicio_id) DO NOTHING`,
        [d.detalle_servicio_id, d.orden_id, d.servicio_id, d.cantidad ?? 1,
         d.precio_unitario, d.descuento ?? 0, d.subtotal, d.modelo_id,
         d.marca, d.modelo, d.talla, d.color, d.descripcion_calzado,
         d.caja_almacenamiento, d.codigo_ubicacion, d.notas_especiales]
      );
      contar('detalles_servicios', 1);
    }

    log('▸ detalles de productos');
    for (const d of await leer('SELECT * FROM detalles_orden_productos')) {
      if (DRY) { contar('detalles_productos', 1); continue; }
      await pgc.query(
        `INSERT INTO detalles_orden_productos (detalle_producto_id, orden_id, producto_id,
                                               cantidad, precio_unitario, descuento, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (detalle_producto_id) DO NOTHING`,
        [d.detalle_producto_id, d.orden_id, d.producto_id, d.cantidad,
         d.precio_unitario, d.descuento ?? 0, d.subtotal]
      );
      contar('detalles_productos', 1);
    }

    log('▸ pagos');
    for (const p of await leer('SELECT * FROM pagos')) {
      if (DRY) { contar('pagos', 1); continue; }
      await pgc.query(
        `INSERT INTO pagos (pago_id, orden_id, monto, metodo, referencia, terminal_id,
                            empleado_id, estado, fecha_pago)
         VALUES ($1,$2,$3,$4::metodo_pago,$5,$6,$7,$8::estado_pago,$9)
         ON CONFLICT (pago_id) DO NOTHING`,
        [p.pago_id, p.orden_id, p.monto, p.metodo, p.referencia, p.terminal_id,
         p.empleado_id ?? empleadoPorDefecto, p.estado ?? 'completado', fecha(p.fecha_pago)]
      );
      contar('pagos', 1);
    }

    log('▸ historial de estados');
    for (const h of await leer('SELECT * FROM historial_estados')) {
      if (DRY) { contar('historial', 1); continue; }
      await pgc.query(
        `INSERT INTO historial_estados (historial_id, orden_id, estado_id, empleado_id,
                                        comentario, fecha_cambio)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (historial_id) DO NOTHING`,
        [h.historial_id, h.orden_id, Math.min(9, (h.estado_id ?? 1) + 1),
         h.empleado_id ?? empleadoPorDefecto, h.comentario, fecha(h.fecha_cambio)]
      );
      contar('historial', 1);
    }

    log('▸ mensajes');
    for (const m of await leer('SELECT * FROM mensajes_contacto')) {
      if (DRY) { contar('mensajes', 1); continue; }
      await pgc.query(
        `INSERT INTO mensajes_contacto (mensaje_id, nombre, email, asunto, mensaje,
                                        esta_leido, esta_destacado, esta_archivado, fecha_creacion)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (mensaje_id) DO NOTHING`,
        [m.mensaje_id, m.nombre, correo(m.email), m.asunto, m.mensaje,
         !!m.esta_leido, !!m.esta_destacado, !!m.esta_archivado, fecha(m.fecha_creacion)]
      );
      contar('mensajes', 1);
    }

    log('▸ configuración');
    for (const c of await leer('SELECT * FROM configuracion_sistema')) {
      if (DRY) { contar('configuracion', 1); continue; }
      await pgc.query(
        `INSERT INTO configuracion_sistema (clave, valor, descripcion)
         VALUES ($1,$2,$3) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor`,
        [c.clave, c.valor, c.descripcion]
      );
      contar('configuracion', 1);
    }

    if (!DRY) {
      // Reajustar las secuencias para que los ids nuevos no choquen con los migrados.
      log('\n▸ ajustando secuencias');
      const tablas = [
        ['usuarios', 'usuario_id'], ['empleados', 'empleado_id'],
        ['clientes', 'cliente_id'], ['direcciones', 'direccion_id'],
        ['servicios', 'servicio_id'], ['productos', 'producto_id'],
        ['categorias_productos', 'categoria_id'], ['marcas', 'marca_id'],
        ['modelos_calzado', 'modelo_id'], ['ordenes', 'orden_id'],
        ['detalles_orden_servicios', 'detalle_servicio_id'],
        ['detalles_orden_productos', 'detalle_producto_id'],
        ['pagos', 'pago_id'], ['historial_estados', 'historial_id'],
        ['mensajes_contacto', 'mensaje_id'],
      ];
      for (const [tabla, col] of tablas) {
        await pgc.query(
          `SELECT setval(pg_get_serial_sequence($1, $2),
                         GREATEST((SELECT COALESCE(MAX(${col}), 0) FROM ${tabla}), 1))`,
          [tabla, col]
        );
      }

      await pgc.query('COMMIT');
    }

    log('\n' + (DRY ? '— Simulación (no se escribió nada) —' : '✓ Migración completada'));
    for (const [tabla, n] of Object.entries(resumen)) {
      log(`  ${String(n).padStart(6)}  ${tabla}`);
    }
    if (!DRY) {
      log('\nSiguiente paso: revisa los totales contra la base vieja antes de apagarla.');
    }
  } catch (err) {
    if (!DRY) await pgc.query('ROLLBACK');
    throw err;
  } finally {
    await my.end();
    await pgc.end();
  }
}

main().catch((err) => {
  console.error('\n✗', err.message);
  process.exit(1);
});
