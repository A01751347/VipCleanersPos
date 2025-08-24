// app/page.tsx
import React, { Suspense } from 'react';
import type { Metadata } from 'next';

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import HowItWorks from '../components/HowItWorks';
import Gallery from '../components/Gallery';
import BeforeAfter from '../components/BeforeAfter';
import DetailedReviews from '../components/DetailedReviews';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import BlogSection from '../components/BlogSection';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import SmoothScroll from '../components/SmoothScroll';

import { FullPageLoading } from '../components/LoadingStates';

export const metadata: Metadata = {
  title: 'VipCleaners | Limpieza Premium de Sneakers en CDMX',
  description:
    'Servicio profesional de limpieza de sneakers en Ciudad de México. Técnicas avanzadas, productos eco-friendly y resultados que sorprenden.',
  keywords: [
    'limpieza de sneakers CDMX',
    'limpieza de tenis México',
    'limpieza de calzado deportivo',
    'servicio premium sneakers',
    'VipCleaners',
    'limpieza tenis CDMX',
    'lavado sneakers Roma Norte'
  ].join(', '),
  authors: [{ name: 'VipCleaners', url: 'https://vipcleaners.asec.store' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: {
    index: true,
    follow: true,
    maxImagePreview: 'large'
  },
  openGraph: {
    title: 'Limpieza Premium de Sneakers y Tenis en CDMX',
    description:
      'Especialistas en limpieza de sneakers y calzado deportivo en CDMX con técnicas profesionales y productos eco-friendly.',
    url: 'https://vipcleaners.asec.store',
    siteName: 'VipCleaners',
    images: [
      {
        url: 'https://vipcleaners.asec.store/assets/LOGO_VIPS.svg',
        width: 1200,
        height: 630,
        alt: 'VipCleaners - Limpieza de Sneakers en CDMX'
      }
    ],
    locale: 'es_MX',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VipCleaners | Limpieza de Sneakers en CDMX',
    description:
      'Servicio premium de limpieza de sneakers y tenis en Ciudad de México. Resultados de alta calidad, sin dañar tus pares.',
    images: ['https://vipcleaners.asec.store/assets/LOGO_VIPS.svg'],
    creator: '@vipcleaners'
  },
  alternates: {
    canonical: 'https://vipcleaners.asec.store'
  },
  publisher: 'VipCleaners'
};

const LazySection: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <Suspense fallback={fallback || (
    <div className="h-96 flex items-center justify-center"><FullPageLoading /></div>
  )}>
    {children}
  </Suspense>
);

export default function Home() {
  return (
    <>
      <noscript>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 text-center">
          <p>Para una mejor experiencia, por favor habilita JavaScript en tu navegador.</p>
        </div>
      </noscript>

      <SmoothScroll />

      <Navbar />
      <Hero />
      <BeforeAfter />
      <HowItWorks />
      <Pricing />
      <BlogSection />
      <DetailedReviews />
      <FAQ />
      <Contact />
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'VipCleaners',
            description: 'Servicio premium de limpieza de sneakers en Ciudad de México',
            url: 'https://vipcleaners.asec.store',
            telephone: '55-5929-3000',
            email: 'info@vipcleaners.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Calle del Sneaker 123',
              addressLocality: 'Narvarte Pte.',
              addressRegion: 'CDMX',
              postalCode: '53000',
              addressCountry: 'MX'
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: '19.4326',
              longitude: '-99.1332'
            },
            openingHours: ['Mo-Fr 09:00-19:00', 'Sa 10:00-18:00'],
            priceRange: '$139-$259',
            image: 'https://vipcleaners.asec.store/assets/LOGO_VIPS.svg',
            sameAs: [
              'https://www.facebook.com/vipcleaners',
              'https://www.instagram.com/vipcleaners',
              'https://twitter.com/vipcleaners'
            ],
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '237'
            },
            service: [
              {
                '@type': 'Service',
                name: 'Limpieza Básica de Zapatillas',
                description:
                  'Limpieza exterior completa, tratamiento desodorizante y limpieza de agujetas',
                price: '139',
                priceCurrency: 'MXN'
              },
              {
                '@type': 'Service',
                name: 'Limpieza Premium de Zapatillas',
                description:
                  'Limpieza profunda, tratamiento antimanchas e impermeabilización premium',
                price: '189',
                priceCurrency: 'MXN'
              }
            ]
          })
        }}
      />
    </>
  );
}

export const dynamic = 'force-static';
export const revalidate = 3600;