// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Corregido: serverComponentsExternalPackages ahora es serverExternalPackages
  serverExternalPackages: ['mysql2'],
  
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  
  // Configuración para NextAuth con Next.js 15
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "crypto": false,
    };
    return config;
  },
  
  // Suprimir algunos warnings de ESLint durante el build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuración de TypeScript para ser menos estricto durante el build
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;