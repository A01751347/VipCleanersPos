'use client'
import React from 'react';
import { Star, CheckCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import BookingButton from './BookingButton';
import AnimateOnScroll from '../components/AnimateOnScroll';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16 sm:pt-20" id="home">
      {/* Background Layer */}
      <BackgroundLayer />
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        {/* Left Side - Text Content */}
        <LeftContent />
        
        {/* Right Side - Image */}
        <RightContent />
      </div>

      {/* Scroll Indicator - Hidden on mobile */}
      <ScrollIndicator />
    </section>
  );
};

// Background with overlay and pattern
const BackgroundLayer: React.FC = () => (
  <>
    <div className="absolute inset-0 bg-[#313D52] bg-opacity-90 z-0" />
    <div 
      className="absolute inset-0 opacity-5"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2378f3d3' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    />
  </>
);

// Left side content with text and buttons
const LeftContent: React.FC = () => (
  <div className="w-full lg:w-1/2 text-center lg:text-left">
    {/* Header with rating */}
    <AnimateOnScroll type="fade-up">
      <HeaderWithRating />
    </AnimateOnScroll>
    
    {/* Main title */}
    <AnimateOnScroll type="fade-up" delay={0.1}>
      <MainTitle />
    </AnimateOnScroll>
    
    {/* Description */}
    <AnimateOnScroll type="fade-up" delay={0.2}>
      <Description />
    </AnimateOnScroll>

    {/* Stats */}
    <AnimateOnScroll type="fade-up" delay={0.25}>
      <QuickStats />
    </AnimateOnScroll>
    
    {/* Action buttons */}
    <AnimateOnScroll type="fade-up" delay={0.3}>
      <ActionButtons />
    </AnimateOnScroll>

    {/* Trust indicators */}
    <AnimateOnScroll type="fade-up" delay={0.4}>
      <TrustIndicators />
    </AnimateOnScroll>
  </div>
);

// Header section with subtitle and rating
const HeaderWithRating: React.FC = () => (
  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-4 mb-4">
    <span className="text-[#78f3d3] font-medium uppercase tracking-widest text-xs sm:text-sm">
    Cada par cuenta una historia, y nosotros somos parte de ella.
    </span>
    <div className="flex items-center text-[#78f3d3]">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={14} fill="currentColor" />
      ))}
      <span className="ml-2 text-xs sm:text-sm text-white opacity-80">4.9/5</span>
    </div>
  </div>
);

// Main hero title - Responsive text sizes
const MainTitle: React.FC = () => (
  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
    DEJANOS ESTAR
    <span className="text-[#78f3d3] block">EN CADA PASO</span>
  </h1>
);

// Description paragraph - Better mobile spacing
const Description: React.FC = () => (
  <p className="text-gray-300 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
    Servicios premium de limpieza para sneakers. 
    Los tratamos con el cuidado que merecen, utilizando técnicas de calidad 
    y equipo profesional.
  </p>
);

// Quick stats section - Better mobile layout
const QuickStats: React.FC = () => (
  <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-6 mb-6 sm:mb-8">
    <StatItem icon={CheckCircle} text="3K+ Pares Atendidos" />
    <StatItem icon={Clock} text="Entrega en 24-48hrs" />
  </div>
);

// Individual stat item - Better mobile sizing
const StatItem: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex items-center justify-center lg:justify-start text-white">
    <Icon size={18} className="text-[#78f3d3] mr-2 flex-shrink-0" />
    <span className="text-sm sm:text-base">{text}</span>
  </div>
);

// Action buttons section - Stacked on mobile
const ActionButtons: React.FC = () => (
  <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 mb-6 sm:mb-8">
    <BookingButton className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#78f3d3] text-[#313D52] font-bold rounded-full hover:bg-[#4de0c0] transition-all duration-300 text-sm sm:text-base">
      Reserva una Limpieza
    </BookingButton>
    <a 
      href="#services" 
      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-[#78f3d3] text-[#78f3d3] font-bold rounded-full hover:bg-[#78f3d3] hover:text-[#313D52] transition-all duration-300 text-center text-sm sm:text-base"
    >
      Nuestros Servicios
    </a>
  </div>
);

// Trust indicators - Better mobile layout
const TrustIndicators: React.FC = () => (
  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-6 text-xs sm:text-sm text-gray-400">
    <span className="flex items-center">
      <span className="text-[#78f3d3] mr-1">✓</span>
      Garantía 100%
    </span>
    <span className="flex items-center">
      <span className="text-[#78f3d3] mr-1">✓</span>
      Productos Ecológicos
    </span>
    <span className="flex items-center">
      <span className="text-[#78f3d3] mr-1">✓</span>
      Pickup Disponible
    </span>
  </div>
);

// Right side content with image - Better mobile sizing
const RightContent: React.FC = () => (
  <AnimateOnScroll type="fade-left" delay={0.4}>
    <div className="w-full lg:w-1/2 flex justify-center relative mt-8 lg:ml-64 lg:mt-0">
      {/* Background gradient circle - Smaller on mobile */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#78f3d3] to-[#4de0c0] rounded-full blur-3xl opacity-20 scale-110 sm:scale-125 lg:scale-150" />
      
      {/* Main image - Responsive sizing */}
      <Image 
  src="/assets/Logo_VIP.png" 
  alt="Logo VIP"
  width={900}
  height={700}
  className="w-64 sm:w-80 md:w-96 lg:w-[800px] xl:w-[1000px] max-w-full h-auto transform hover:scale-105 transition-transform duration-200"
  
  priority
/>

    </div>
  </AnimateOnScroll>
);

// Scroll indicator at bottom - Hidden on small screens
const ScrollIndicator: React.FC = () => (
  <AnimateOnScroll>
    <div className="hidden md:block absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center">
      <div className="animate-bounce">
        <p className="text-sm mb-2 uppercase opacity-70 tracking-wider">Desliza Abajo</p>
        <div className="mx-auto w-6 h-10 border-2 border-[#78f3d3] rounded-full flex justify-center">
          <div className="w-1 h-3 bg-[#78f3d3] rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </div>
  </AnimateOnScroll>
);

export default Hero;