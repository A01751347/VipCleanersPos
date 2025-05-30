// components/Services.tsx con animaciones
import React from 'react';
import Link from 'next/link';
import { Shield, Brush, CheckCircle, ArrowRight } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import AnimateOnScroll from './AnimateOnScroll';

interface ServiceCardProps {
  title: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  index: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, features, icon: Icon, index }) => {
  return (
    <AnimateOnScroll type="fade-up" delay={0.1 * index}>
      <div className="bg-[#f5f9f8] rounded-xl p-8 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-[0_10px_15px_-3px_rgba(49,61,82,0.1),0_4px_6px_-2px_rgba(49,61,82,0.05)] group border border-[#e0e6e5]">
        <div className="w-16 h-16 rounded-full bg-[#78f3d3] bg-opacity-20 flex items-center justify-center text-[#313D52] mb-6 group-hover:bg-[#78f3d3] group-hover:text-[#313D52] transition-all">
          <Icon size={32} />
        </div>
        
        <h3 className="text-xl font-semibold text-[#313D52] mb-4">{title}</h3>
        
        <p className="text-[#6c7a89] mb-6">
          {description}
        </p>
        
        <ul className="space-y-2 mb-6">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start text-[#3e4a61]">
              <CheckCircle size={18} className="text-[#78C9D3] mr-2 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <Link href="/" className="inline-flex items-center text-[#313D52] font-medium hover:text-[#78f3d3] transition-colors group-hover:translate-x-1">
          Saber Más 
          <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </AnimateOnScroll>
  );
};

const Services: React.FC = () => {
  const services = [
    {
      icon: Shield,
      title: "Limpieza Básica",
      description: "Nuestro servicio de limpieza básica está diseñado para mantener tus zapatillas en óptimas condiciones con un cuidado regular y efectivo.",
      features: [
        "Limpieza exterior completa",
        "Tratamiento desodorizante",
        "Limpieza de agujetas",
        "Secado especializado",
        "Eliminación de manchas superficiales",
        "Cepillado y acondicionamiento"
      ]
    },
    {
      icon: Brush,
      title: "Limpieza Premium",
      description: "Un servicio integral que combina limpieza profunda y técnicas de restauración para devolver a tus zapatillas su apariencia y condición original.",
      features: [
        "Todo lo incluido en la limpieza básica",
        "Limpieza profunda de suelas",
        "Tratamiento antimanchas avanzado",
        "Impermeabilización premium",
        "Restauración de color",
        "Tratamiento antiolor profesional",
        "Servicio prioritario"
      ]
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="services">
      <div className="max-w-7xl mx-auto">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <span className="text-sm sm:text-base font-medium uppercase tracking-wider text-[#78D5D3]">LO QUE OFRECEMOS</span>
            <h2 className="mt-2 text-3xl font-bold text-[#313D52] sm:text-4xl">Nuestros Servicios Premium</h2>
            <p className="mt-4 max-w-2xl mx-auto text-[#6c7a89]">
              Ofrecemos servicios especializados de limpieza y cuidado para tus zapatillas favoritas, garantizando los mejores resultados con técnicas profesionales y productos de alta calidad.
            </p>
          </div>
        </AnimateOnScroll>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              features={service.features}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;