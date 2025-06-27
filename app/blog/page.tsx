'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, User, BookOpen, TrendingUp, Sparkles, Star, Eye, Search } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BookingButton from '@/components/BookingButton';



// Blog posts data
const blogPosts = [
  {
    id: '1',
    title: "Guía completa para limpiar zapatillas blancas",
    excerpt: "Aprende los mejores trucos y técnicas para mantener tus zapatillas blancas impecables por más tiempo.",
    image: "/assets/blog/white-sneakers.png",
    date: "2025-04-12",
    slug: "guia-limpiar-zapatillas-blancas",
    author: "VIP Sneaker Care",
    readTime: "8 min",
    tags: ["Limpieza", "Zapatillas Blancas", "Cuidado"],
    featured: true,
    category: "Guías",
    views: 2340,
    likes: 156
  },
  {
    id: '2',
    title: "Cómo impermeabilizar tus sneakers para la temporada de lluvias",
    excerpt: "Protege tus zapatillas favoritas contra la humedad y las manchas con estos consejos profesionales.",
    image: "/assets/blog/waterproofing.jpg",
    date: "2025-03-28",
    slug: "impermeabilizar-sneakers-lluvia",
    author: "VIP Sneaker Care",
    readTime: "6 min",
    tags: ["Impermeabilización", "Protección", "Temporada"],
    featured: false,
    category: "Protección",
    views: 1890,
    likes: 98
  },
  {
    id: '3',
    title: "La guía definitiva para cuidar zapatillas de gamuza",
    excerpt: "Todo lo que necesitas saber para mantener y restaurar tus zapatillas de gamuza como un profesional.",
    image: "/assets/blog/suede-care.jpg",
    date: "2025-03-15",
    slug: "cuidar-zapatillas-gamuza",
    author: "VIP Sneaker Care",
    readTime: "10 min",
    tags: ["Gamuza", "Cuidado Especial", "Restauración"],
    featured: false,
    category: "Guías",
    views: 3120,
    likes: 203
  }
];

export default function BlogPage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categories = ['Todos', 'Guías', 'Protección', 'Cuidado Especial'];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'Todos' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f9f8] via-white to-[#f0f8ff]">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#313D52] via-[#2a3441] to-[#1f2937] text-white pt-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#78f3d3] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#4de0c0] rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center bg-gradient-to-r from-[#78f3d3] to-[#4de0c0] text-[#313D52] px-6 py-3 rounded-full font-bold">
                <BookOpen size={20} className="mr-2" />
                Blog VIP Cleaners Sneaker Care
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-8 bg-gradient-to-r from-white via-[#78f3d3] to-white bg-clip-text text-transparent leading-tight">
              Expertos en <br />
              <span className="text-[#78f3d3]">Sneaker Care</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
              Consejos profesionales, guías detalladas y las últimas tendencias para mantener 
              tus zapatillas en perfecto estado como el primer día.
            </p>
            
            <div className="flex items-center justify-center mt-12 space-x-8 text-white/60">
              <div className="flex items-center">
                <TrendingUp size={20} className="mr-2 text-[#78f3d3]" />
                <span>+50 Artículos</span>
              </div>
              <div className="flex items-center">
                <Eye size={20} className="mr-2 text-[#78f3d3]" />
                <span>+100k Lectores</span>
              </div>
              <div className="flex items-center">
                <Sparkles size={20} className="mr-2 text-[#78f3d3]" />
                <span>Tips Exclusivos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search and Filter Section */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#e0e6e5]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={20} className="text-[#6c7a89]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar artículos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-[#e0e6e5] rounded-xl focus:outline-none focus:border-[#78f3d3] focus:ring-4 focus:ring-[#78f3d3] focus:ring-opacity-20 transition-all"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-[#e0e6e5] rounded-xl focus:outline-none focus:border-[#78f3d3] focus:ring-4 focus:ring-[#78f3d3] focus:ring-opacity-20 transition-all appearance-none bg-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#6c7a89]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && searchTerm === '' && selectedCategory === 'Todos' && (
          <section className="mb-20">
            <div className="flex items-center justify-center mb-12">
              <div className="flex items-center bg-gradient-to-r from-[#78f3d3] to-[#4de0c0] text-[#313D52] px-6 py-3 rounded-full font-bold">
                <Star size={20} className="mr-2" />
                Artículos Destacados
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <article className="group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-[#e0e6e5]">
                    <div className="relative h-64">
                      <div 
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                        style={{ backgroundImage: `url(${post.image})` }}
                      ></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      {/* Featured Badge */}
                      <div className="absolute top-6 left-6">
                        <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                          <Star size={16} className="mr-1" />
                          Destacado
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="absolute top-6 right-6 flex space-x-3">
                        <span className="bg-black/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm flex items-center">
                          <Eye size={14} className="mr-1" />
                          {formatNumber(post.views || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="flex items-center justify-between text-sm text-[#6c7a89] mb-4">
                        <span className="bg-[#78f3d3]/10 text-[#313D52] px-3 py-1 rounded-full font-medium">
                          {post.category}
                        </span>
                        <span>{post.readTime}</span>
                      </div>

                      <h2 className="text-2xl font-bold text-[#313D52] mb-4 group-hover:text-[#78f3d3] transition-colors leading-tight">
                        {post.title}
                      </h2>

                      <p className="text-[#6c7a89] mb-6 leading-relaxed">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar size={16} className="text-[#78f3d3] mr-2" />
                          <span className="text-sm text-[#6c7a89]">{formatDate(post.date)}</span>
                        </div>
                        
                        <div className="flex items-center text-[#78f3d3] group-hover:text-[#4de0c0] font-semibold">
                          <span className="mr-2">Leer más</span>
                          <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Regular Posts Grid */}
        <section>
          <div className="flex items-center justify-center mb-12">
            <h2 className="text-3xl font-bold text-[#313D52]">
              {searchTerm || selectedCategory !== 'Todos' ? 'Resultados de búsqueda' : 'Todos los Artículos'}
            </h2>
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <article className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-[#e0e6e5] overflow-hidden">
                    <div className="relative h-48">
                      <div 
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url(${post.image})` }}
                      ></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      
                      {/* Stats */}
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <span className="bg-black/20 backdrop-blur-md text-white px-2 py-1 rounded-full text-xs flex items-center">
                          <Eye size={12} className="mr-1" />
                          {formatNumber(post.views || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between text-xs text-[#6c7a89] mb-3">
                        <span className="bg-[#78f3d3]/10 text-[#313D52] px-2 py-1 rounded-full font-medium">
                          {post.category}
                        </span>
                        <span>{post.readTime}</span>
                      </div>

                      <h3 className="text-lg font-bold text-[#313D52] mb-3 group-hover:text-[#78f3d3] transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-sm text-[#6c7a89] mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-[#6c7a89]">
                          {formatDate(post.date)}
                        </div>
                        <div className="flex items-center text-[#78f3d3] group-hover:text-[#4de0c0]">
                          <span className="text-sm font-semibold mr-1">Leer</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-[#313D52] mb-4">No se encontraron artículos</h3>
              <p className="text-[#6c7a89] mb-8">
                Intenta con otros términos de búsqueda o selecciona una categoría diferente.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('Todos');
                }}
                className="px-6 py-3 bg-[#78f3d3] text-[#313D52] rounded-xl hover:bg-[#4de0c0] transition-colors font-semibold"
              >
                Ver todos los artículos
              </button>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="mt-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#313D52] via-[#2a3441] to-[#1f2937] text-white p-12">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#78f3d3] rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#4de0c0] rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-[#78f3d3] rounded-full flex items-center justify-center mx-auto mb-8">
                <Sparkles size={40} className="text-[#313D52]" />
              </div>
              
              <h3 className="text-3xl md:text-4xl font-black mb-6">
                ¿Listo para darle vida nueva a tus sneakers?
              </h3>
              
              <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                Hemos compartido nuestros secretos profesionales contigo. Ahora es momento de poner 
                tus zapatillas en manos expertas y ver la magia en acción.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-white">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#78f3d3]/20 rounded-full flex items-center justify-center mb-3">
                    <span className="text-[#78f3d3] text-xl">🧽</span>
                  </div>
                  <h4 className="font-bold mb-2">Técnicas Profesionales</h4>
                  <p className="text-sm text-white/70">Como las que acabas de leer</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#78f3d3]/20 rounded-full flex items-center justify-center mb-3">
                    <span className="text-[#78f3d3] text-xl">🚚</span>
                  </div>
                  <h4 className="font-bold mb-2">Pickup</h4>
                  <p className="text-sm text-white/70">En la CDMX</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#78f3d3]/20 rounded-full flex items-center justify-center mb-3">
                    <span className="text-[#78f3d3] text-xl">✨</span>
                  </div>
                  <h4 className="font-bold mb-2">Resultados Garantizados</h4>
                  <p className="text-sm text-white/70">Como nuevos o gratis</p>
                </div>
              </div>
              
              <BookingButton className="group inline-flex items-center px-12 py-5 bg-[#313D52] text-white text-xl font-black rounded-full hover:bg-[#242e40] transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
  Reserva ahora
  <ArrowRight size={24} className="ml-4 group-hover:translate-x-2 transition-transform" />
</BookingButton>

              
              <p className="text-sm text-white/60 mt-6">
                📞 Respuesta inmediata • 🏆 +5000 clientes satisfechos • 💎 Garantía total
              </p>
            </div>
          </div>
        </section>
      </div>

     

      <Footer />
    </div>
  );
}