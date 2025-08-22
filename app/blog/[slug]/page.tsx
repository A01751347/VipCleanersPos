// app/blog/[slug]/page.tsx
'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin, ArrowRight, Eye, Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import BookingButton from '@/components/BookingButton';

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
    featured: false,
    category: "Guías",
    views: 2340,
    likes: 156,
    content: `
      <p>Las zapatillas blancas son un clásico atemporal que nunca pasa de moda. Sin embargo, mantenerlas impecables puede ser todo un desafío. En esta guía completa, te enseñaremos todos los secretos profesionales para que tus sneakers blancos luzcan como el primer día.</p>

      <h2>¿Por qué se ensucian tanto las zapatillas blancas?</h2>
      <p>Las zapatillas blancas muestran cada pequeña mancha, rayón o señal de desgaste. El color blanco no tiene dónde esconder la suciedad, por lo que requieren un cuidado especial y constante. Además, los materiales comunes como el cuero sintético, lona y malla son porosos, lo que permite que la suciedad se adhiera más fácilmente.</p>

      <h2>Materiales que necesitarás</h2>
      <h3>Para limpieza básica:</h3>
      <ul>
        <li><strong>Cepillo de dientes viejo</strong> (para áreas difíciles)</li>
        <li><strong>Cepillo suave de limpieza</strong> (para superficies amplias)</li>
        <li><strong>Paño de microfibra</strong> (2-3 unidades)</li>
        <li><strong>Agua tibia</strong></li>
        <li><strong>Jabón neutro</strong> o detergente suave</li>
        <li><strong>Bicarbonato de sodio</strong></li>
        <li><strong>Pasta dental blanca</strong> (sin gel)</li>
        <li><strong>Vinagre blanco</strong></li>
      </ul>

      <h2>Conclusión</h2>
      <p>Mantener zapatillas blancas impecables requiere constancia y los métodos correctos. La clave está en la prevención, el cuidado regular y actuar rápidamente ante las manchas. Con estos consejos profesionales, tus sneakers blancos lucirán perfectos por mucho más tiempo.</p>
    `
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
    likes: 98,
    content: `
      <!-- Visual Content for Waterproofing Article -->
      <style>
        .gradient-text { background: linear-gradient(135deg, #78f3d3 0%, #4de0c0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hover-lift { transition: all 0.3s ease; }
        .hover-lift:hover { transform: translateY(-5px); }
        .step-card { transition: all 0.4s ease; }
        .step-card:hover { transform: translateY(-8px) scale(1.02); }
        .glass-card { backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); }
        .floating { animation: floating 3s ease-in-out infinite; }
        @keyframes floating { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .content-section { scroll-margin-top: 100px; }
      </style>

      <!-- Table of Contents -->
      <div class="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 mb-8">
        <div class="max-w-4xl mx-auto px-6 py-4">
          <nav class="flex flex-wrap justify-center space-x-8 text-sm">
            <a href="#why" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">¿Por qué?</a>
            <a href="#types" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">Tipos</a>
            <a href="#guide" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">Guía paso a paso</a>
            <a href="#maintenance" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">Mantenimiento</a>
            <a href="#tips" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">Consejos</a>
          </nav>
        </div>
      </div>

      <!-- Introduction -->
      <div class="text-center mb-16">
        <div class="flex justify-center items-center space-x-8 mb-8">
          <div class="text-4xl floating">☔</div>
          <div class="text-4xl floating" style="animation-delay: 0.5s;">🌧️</div>
          <div class="text-4xl floating" style="animation-delay: 1s;">⛈️</div>
        </div>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          La temporada de lluvias puede ser devastadora para tus sneakers, pero con la protección adecuada, tus zapatillas estarán listas para cualquier clima.
        </p>
      </div>

      <!-- Professional CTA Section -->
      <div class="mb-20">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-12">
          <!-- Animated background elements -->
          <div class="absolute inset-0 opacity-10">
            <div class="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl floating"></div>
            <div class="absolute bottom-10 right-10 w-80 h-80 bg-cyan-300 rounded-full blur-3xl floating" style="animation-delay: 1s;"></div>
          </div>
          
          <div class="relative z-10 text-center">
            <div class="text-6xl mb-8">🔧⚡</div>
            <h3 class="text-3xl md:text-4xl font-black mb-6">
              ¿Prefieres dejarlo en manos de expertos?
            </h3>
            <p class="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              En VIP Sneaker Care no solo impermeabilizamos tus sneakers, también los dejamos como nuevos. 
              Nuestro proceso profesional incluye limpieza profunda + impermeabilización premium + garantía total.
            </p>
            
            <button id="openBookingBtn" class="group inline-flex items-center px-12 py-5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-xl font-black rounded-full hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
              <span>¡Reserva tu impermeabilización profesional!</span>
              <svg class="w-6 h-6 ml-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </button>
            
            <p class="text-sm text-gray-400 mt-6">
              💧 Resistencia al agua garantizada por 6 meses • 🏆 +5000 clientes satisfechos
            </p>
          </div>
        </div>
      </div>

      <script>
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
          anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
              target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          });
        });
      </script>
    `
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
    likes: 203,
    content: `
      <p>Las zapatillas de gamuza son sinónimo de elegancia y estilo, pero también requieren un cuidado especial. Este material delicado puede ser desafiante de mantener, pero con las técnicas correctas, tus sneakers de gamuza lucirán perfectos por años.</p>

      <h2>¿Qué es la gamuza y por qué es especial?</h2>
      <p>La gamuza es un tipo de cuero con acabado aterciopelado, creado al lijar la parte interna de la piel. Esta textura única le da su característica apariencia suave, pero también la hace más vulnerable a manchas y daños.</p>

      <h2>Conclusión</h2>
      <p>El cuidado de la gamuza requiere paciencia y las técnicas correctas, pero los resultados valen la pena. Con mantenimiento regular y protección adecuada, tus zapatillas de gamuza mantendrán su elegancia y textura única por años.</p>
    `
  }
];

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ params }) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{ slug: string } | null>(null);
  
  // Always call useEffect - this is crucial for the Rules of Hooks
  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);
  
  // Always call this useEffect - move the condition inside the effect
  React.useEffect(() => {
    // Only execute the logic if resolvedParams exists and has a slug
    if (!resolvedParams?.slug) return;
    
    const setupBookingButton = () => {
      const bookingBtn = document.getElementById('openBookingBtn');
      if (bookingBtn) {
        const handleClick = () => {
          setIsBookingModalOpen(true);
        };
        
        bookingBtn.addEventListener('click', handleClick);
        
        // Return cleanup function
        return () => {
          bookingBtn.removeEventListener('click', handleClick);
        };
      }
      return () => {}; // Return empty cleanup if no button found
    };

    // Small delay to ensure the content is rendered
    const timeoutId = setTimeout(setupBookingButton, 100);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      const bookingBtn = document.getElementById('openBookingBtn');
      if (bookingBtn) {
        // Remove any existing event listeners
        const newBtn = bookingBtn.cloneNode(true);
        bookingBtn.parentNode?.replaceChild(newBtn, bookingBtn);
      }
    };
  }, [resolvedParams?.slug]); // This effect depends on resolvedParams.slug
  
  if (!resolvedParams) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#78f3d3] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#6c7a89]">Cargando artículo...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  
  const post = blogPosts.find(p => p.slug === resolvedParams.slug);

  if (!post) {
    notFound();
  }

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

  const relatedPosts = blogPosts
    .filter(p => p.id !== post.id && p.tags.some(tag => post.tags.includes(tag)))
    .slice(0, 3);

  return (
    <>
      <Navbar />
      <article className="min-h-screen bg-white pt-20">
        {/* Enhanced Hero Image */}
        <div className="relative h-96 md:h-[500px] overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transform scale-105"
            style={{ backgroundImage: `url(${post.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          </div>
          
          {/* Back Button */}
          <div className="absolute top-8 left-8 z-20">
            <Link 
              href="/blog"
              className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full transition-all duration-300 border border-white/20"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver al blog
            </Link>
          </div>

          {/* Share Button */}
          <div className="absolute top-8 right-8 z-20">
            <button className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full transition-all duration-300 border border-white/20">
              <Share2 size={20} />
            </button>
          </div>

          {/* Article Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
            <div className="max-w-4xl mx-auto">
              {/* Category and Featured Badge */}
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-[#78f3d3] text-[#313D52] px-4 py-2 rounded-full text-sm font-bold">
                  {post.category}
                </span>
                {post.featured && (
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold flex items-center">
                    ⭐ Destacado
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                {post.title}
              </h1>
              
              <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-3xl">
                {post.excerpt}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-white/80">
                <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Calendar size={16} className="mr-2" />
                  <span>{formatDate(post.date)}</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Clock size={16} className="mr-2" />
                  <span>{post.readTime}</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <User size={16} className="mr-2" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Eye size={16} className="mr-2" />
                  <span>{formatNumber(post.views || 0)} vistas</span>
                </div>
                <button 
                  onClick={() => setIsLiked(!isLiked)}
                  className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <Heart 
                    size={16} 
                    className={`mr-2 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                  />
                  <span>{formatNumber((post.likes || 0) + (isLiked ? 1 : 0))}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Tags */}
          <div className="flex flex-wrap gap-3 mb-12">
            {post.tags.map((tag, index) => (
              <span 
                key={index}
                className="bg-gradient-to-r from-[#f5f9f8] to-[#e0f2fe] text-[#313D52] px-4 py-2 rounded-full text-sm font-medium border border-[#78f3d3]/20"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Article Body */}
          <div className="prose prose-xl max-w-none">
            <div 
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.8'
              }}
            />
          </div>

          {/* Enhanced Share Section */}
          <div className="mt-16 p-8 bg-gradient-to-r from-[#f5f9f8] to-white rounded-3xl border border-[#e0e6e5]">
            <h3 className="text-2xl font-bold text-[#313D52] mb-6 flex items-center">
              <Share2 size={24} className="mr-3 text-[#78f3d3]" />
              ¿Te gustó este artículo? ¡Compártelo!
            </h3>
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <Facebook size={18} className="mr-2" />
                Facebook
              </button>
              <button className="flex items-center px-6 py-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <Twitter size={18} className="mr-2" />
                Twitter
              </button>
              <button className="flex items-center px-6 py-3 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <Linkedin size={18} className="mr-2" />
                LinkedIn
              </button>
              <button className="flex items-center px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <span className="mr-2">📱</span>
                WhatsApp
              </button>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-20">
              <h3 className="text-3xl font-bold text-[#313D52] mb-12 text-center">
                Te podría interesar también
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost, index) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <div className="group bg-white border-2 border-[#e0e6e5] rounded-2xl overflow-hidden hover:border-[#78f3d3] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                      <div 
                        className="h-40 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url(${relatedPost.image})` }}
                      ></div>
                      <div className="p-6">
                        <div className="flex items-center justify-between text-xs text-[#6c7a89] mb-3">
                          <span className="bg-[#78f3d3]/10 text-[#313D52] px-2 py-1 rounded-full font-medium">
                            {relatedPost.category}
                          </span>
                          <span>{relatedPost.readTime}</span>
                        </div>
                        <h4 className="font-bold text-[#313D52] mb-3 line-clamp-2 group-hover:text-[#78f3d3] transition-colors">
                          {relatedPost.title}
                        </h4>
                        <p className="text-sm text-[#6c7a89] line-clamp-3 mb-4">
                          {relatedPost.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-[#6c7a89]">
                            {formatDate(relatedPost.date)}
                          </div>
                          <div className="flex items-center text-[#78f3d3] group-hover:text-[#4de0c0]">
                            <span className="text-sm font-semibold mr-1">Leer más</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced CTA Section */}
          <div className="mt-20 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#78f3d3] via-[#4de0c0] to-[#78f3d3] p-12 text-center shadow-2xl">
            {/* Decorative elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#313D52] rounded-full blur-3xl transform -translate-x-40 translate-y-40"></div>
            </div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-[#313D52] rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-[#78f3d3] text-4xl">✨</span>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-black text-[#313D52] mb-6">
                ¿Inspirado por lo que leíste?
              </h3>
              
              <p className="text-xl text-[#313D52]/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                No dejes que tus sneakers esperen más. Nuestro equipo de expertos está listo para 
                aplicar todas estas técnicas profesionales en tus zapatillas favoritas.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-[#313D52]">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#313D52] rounded-full flex items-center justify-center mb-3">
                    <span className="text-[#78f3d3] text-xl">🧽</span>
                  </div>
                  <h4 className="font-bold mb-2">Limpieza Profesional</h4>
                  <p className="text-sm opacity-80">Técnicas avanzadas como las del artículo</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#313D52] rounded-full flex items-center justify-center mb-3">
                    <span className="text-[#78f3d3] text-xl">🏠</span>
                  </div>
                  <h4 className="font-bold mb-2">Servicio a Domicilio</h4>
                  <p className="text-sm opacity-80">Recogemos y entregamos en tu casa</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#313D52] rounded-full flex items-center justify-center mb-3">
                    <span className="text-[#78f3d3] text-xl">✨</span>
                  </div>
                  <h4 className="font-bold mb-2">Resultados Garantizados</h4>
                  <p className="text-sm opacity-80">Como nuevos o te devolvemos el dinero</p>
                </div>
              </div>
              
              <BookingButton className="group inline-flex items-center px-12 py-5 bg-[#313D52] text-white text-xl font-black rounded-full hover:bg-[#242e40] transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
                Reserva ahora
                <ArrowRight size={24} className="ml-4 group-hover:translate-x-2 transition-transform" />
              </BookingButton>
              
              <p className="text-sm text-[#313D52]/60 mt-6">
                📞 Respuesta inmediata • 🚀 Pickup gratis en CDMX • 💎 Garantía total
              </p>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </>
  );
};

export default BlogPostPage;