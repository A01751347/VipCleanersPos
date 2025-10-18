// Script para probar la visualización de fotos existentes
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPhotoDisplay() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('🔍 Probando visualización de fotos existentes...\n');

    // Verificar qué fotos existen en la base de datos
    const [photos] = await connection.execute(`
      SELECT
        archivo_id,
        tipo,
        entidad_tipo,
        entidad_id,
        nombre_archivo,
        s3_url,
        fecha_creacion
      FROM archivos_media
      WHERE tipo IN ('calzado_entrada', 'calzado_salida')
      ORDER BY fecha_creacion DESC
      LIMIT 10
    `);

    if (photos.length === 0) {
      console.log('❌ No hay fotos de calzado en la base de datos');
      console.log('💡 Sube algunas fotos primero usando la interfaz web');
      return;
    }

    console.log('📸 Fotos encontradas en la base de datos:');
    photos.forEach((photo, index) => {
      console.log(`   ${index + 1}. ID: ${photo.archivo_id}`);
      console.log(`      Tipo: ${photo.tipo}`);
      console.log(`      Entidad: ${photo.entidad_tipo} ${photo.entidad_id}`);
      console.log(`      Archivo: ${photo.nombre_archivo}`);
      console.log(`      URL: ${photo.s3_url}`);
      console.log(`      Fecha: ${photo.fecha_creacion}`);
      console.log('');
    });

    // Probar el endpoint de obtención de fotos
    console.log('🌐 Probando endpoint de obtención de fotos...');

    if (photos.length > 0) {
      const firstPhoto = photos[0];
      console.log(`📋 Para entidad: ${firstPhoto.entidad_tipo} ${firstPhoto.entidad_id}`);
      console.log(`🔗 URL del endpoint: /api/admin/media?entidadTipo=${firstPhoto.entidad_tipo}&entidadId=${firstPhoto.entidad_id}&tipo=${firstPhoto.tipo}`);
    }

    console.log('\n✅ Para probar completamente:');
    console.log('1. Inicia el servidor: npm run dev');
    console.log('2. Ve a una orden que tenga fotos');
    console.log('3. Haz clic en "Editar" en un servicio de calzado');
    console.log('4. Deberías ver las fotos existentes en el modal');

  } catch (error) {
    console.error('❌ Error al probar visualización de fotos:', error);
  } finally {
    await connection.end();
  }
}

testPhotoDisplay();