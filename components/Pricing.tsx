
"use client"
// components/Pricing.tsx - Versión mejorada solo para servicios de limpieza
import React from 'react';
import { Check, ArrowRight, Sparkles, Shield } from 'lucide-react';
import AnimateOnScroll from './AnimateOnScroll';
import BookingButton from './BookingButton';

interface PricingCardProps {
  title: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  features: string[];
  featured?: boolean;
  index: number;
  badge?: string;
  icon?: React.ReactNode;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
  title, 
  subtitle, 
  price, 
  originalPrice,
  features, 
  featured = false, 
  index,
  badge,
  icon
}) => {
  return (
    <AnimateOnScroll type={featured ? "zoom-in" : "fade-up"} delay={0.1 * index}>
      <div className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-500 group ${
        featured 
          ? 'transform scale-105 md:scale-110 z-10 shadow-[0_25px_50px_-12px_rgba(49,61,82,0.25)] border-2 border-[#78f3d3]' 
          : 'shadow-[0_10px_25px_-5px_rgba(49,61,82,0.1)] hover:shadow-[0_20px_40px_-8px_rgba(49,61,82,0.15)] hover:transform hover:-translate-y-3'
      }`}>
        

        {/* Header con gradiente */}
        <div className={`relative p-8 text-center ${
          featured 
            ? 'bg-gradient-to-br from-[#78f3d3] via-[#6ae8c8] to-[#4de0c0] text-[#313D52]' 
            : 'bg-gradient-to-br from-[#313D52] to-[#2a3441] text-white'
        }`}>
          {/* Patrón de fondo decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full border-2 border-current"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 rounded-full bg-current"></div>
          </div>
          
          <div className="relative z-10">
            {icon && (
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                featured ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {icon}
              </div>
            )}
            <h3 className="text-2xl font-bold mb-2">{title}</h3>
            <p className="text-base opacity-90">{subtitle}</p>
          </div>
        </div>
        
        {/* Precio */}
        <div className="px-8 py-6 text-center bg-gradient-to-b from-white to-gray-50/50">
          <div className="flex items-center justify-center gap-3">
            {originalPrice && (
              <span className="text-lg text-gray-400 line-through font-medium">${originalPrice}</span>
            )}
            <div className="text-5xl font-bold text-[#313D52]">${price}</div>
          </div>
          <p className="text-[#6c7a89] mt-2 font-medium">por par de zapatos</p>
          {originalPrice && (
            <div className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              Ahorra ${originalPrice - price}
            </div>
          )}
        </div>
        
        {/* Features */}
        <div className="px-8 py-6">
          <ul className="space-y-4">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start group/item">
                <div className={`flex-shrink-0 mr-4 mt-0.5 p-1 rounded-full transition-colors ${
                  featured 
                    ? 'text-[#78f3d3] bg-[#78f3d3]/10 group-hover/item:bg-[#78f3d3]/20' 
                    : 'text-[#4de0c0] bg-[#4de0c0]/10 group-hover/item:bg-[#4de0c0]/20'
                }`}>
                  <Check size={16} strokeWidth={3} />
                </div>
                <span className="text-[#3e4a61] font-medium leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* CTA Button */}
        <div className="px-8 pb-8">
          <BookingButton 
            className={`block w-full text-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg group/btn ${
              featured 
                ? 'bg-gradient-to-r from-[#78f3d3] to-[#4de0c0] text-[#313D52] hover:shadow-[0_10px_25px_-5px_rgba(120,243,211,0.4)] hover:scale-[1.02] transform' 
                : 'bg-[#313D52] text-white hover:bg-[#2a3441] hover:shadow-[0_10px_25px_-5px_rgba(49,61,82,0.3)] hover:scale-[1.02] transform'
            }`}
          >
            <span className="flex items-center justify-center">
              Reservar Servicio
              <ArrowRight size={20} className="ml-2 transition-transform group-hover/btn:translate-x-1" />
            </span>
          </BookingButton>
        </div>
      </div>
    </AnimateOnScroll>
  );
};

interface PricingPlan {
  title: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  features: string[];
  featured?: boolean;
  badge?: string;
  icon?: React.ReactNode;
}

const Pricing: React.FC = () => {
  const pricingPlans: PricingPlan[] = [
    {
      title: "Limpieza Básica",
      subtitle: "Perfecta para mantenimiento regular",
      price: 145,
      icon: <Sparkles size={32} className="text-current" />,
      features: [
        "Limpieza exterior completa y profunda",
        "Limpieza y blanqueamiento de agujetas",
        "Eliminación de manchas superficiales y suciedad",
        "Cepillado del material",
        "Entrega garantizada en 48 horas",
        "Garantía de satisfacción del 100%"
      ]
    },
    {
      title: "Limpieza Premium",
      subtitle: "El mejor cuidado para tus sneakers favoritos",
      price: 249,
      originalPrice: 279,
      badge: "MÁS POPULAR",
      icon: <Shield size={32} className="text-current" />,
      features: [
        "Todo lo incluido en la limpieza básica",
        "Limpieza profunda y limpieza profunda de suelas",
        "Protección contra futuras manchas",
        "Servicio prioritario y atención VIP",
        "Entrega express en 24 horas o menos",
        "Seguimiento fotográfico del proceso"
      ],
      featured: true
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#f5f9f8] via-white to-[#f0f7f6]" id="pricing">
      <div className="max-w-7xl mx-auto">
        
        {/* Header mejorado */}
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#78f3d3]/20 rounded-full text-[#313D52] font-semibold text-sm mb-6">
              <Sparkles size={16} />
              PRECIOS TRANSPARENTES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#313D52] mb-6 leading-tight">
              Servicios de Limpieza
              <span className="block text-[#78f3d3]">Profesional</span>
            </h2>
            <p className="text-xl text-[#6c7a89] max-w-3xl mx-auto leading-relaxed">
              Elige el nivel de cuidado perfecto para tus sneakers. Calidad profesional, 
              precios justos y resultados garantizados que superarán tus expectativas.
            </p>
          </div>
        </AnimateOnScroll>
        
        {/* Grid de precios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={index}
              title={plan.title}
              subtitle={plan.subtitle}
              price={plan.price}
              originalPrice={plan.originalPrice}
              features={plan.features}
              featured={plan.featured}
              badge={plan.badge}
              icon={plan.icon}
              index={index}
            />
          ))}
        </div>

        {/* Información adicional */}
        <AnimateOnScroll type="fade-up" delay={0.4}>
          <div className="mt-16 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-[0_10px_25px_-5px_rgba(49,61,82,0.1)] max-w-4xl mx-auto border border-gray-100">
              <h3 className="text-2xl font-bold text-[#313D52] mb-4">¿Tienes preguntas sobre nuestros servicios?</h3>
              <p className="text-[#6c7a89] mb-6 text-lg">
                Nuestro equipo está aquí para ayudarte a elegir el mejor servicio para tus sneakers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                  href="#contact" 
                  className="inline-flex items-center justify-center px-6 py-3 text-[#313D52] font-semibold hover:text-[#78f3d3] transition-colors"
                >
                  Contactar un Especialista
                </a>
                <a 
                  href="#faq" 
                  className="inline-flex items-center justify-center px-6 py-3 text-[#313D52] font-semibold hover:text-[#78f3d3] transition-colors"
                >
                  Ver Preguntas Frecuentes
                </a>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
        
      </div>
    </section>
  );
};

export default Pricing;