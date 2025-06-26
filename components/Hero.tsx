'use client'
import React from 'react';
import { Star, CheckCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import BookingButton from './BookingButton';
import AnimateOnScroll from '../components/AnimateOnScroll';

const Hero: React.FC = () => {
  return (
    <section className="relative h-screen flex items-center overflow-hidden" id="home">
      {/* Background Layer */}
      <BackgroundLayer />
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between">
        {/* Left Side - Text Content */}
        <LeftContent />
        
        {/* Right Side - Image */}
        <RightContent />
      </div>

      {/* Scroll Indicator */}
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
  <div className="max-w-2xl lg:w-1/2 mb-8 lg:mb-0">
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
  <div className="flex items-center mb-4">
    <span className="text-[#78f3d3] font-medium uppercase tracking-widest text-sm sm:text-base">
      Expertos en el Cuidado de tus Zapatillas
    </span>
    <div className="ml-4 flex items-center text-[#78f3d3]">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={16} fill="currentColor" />
      ))}
      <span className="ml-2 text-sm text-white opacity-80">4.9/5</span>
    </div>
  </div>
);

// Main hero title
const MainTitle: React.FC = () => (
  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
    DEJANOS ESTAR
    <span className="text-[#78f3d3] block">EN CADA PASO</span>
  </h1>
);

// Description paragraph
const Description: React.FC = () => (
  <p className="text-gray-300 text-lg mb-8 leading-relaxed">
    Servicios premium de limpieza para sneakers. 
    Los tratamos con el cuidado que merecen, utilizando técnicas de calidad 
    y equipo profesional.
  </p>
);

// Quick stats section
const QuickStats: React.FC = () => (
  <div className="flex flex-wrap gap-6 mb-8">
    <StatItem icon={CheckCircle} text="3K+ Pares Atendidos" />
    <StatItem icon={Clock} text="Entrega en 24-48hrs" />
  </div>
);

// Individual stat item
const StatItem: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex items-center text-white">
    <Icon size={20} className="text-[#78f3d3] mr-2" />
    <span className="text-sm">{text}</span>
  </div>
);

// Action buttons section
const ActionButtons: React.FC = () => (
  <div className="flex flex-wrap gap-4">
    <BookingButton className="primary-button">
      Reserva una Limpieza
    </BookingButton>
    <a href="#services" className="secondary-button">
      Nuestros Servicios
    </a>
  </div>
);

// Trust indicators
const TrustIndicators: React.FC = () => (
  <div className="mt-8 flex items-center space-x-6 text-sm text-gray-400">
    <span>✓ Garantía 100%</span>
    <span>✓ Productos Ecológicos</span>
    <span>✓ Pickup Disponible</span>
  </div>
);

// Right side content with image
const RightContent: React.FC = () => (
  <AnimateOnScroll type="fade-left" delay={0.4}>
    <div className="lg:w-1/2 flex justify-center relative">
      {/* Background gradient circle */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#78f3d3] to-[#4de0c0] rounded-full blur-3xl opacity-20 scale-150" />
      
      {/* Main image */}
      <Image 
  src="/assets/Logo_VIP.png" 
  alt="Logo VIP"
  width={500}
  height={300}
  className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-auto transform hover:scale-105 transition-transform duration-200"
  priority
/>


    </div>
  </AnimateOnScroll>
);

// Floating decorative elements
const FloatingElements: React.FC = () => (
  <>
    <div className="absolute top-10 right-10 w-20 h-20 bg-[#78f3d3] bg-opacity-20 rounded-full animate-pulse" />
    <div className="absolute bottom-20 left-10 w-16 h-16 bg-[#78f3d3] bg-opacity-30 rounded-full animate-bounce" />
  </>
);

// Scroll indicator at bottom
const ScrollIndicator: React.FC = () => (
  <AnimateOnScroll>
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center">
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