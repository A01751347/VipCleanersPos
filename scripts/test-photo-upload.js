// Script para probar la carga de fotos simulando una llamada al endpoint
const FormData = require('form-data');
const fs = require('fs');

// Para testing usaremosun archivo de prueba pequeño
async function testPhotoUpload() {
  console.log('🧪 Probando endpoint de carga de fotos...');

  // Crear un archivo de prueba pequeño
  const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGGaraD7AAAAABJRU5ErkJggg==', 'base64');

  // Simular FormData
  const formData = new FormData();
  formData.append('file', testImageData, {
    filename: 'test-image.png',
    contentType: 'image/png'
  });
  formData.append('tipo', 'calzado_entrada');
  formData.append('entidadTipo', 'orden');
  formData.append('entidadId', '21');
  formData.append('descripcion', 'Foto de prueba de integración');

  try {
    const response = await fetch('http://localhost:3001/api/admin/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Aquí necesitarías las cookies de sesión real para probar
        'Cookie': 'next-auth.session-token=your-session-token'
      }
    });

    console.log('📨 Status:', response.status);
    const result = await response.json();
    console.log('📝 Response:', result);

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.log('💡 Para probar completamente, usa la interfaz web con una sesión activa');
  }
}

console.log('💡 Para probar la carga de fotos completa:');
console.log('1. Inicia el servidor: npm run dev');
console.log('2. Ve a http://localhost:3001/admin/orders/[id]');
console.log('3. Intenta editar un calzado y subir una foto');
console.log('4. Verifica que no haya errores de foreign key');

testPhotoUpload();