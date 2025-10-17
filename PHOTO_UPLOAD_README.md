# 📸 Sistema de Carga de Fotos - VipCleaners

## Funcionalidad Implementada

### 🎯 Características Principales

✅ **Carga de fotos para calzado en registro y edición**
✅ **Integración completa con AWS S3**
✅ **Almacenamiento de metadatos en base de datos**
✅ **Componentes reutilizables**
✅ **Manejo de errores y estados de carga**

---

## 🛠️ Componentes Implementados

### 1. **PhotoUpload Component** (`/components/PhotoUpload.tsx`)
- Componente reutilizable para cargar múltiples fotos
- Integración directa con S3 a través del endpoint `/api/admin/upload`
- Preview de fotos con opción de eliminar
- Límite configurable de fotos (default: 5)
- Validación de tipos de archivo y tamaño

### 2. **EditShoeModal** (Actualizado)
- Integra el componente PhotoUpload
- Permite añadir/editar fotos al editar detalles de calzado
- Funciona con órdenes existentes (requiere `ordenId`)

### 3. **ShoesServiceModal** (Actualizado)
- Mantiene sistema de archivos locales durante registro
- Fotos se suben automáticamente a S3 después de crear la orden
- Mensaje informativo para el usuario

---

## 🔧 Configuración Técnica

### Variables de Entorno Requeridas
```env
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=tu-bucket-name
```

### Base de Datos
- Tabla `archivos_media` configurada para almacenar metadatos
- Procedimiento `RegistrarArchivoMedia` para registrar archivos
- Soporte para diferentes tipos: `calzado_entrada`, `calzado_salida`, `identificacion`

---

## 🔄 Flujo de Trabajo

### Registro de Calzado (Nuevo)
1. Usuario llena datos del calzado
2. Añade fotos (almacenadas temporalmente)
3. Al crear la orden → fotos se suben automáticamente a S3
4. Metadatos se registran en base de datos

### Edición de Calzado (Existente)
1. Usuario abre modal de edición
2. Puede añadir nuevas fotos → se suben inmediatamente a S3
3. Cambios se guardan en tiempo real

---

## 📁 Estructura de Archivos en S3

```
uploads/
├── calzado_entrada_orden_123_1634567890123.jpg
├── calzado_entrada_orden_123_1634567890456.png
└── identificacion_orden_456_1634567891789.pdf
```

**Formato de nombres:**
`{tipo}_{entidadTipo}_{entidadId}_{timestamp}.{extension}`

---

## 🌐 URLs Generadas

Las fotos se almacenan con URLs públicas:
```
https://vipcleaners-images.s3.us-east-1.amazonaws.com/uploads/archivo.jpg
```

---

## 🔍 API Endpoints

### POST `/api/admin/upload`
**Parámetros FormData:**
- `file`: Archivo a subir
- `tipo`: Tipo de archivo (`calzado_entrada`, `calzado_salida`, etc.)
- `entidadTipo`: Tipo de entidad (`orden`, `cliente`, etc.)
- `entidadId`: ID de la entidad
- `descripcion`: Descripción opcional

**Respuesta:**
```json
{
  "success": true,
  "archivoId": 123,
  "url": "https://bucket.s3.region.amazonaws.com/uploads/file.jpg"
}
```

---

## 🚀 Uso en Desarrollo

### Probar S3 Connection
```bash
node scripts/test-s3.js
```

### Verificar Variables de Entorno
Asegúrate de que las variables AWS estén configuradas sin espacios al inicio.

---

## 🎨 Componentes de UI

### PhotoUpload Props
```typescript
interface PhotoUploadProps {
  entityType: 'orden' | 'cliente' | 'empleado' | 'producto' | 'servicio' | 'marca';
  entityId: number;
  photoType?: 'calzado_entrada' | 'calzado_salida' | 'identificacion' | 'otro';
  onPhotosUploaded?: (urls: string[]) => void;
  maxPhotos?: number;
  existingPhotos?: string[];
}
```

### Ejemplo de Uso
```tsx
<PhotoUpload
  entityType="orden"
  entityId={123}
  photoType="calzado_entrada"
  onPhotosUploaded={(urls) => console.log('Fotos subidas:', urls)}
  maxPhotos={5}
/>
```

---

## 🛡️ Seguridad

- ✅ Autenticación requerida (rol admin)
- ✅ Validación de tipos de archivo
- ✅ Límites de tamaño (5MB por imagen configurado en cliente)
- ✅ Nombres únicos para evitar colisiones
- ✅ Metadatos registrados para auditoría

---

## 📝 Notas Adicionales

- Las fotos se procesan en paralelo para mejor rendimiento
- Sistema robusto de manejo de errores
- URLs persistentes en S3
- Integración completa con el sistema de órdenes existente

---

**Estado:** ✅ **Completamente Implementado y Funcional**