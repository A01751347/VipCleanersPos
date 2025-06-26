// src/components/HowItWorks.tsx
"use client"
import React, { useEffect, useRef, useState } from 'react';
import { CalendarCheck, Box, Wand2, CheckCircle } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const stepThresholds = [13, 38, 63, 84];


const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(-1);

  const [progress, setProgress] = useState<number>(0);

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

  const hasAnimatedRef = useRef(false);
  useEffect(() => {
    const totalDuration = 8000;
    const intervalTime = 50;
    let currentTime = 0;
    let interval: NodeJS.Timeout | null = null;
  
    const stepThresholds = [13, 38, 63, 84];

  
    const startAnimation = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;

      interval = setInterval(() => {
        currentTime += intervalTime;
        const totalProgress = Math.min((currentTime / totalDuration) * 100, 100);
  
        setProgress(totalProgress);
  
        // Paso activo solo si progreso pasó el mínimo umbral
        if (totalProgress >= stepThresholds[0]) {
          const currentStepIndex = stepThresholds.findIndex((threshold, index) => {
            const next = stepThresholds[index + 1] ?? 100;
            return totalProgress >= threshold && totalProgress < next;
          });
          setActiveStep(currentStepIndex === -1 ? stepThresholds.length - 1 : currentStepIndex);
        } else {
          setActiveStep(-1);
        }
  
        if (currentTime >= totalDuration) {
          clearInterval(interval!);
          setProgress(100);
          setActiveStep(stepThresholds.length );
        }
      }, intervalTime);
    };
  
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          currentTime = 0;
          setProgress(0);
          setActiveStep(-1);
          hasAnimatedRef.current = false; 
          startAnimation();
        }
      });
    }, { threshold: .3 });
  
    const sectionElement = document.getElementById('how-it-works');
    if (sectionElement) {
      observer.observe(sectionElement);
    }
  
    return () => {
      if (interval) clearInterval(interval);
      observer.disconnect();
    };
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
            className="absolute top-9 left-0 h-1 bg-gradient-to-r from-[#78f3d3] to-[#4fd1c7] transition-all duration-300 ease-out hidden md:block shadow-sm"
            style={{ width: `${progress}%` }}
          ></div>
          
          {/* Progress indicator for mobile */}
          <div className="mb-8 md:hidden">
            <div className="w-full h-2 bg-[#e0e6e5] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#78f3d3] to-[#4fd1c7] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = activeStep >= 0 && index <= activeStep;

              const isCurrentStep = index === activeStep;
              
              return (
                <div 
                  key={index}
                  className="flex md:flex-col items-start md:items-center mb-8 md:mb-0 md:w-1/4 relative"
                >
                  <div 
                    className={`w-12 h-12 md:w-16 md:h-16 rounded-full z-10 flex items-center justify-center md:mb-6 mr-4 md:mr-0 transition-all duration-500 transform ${
                      isActive 
                        ? 'bg-gradient-to-br from-[#78f3d3] to-[#4fd1c7] text-white shadow-lg md:scale-110' 
                        : 'bg-[#e0e6e5] text-[#6c7a89] scale-100'
                    } ${isCurrentStep ? 'animate-pulse' : ''}`}
                  >
                    <StepIcon size={24} className="md:text-2xl" />
                  </div>
                  
                  <div className="md:text-center">
                    <h3 className={`text-lg font-semibold mb-1 md:mb-2 transition-all duration-500 ${
                      isActive ? 'text-[#78D5D3] transform scale-105' : 'text-[#313D52]'
                    }`}>
                      {step.title}
                    </h3>
                    
                    <p className={`md:text-center md:px-4 text-sm transition-all duration-500 ${
                      isActive ? 'text-[#4a5568] opacity-100' : 'text-[#6c7a89] opacity-75'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Indicador de paso completado */}
                  {isActive && index < steps.length - 1 && (
                    <div className="absolute -bottom-2 left-6 md:left-1/2 md:-translate-x-1/2 md:top-20">
                      <div className="w-2 h-2 bg-[#78f3d3] rounded-full animate-bounce"></div>
                    </div>
                  )}
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