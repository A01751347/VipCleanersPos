'use client'
import React from 'react';
import { ChevronDown } from 'lucide-react';
import BookingButton from './BookingButton';
import Image from 'next/image';
import AnimateOnScroll from '../components/AnimateOnScroll';

const Hero: React.FC = () => {
  return (
    <section className="relative h-screen flex items-center" id="home">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-[#313D52] bg-opacity-90 z-0" />

      {/* Contenedor principal con flexbox */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
        
        {/* --- IZQUIERDA: Texto y botones --- */}
        <div className="max-w-2xl md:w-1/2 mb-8 md:mb-0">
          <AnimateOnScroll type="fade-up">
            <span className="text-[#78f3d3] font-medium uppercase tracking-widest text-sm sm:text-base mb-4 block">
              Expertos en el Cuidado de tus Zapatillas
            </span>
          </AnimateOnScroll>
          
          <AnimateOnScroll type="fade-up" delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              REGRESA TUS KICKS A LA VIDA
            </h1>
          </AnimateOnScroll>
          
          <AnimateOnScroll type="fade-up" delay={0.2}>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Servicios premium de limpieza y restauración para zapatillas. 
              Tratamos tus zapatos con el cuidado que merecen, utilizando técnicas de calidad 
              profesional y productos ecológicos.
            </p>
          </AnimateOnScroll>
          
          <AnimateOnScroll type="fade-up" delay={0.3}>
            <div className="flex flex-wrap gap-4">
              <BookingButton 
                className="px-8 py-3 bg-[#78f3d3] text-[#313D52] font-semibold rounded-full shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] transform hover:-translate-y-1 transition-all hover:bg-[#4de0c0]"
              >
                Reserva una Limpieza
              </BookingButton>
              <a 
                href="#services" 
                className="px-8 py-3 text-white font-semibold rounded-full border-2 border-[#78f3d3] hover:bg-[#78f3d3] hover:text-[#313D52] transform hover:-translate-y-1 transition-all"
              >
                Nuestros Servicios
              </a>
            </div>
          </AnimateOnScroll>
        </div>

        {/* --- DERECHA: Imagen --- */}
        <AnimateOnScroll type="fade-left" delay={0.4}>
          <div className=" flex justify-center">
            <Image 
              src="/assets/Logo_VIP.png" 
              alt="Logo VIP"
              width={600}
              height={700}
              className="w-full h-full"
              priority
            />
          </div>
        </AnimateOnScroll>
      </div>

      {/* Scroll Indicator */}
      <AnimateOnScroll >
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center animate-bounce">
          <p className="text-sm mb-2 uppercase opacity-70">Desliza Abajo</p>
          <ChevronDown size={24} className="text-[#78f3d3]" />
        </div>
      </AnimateOnScroll>
    </section>
  );
};
export default Hero;