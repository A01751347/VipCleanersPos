#!/usr/bin/env bash
# Recrea la base de desarrollo desde cero.
#
# Termina primero las conexiones abiertas: sin eso, DROP DATABASE falla en
# silencio si el servidor de desarrollo está corriendo, y las pruebas terminan
# ejecutándose contra datos viejos.
set -euo pipefail

DB="${1:-vipcleaners_dev}"
EMAIL="${SEED_EMAIL:-admin@vipcleaners.mx}"
PASSWORD="${SEED_PASSWORD:-ClaveLocalDePrueba2026}"

echo "▸ Terminando conexiones a $DB"
psql -d postgres -tAc \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB' AND pid <> pg_backend_pid();" \
  >/dev/null

echo "▸ Recreando $DB"
psql -v ON_ERROR_STOP=1 -d postgres \
  -c "DROP DATABASE IF EXISTS $DB;" \
  -c "CREATE DATABASE $DB;" >/dev/null

echo "▸ Aplicando migraciones"
node scripts/migrate.mjs

echo "▸ Creando administrador"
node scripts/seed.mjs --email "$EMAIL" --password "$PASSWORD" --nombre Admin

echo "✓ Base de desarrollo lista"
