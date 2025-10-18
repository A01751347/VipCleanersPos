# 🐛 Debug Drag & Drop - Guía de Solución

## 🔍 **Cambios Realizados para Arreglar el Problema:**

### 1. **Event Listeners Globales**
- Agregado `useEffect` para prevenir comportamiento default del navegador
- Previene que el navegador abra las imágenes directamente

### 2. **Logs de Debug Agregados**
- `console.log('Drag Enter')` - Verifica si se detecta el drag
- `console.log('Drop event triggered')` - Confirma si llega el evento drop
- `console.log('Files:', e.dataTransfer.files)` - Muestra archivos detectados

### 3. **Validación Mejorada**
- Verificación de `e.dataTransfer.types.includes('Files')`
- Mejor detección de salida del área (dragLeave)
- `dropEffect = 'copy'` para indicar acción permitida

### 4. **Área de Drop Mejorada**
- `min-h-[120px]` para área más grande
- `flex items-center justify-center` para mejor layout
- Padding aumentado a `p-8`

---

## 🧪 **Pasos para Debuggear:**

### **1. Abrir DevTools**
```
F12 → Console Tab
```

### **2. Probar Drag & Drop**
1. Ve a: `http://localhost:3001/admin/orders/[id]`
2. Abre modal de edición de calzado
3. **Arrastra una imagen** al área punteada
4. **Observa la consola** - deberías ver:
   ```
   Drag Enter
   Drop event triggered
   Files: FileList {0: File, length: 1}
   Total files: 1
   File type: image/png
   Image files: 1
   ```

### **3. Si NO ves los logs:**

#### **Problema A: No se detecta "Drag Enter"**
- El área no está capturando el evento
- Verificar que el área sea lo suficientemente grande
- Intentar arrastar directamente sobre el texto/icono

#### **Problema B: Se ve "Drag Enter" pero no "Drop"**
- El evento se está cancelando antes del drop
- Intentar mantener presionado y soltar claramente
- Verificar que no hay otros elementos interceptando

#### **Problema C: Se ve "Drop" pero "Files: FileList {length: 0}"**
- El navegador no está pasando los archivos
- Verificar que estás arrastrando imágenes reales
- Intentar con diferentes tipos de archivo

---

## 🔧 **Soluciones Comunes:**

### **Solución 1: Área de Drop Muy Pequeña**
```typescript
// Aumentamos el área mínima
min-h-[120px] flex items-center justify-center
```

### **Solución 2: Browser Intercepta Eventos**
```typescript
// Event listeners globales para prevenir defaults
document.addEventListener('dragenter', preventDefaults);
document.addEventListener('dragover', preventDefaults);
document.addEventListener('drop', preventDefaults);
```

### **Solución 3: dragLeave Prematuro**
```typescript
// Verificación de límites para dragLeave
const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
const x = e.clientX;
const y = e.clientY;

if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
  setIsDragOver(false);
}
```

---

## ⚡ **Prueba Rápida:**

### **Test 1: Área Reactiva**
- Mueve el mouse sobre el área → debe cambiar a hover (borde verde)

### **Test 2: Drag Detection**
- Arrastra cualquier archivo → debe cambiar color/texto

### **Test 3: Drop Functionality**
- Suelta imagen → debe aparecer en console y subirse

---

## 🎯 **Resultado Esperado:**

```
Console Output:
Drag Enter
Drop event triggered
Files: FileList {0: File, length: 1}
Total files: 1
File type: image/png
Image files: 1
```

**UI Changes:**
- ✅ Área cambia a verde al arrastrar
- ✅ Texto cambia a "Suelta las fotos aquí"
- ✅ Escala ligeramente (1.02x)
- ✅ Imagen se sube automáticamente al soltar

---

**Si sigue sin funcionar, revisa la consola y comparte los logs para debug específico.** 🔍