# 📸 Testing Photo Display - Guía Completa

## ✅ Funcionalidades Implementadas

### 1. **Carga de Fotos** ✅
- Upload a S3 real
- Almacenamiento en base de datos
- Preview durante la carga

### 2. **Visualización de Fotos Existentes** ✅ **NUEVO**
- Carga automática de fotos al abrir modal
- Display de fotos previamente subidas
- Loading state mientras carga

### 3. **Eliminación de Fotos** ✅ **NUEVO**
- Elimina de S3
- Elimina de base de datos
- UI actualizada en tiempo real

---

## 🧪 Pasos de Prueba

### **Paso 1: Verificar Fotos Existentes**
```bash
node scripts/test-photo-display.js
```

**Resultado esperado:**
- Lista de fotos en la base de datos
- URLs de S3 válidas
- Información de entidades (orden, detalle)

### **Paso 2: Probar Visualización**

1. **Inicia el servidor:**
   ```bash
   npm run dev
   ```

2. **Ve a una orden con fotos:**
   - Navega a `http://localhost:3001/admin/orders`
   - Selecciona la orden 21 (que tiene fotos según el test)

3. **Abre modal de edición:**
   - Haz clic en "Editar" en cualquier servicio de calzado
   - **Deberías ver:**
     - ⏳ Loading spinner inicial
     - 📸 Fotos existentes cargadas automáticamente
     - 🔄 Posibilidad de añadir más fotos
     - 🗑️ Botón X para eliminar fotos

### **Paso 3: Probar Funcionalidades**

#### ✅ **Cargar Fotos Existentes**
- Al abrir el modal → fotos aparecen automáticamente
- No hay errores en la consola del navegador

#### ✅ **Añadir Nuevas Fotos**
- Selecciona archivos → se suben a S3
- Aparecen junto a las fotos existentes

#### ✅ **Eliminar Fotos**
- Haz clic en X → foto desaparece inmediatamente
- Se elimina de S3 y base de datos

---

## 🔍 Endpoints Disponibles

### **GET `/api/admin/media`**
**Obtener fotos de una entidad:**
```
GET /api/admin/media?entidadTipo=orden&entidadId=21&tipo=calzado_entrada
```

**Respuesta:**
```json
{
  "success": true,
  "files": [
    {
      "id": 5,
      "url": "https://vipcleaners-images.s3.us-east-1.amazonaws.com/uploads/...",
      "tipo": "calzado_entrada",
      "nombreArchivo": "foto.png",
      "extension": "png",
      "tamano": 1092390,
      "descripcion": "Foto de calzado",
      "fechaCreacion": "2025-10-17T20:30:14.000Z"
    }
  ]
}
```

### **DELETE `/api/admin/media/[id]`**
**Eliminar foto específica:**
```
DELETE /api/admin/media/5
```

---

## 🐛 Troubleshooting

### **Problem: "No aparecen fotos existentes"**

**Solución 1:** Verificar que hay fotos en BD
```bash
node scripts/test-photo-display.js
```

**Solución 2:** Verificar endpoint en DevTools
- F12 → Network
- Buscar llamada a `/api/admin/media`
- Verificar que responda 200 con fotos

**Solución 3:** Verificar parámetros
- `entityType` = "orden"
- `entityId` = número válido de orden
- `photoType` = "calzado_entrada"

### **Problem: "Error 401 Unauthorized"**
- Verificar que estás logueado como admin
- Revisar cookies de sesión

### **Problem: "Fotos se suben pero no se ven después"**
- ✅ **RESUELTO**: Ahora el componente carga fotos automáticamente

---

## 📊 Estados del Sistema

| Funcionalidad | Estado | Componente |
|---------------|---------|------------|
| Cargar fotos existentes | ✅ Funcionando | PhotoUpload |
| Mostrar loading state | ✅ Funcionando | PhotoUpload |
| Upload nuevas fotos | ✅ Funcionando | PhotoUpload |
| Eliminar fotos | ✅ Funcionando | PhotoUpload + API |
| Endpoint GET media | ✅ Funcionando | /api/admin/media |
| Endpoint DELETE media | ✅ Funcionando | /api/admin/media/[id] |

---

## 🎯 URLs de Prueba

Con fotos existentes:
- `http://localhost:3001/admin/orders/21` (tiene varias fotos)
- `http://localhost:3001/admin/orders/2` (tiene 1 foto)

Sin fotos:
- Cualquier otra orden nueva

---

**🎉 ¡El problema está resuelto! Las fotos ahora se muestran correctamente después de subirlas.**