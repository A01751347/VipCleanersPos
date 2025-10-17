// Script para verificar empleados en la base de datos
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkEmpleados() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('🔍 Verificando empleados en la base de datos...\n');

    // Primero verificar la estructura de la tabla
    const [structure] = await connection.execute('DESCRIBE empleados');
    console.log('📋 Estructura de la tabla empleados:');
    structure.forEach(col => {
      console.log(`   ${col.Field} | ${col.Type} | ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} | Default: ${col.Default}`);
    });

    console.log('\n');

    const [empleados] = await connection.execute('SELECT * FROM empleados ORDER BY empleado_id');

    if (empleados.length === 0) {
      console.log('❌ No hay empleados registrados en la base de datos');
    } else {
      console.log('👥 Empleados encontrados:');
      empleados.forEach(emp => {
        console.log(`   ID: ${emp.empleado_id} | ${emp.nombre} ${emp.apellidos} | Usuario ID: ${emp.usuario_id || 'N/A'}`);
      });
    }

    // También verificar la tabla de usuarios
    console.log('\n🔍 Verificando usuarios en la base de datos...\n');

    // Primero verificar la estructura de la tabla usuarios
    const [userStructure] = await connection.execute('DESCRIBE usuarios');
    console.log('📋 Estructura de la tabla usuarios:');
    userStructure.forEach(col => {
      console.log(`   ${col.Field} | ${col.Type} | ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} | Default: ${col.Default}`);
    });

    console.log('\n');

    const [usuarios] = await connection.execute('SELECT * FROM usuarios ORDER BY usuario_id');

    if (usuarios.length === 0) {
      console.log('❌ No hay usuarios registrados en la base de datos');
    } else {
      console.log('👤 Usuarios encontrados:');
      usuarios.forEach(user => {
        console.log(`   ID: ${user.usuario_id} | ${user.email} | Rol: ${user.rol}`);
      });
    }

  } catch (error) {
    console.error('❌ Error al consultar la base de datos:', error.message);
  } finally {
    await connection.end();
  }
}

checkEmpleados();