#!/usr/bin/env node
// scripts/update-questions-table.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Cargando variables de entorno desde ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('Archivo .env.local no encontrado, usando .env');
  dotenv.config();
}

async function updateQuestionsTable() {
  let pool;
  try {
    // Configurar pool de conexión
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kickclean',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    console.log('Conexión a la base de datos establecida.');

    // Verificar si la tabla questions existe
    console.log('Verificando si la tabla questions existe...');
    try {
      const [tables] = await pool.execute("SHOW TABLES LIKE 'questions'");
      if (tables.length === 0) {
        console.log('La tabla questions no existe. Creando tabla...');
        
        // Crear la tabla questions con las nuevas columnas
        const createTableQuery = `
        CREATE TABLE questions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          subject VARCHAR(255),
          message TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT 0,
          is_starred BOOLEAN NOT NULL DEFAULT 0,
          is_archived BOOLEAN NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await pool.execute(createTableQuery);
        console.log('Tabla questions creada exitosamente con todas las columnas necesarias.');
        await pool.end();
        return;
      }
    } catch (err) {
      console.error('Error al verificar la tabla questions:', err);
      throw err;
    }

    // La tabla existe, verificar y agregar las columnas que falten
    const columnsToAdd = [
      { name: 'is_read', definition: 'BOOLEAN NOT NULL DEFAULT 0' },
      { name: 'is_starred', definition: 'BOOLEAN NOT NULL DEFAULT 0' },
      { name: 'is_archived', definition: 'BOOLEAN NOT NULL DEFAULT 0' }
    ];

    // Obtener la estructura actual de la tabla
    const [columns] = await pool.execute('SHOW COLUMNS FROM questions');
    const existingColumns = columns.map(col => col.Field);
    
    console.log('Columnas existentes:', existingColumns.join(', '));
    
    // Agregar las columnas que faltan
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Agregando columna ${column.name} a la tabla questions...`);
        await pool.execute(`ALTER TABLE questions ADD COLUMN ${column.name} ${column.definition}`);
        console.log(`Columna ${column.name} agregada exitosamente.`);
      } else {
        console.log(`La columna ${column.name} ya existe.`);
      }
    }

    console.log('Actualización de la tabla questions completada.');
    
    await pool.end();
    console.log('Conexión a la base de datos cerrada.');
  } catch (error) {
    console.error('\n❌ Error al actualizar la tabla questions:', error);
    if (pool) {
      await pool.end();
      console.log('Conexión a la base de datos cerrada después de error.');
    }
    throw error;
  }
}

// Si este script se ejecuta directamente
if (require.main === module) {
  console.log('\n=== ACTUALIZACIÓN DE LA TABLA QUESTIONS ===\n');
  
  updateQuestionsTable()
    .then(() => {
      console.log('\nProceso completado exitosamente.');
      process.exit(0);
    })
    .catch(err => {
      console.error('\nError crítico durante la ejecución:', err);
      process.exit(1);
    });
}

module.exports = { updateQuestionsTable };