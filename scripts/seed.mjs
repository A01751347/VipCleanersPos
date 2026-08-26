#!/usr/bin/env node
/**
 * Crea el primer administrador y datos de catálogo para arrancar.
 *
 * Uso:
 *   node scripts/seed.mjs --email admin@ejemplo.mx --password 'unaClaveLarga' --nombre Ana
 *
 * La contraseña NO se lee de variables de entorno con valor por defecto: el
 * .env anterior traía ADMIN_PASSWORD versionado en un repositorio público.
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

function arg(nombre) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg('email');
  const password = arg('password');
  const nombre = arg('nombre') ?? 'Administrador';
  const apellidos = arg('apellidos') ?? '';

  if (!email || !password) {
    console.error('Uso: node scripts/seed.mjs --email <correo> --password <clave> [--nombre <nombre>]');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('✗ Usa una contraseña de al menos 12 caracteres.');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  try {
    await client.query('BEGIN');

    const existe = await client.query('SELECT usuario_id FROM usuarios WHERE lower(email) = lower($1)', [email]);
    if (existe.rows.length > 0) {
      console.error(`✗ Ya existe un usuario con el correo ${email}.`);
      await client.query('ROLLBACK');
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows: [usuario] } = await client.query(
      `INSERT INTO usuarios (email, password, rol) VALUES ($1, $2, 'admin') RETURNING usuario_id`,
      [email.toLowerCase(), hash]
    );

    const { rows: [empleado] } = await client.query(
      `INSERT INTO empleados (usuario_id, nombre, apellidos, puesto)
       VALUES ($1, $2, $3, 'Administrador') RETURNING empleado_id`,
      [usuario.usuario_id, nombre, apellidos]
    );

    // Servicios de arranque, sólo si el catálogo está vacío
    const { rows: [{ total }] } = await client.query('SELECT COUNT(*)::int AS total FROM servicios');
    if (total === 0) {
      await client.query(
        `INSERT INTO servicios (nombre, descripcion, precio, tiempo_estimado_minutos, requiere_identificacion) VALUES
          ('Limpieza básica',   'Limpieza exterior y de suela',                    250, 90,  false),
          ('Limpieza profunda', 'Limpieza completa, interior, suela y agujetas',   400, 150, false),
          ('Restauración',      'Restauración de color y materiales',              850, 480, true),
          ('Impermeabilización','Tratamiento protector contra agua y manchas',     180, 45,  false)`
      );
      console.log('  · 4 servicios de ejemplo creados');
    }

    await client.query('COMMIT');

    console.log(`\n✓ Administrador creado`);
    console.log(`  correo:   ${email}`);
    console.log(`  empleado: #${empleado.empleado_id}`);
    console.log(`\nYa puedes entrar en /admin/login\n`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
