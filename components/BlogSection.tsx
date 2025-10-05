'use client'
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import AnimateOnScroll from './AnimateOnScroll';

interface BlogPostProps {
  title: string;
  excerpt: string;
  image: string;
  date: string;
  slug: string;
  index: number;
  readTime?: string;
  category?: string;
  views?: number;
  featured?: boolean;
}

const BlogPost: React.FC<BlogPostProps> = ({ title, excerpt, image, date, slug, index, readTime, category, views, featured }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <AnimateOnScroll type="fade-up" delay={0.1 * index}>
      <Link href={`/blog/${slug}`}>
        <article className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200">
          <div className="h-48 overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
              style={{ backgroundImage: `url(${image})` }}
            ></div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              {featured && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#78f3d3] text-[#313D52]">
                  Destacado
                </span>
              )}
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {category}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-[#313D52] transition-colors">
              {title}
            </h3>

            <p className="text-gray-600 mb-4 leading-relaxed">
              {excerpt}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span>{formatDate(date)}</span>
                <span>{readTime}</span>
              </div>
              <div className="flex items-center text-[#78f3d3] group-hover:text-[#4de0c0] transition-colors">
                <span className="mr-1">Leer más</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </article>
      </Link>
    </AnimateOnScroll>
  );
};

const BlogSection: React.FC = () => {
  const blogPosts = [
    {
      title: "Guía completa para limpiar zapatillas blancas",
      excerpt: "Aprende los mejores trucos y técnicas para mantener tus zapatillas blancas impecables por más tiempo.",
      image: "/assets/blog/white-sneakers.png",
      date: "2025-04-12",
      slug: "guia-limpiar-zapatillas-blancas",
      readTime: "8 min",
      category: "Guías",
      views: 2340,
      featured: true
    },
    {
      title: "Cómo impermeabilizar tus sneakers para la temporada de lluvias",
      excerpt: "Protege tus zapatillas favoritas contra la humedad y las manchas con estos consejos profesionales.",
      image: "/assets/blog/waterproofing.jpg",
      date: "2025-03-28",
      slug: "impermeabilizar-sneakers-lluvia",
      readTime: "6 min",
      category: "Protección",
      views: 1890,
      featured: false
    },
    {
      title: "La guía definitiva para cuidar zapatillas de gamuza",
      excerpt: "Todo lo que necesitas saber para mantener y restaurar tus zapatillas de gamuza como un profesional.",
      image: "/assets/blog/suede-care.jpg",
      date: "2025-03-15",
      slug: "cuidar-zapatillas-gamuza",
      readTime: "10 min",
      category: "Cuidado Especial",
      views: 3120,
      featured: false
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="blog">
      <div className="max-w-7xl mx-auto">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Guías de Cuidado Profesional
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Consejos expertos y técnicas profesionales para mantener tus zapatillas en perfecto estado.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <BlogPost
              key={index}
              title={post.title}
              excerpt={post.excerpt}
              image={post.image}
              date={post.date}
              slug={post.slug}
              index={index}
              readTime={post.readTime}
              category={post.category}
              views={post.views}
              featured={post.featured}
            />
          ))}
        </div>

        <AnimateOnScroll>
          <div className="text-center mt-16">
            <div className="bg-gray-50 rounded-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                ¿Quieres leer más consejos?
              </h3>
              <p className="text-gray-600 mb-6">
                Explora nuestra colección completa de guías y artículos sobre el cuidado de sneakers.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center px-6 py-3 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors font-medium"
              >
                Ver todos los artículos
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default BlogSection;