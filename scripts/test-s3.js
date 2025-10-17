// Script para probar la conexión con S3
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');

// Cargar variables de entorno
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testS3() {
  console.log('🧪 Probando conexión con S3...');
  console.log('📝 Configuración:');
  console.log(`   Región: ${process.env.AWS_REGION}`);
  console.log(`   Bucket: ${process.env.AWS_S3_BUCKET}`);
  console.log(`   Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`);

  try {
    // Probar listar objetos en el bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      MaxKeys: 5
    });

    const response = await s3Client.send(listCommand);
    console.log('✅ Conexión exitosa con S3');
    console.log(`📁 Objetos en el bucket: ${response.KeyCount || 0}`);

    // Probar subida de archivo de prueba
    const testData = Buffer.from('Test file for VipCleaners S3 integration');
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: 'test/integration-test.txt',
      Body: testData,
      ContentType: 'text/plain',
    });

    await s3Client.send(uploadCommand);
    console.log('✅ Subida de archivo de prueba exitosa');

    const testUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/test/integration-test.txt`;
    console.log(`🔗 URL de prueba: ${testUrl}`);

  } catch (error) {
    console.error('❌ Error al conectar con S3:', error.message);

    if (error.name === 'NoSuchBucket') {
      console.log('💡 El bucket no existe. Créalo en la consola de AWS.');
    } else if (error.name === 'AccessDenied') {
      console.log('💡 Permisos insuficientes. Verifica las credenciales y políticas.');
    } else if (error.name === 'CredentialsError') {
      console.log('💡 Error en las credenciales. Verifica AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY.');
    }
  }
}

testS3();