// types/next-auth.d.ts
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extiende la interfaz User para incluir roles y otros campos personalizados
   */
  interface User {
    role?: string;
    // otros campos personalizados que quieras añadir
  }

  /**
   * Extiende la interfaz Session para incluir información adicional en la sesión
   */
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    }
  }
}

declare module "next-auth/jwt" {
  /**
   * Extiende el objeto token de JWT
   */
  interface JWT {
    role?: string;
    // otros campos personalizados que quieras añadir al token
  }
}