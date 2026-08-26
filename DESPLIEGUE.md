# Despliegue a producción

## ⚠️ Antes que nada: rotar credenciales

El archivo `.env` estuvo versionado en un repositorio **público** de GitHub
hasta este cambio. Las credenciales que contenía deben considerarse
comprometidas, aunque el archivo ya no esté en el índice.

Este cambio hizo `git rm --cached .env`, así que deja de subirse — pero **sigue
en el histórico** y cualquiera puede recuperarlo.

Pendiente, en este orden:

1. **Rotar todo** (primero, porque limpiar el histórico no invalida nada):
   - contraseña de MySQL/PostgreSQL
   - `NEXTAUTH_SECRET` → `openssl rand -base64 32`
   - contraseña SMTP
   - contraseña del usuario administrador
   - llaves de Cloudflare Turnstile
2. **Limpiar el histórico**: `git filter-repo --path .env --invert-paths`, o BFG.
   Después `git push --force`. Avisa a quien tenga clones.
3. **Poner el repositorio en privado** mientras tanto.
4. **Revisar los logs de acceso de la base** buscando conexiones desconocidas.

---

## Variables de entorno

Todas van en el panel del proveedor de hosting, ninguna en el repositorio.
`next.config.ts` ya no las hornea en el build, así que se leen en tiempo de
ejecución y se pueden rotar sin reconstruir.

| Variable | Obligatoria | Nota |
|---|---|---|
| `DATABASE_URL` | Sí | `postgresql://usuario:clave@host:5432/base` |
| `DB_SSL` | En producción | Pon `require` |
| `NEXTAUTH_URL` | Sí | **El dominio real con https.** Si queda en localhost, el login no funciona. |
| `NEXTAUTH_SECRET` | Sí | 32 bytes aleatorios |
| `AWS_REGION` · `AWS_ACCESS_KEY_ID` · `AWS_SECRET_ACCESS_KEY` · `AWS_S3_BUCKET` | Para fotos | Sin ellas, subir archivos devuelve 503 con un mensaje claro |
| `TURNSTILE_SECRET_KEY` · `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Sí | Sin ellas el sitio público queda sin protección anti-bot |
| `SMTP_*` | Para avisos | Sin ellas no se envían correos al cliente |
| `WHATSAPP_TOKEN` · `WHATSAPP_PHONE_NUMBER_ID` | No | Sin ellas los avisos por WhatsApp simplemente no salen |
| `SKIP_TURNSTILE` | **No la definas** | Sólo tiene efecto fuera de producción |

## Base de datos

```bash
bun run db:migrate      # aplica el esquema
bun run db:status       # confirma que no quedan pendientes
```

El usuario de la aplicación no necesita `DROP` ni `GRANT`. Dale sólo
`SELECT, INSERT, UPDATE, DELETE` sobre el esquema `public`, y usa un usuario
distinto para las migraciones.

Restringe el acceso a la base por IP de origen y exige TLS.

### Migrar los datos de MySQL

```bash
bun add -d mysql2                      # sólo para el traslado
# llena MYSQL_* en .env
bun run db:migrate-from-mysql -- --dry-run   # cuenta sin escribir
bun run db:migrate-from-mysql                # migra de verdad
bun remove mysql2
```

Compara los totales contra la base vieja antes de apagarla. El script es
idempotente y respeta los ids originales.

## S3

El bucket debe tener **Block Public Access activado**. La aplicación sólo
guarda la llave del objeto y firma URLs de 5 minutos al servirlas, así que las
fotos de identificación dejan de ser accesibles por URL adivinable.

## Lista de verificación

### Configuración
- [ ] Credenciales rotadas y `.env` fuera del histórico de git
- [ ] Repositorio en privado (o histórico limpio)
- [ ] `NEXTAUTH_URL` con el dominio real de producción
- [ ] Las cuatro variables `AWS_*` definidas
- [ ] `SKIP_TURNSTILE` ausente
- [ ] Base con TLS y acceso restringido por IP
- [ ] Usuario de base sin permisos de `DROP`

### Datos
- [ ] `bun run db:status` sin pendientes
- [ ] Respaldo automático diario configurado
- [ ] **Restauración de respaldo probada** en una base limpia, no sólo configurada
- [ ] Bucket de S3 con Block Public Access
- [ ] Empleados reales dados de alta con su usuario vinculado

### Verificación funcional
- [ ] Dos cajeros cobrando en paralelo 30 minutos sin órdenes cruzadas
      (`node tests/concurrencia.mjs` cubre el caso automático)
- [ ] Foto de un par visible en el detalle de la orden después de cobrar
- [ ] Un pago aparece con el nombre del cajero que lo hizo
- [ ] Correo de cambio de estado recibido por un cliente de prueba
- [ ] Seguimiento público: no devuelve dirección, correo, teléfono ni pagos
- [ ] Las rutas `/api/admin/*` devuelven 401 sin sesión
      (`node tests/e2e.mjs` lo verifica en las 12 principales)
- [ ] Corte de caja cuadrado contra un conteo físico de efectivo

### Operación
- [ ] Monitoreo de errores conectado (Sentry u otro)
- [ ] Alerta de caída a un teléfono real
- [ ] Procedimiento escrito para cuando el sistema se cae a media jornada
- [ ] Al menos dos personas con acceso de administrador

## Lo que queda pendiente

Fuera del alcance de este cambio, en orden de rendimiento:

1. **WhatsApp Business API.** El código de envío ya está en
   `lib/notifications.ts` detrás de configuración; falta dar de alta la cuenta
   y poner las dos variables. El consentimiento ya se captura y los términos ya
   lo prometen.
2. **Cobro real con tarjeta.** Hoy `tarjeta` y `mercado_pago` son etiquetas: el
   cajero teclea que se pagó, nadie verifica contra el proveedor.
3. **Cal.com para recolección y entrega a domicilio.** El cupo de mostrador ya
   se resuelve con `capacidad_dia`; Cal.com aplica a las citas con repartidor.
4. **Facturación CFDI 4.0.** Los campos fiscales del cliente ya existen en la
   tabla `clientes`; falta la integración con un PAC.
5. **Monitoreo de errores.** Ganchos listos en `app/error.tsx` y
   `app/global-error.tsx`.
6. **Etiquetas QR por par.** Cada par ya tiene su `detalle_servicio_id` y su
   ubicación; imprimir la etiqueta elimina el error de emparejar tenis con
   ticket.
