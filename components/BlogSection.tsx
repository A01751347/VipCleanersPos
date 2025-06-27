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
}

const BlogPost: React.FC<BlogPostProps> = ({ title, excerpt, image, date, slug, index }) => {
  return (
    <AnimateOnScroll type="fade-up" delay={0.1 * index}>
      <div className="bg-white rounded-xl overflow-hidden shadow-[0_10px_15px_-3px_rgba(49,61,82,0.1),0_4px_6px_-2px_rgba(49,61,82,0.05)] hover:shadow-lg transition-shadow">
        <div 
          className="h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        ></div>
        <div className="p-6">
          <div className="text-sm text-[#6c7a89] mb-2">{date}</div>
          <h3 className="text-xl font-semibold text-[#313D52] mb-2">{title}</h3>
          <p className="text-[#6c7a89] mb-4">{excerpt}</p>
          <Link 
            href={`/blog/${slug}`}
            className="inline-flex items-center text-[#78f3d3] font-medium hover:text-[#4de0c0] transition-colors"
          >
            Leer más <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </AnimateOnScroll>
  );
};

const BlogSection: React.FC = () => {
  // Estos serían posts de ejemplo; en una implementación real, los obtendrías de una API
  const blogPosts = [
    {
      title: "Guía completa para limpiar zapatillas blancas",
      excerpt: "Aprende los mejores trucos y técnicas para mantener tus zapatillas blancas impecables por más tiempo.",
      image: "/assets/blog/white-sneakers.png",
      date: "12 abril, 2025",
      slug: "guia-limpiar-zapatillas-blancas"
    },
    {
      title: "Cómo impermeabilizar tus sneakers para la temporada de lluvias",
      excerpt: "Protege tus zapatillas favoritas contra la humedad y las manchas con estos consejos profesionales.",
      image: "/assets/blog/waterproofing.jpg",
      date: "28 marzo, 2025",
      slug: "impermeabilizar-sneakers-lluvia"
    },
    {
      title: "La guía definitiva para cuidar zapatillas de gamuza",
      excerpt: "Todo lo que necesitas saber para mantener y restaurar tus zapatillas de gamuza como un profesional.",
      image: "/assets/blog/suede-care.jpg",
      date: "15 marzo, 2025",
      slug: "cuidar-zapatillas-gamuza"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f5f9f8]" id="blog">
      <div className="max-w-7xl mx-auto">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <span className="text-sm sm:text-base font-medium uppercase tracking-wider text-[#78D5D3]">Tips & Consejos</span>
            <h2 className="mt-2 text-3xl font-bold text-[#313D52] sm:text-4xl">Nuestro Blog</h2>
            <p className="mt-4 max-w-2xl mx-auto text-[#6c7a89]">
              Descubre consejos, guías y tendencias para el cuidado de tus zapatillas favoritas.
            </p>
          </div>
        </AnimateOnScroll>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {blogPosts.map((post, index) => (
            <BlogPost 
              key={index}
              title={post.title}
              excerpt={post.excerpt}
              image={post.image}
              date={post.date}
              slug={post.slug}
              index={index}
            />
          ))}
        </div>
        
        <AnimateOnScroll>
          <div className="text-center mt-12">
            <Link 
              href="/blog"
              className="px-8 py-3 bg-[#78f3d3] text-[#313D52] font-semibold rounded-full shadow-sm hover:bg-[#4de0c0] transition-colors inline-flex items-center"
            >
              Ver todos los artículos <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default BlogSection;