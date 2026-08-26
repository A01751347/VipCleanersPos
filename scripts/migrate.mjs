#!/usr/bin/env node
/**
 * Ejecutor de migraciones.
 *
 * Aplica en orden los archivos de db/migrations y lleva registro de cuáles ya
 * corrieron. Existe porque el esquema anterior se fue modificando a mano
 * directamente en producción: schema.sql dejó de corresponder a la base real
 * (faltaban 4 procedimientos, 2 vistas, 4 tablas y varias columnas), así que no
 * se podía reconstruir la base ni levantar un entorno de pruebas.
 *
 * Uso:
 *   node scripts/migrate.mjs           aplica las pendientes
 *   node scripts/migrate.mjs status    muestra el estado sin aplicar nada
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import pg from 'pg';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, '..', 'db', 'migrations');

const TABLA = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version     TEXT PRIMARY KEY,
    checksum    TEXT NOT NULL,
    aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

function sha(texto) {
  return createHash('sha256').update(texto).digest('hex').slice(0, 16);
}

async function main() {
  const modo = process.argv[2] ?? 'up';

  if (!process.env.DATABASE_URL) {
    console.error('✗ DATABASE_URL no está definida.');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  try {
    await client.query(TABLA);

    const archivos = (await readdir(DIR)).filter((f) => f.endsWith('.sql')).sort();
    const { rows } = await client.query('SELECT version, checksum FROM schema_migrations');
    const aplicadas = new Map(rows.map((r) => [r.version, r.checksum]));

    let pendientes = 0;

    for (const archivo of archivos) {
      const version = archivo.replace(/\.sql$/, '');
      const sql = await readFile(join(DIR, archivo), 'utf8');
      const checksum = sha(sql);

      if (aplicadas.has(version)) {
        if (aplicadas.get(version) !== checksum) {
          console.error(
            `✗ ${version} cambió después de haberse aplicado.\n` +
            '  Una migración aplicada es inmutable: crea una nueva en lugar de editarla.'
          );
          process.exit(1);
        }
        if (modo === 'status') console.log(`  ✓ ${version}`);
        continue;
      }

      pendientes++;
      if (modo === 'status') {
        console.log(`  · ${version} (pendiente)`);
        continue;
      }

      process.stdout.write(`  → aplicando ${version}… `);
      // Cada migración corre en su propia transacción: si falla, no deja el
      // esquema a medias.
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
          [version, checksum]
        );
        await client.query('COMMIT');
        console.log('listo');
      } catch (err) {
        await client.query('ROLLBACK');
        console.log('FALLÓ');
        console.error(`\n${err.message}\n`);
        process.exit(1);
      }
    }

    if (modo === 'status') {
      console.log(`\n${archivos.length} migraciones, ${pendientes} pendientes.`);
    } else if (pendientes === 0) {
      console.log('  Todo al día, no hay migraciones pendientes.');
    } else {
      console.log(`\n✓ ${pendientes} migración(es) aplicada(s).`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
