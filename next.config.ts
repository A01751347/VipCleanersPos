// next.config.ts
import type { NextConfig } from 'next'

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY', // evita clickjacking
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "img-src 'self' https: data:",
      "font-src 'self' https: data:",
      // 👇 se agrega challenges.cloudflare.com a script-src y frame-src
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https:",
      "style-src 'self' 'unsafe-inline' https:",
      "connect-src 'self' https:",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://api.whatsapp.com",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ['mysql2'],

  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },

  webpack(config) {
    // Trata .svg como React components
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack']
    })
    return config
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  async headers() {
    return [
      {
        source: '/(.*)', // aplica a todas las rutas
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
