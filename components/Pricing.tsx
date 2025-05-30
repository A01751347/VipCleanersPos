"use client"
// components/Pricing.tsx con animaciones
import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import AnimateOnScroll from './AnimateOnScroll';

interface PricingCardProps {
  title: string;
  subtitle: string;
  price: number;
  features: string[];
  featured?: boolean;
  index: number;
}

const PricingCard: React.FC<PricingCardProps> = ({ title, subtitle, price, features, featured = false, index }) => {
  return (
    <AnimateOnScroll type={featured ? "zoom-in" : "fade-up"} delay={0.1 * index}>
      <div className={`bg-white rounded-xl overflow-hidden transition-all duration-300 shadow-[0_10px_15px_-3px_rgba(49,61,82,0.1),0_4px_6px_-2px_rgba(49,61,82,0.05)] ${
        featured ? 'transform scale-105 md:scale-110 z-10 relative' : 'hover:transform hover:-translate-y-2'
      }`}>
        <div className={`p-6 text-center ${featured ? 'bg-[#78f3d3] text-[#313D52]' : 'bg-[#313D52] text-white'}`}>
          <h3 className="text-xl font-semibold mb-1">{title}</h3>
          <p className="text-sm opacity-80">{subtitle}</p>
        </div>
        
        <div className="p-8 text-center border-b border-gray-200">
          <div className="text-4xl font-bold text-[#313D52]">${price}</div>
          <p className="text-[#6c7a89] mt-1">por par</p>
        </div>
        
        <div className="p-8">
          <ul className="space-y-4">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start">
                <div className={`flex-shrink-0 mr-3 mt-1 ${featured ? 'text-[#78f3d3]' : 'text-[#4de0c0]'}`}>
                  <Check size={18} />
                </div>
                <span className="text-[#3e4a61]">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-8 pt-0 text-center">
          <a 
            href="#booking" 
            className={`inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold shadow-[0_4px_6px_-1px_rgba(49,61,82,0.1),0_2px_4px_-1px_rgba(49,61,82,0.06)] transition-all ${
              featured 
                ? 'bg-[#78f3d3] text-[#313D52] hover:bg-[#4de0c0] hover:shadow-[0_10px_15px_-3px_rgba(49,61,82,0.1),0_4px_6px_-2px_rgba(49,61,82,0.05)]' 
                : 'bg-[#f5f9f8] text-[#313D52] hover:bg-[#e0e6e5]'
            }`}
          >
            Reserva Ahora
            <ArrowRight size={18} className="ml-2" />
          </a>
        </div>
      </div>
    </AnimateOnScroll>
  );
};

interface PricingPlan {
  title: string;
  subtitle: string;
  price: number;
  features: string[];
  featured?: boolean;
}

const Pricing: React.FC = () => {
  const [isMonthly, setIsMonthly] = useState<boolean>(false);

  const togglePricing = (): void => {
    setIsMonthly(!isMonthly);
  };

  const pricingData: {
    perService: PricingPlan[];
    monthly: PricingPlan[];
  } = {
    perService: [
      {
        title: "Limpieza Básica",
        subtitle: "Para mantenimiento regular",
        price: 139,
        features: [
          "Limpieza exterior completa",
          "Tratamiento desodorizante",
          "Limpieza de agujetas",
          "Secado especializado",
          "Eliminación de manchas superficiales",
          "Cepillado y acondicionamiento",
          "Entrega en 48 horas"
        ]
      },
      {
        title: "Limpieza Premium",
        subtitle: "Servicio integral y prioritario",
        price: 189,
        features: [
          "Todo lo de la limpieza básica",
          "Limpieza profunda de suelas",
          "Tratamiento antimanchas avanzado",
          "Tratamiento antiolor profesional",
          "Servicio prioritario",
          "Entrega en 24 horas"
        ],
        featured: true
      }
    ],
    monthly: [
      {
        title: "Membresía Básica",
        subtitle: "Para cuidado regular",
        price: 119,
        features: [
          "1 Limpieza Básica por mes",
          "10% de descuento en servicios adicionales",
          "Servicio prioritario",
          "Tips mensuales de cuidado",
          "Revisión gratuita de tus sneakers",
          "Atención personalizada",
          "Almacenamiento de tus preferencias"
        ]
      },
      {
        title: "Membresía Premium",
        subtitle: "Para entusiastas de sneakers",
        price: 219,
        features: [
          "1 Limpieza Premium por mes",
          "15% de descuento en servicios adicionales",
          "Servicio VIP",
          "Eventos exclusivos",
          "Consulta personal con especialistas",
          "Productos de mantenimiento de regalo",
          "Pick-up y entrega a domicilio"
        ],
        featured: true
      }
    ]
  };

  const currentPricing = isMonthly ? pricingData.monthly : pricingData.perService;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f5f9f8]" id="pricing">
      <div className="max-w-7xl mx-auto">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <span className="text-sm sm:text-base font-medium uppercase tracking-wider text-[#78D5D3]">Nuestras Tarifas</span>
            <h2 className="mt-2 text-3xl font-bold text-[#313D52] sm:text-4xl">Precios de Servicio</h2>
            <p className="mt-4 max-w-2xl mx-auto text-[#6c7a89]">
              Precios transparentes para nuestros servicios de limpieza. El cuidado de calidad para tus zapatillas no tiene por qué ser costoso.
            </p>
          </div>
        </AnimateOnScroll>
        
        <AnimateOnScroll type="fade-up" delay={0.2}>
          <div className="flex justify-center items-center gap-4 mb-12">
            <span className={`font-medium ${!isMonthly ? 'text-[#78D5D3]' : 'text-[#6c7a89]'}`}>
              Pago por Servicio
            </span>
            
            <button
              className="relative w-16 h-8 rounded-full p-0 focus:outline-none"
              onClick={togglePricing}
              aria-label="Toggle pricing plan"
            >
              {/* Fondo dinámico */}
              <div
                className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                  isMonthly ? 'bg-[#78D5D3]' : 'bg-[#e0e6e5]'
                }`}
              ></div>

              {/* Thumb */}
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                  isMonthly ? 'translate-x-8' : 'translate-x-0'
                }`}
              ></div>
            </button>
            
            <span className={`font-medium ${isMonthly ? 'text-[#78D5D3]' : 'text-[#6c7a89]'}`}>
              Membresía Mensual
            </span>
          </div>
        </AnimateOnScroll>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {currentPricing.map((plan, index) => (
            <PricingCard
              key={index}
              title={plan.title}
              subtitle={plan.subtitle}
              price={plan.price}
              features={plan.features}
              featured={plan.featured}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;