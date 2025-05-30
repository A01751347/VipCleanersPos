// src/types/theme.ts

// Theme colors used throughout the application
export const colors = {
  // Colores principales
  primary: '#78f3d3', // Verde menta (acento principal)
  'primary-dark': '#4de0c0', // Verde menta más oscuro para hover
  secondary: '#313D52', // Azul oscuro (color base)
  
  // Variaciones del azul oscuro para fondos y textos
  'secondary-light': '#3e4a61', // Un poco más claro que el secundario
  'secondary-dark': '#242e40', // Un poco más oscuro que el secundario
  
  // Colores neutrales complementarios
  'neutral-light': '#f5f9f8', // Casi blanco con tinte verdoso muy sutil
  'neutral-medium': '#e0e6e5', // Gris claro con tinte verdoso
  'neutral-dark': '#6c7a89', // Gris oscuro con tinte azulado
  
  // Colores para estados y acciones
  'success': '#4de0b3', // Verde similar al primario pero más saturado
  'warning': '#f3bd78', // Naranja complementario
  'error': '#f37878', // Rojo suave
  
  // Color de texto sobre fondos oscuros
  'text-light': '#f8f9fa', // Blanco suave
  
  // Color de texto sobre fondos claros
  'text-dark': '#313D52', // El mismo azul oscuro secundario
};

// Shadow styles
export const shadows = {
  'shadow-card': '0 10px 15px -3px rgba(49, 61, 82, 0.1), 0 4px 6px -2px rgba(49, 61, 82, 0.05)',
  'shadow-button': '0 4px 6px -1px rgba(49, 61, 82, 0.1), 0 2px 4px -1px rgba(49, 61, 82, 0.06)',
  'shadow-button-hover': '0 10px 15px -3px rgba(49, 61, 82, 0.1), 0 4px 6px -2px rgba(49, 61, 82, 0.05)',
};

// Theme object that can be used to extend Tailwind config
export const theme = {
  colors,
  shadows,
};

export default theme;