#!/usr/bin/env node
// scripts/update-bookings-table.js
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

async function updateBookingsTable() {
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

    // Verificar si la tabla bookings existe
    console.log('Verificando si la tabla bookings existe...');
    try {
      const [tables] = await pool.execute("SHOW TABLES LIKE 'bookings'");
      if (tables.length === 0) {
        console.log('La tabla bookings no existe. Creando tabla...');
        
        // Crear la tabla bookings con la columna status
        const createTableQuery = `
        CREATE TABLE bookings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          booking_reference VARCHAR(10) NOT NULL UNIQUE,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(10) NOT NULL,
          shoes_type VARCHAR(255) NOT NULL,
          service_type VARCHAR(50) NOT NULL,
          delivery_method VARCHAR(50) NOT NULL,
          booking_date DATETIME NOT NULL,
          status ENUM('pending', 'received', 'in_progress', 'completed', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_booking_reference (booking_reference),
          INDEX idx_status (status),
          INDEX idx_booking_date (booking_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await pool.execute(createTableQuery);
        console.log('Tabla bookings creada exitosamente con todas las columnas necesarias.');
        await pool.end();
        return;
      }
    } catch (err) {
      console.error('Error al verificar la tabla bookings:', err);
      throw err;
    }

    // La tabla existe, verificar si tiene la columna status
    const [columns] = await pool.execute('SHOW COLUMNS FROM bookings LIKE ?', ['status']);
    
    if (columns.length === 0) {
      console.log('Agregando columna status a la tabla bookings...');
      
      // Agregar la columna status
      await pool.execute(`
        ALTER TABLE bookings 
        ADD COLUMN status ENUM('pending', 'received', 'in_progress', 'completed', 'delivered', 'cancelled') 
        NOT NULL DEFAULT 'pending'
      `);
      
      console.log('Columna status agregada exitosamente.');
    } else {
      console.log('La columna status ya existe en la tabla bookings.');
    }

    console.log('Actualización de la tabla bookings completada.');
    
    await pool.end();
    console.log('Conexión a la base de datos cerrada.');
  } catch (error) {
    console.error('\n❌ Error al actualizar la tabla bookings:', error);
    if (pool) {
      await pool.end();
      console.log('Conexión a la base de datos cerrada después de error.');
    }
    throw error;
  }
}

// Si este script se ejecuta directamente
if (require.main === module) {
  console.log('\n=== ACTUALIZACIÓN DE LA TABLA BOOKINGS ===\n');
  
  updateBookingsTable()
    .then(() => {
      console.log('\nProceso completado exitosamente.');
      process.exit(0);
    })
    .catch(err => {
      console.error('\nError crítico durante la ejecución:', err);
      process.exit(1);
    });
}

module.exports = { updateBookingsTable };