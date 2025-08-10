'use client'
// components/DetailedReviews.tsx
import React, { useState } from 'react';
import { Star, StarHalf, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimateOnScroll from './AnimateOnScroll';

interface Review {
  id: number;
  name: string;
  avatar: string;
  date: string;
  rating: number;
  text: string;
  shoes: string;
  service: string;
}

const DetailedReviews: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  const reviews: Review[] = [
    {
      id: 1,
      name: "Carlos Mendoza",
      avatar: "/assets/reviews/avatar2.jpg",
      date: "15 marzo, 2025",
      rating: 5,
      text: "Increíble trabajo con mis Air Jordan 1. Estaban completamente sucios y manchados, y ahora parecen nuevos. La atención al detalle es impresionante, incluso limpiaron las agujetas y les aplicaron protector. ¡100% recomendado!",
      shoes: "Air Jordan 1 Chicago",
      service: "Limpieza Premium"
    },
    {
      id: 2,
      name: "Laura Sánchez",
      avatar: "/assets/reviews/avatar3.jpg",
      date: "2 marzo, 2025",
      rating: 4.5,
      text: "Llevé mis Yeezys que pensé que ya no tenían salvación por una mancha de café muy difícil. El resultado me dejó sorprendida, se ve como si nunca hubiera tenido la mancha. Solo la entresuela tiene un detalle mínimo que no pudieron quitar del todo, pero estoy súper contenta con el resultado.",
      shoes: "Adidas Yeezy 350",
      service: "Limpieza Premium"
    },
    {
      id: 3,
      name: "Miguel Ángel Rojas",
      avatar: "/assets/reviews/avatar1.jpg",
      date: "28 febrero, 2025",
      rating: 5,
      text: "Segunda vez que traigo mis sneakers aquí y nuevamente quedé impresionado con los resultados. El servicio es rápido, el personal muy amable, y lo más importante, mis zapatillas se ven espectaculares. Definitivamente mi lugar de confianza para el cuidado de mi colección.",
      shoes: "Nike Air Max 90",
      service: "Limpieza Básica"
    }
  ];
  
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={18} fill="#FFD700" color="#FFD700" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" size={18} fill="#FFD700" color="#FFD700" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={18} color="#D1D5DB" />);
    }
    
    return stars;
  };
  
  const nextReview = () => {
    setCurrentIndex((currentIndex + 1) % reviews.length);
  };
  
  const prevReview = () => {
    setCurrentIndex((currentIndex - 1 + reviews.length) % reviews.length);
  };
  
  const currentReview = reviews[currentIndex];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <span className="text-sm sm:text-base font-medium uppercase tracking-wider text-[#78D5D3]">Valoraciones</span>
            <h2 className="mt-2 text-3xl font-bold text-[#313D52] sm:text-4xl">Lo que opinan nuestros clientes</h2>
            <div className="flex items-center justify-center gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={24} className="text-yellow-400" fill="#FBBF24" />
              ))}
            </div>
            <p className="text-lg font-medium mt-2 text-[#6c7a89]">4.9 de 5 basado en 237 reseñas</p>
          </div>
        </AnimateOnScroll>
        
        <AnimateOnScroll type="fade-up">
          <div className="bg-[#f5f9f8] rounded-xl p-8 md:p-12 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 mr-4">
                  {/* En un proyecto real, usar Next Image */}
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${currentReview.avatar})` }}
                  ></div>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-[#313D52]">{currentReview.name}</h4>
                  <div className="flex items-center mt-1">
                    {renderStars(currentReview.rating)}
                    <span className="ml-2 text-[#6c7a89] text-sm">{currentReview.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="hidden md:block text-right">
                <div className="text-[#313D52] font-medium">{currentReview.shoes}</div>
                <div className="text-[#6c7a89] text-sm">{currentReview.service}</div>
              </div>
            </div>
            
            <div className="md:hidden mb-4 mt-2">
              <div className="text-[#313D52] font-medium">{currentReview.shoes}</div>
              <div className="text-[#6c7a89] text-sm">{currentReview.service}</div>
            </div>
            
            <p className="text-[#313D52] text-lg leading-relaxed mb-8">
             &ldquo;{currentReview.text}&rdquo;
            </p>
            
            <div className="flex justify-between items-center">
              <div className="text-[#6c7a89] text-sm">
                Reseña {currentIndex + 1} de {reviews.length}
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={prevReview}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#6c7a89] hover:bg-[#78f3d3] hover:text-[#313D52] transition-colors"
                  aria-label="Reseña anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <button 
                  onClick={nextReview}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#6c7a89] hover:bg-[#78f3d3] hover:text-[#313D52] transition-colors"
                  aria-label="Reseña siguiente"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
        
        <AnimateOnScroll delay={0.2}>
          <div className="text-center mt-10">
            <a 
              href="#" 
              className="inline-flex items-center text-[#313D52] font-medium hover:text-[#78f3d3] transition-colors"
            >
              Ver todas las reseñas en Google
              <ChevronRight size={16} className="ml-1" />
            </a>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default DetailedReviews;