// scripts/create-admin-user.js
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdminUser() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('🔗 Conectado a la base de datos');

    // Datos del administrador
    const adminData = {
      email: 'admint@vipcleaners.com',
      password: 'admin123', // Cambia esto por una contraseña segura
      nombre: 'Administrador',
      apellidos: 'Sistema',
      telefono: '5555555555',
      puesto: 'Administrador'
    };

    // Generar hash de la contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 12);
    console.log('🔐 Contraseña hasheada generada');

    // Verificar si ya existe un usuario con este email
    const [existingUsers] = await connection.execute(
      'SELECT usuario_id FROM usuarios WHERE email = ?',
      [adminData.email]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  Ya existe un usuario con este email');
      return;
    }

    // Iniciar transacción
    await connection.beginTransaction();

    try {
      // 1. Crear usuario
      const [userResult] = await connection.execute(
        `INSERT INTO usuarios (email, password, rol, activo, fecha_creacion) 
         VALUES (?, ?, 'admin', TRUE, NOW())`,
        [adminData.email, hashedPassword]
      );

      const usuarioId = userResult.insertId;
      console.log('✅ Usuario creado con ID:', usuarioId);

      // 2. Crear empleado (opcional, si la tabla existe)
      try {
        await connection.execute(
          `INSERT INTO empleados (usuario_id, nombre, apellidos, email, telefono, puesto, activo, fecha_contratacion) 
           VALUES (?, ?, ?, ?, ?, ?, TRUE, CURDATE())`,
          [usuarioId, adminData.nombre, adminData.apellidos, adminData.email, adminData.telefono, adminData.puesto]
        );
        console.log('✅ Empleado creado');
      } catch (empError) {
        console.log('⚠️  No se pudo crear el empleado (tabla puede no existir):', empError.message);
      }

      // Confirmar transacción
      await connection.commit();

      console.log('\n🎉 ¡Usuario administrador creado exitosamente!');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Contraseña:', adminData.password);
      console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };