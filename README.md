# VIP Cleaners POS

Punto de venta y gestión de operación para un servicio de limpieza de calzado:
recepción del par, almacén físico, cobros, inventario, reservas en línea y
seguimiento para el cliente.

**Stack:** Next.js 15 (App Router) · PostgreSQL · NextAuth · S3 · Tailwind 4

---

## Arrancar en local

```bash
bun install
cp .env.example .env          # llena DATABASE_URL y NEXTAUTH_SECRET

createdb vipcleaners_dev
bun run db:migrate            # aplica el esquema
bun run db:seed --email tu@correo.mx --password 'unaClaveLarga' --nombre Tu

bun run dev                   # http://localhost:3000
```

Genera el secreto de sesión con `openssl rand -base64 32`.

## Comandos

| Comando | Qué hace |
|---|---|
| `bun run dev` | Servidor de desarrollo |
| `bun run build` | Build de producción (falla si hay errores de tipos o lint) |
| `bun run typecheck` | Sólo verificación de tipos |
| `bun run db:migrate` | Aplica las migraciones pendientes |
| `bun run db:status` | Muestra qué migraciones faltan |
| `bun run db:seed` | Crea el primer administrador |
| `bun run db:migrate-from-mysql` | Traslada los datos de la base MySQL anterior |
| `node tests/e2e.mjs` | Prueba de extremo a extremo contra el servidor local |
| `node tests/concurrencia.mjs` | Verifica que dos cajeros simultáneos no crucen órdenes |
| `node tests/navegador.mjs` | Recorre el panel en un navegador real y guarda capturas |

## Cómo está organizado

```
app/
  admin/            Panel: POS, órdenes, almacén, caja, inventario, reportes
  api/admin/        API del panel (toda exige sesión)
  api/{booking,contact,services,track}/   API pública
db/migrations/      Esquema. Única fuente de verdad; nada de DDL a mano.
lib/
  db/               Capa de datos por dominio
    client.ts       Pool, transacciones, traducción de errores
    orders.ts       Creación de órdenes (transaccional), estados, cancelación
    money.ts        Aritmética en centavos enteros
    codes.ts        Códigos de orden y tokens de seguimiento
  auth/             Guardas de rol y límite de peticiones
  storage/          S3 con URLs firmadas
  validation/       Esquemas de entrada (zod)
scripts/            Migraciones, alta inicial, traslado desde MySQL
tests/              Pruebas de extremo a extremo, concurrencia y navegador
```

## Reglas del proyecto

**El esquema sólo cambia por migración.** Agrega un archivo nuevo en
`db/migrations/` con el siguiente número. Una migración ya aplicada es
inmutable: el ejecutor compara su checksum y se detiene si cambió.

**Nada escribe a la base fuera de una transacción** cuando toca más de una
tabla. Usa `withTransaction()` de `lib/db/client.ts`.

**Los importes se calculan en el servidor**, a partir de los precios del
catálogo, y en centavos enteros. El cliente nunca manda totales.

**Toda escritura queda atribuida a un empleado real**, tomado de la sesión.

**El bucket de S3 es privado.** Las imágenes se sirven por
`/api/admin/media/[id]`, que redirige a una URL firmada de 5 minutos.

## Producción

Antes de desplegar, revisa [DESPLIEGUE.md](DESPLIEGUE.md).
