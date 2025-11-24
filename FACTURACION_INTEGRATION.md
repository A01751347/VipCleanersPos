# 📄 Sistema de Facturación Electrónica - VipCleaners POS

## 📋 Descripción General

Sistema híbrido de facturación electrónica (CFDI) integrado con **Facturapi** que permite:
- ✅ **Facturación self-service** - Clientes pueden facturar desde la web
- ✅ **Facturación en mostrador** - Empleados pueden facturar directamente desde el admin
- ✅ **Validaciones anti-duplicado** - Evita facturar la misma orden dos veces
- ✅ **Envío automático por email** - PDF y XML se envían al cliente
- ✅ **Auditoría completa** - Log de todas las facturas generadas

---

## 🎯 Flujos de Facturación

### Opción A: Facturación Self-Service (Cliente)

**Ruta**: `https://tudominio.com/facturacion`

**Flujo**:
1. Cliente ingresa código de orden y monto total
2. Sistema valida que la orden existe y el monto coincide
3. Cliente captura datos fiscales (RFC, Razón Social, etc.)
4. Sistema genera factura en Facturapi
5. Factura se envía automáticamente por email
6. Cliente puede descargar PDF y XML

**Ventajas**:
- Cliente lo hace en su tiempo
- No consume tiempo del empleado
- Disponible 24/7

### Opción B: Facturación en Mostrador (Empleado)

**Ubicación**: Panel Admin → Ver Orden → Botón "Facturar"

**Flujo**:
1. Empleado pregunta: "¿Requiere factura?"
2. Si sí, hace clic en "Facturar" en la orden
3. Captura RFC y datos fiscales del cliente
4. Sistema genera factura inmediatamente
5. Factura se envía al email del cliente
6. Empleado puede imprimir o mostrar QR

**Ventajas**:
- Inmediato
- Cliente no necesita hacer nada después
- Control total del empleado

---

## 🚀 Instalación y Configuración

### Paso 1: Ejecutar Migración de Base de Datos

```bash
# Ejecuta el script SQL en tu base de datos MySQL
mysql -u tu_usuario -p lavanderia_tenis < database/migrations/add_facturacion_fields.sql
```

Esto agrega:
- Campos de facturación a tabla `ordenes`
- Tabla `facturas_log` para auditoría
- Tabla `clientes_datos_fiscales` (opcional, para guardar RFCs)

### Paso 2: Crear Cuenta en Facturapi

1. Ve a https://www.facturapi.io
2. Crea una cuenta (gratis para testing)
3. Ve a **API Keys** en el dashboard
4. Copia:
   - **Test Secret Key** (para desarrollo)
   - **Live Secret Key** (para producción)

### Paso 3: Configurar Datos Fiscales de tu Empresa

1. En Facturapi → **Configuración → Organización**
2. Completa:
   - RFC de tu empresa
   - Razón Social
   - Régimen Fiscal (ej: 612 - Personas Físicas con Actividad)
   - Dirección fiscal completa
3. Sube tus certificados del SAT (CSD):
   - Archivo `.cer`
   - Archivo `.key`
   - Contraseña de la llave privada

### Paso 4: Configurar Variables de Entorno

Edita `.env` y completa:

```bash
# Facturapi
FACTURAPI_SECRET_KEY=sk_live_tu_clave_aqui
FACTURAPI_TEST_KEY=sk_test_tu_clave_de_prueba
FACTURAPI_MODE=test  # Cambiar a "live" en producción

# Datos de tu empresa
FACTURAPI_ORGANIZATION_RFC=XAXX010101000
FACTURAPI_ORGANIZATION_NAME=Tu Empresa SA de CV
FACTURAPI_ORGANIZATION_TAX_SYSTEM=612

# URL base (para links en emails)
NEXT_PUBLIC_BASE_URL=https://tudominio.com
NEXT_PUBLIC_COMPANY_NAME=VipCleaners
NEXT_PUBLIC_COMPANY_PHONE=+52 55 1234 5678
```

### Paso 5: Probar en Modo Test

```bash
# Asegúrate de estar en modo test
FACTURAPI_MODE=test

# Reinicia el servidor
npm run dev
# o
bun dev
```

---

## 📝 Uso del Sistema

### Desde la Web (Cliente)

1. Cliente va a: `https://tudominio.com/facturacion`
2. Ingresa:
   - Código de orden (ejemplo: `ORD-2024-001`)
   - Monto total (debe coincidir exactamente)
3. Completa datos fiscales:
   - RFC
   - Razón Social
   - Uso de CFDI (G03 = Gastos en general)
   - Régimen Fiscal
   - Código Postal
   - Email
4. Clic en "Generar Factura"
5. ✅ Recibe factura por email
6. Puede descargar PDF y XML

### Desde el Admin (Empleado)

1. Ve a **Admin → Órdenes**
2. Busca la orden del cliente
3. Clic en "Ver Detalle"
4. Clic en botón "**Facturar**"
5. Completa datos fiscales del cliente
6. Clic en "Generar Factura"
7. ✅ Factura se envía al cliente
8. Puede descargar PDF/XML para imprimirlo

---

## 🛡️ Validaciones de Seguridad

### Anti-Duplicados

El sistema valida:
```sql
✅ Si orden.facturado = TRUE → Rechaza facturar
✅ Si orden.factura_status = 'issued' → Rechaza facturar
✅ Si factura_uuid ya existe → Rechaza facturar
```

### Validación de Monto

Para evitar que alguien facture un ticket ajeno:
```javascript
if (Math.abs(orden.total - montoIngresado) > 0.01) {
  throw Error('El monto no coincide');
}
```

### Validación de RFC

```javascript
const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
if (!rfcPattern.test(rfc)) {
  throw Error('RFC inválido');
}
```

---

## 📊 Estructura de Base de Datos

### Tabla `ordenes` (campos agregados)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `facturado` | BOOLEAN | ¿Ya se facturó? |
| `factura_uuid` | VARCHAR(100) | UUID del CFDI |
| `factura_serie` | VARCHAR(20) | Serie de la factura |
| `factura_folio` | VARCHAR(50) | Folio de la factura |
| `factura_fecha` | DATETIME | Fecha de emisión |
| `factura_pdf_url` | TEXT | URL del PDF |
| `factura_xml_url` | TEXT | URL del XML |
| `factura_status` | ENUM | pending, issued, cancelled |
| `facturapi_id` | VARCHAR(100) | ID en Facturapi |
| `rfc_cliente` | VARCHAR(13) | RFC del cliente |
| `razon_social_cliente` | VARCHAR(255) | Razón social |
| `uso_cfdi` | VARCHAR(10) | Uso del CFDI |
| `regimen_fiscal` | VARCHAR(10) | Régimen fiscal |
| `codigo_postal_fiscal` | VARCHAR(10) | CP fiscal |

### Tabla `facturas_log` (auditoría)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `log_id` | INT | ID del log |
| `orden_id` | INT | Orden facturada |
| `accion` | ENUM | created, cancelled, error, email_sent |
| `factura_uuid` | VARCHAR(100) | UUID |
| `usuario_id` | INT | Quién generó (NULL = self-service) |
| `detalles` | TEXT | JSON con info adicional |
| `fecha_registro` | TIMESTAMP | Cuándo ocurrió |

---

## 🔍 Consultas Útiles

### Ver órdenes facturadas hoy

```sql
SELECT
  codigo_orden,
  total,
  factura_uuid,
  factura_fecha,
  razon_social_cliente
FROM ordenes
WHERE DATE(factura_fecha) = CURDATE()
  AND facturado = TRUE;
```

### Ver órdenes pendientes de facturar

```sql
SELECT
  codigo_orden,
  total,
  fecha_creacion,
  DATEDIFF(NOW(), fecha_creacion) as dias_antiguedad
FROM ordenes
WHERE facturado = FALSE
  AND total > 0
  AND DATEDIFF(NOW(), fecha_creacion) <= 30
ORDER BY fecha_creacion DESC;
```

### Log de facturación del mes

```sql
SELECT
  o.codigo_orden,
  fl.accion,
  fl.factura_uuid,
  fl.fecha_registro,
  u.nombre as usuario_nombre
FROM facturas_log fl
JOIN ordenes o ON fl.orden_id = o.orden_id
LEFT JOIN usuarios u ON fl.usuario_id = u.usuario_id
WHERE MONTH(fl.fecha_registro) = MONTH(NOW())
ORDER BY fl.fecha_registro DESC;
```

---

## 🧪 Testing

### Tarjetas de Prueba (Facturapi Test Mode)

Usa estos RFCs ficticios en modo test:

```
✅ RFC Válido (Persona Física):
   XAXX010101000

✅ RFC Válido (Persona Moral):
   EKU9003173C9

✅ Régimen Fiscal:
   616 = Sin obligaciones fiscales
   612 = Personas Físicas con Actividad
   601 = Personas Morales
```

### Verificar Factura en Facturapi

1. Ve a https://dashboard.facturapi.io
2. **Facturas → Ver todas**
3. Busca por UUID o External ID (código de orden)
4. Verifica que la factura se generó correctamente

---

## 📧 Email de Factura

El sistema envía automáticamente un email con:
- ✅ UUID de la factura
- ✅ Número de orden
- ✅ Botón para descargar PDF
- ✅ Botón para descargar XML
- ✅ Diseño profesional con colores de la marca

---

## 🐛 Solución de Problemas

### Error: "Servicio de facturación no configurado"

**Causa**: Falta `FACTURAPI_SECRET_KEY` o `FACTURAPI_TEST_KEY`

**Solución**:
```bash
# Verifica que estén en .env
echo $FACTURAPI_SECRET_KEY
echo $FACTURAPI_MODE
```

### Error: "CSD no encontrado"

**Causa**: No has subido tus certificados del SAT a Facturapi

**Solución**:
1. Ve a https://dashboard.facturapi.io
2. **Configuración → Organización → Certificados**
3. Sube tu `.cer` y `.key` del SAT

### Error: "RFC inválido"

**Causa**: El RFC no cumple con el formato correcto

**Formato correcto**:
- Persona Física: `AAAA123456XXX` (13 caracteres)
- Persona Moral: `AAA123456XXX` (12 caracteres)

### La factura se genera pero no llega el email

**Causas posibles**:
1. Email configuración SMTP incorrecta
2. Email del cliente está mal escrito
3. El email cayó en SPAM

**Solución**:
1. Verifica configuración SMTP en `.env`
2. Pide al cliente revisar carpeta de SPAM
3. Descarga PDF/XML desde el admin y envialo manual

---

## 📚 Códigos de Uso de CFDI Más Comunes

| Código | Descripción | Cuándo Usar |
|--------|-------------|-------------|
| G01 | Adquisición de mercancías | Compra de productos |
| G02 | Devoluciones, descuentos | Notas de crédito |
| G03 | Gastos en general | **Servicios de lavandería** ⭐ |
| D10 | Pagos por servicios educativos | Colegiaturas |
| P01 | Por definir | Cliente decide después |

---

## 🔐 Seguridad y Cumplimiento

### Datos Sensibles

✅ **RFC** - Se almacena en mayúsculas
✅ **Razón Social** - Se valida que no esté vacía
✅ **UUID** - Se indexa para búsquedas rápidas
✅ **Logs** - Todas las acciones se auditan

### Retención de Datos

- **Facturas**: Se conservan indefinidamente (obligación fiscal)
- **Logs**: Se conservan por 5 años mínimo
- **PDFs/XMLs**: Almacenados en Facturapi (backups automáticos)

---

## 💰 Costos de Facturapi

### Plan Gratuito (Testing)
- ✅ 100 facturas de prueba/mes
- ✅ Todas las funcionalidades
- ✅ Perfecto para desarrollo

### Planes de Pago (Producción)
- **Básico**: ~$300 MXN/mes - 100 facturas
- **Profesional**: ~$800 MXN/mes - 500 facturas
- **Empresarial**: ~$2,000 MXN/mes - Ilimitadas

**Recomendación**: Empieza con Plan Básico y escala según crecimiento

---

## 📈 Métricas y Reportes

### Dashboard de Facturación (Próximamente)

- Total de facturas emitidas
- Monto facturado vs no facturado
- Promedio de tiempo para facturar
- Clientes que más facturan
- Órdenes antiguas sin facturar

---

## 🔄 Próximas Mejoras

- [ ] Cancelación de facturas desde el admin
- [ ] Notas de crédito (devoluciones)
- [ ] Guardar RFCs frecuentes del cliente
- [ ] Complementos de pago (parcialidades)
- [ ] Reporte mensual de facturas
- [ ] Integración con contabilidad
- [ ] Factura global mensual automática

---

## 📞 Soporte

**Facturapi**:
- 📧 Email: soporte@facturapi.io
- 📚 Docs: https://docs.facturapi.io
- 💬 Chat: Disponible en dashboard

**VipCleaners**:
- Revisa logs en `/var/log/facturacion.log`
- Consulta tabla `facturas_log` para auditoría
- Verifica configuración en Facturapi dashboard

---

**Última actualización**: 2025-11-24
**Versión**: 1.0.0
**Proveedor de timbrado**: Facturapi
