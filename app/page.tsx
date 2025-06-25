// app/page.tsx - Layout principal mejorado
import React from 'react';
import { Metadata } from 'next';

// Components
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TrustBadges from '../components/TrustBadges';
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

// Loading and performance components
import { Suspense } from 'react';
import { FullPageLoading } from '../components/LoadingStates';

// SEO optimized metadata
export const metadata: Metadata = {
  title: "VipCleaners | Servicio Premium de Limpieza de Zapatillas en CDMX",
  description: "Servicios profesionales de limpieza, restauración e impermeabilización para tus zapatillas en Ciudad de México. Renovamos tus favoritas con técnicas avanzadas y productos de alta calidad. Pickup gratis en zonas seleccionadas.",
  keywords: [
    "limpieza de zapatillas CDMX",
    "restauración de sneakers México",
    "impermeabilización de tenis",
    "limpieza de calzado deportivo",
    "servicio premium zapatillas",
    "VipCleaners",
    "pickup zapatillas CDMX",
    "limpieza sneakers Roma Norte"
  ].join(", "),
  authors: [{ name: "VipCleaners", url: "https://www.vipcleaners.com" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "VipCleaners | Servicio Premium de Limpieza de Zapatillas",
    description: "Especialistas en limpieza y restauración de sneakers en CDMX. Pickup gratis, técnicas profesionales y garantía de satisfacción.",
    url: "https://www.vipcleaners.com",
    siteName: "VipCleaners",
    images: [
      {
        url: "https://www.vipcleaners.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VipCleaners - Expertos en Limpieza de Zapatillas"
      }
    ],
    locale: "es_MX",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "VipCleaners | Servicio Premium de Limpieza de Zapatillas",
    description: "Especialistas en limpieza y restauración de sneakers en CDMX. Pickup gratis y garantía de satisfacción.",
    images: ["https://www.vipcleaners.com/twitter-image.jpg"],
    creator: "@vipcleaners"
  },
  alternates: {
    canonical: "https://www.vipcleaners.com"
  }
};

// Lazy loading wrapper for heavy components
const LazySection: React.FC<{ 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <Suspense fallback={fallback || <div className="h-96 flex items-center justify-center"><FullPageLoading /></div>}>
    {children}
  </Suspense>
);

// Main page component with optimized structure
export default function Home() {
  return (
    <>
      {/* Progressive enhancement */}
      <noscript>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 text-center">
          <p>Para una mejor experiencia, por favor habilita JavaScript en tu navegador.</p>
        </div>
      </noscript>

      {/* Smooth scrolling behavior */}
      <SmoothScroll />
      
      {/* Critical above-the-fold content */}
      <Navbar />
      <Hero />
      
      {/* Trust signals - load immediately after hero */}
      <TrustBadges />
      
      {/* Core business sections - high priority */}
      <Services />
      <HowItWorks />
      
      <LazySection>
        <BeforeAfter />
      </LazySection>
      
      {/* Social proof sections */}
      <LazySection>
        <DetailedReviews />
      </LazySection>
      
      <LazySection>
        <Testimonials />
      </LazySection>
      
      {/* Conversion sections */}
      <Pricing />
      
      {/* Support and content sections - lower priority */}
      <LazySection>
        <FAQ />
      </LazySection>
      
      <LazySection>
        <BlogSection />
      </LazySection>
      
      {/* Contact and footer */}
      <Contact />
      <Footer />

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "VipCleaners",
            "description": "Servicio premium de limpieza y restauración de zapatillas en Ciudad de México",
            "url": "https://www.vipcleaners.com",
            "telephone": "442-123-4567",
            "email": "info@vipcleaners.com",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Calle del Sneaker 123",
              "addressLocality": "Roma Norte",
              "addressRegion": "CDMX",
              "postalCode": "53000",
              "addressCountry": "MX"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "19.4326",
              "longitude": "-99.1332"
            },
            "openingHours": [
              "Mo-Fr 09:00-19:00",
              "Sa 10:00-18:00"
            ],
            "priceRange": "$139-$259",
            "image": "https://www.vipcleaners.com/logo.jpg",
            "sameAs": [
              "https://www.facebook.com/vipcleaners",
              "https://www.instagram.com/vipcleaners",
              "https://twitter.com/vipcleaners"
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "237"
            },
            "service": [
              {
                "@type": "Service",
                "name": "Limpieza Básica de Zapatillas",
                "description": "Limpieza exterior completa, tratamiento desodorizante y limpieza de agujetas",
                "price": "139",
                "priceCurrency": "MXN"
              },
              {
                "@type": "Service",
                "name": "Limpieza Premium de Zapatillas",
                "description": "Limpieza profunda, tratamiento antimanchas e impermeabilización premium",
                "price": "189",
                "priceCurrency": "MXN"
              }
            ]
          })
        }}
      />
    </>
  );
}

// Performance optimizations
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour