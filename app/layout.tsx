

// app/layout.tsx - sin cambios funcionales, mantiene estilo y fuentes
import type { Metadata as RootMetadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import SmoothScroll from '@/components/SmoothScroll';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: RootMetadata = {
  title: 'VipCleaners | Servicio Premium de Limpieza de Zapatillas',
  icons: {
    icon: "/fav.svg",
    shortcut: "/fav.svg",
    apple: "/fav.svg",
  },
  description:
    'Servicios profesionales de limpieza, restauración e impermeabilización para tus zapatillas. Renovamos tus favoritas con técnicas avanzadas y productos de alta calidad.',
  keywords:
    'limpieza de zapatillas, restauración de sneakers, impermeabilización de tenis, limpieza de calzado deportivo, servicio premium zapatillas',
  authors: [{ name: 'VipCleaners', url: 'https://www.VipCleaners.com' }],
  openGraph: {
    title: 'VipCleaners | Servicio Premium de Limpieza de Zapatillas',
    description:
      'Servicios profesionales de limpieza, restauración e impermeabilización para tus zapatillas. Renovamos tus favoritas con técnicas avanzadas y productos de alta calidad.',
    url: 'https://www.VipCleaners.com',
    siteName: 'VipCleaners',
    images: [
      { url: 'https://www.VipCleaners.com/og-image.jpg', width: 1200, height: 630, alt: 'VipCleaners - Expertos en Limpieza de Zapatillas' }
    ],
    locale: 'es_MX',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VipCleaners | Servicio Premium de Limpieza de Zapatillas',
    description:
      'Servicios profesionales de limpieza, restauración e impermeabilización para tus zapatillas.',
    images: ['https://www.VipCleaners.com/twitter-image.jpg']
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SmoothScroll />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
