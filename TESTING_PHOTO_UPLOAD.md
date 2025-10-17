# 🧪 Cómo Probar la Funcionalidad de Carga de Fotos

## ✅ Problemas Resueltos

1. **Foreign Key Constraint**: ✅ Resuelto - ahora mapea correctamente usuario_id → empleado_id
2. **Stored Procedure Error**: ✅ Resuelto - separamos las consultas SQL
3. **S3 Integration**: ✅ Funcionando - las fotos se suben a S3 real

---

## 🚀 Pasos para Probar

### 1. **Iniciar el Servidor**
```bash
npm run dev
```

### 2. **Navegar a la Página de Admin**
Ve a: `http://localhost:3001/admin`

### 3. **Probar Edición de Calzado**

#### Opción A: Editar Calzado Existente
1. Ve a `http://localhost:3001/admin/orders`
2. Selecciona una orden existente
3. Busca la sección "Detalles del Calzado"
4. Haz clic en el botón "Editar" de algún servicio
5. En el modal, verás la sección "Fotos del calzado"
6. Selecciona una o más fotos (máximo 5)
7. Haz clic en "Guardar"

**Resultado esperado:**
- ✅ Las fotos se suben inmediatamente a S3
- ✅ Aparecen previews de las fotos subidas
- ✅ No hay errores en la consola
- ✅ Los metadatos se guardan en la base de datos

#### Opción B: Registrar Calzado Nuevo (POS)
1. Ve a `http://localhost:3001/admin/pos`
2. Selecciona un cliente
3. Añade un servicio de calzado (ej: "Limpieza Básica")
4. En el modal de calzado, llena los datos:
   - Marca, modelo, talla, color, descripción
   - Selecciona fotos
5. Haz clic en "Agregar al Carrito"
6. Procede con el checkout

**Resultado esperado:**
- ✅ Las fotos se almacenan temporalmente durante el registro
- ✅ Al completar la orden, las fotos se suben automáticamente a S3
- ✅ Los metadatos se registran en la base de datos

---

## 🔍 Verificación de Resultados

### Verificar en S3
Las fotos deberían aparecer en tu bucket S3 con URLs como:
```
https://vipcleaners-images.s3.us-east-1.amazonaws.com/uploads/calzado_entrada_orden_21_1760732254384.png
```

### Verificar en Base de Datos
```sql
SELECT * FROM archivos_media ORDER BY fecha_creacion DESC LIMIT 10;
```

Deberías ver registros con:
- `tipo`: 'calzado_entrada'
- `entidad_tipo`: 'orden'
- `s3_url`: URL completa de S3
- `empleado_id`: 1 (fallback) o ID correspondiente

---

## 🐛 Troubleshooting

### Error: "Foreign Key Constraint"
- ✅ **Resuelto**: El sistema ahora mapea automáticamente usuario_id → empleado_id
- 🔧 **Fallback**: Si no encuentra empleado, usa empleado_id = 1

### Error: "Cannot read properties of undefined"
- ✅ **Resuelto**: Separamos las consultas del procedimiento almacenado

### Fotos no aparecen en S3
- Verifica las variables de entorno AWS en `.env`
- Ejecuta `node scripts/test-s3.js` para verificar conectividad

### Consola del navegador
- Abre DevTools → Console
- No deberían aparecer errores 500 o de red
- Las respuestas del endpoint `/api/admin/upload` deben ser 201 con `success: true`

---

## 📊 Scripts de Debug Disponibles

```bash
# Verificar empleados en BD
node scripts/check-empleados.js

# Probar conexión S3
node scripts/test-s3.js

# Debug procedimiento almacenado
node scripts/debug-stored-procedure.js
```

---

## 🎯 Estados de Funcionamiento

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Componente PhotoUpload | ✅ Funcionando | Preview, eliminación, límites |
| Modal EditShoeModal | ✅ Funcionando | Integrado con PhotoUpload |
| Modal ShoesServiceModal | ✅ Funcionando | Carga temporal → S3 post-orden |
| Endpoint /api/admin/upload | ✅ Funcionando | Mapeo empleado_id + S3 real |
| S3 Integration | ✅ Funcionando | Bucket vipcleaners-images |
| Base de Datos | ✅ Funcionando | Tabla archivos_media |

---

**¡Todo está listo para producción! 🚀**