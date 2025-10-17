// Script para debuggear el procedimiento almacenado RegistrarArchivoMedia
const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugStoredProcedure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('🔍 Debuggeando procedimiento almacenado RegistrarArchivoMedia...\n');

    // Verificar si el procedimiento existe
    const [procedures] = await connection.execute(
      "SHOW PROCEDURE STATUS WHERE Name = 'RegistrarArchivoMedia'"
    );

    if (procedures.length === 0) {
      console.log('❌ El procedimiento RegistrarArchivoMedia no existe');
      return;
    }

    console.log('✅ Procedimiento RegistrarArchivoMedia encontrado');

    // Probar el procedimiento con datos de ejemplo
    const testData = {
      tipo: 'calzado_entrada',
      entidadTipo: 'orden',
      entidadId: 21,
      nombreArchivo: 'test-debug.png',
      extension: 'png',
      tamano: 1000,
      s3Bucket: 'vipcleaners-images',
      s3Key: 'uploads/test-debug.png',
      s3Url: 'https://vipcleaners-images.s3.us-east-1.amazonaws.com/uploads/test-debug.png',
      descripcion: 'Test de debug',
      esPublico: false,
      empleadoId: 1
    };

    console.log('🧪 Ejecutando procedimiento con datos de prueba...');
    console.log('📝 Datos:', JSON.stringify(testData, null, 2));

    // Ejecutar el procedimiento como lo hace el código actualizado
    const values = [
      testData.tipo,
      testData.entidadTipo,
      testData.entidadId,
      testData.nombreArchivo,
      testData.extension,
      testData.tamano,
      testData.s3Bucket,
      testData.s3Key,
      testData.s3Url,
      testData.descripcion,
      testData.esPublico ? 1 : 0,
      testData.empleadoId
    ];

    console.log('📋 Valores:', values);

    // Ejecutar procedimiento
    await connection.query(
      'CALL RegistrarArchivoMedia(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @archivo_id)',
      values
    );

    // Obtener el resultado
    const [result] = await connection.query('SELECT @archivo_id as archivo_id');

    console.log('\n📊 Resultado completo del procedimiento:');
    console.log('Tipo de resultado:', typeof result);
    console.log('Es array:', Array.isArray(result));
    console.log('Contenido:', JSON.stringify(result, null, 2));

    if (Array.isArray(result)) {
      console.log('\n🔍 Analizando array de resultados:');
      result.forEach((item, index) => {
        console.log(`   Índice ${index}:`, typeof item, JSON.stringify(item, null, 2));
      });
    }

    // También verificar la tabla archivos_media directamente
    const [mediaFiles] = await connection.execute(
      'SELECT * FROM archivos_media ORDER BY archivo_id DESC LIMIT 5'
    );

    console.log('\n📁 Últimos 5 archivos en archivos_media:');
    mediaFiles.forEach(file => {
      console.log(`   ID: ${file.archivo_id} | ${file.tipo} | ${file.nombre_archivo}`);
    });

  } catch (error) {
    console.error('❌ Error al debuggear procedimiento:', error);
    console.log('Stack:', error.stack);
  } finally {
    await connection.end();
  }
}

debugStoredProcedure();