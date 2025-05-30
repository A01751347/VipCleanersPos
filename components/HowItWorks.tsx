// src/components/HowItWorks.tsx
"use client"
// components/HowItWorks.tsx
import React, { useEffect, useState } from 'react';
import { CalendarCheck, Box, Wand2, CheckCircle } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps: Step[] = [
    {
      icon: CalendarCheck,
      title: "Reserva una Limpieza",
      description: "Programa tu servicio en línea o llámanos para concertar una cita."
    },
    {
      icon: Box,
      title: "Entrega/Recolección",
      description: "Entrega tus zapatillas o utiliza nuestro conveniente servicio de recolección."
    },
    {
      icon: Wand2,
      title: "Cuidado Experto",
      description: "Nuestros especialistas hacen magia con técnicas profesionales."
    },
    {
      icon: CheckCircle,
      title: "Listas para Usar",
      description: "Recoge tus zapatillas renovadas o recíbelas en tu puerta."
    }
  ];

  useEffect(() => {
    // Observer logic to detect when steps come into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stepIndex = parseInt(entry.target.getAttribute('data-step') || '0') - 1;
          setActiveStep(stepIndex);
        }
      });
    }, { threshold: 0.6 });

    document.querySelectorAll('[data-step]').forEach(step => {
      observer.observe(step);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f5f9f8] relative overflow-hidden" id="how-it-works">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
        style={{
          backgroundImage: "url('https://via.placeholder.com/200')",
          backgroundRepeat: 'repeat',
          backgroundSize: '200px'
        }}>
      </div>
      
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <span className="text-sm sm:text-base font-medium uppercase tracking-wider text-[#78D5D3]">Un Proceso Simple</span>
          <h2 className="mt-2 text-3xl font-bold text-[#313D52] sm:text-4xl">CÓMO FUNCIONA</h2>
          <p className="mt-4 max-w-2xl mx-auto text-[#6c7a89]">
            Nuestro proceso simplificado facilita que tus zapatillas sean limpiadas y restauradas con cuidado profesional.
            No te quedes solo con nuestras palabras. Escucha lo que dicen nuestros clientes acerca de nuestros servicios.
          </p>
        </div>

        {/* Process Steps - All screen sizes */}
        <div className="relative max-w-6xl mx-auto">
          {/* Progress line - Only visible on md screens and up */}
          <div className="absolute top-9 left-0 right-0 h-1 bg-[#e0e6e5] hidden md:block"></div>
          
          {/* Active progress line - Only visible on md screens and up */}
          <div 
            className="absolute top-9 left-0 h-1 bg-[#78f3d3] transition-all duration-700 hidden md:block"
            style={{ width: `${(activeStep + 1) * 25}%` }}
          ></div>
          
          <div className="flex flex-col md:flex-row md:justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index <= activeStep;
              
              return (
                <div 
                  key={index}
                  data-step={index + 1}
                  className="flex md:flex-col items-start md:items-center mb-8 md:mb-0 md:w-1/4 relative"
                >
                  <div 
                    className={`w-12 h-12 md:w-16 md:h-16 rounded-full z-10 flex items-center justify-center md:mb-6 mr-4 md:mr-0 transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#78f3d3] text-[#313D52] shadow-lg md:transform md:scale-110' 
                        : 'bg-[#e0e6e5] text-[#6c7a89]'
                    }`}
                  >
                    <StepIcon size={24} className="md:text-2xl" />
                  </div>
                  
                  <div className="md:text-center">
                    <h3 className={`text-lg font-semibold mb-1 md:mb-2 transition-colors ${
                      isActive ? 'text-[#78D5D3]' : 'text-[#313D52]'
                    }`}>
                      {step.title}
                    </h3>
                    
                    <p className="text-[#6c7a89] md:text-center md:px-4 text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;