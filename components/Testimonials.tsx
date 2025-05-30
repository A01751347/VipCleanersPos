"use client"
// components/Testimonials.tsx con animaciones
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import AnimateOnScroll from './AnimateOnScroll';

interface TestimonialProps {
  quote: string;
  client: string;
  profession: string;
  avatar: string;
  isActive: boolean;
}

interface TestimonialData {
  quote: string;
  client: string;
  profession: string;
  avatar: string;
}

const Testimonial: React.FC<TestimonialProps> = ({ quote, client, profession, avatar, isActive }) => {
  return (
    <div className={`bg-white bg-opacity-10 rounded-xl p-8 relative transition-all duration-300 transform ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`}>
      <Quote className="absolute top-6 right-6 text-[#78f3d3] opacity-20" size={40} />
      <p className="text-lg italic mb-8 leading-relaxed text-opacity-90">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center">
        <div 
          className="w-16 h-16 rounded-full mr-4 border-2 border-[#78f3d3] bg-cover bg-center"
          style={{ backgroundImage: `url(${avatar})` }}
        ></div>
        <div>
          <h4 className=" font-semibold text-lg">{client}</h4>
          <p className=" text-opacity-70">{profession}</p>
        </div>
      </div>
    </div>
  );
};

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [activeItems, setActiveItems] = useState<number[]>([]);
  const [windowWidth, setWindowWidth] = useState<number>(0);

  const testimonials: TestimonialData[] = [
    {
      quote: "¡VIP Cleaners devolvió la vida a mis Air Jordans vintage! Parecían completamente desgastados, pero ahora están casi como nuevos. La atención al detalle es increíble.",
      client: "Alberto Rodriguéz",
      profession: "Coleccionista",
      avatar: "/api/placeholder/200/200"
    },
    {
      quote: "Al principio era escéptica, pero mis Yeezys regresaron luciendo como nuevos. El equipo fue profesional y el servicio fue rápido. ¡Altamente recomendado!",
      client: "Sarah Ander",
      profession: "Fashion Influencer",
      avatar: "/api/placeholder/200/200"
    },
    {
      quote: "¡El trabajo de limpieza premium que hicieron en mis zapatillas es increíble! Recibo cumplidos por donde paso. Vale cada centavo por tener un par verdaderamente único.",
      client: "David Chen",
      profession: "Artista Visual",
      avatar: "/api/placeholder/200/200"
    },
    {
      quote: "Ensucié mis tenis en lodo. VIP Cleaners me salvó completamente! Su servicio de restauración es magia.",
      client: "Jessica Rodriguez",
      profession: "Coleccionista",
      avatar: "/api/placeholder/200/200"
    }
  ];

  // Actualizar el ancho de ventana
  useEffect(() => {
    const handleResize = (): void => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determinar cuántos testimonios mostrar según el ancho de pantalla
  useEffect(() => {
    let itemsToShow = 1;
    if (windowWidth >= 1024) {
      itemsToShow = 3;
    } else if (windowWidth >= 768) {
      itemsToShow = 2;
    }
    const indices: number[] = [];
    for (let i = 0; i < itemsToShow; i++) {
      const index = (currentIndex + i) % testimonials.length;
      indices.push(index);
    }
    setActiveItems(indices);
  }, [currentIndex, windowWidth, testimonials.length]);

  const goNext = (): void => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const goPrev = (): void => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1));
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#313D52]" id="testimonials">
      <div className="max-w-7xl mx-auto">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <span className="text-sm sm:text-base font-medium uppercase tracking-wider text-[#78f3d3]">Clientes Felices</span>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Lo que dicen nuestros clientes</h2>
            <p className="mt-4 max-w-2xl mx-auto text-white text-opacity-80">
              Escucha lo que algunos clientes tienen que decir sobre nuestro servicio de limpieza y restauración de zapatillas.
            </p>
          </div>
        </AnimateOnScroll>
        
        <div className="relative">
          {/* Grid de testimonios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={activeItems.includes(index) ? 'block' : 'hidden'}>
                <AnimateOnScroll type="zoom-in" delay={0.1 * (index % 3)}>
                  <Testimonial
                    quote={testimonial.quote}
                    client={testimonial.client}
                    profession={testimonial.profession}
                    avatar={testimonial.avatar}
                    isActive={index === currentIndex}
                  />
                </AnimateOnScroll>
              </div>
            ))}
          </div>
          
          {/* Controles de navegación */}
          <AnimateOnScroll>
            <div className="flex justify-center mt-12 space-x-4">
              <button 
                onClick={goPrev}
                className="w-12 h-12 rounded-full bg-[#3e4a61] flex items-center justify-center text-white hover:bg-[#78f3d3] hover:text-[#313D52] transition-colors focus:outline-none"
                aria-label="Testimonio anterior"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button 
                onClick={goNext}
                className="w-12 h-12 rounded-full bg-[#3e4a61] flex items-center justify-center text-white hover:bg-[#78f3d3] hover:text-[#313D52] transition-colors focus:outline-none"
                aria-label="Testimonio siguiente"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </AnimateOnScroll>
          
          {/* Indicadores */}
          <AnimateOnScroll delay={0.3}>
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${index === currentIndex ? 'bg-[#78f3d3] w-6' : 'bg-white bg-opacity-30'}`}
                  aria-label={`Ir al testimonio ${index + 1}`}
                />
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;