// Archivo principal de exportación para la base de datos
// lib/database/index.ts

// Conexión de base de datos
export { executeQuery } from './connection';

// Autenticación
export * from './auth';

// Clientes
export * from './clients';

// Marcas y modelos
export * from './brands-models';

// Reservaciones
export * from './reservation';

// Direcciones
export * from './addresses';

// Servicios
export * from './services';

// Productos
export * from './products';

// Categorías
export * from './categories';

// Órdenes
export * from './orders';

// Pagos
export * from './payments';

// Mensajes
export * from './messages';

// Inventario
export * from './inventory';

// Reportes
export * from './reports';

// Empleados
export * from './employees';

// Archivos multimedia
export * from './media';

// Almacenamiento
export * from './storage';

// Configuración
export * from './config';

// Utilidades
export * from './utils';