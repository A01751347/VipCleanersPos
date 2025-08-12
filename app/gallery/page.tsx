// app/gallery/page.tsx - Página completa de Galería
import React from 'react';
import { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Gallery from '../../components/Gallery';
import { 
  Eye, 
  Star, 
  Award, 
  Camera,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';

// SEO optimizado para la página de galería
export const metadata: Metadata = {
  title: "Galería de Transformaciones | VipCleaners - Antes y Después",
  description: "Explora nuestra galería de transformaciones de zapatillas. Ve el antes y después de nuestros trabajos de limpieza premium en Nike, Adidas, Jordan y más marcas.",
  keywords: [
    "galería limpieza zapatillas",
    "antes y después sneakers",
    "transformaciones zapatillas CDMX",
    "resultados limpieza premium",
    "VipCleaners galería",
    "restauración sneakers México",
    "trabajos realizados zapatillas",
    "portfolio limpieza calzado"
  ].join(", "),
  openGraph: {
    title: "Galería de Transformaciones | VipCleaners",
    description: "Descubre las increíbles transformaciones que realizamos en zapatillas de todas las marcas. Resultados garantizados.",
    url: "https://www.vipcleaners.com/gallery",
    siteName: "VipCleaners",
    images: [
      {
        url: "https://www.vipcleaners.com/gallery-og.jpg",
        width: 1200,
        height: 630,
        alt: "Galería de transformaciones VipCleaners"
      }
    ],
    type: "website"
  },
  alternates: {
    canonical: "https://www.vipcleaners.com/gallery"
  }
};

// Componente de estadísticas para la página
const GalleryStats: React.FC = () => {
  const stats = [
    {
      icon: Camera,
      number: "500+",
      label: "Transformaciones Documentadas",
      description: "Cada trabajo fotografiado profesionalmente"
    },
    {
      icon: Star,
      number: "4.9",
      label: "Calificación Promedio",
      description: "Basada en opiniones reales de clientes"
    },
    {
      icon: Award,
      number: "15",
      label: "Marcas Especializadas",
      description: "Expertos en todas las marcas premium"
    },
    {
      icon: TrendingUp,
      number: "98%",
      label: "Tasa de Satisfacción",
      description: "Clientes completamente satisfechos"
    }
  ];

  return (
    <section className="py-16 bg-white border-b border-[#e0e6e5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#313D52] mb-4">
            Nuestros Números Hablan
          </h2>
          <p className="text-[#6c7a89] max-w-2xl mx-auto">
            Cada transformación es un testimonio de nuestro compromiso con la excelencia
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-[#e0f7f0] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#78f3d3] transition-colors">
                  <Icon size={32} className="text-[#78f3d3] group-hover:text-[#313D52] transition-colors" />
                </div>
                <div className="text-3xl font-bold text-[#313D52] mb-2">{stat.number}</div>
                <div className="font-semibold text-[#313D52] mb-1">{stat.label}</div>
                <div className="text-sm text-[#6c7a89]">{stat.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Componente de CTA especializada para galería
const GalleryCTA: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-[#313D52] to-[#3e4a61] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center bg-[#78f3d3]/20 text-[#78f3d3] px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Users size={16} className="mr-2" />
            ÚNETE A NUESTROS CLIENTES SATISFECHOS
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para ver tus sneakers 
            <span className="text-[#78f3d3]"> transformados?</span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Cada par de zapatillas tiene una historia. Permítenos escribir el siguiente capítulo 
            con una transformación que superará tus expectativas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <Clock size={24} className="text-[#78f3d3] mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Proceso Rápido</h3>
            <p className="text-sm text-gray-300">24-48 horas para la mayoría de servicios</p>
          </div>
          
          <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <Award size={24} className="text-[#78f3d3] mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Calidad Garantizada</h3>
            <p className="text-sm text-gray-300">100% de satisfacción o te devolvemos tu dinero</p>
          </div>
          
          <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <Camera size={24} className="text-[#78f3d3] mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Documentado</h3>
            <p className="text-sm text-gray-300">Fotos antes y después de tu transformación</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-[#78f3d3] text-[#313D52] font-semibold rounded-full hover:bg-[#4de0c0] transition-colors shadow-lg text-lg">
            Reservar Mi Limpieza
          </button>
          <button className="px-8 py-4 border-2 border-[#78f3d3] text-[#78f3d3] font-semibold rounded-full hover:bg-[#78f3d3] hover:text-[#313D52] transition-colors text-lg">
            Ver Precios
          </button>
        </div>
      </div>
    </section>
  );
};

// Componente principal de la página
const GalleryPage: React.FC = () => {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section específico para galería */}
      
      <section className="pt-2 pb-8 bg-gradient-to-br from-[#f5f9f8] to-white">
      </section>

      {/* Estadísticas */}
      
      {/* Componente principal de galería */}
      <Gallery />
      
      {/* CTA especializada */}
      <GalleryCTA />
      
      <Footer />

      {/* JSON-LD para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            "name": "Galería de Transformaciones VipCleaners",
            "description": "Galería de trabajos de limpieza y restauración de zapatillas antes y después",
            "url": "https://www.vipcleaners.com/gallery",
            "publisher": {
              "@type": "Organization",
              "name": "VipCleaners",
              "url": "https://www.vipcleaners.com"
            },
            "about": {
              "@type": "Service",
              "name": "Limpieza y Restauración de Zapatillas",
              "provider": {
                "@type": "LocalBusiness",
                "name": "VipCleaners",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Ciudad de México",
                  "addressCountry": "MX"
                }
              }
            },
            "mainEntity": {
              "@type": "ImageObject",
              "contentUrl": "https://www.vipcleaners.com/gallery-featured.jpg",
              "description": "Transformaciones de zapatillas antes y después"
            }
          })
        }}
      />
    </main>
  );
};

export default GalleryPage;