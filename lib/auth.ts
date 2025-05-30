/**
 * Authentication Library
 * File: lib/auth.ts
 * 
 * Contains utility functions for user authentication and password verification.
 * Handles database queries and password hashing operations.
 */

import { executeQuery } from './db';
import { compare } from 'bcryptjs';

/**
 * User data interface matching the database structure
 */
interface UserData {
  usuario_id: number;
  email: string;
  password: string;
  rol: string;
  activo: boolean;
  nombre?: string;      // Optional: user's first name
  apellidos?: string;   // Optional: user's last name
}

/**
 * Retrieve user information by email address
 * 
 * @param email - User's email address
 * @returns Promise<UserData | null> - User data or null if not found
 */
export async function getUserByEmail(email: string): Promise<UserData | null> {
  try {
    // Sanitize email input
    const sanitizedEmail = email.toLowerCase().trim();
    
    // Query to get user data with optional employee information
    const query = `
      SELECT 
        u.usuario_id, 
        u.email, 
        u.password, 
        u.rol, 
        u.activo,
        e.nombre,
        e.apellidos
      FROM usuarios u
      LEFT JOIN empleados e ON u.usuario_id = e.usuario_id
      WHERE u.email = ? AND u.activo = TRUE
    `;
    
    // Execute the database query
    const result = await executeQuery<UserData[]>({
      query,
      values: [sanitizedEmail]
    });
    
    // Return null if no user found
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    console.error('Error al obtener usuario por email:', error);
    return null;
  }
}

/**
 * Verify password against stored hash
 * 
 * @param plainPassword - Plain text password from user input
 * @param hashedPassword - Hashed password from database
 * @returns Promise<boolean> - True if password matches, false otherwise
 */
export async function verifyPassword(
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> {
  try {
    // Use bcrypt to compare plain password with hash
    return await compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error al verificar la contraseña:', error);
    return false;
  }
}