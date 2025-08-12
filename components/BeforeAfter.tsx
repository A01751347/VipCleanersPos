// src/components/BeforeAfter.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  title?: string;
  description?: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ beforeImage, afterImage, title, description }) => {
  const [position, setPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number): void => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((clientX - rect.left) / rect.width) * 100;
    
    setPosition(Math.min(Math.max(newPosition, 0), 100));
  };

  const handleMouseMove = (e: React.MouseEvent): void => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent): void => {
    if (isDragging) {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    }
  };
  const animateBackToCenter = () => {
    let animationFrame: number;
    const speed = 0.01; // velocidad de interpolación
  
    const step = () => {
      setPosition(prev => {
        const diff = 50 - prev;
        const next = prev + diff * speed;
  
        if (Math.abs(diff) < 0.5) {
          cancelAnimationFrame(animationFrame);
          return 50;
        }
  
        animationFrame = requestAnimationFrame(step);
        return next;
      });
    };
  
    animationFrame = requestAnimationFrame(step);
  };
  
  useEffect(() => {
    const stopDragging = (): void => {
      setIsDragging(false);
    };

    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchend', stopDragging);

    return () => {
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('touchend', stopDragging);
    };
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto mb-12">

      {title && (
        <h3 className="text-lg font-semibold text-[#313D52] mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-[#64748B] mb-4">{description}</p>
      )}
      
      <div className="w-full h-[300px] sm:h-[400px] md:h-[700px] relative overflow-hidden cursor-col-resize">

        <div 
          ref={containerRef}
          className="w-full h-full relative"
          onMouseDown={(e) => {
            setIsDragging(true);
            handleMove(e.clientX);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            handleMove(e.touches[0].clientX);
          }}
          onMouseMove={(e) => handleMove(e.clientX)}

          onMouseLeave={animateBackToCenter}

          onTouchMove={handleTouchMove}
        >
          {/* After Image (Full Background) */}
          <div 
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ 
              backgroundImage: `url(${afterImage})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat'
            }}
          />

          {/* Before Image (Clipped) */}
          <div 
            className="absolute inset-0 bg-cover bg-center z-10"
            style={{ 
              backgroundImage: `url(${beforeImage})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)`,
            }}
          />

          {/* Divider Line */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white z-20 drop-shadow-md"
            style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
          />

          {/* Slider Button with Pulse Animation */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center animate-pulse"
            style={{ left: `${position}%` }}
          >
            <div className="flex items-center justify-center">
              <ChevronLeft size={16} className="text-gray-500" />
              <ChevronRight size={16} className="text-gray-500" />
            </div>
          </div>
        </div>

        <div className="flex justify-between px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50">
          <div className="text-sm font-medium text-[#64748B]">Antes</div>
          <div className="text-sm font-medium text-[#78D5D3]">Después</div>
        </div>
      </div>
    </div>
  );
};

interface ComparisonImage {
  before: string;
  after: string;
  title?: string;
  description?: string;
}

const BeforeAfter: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Array of images for multiple comparisons
  const comparisonImages: ComparisonImage[] = [
    {
      before: '/assets/gallery/ultimoSucio.png',
      after: '/assets/gallery/ultimoLimpio.png',
    },
    // Add more comparison images as needed
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="pt-20 px-4 sm:px-6 lg:px-8 bg-white" id="before-after">
      <div className="max-w-7xl mx-auto">
        <div 
          ref={sectionRef}
          className={`text-center mb-12 transition-all duration-2000 ease-out transform ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-12'
          }`}
        >
          <span className="text-sm sm:text-base font-medium uppercase tracking-wider text-[#78D5D3]">
            Nuestros Resultados
          </span>
          <h2 className="mt-2 text-3xl font-bold text-[#313D52] sm:text-4xl">
            El Antes y Después
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-[#64748B]">
            Observa la transformación por ti mismo. Nuestros resultados hablan más que las palabras.
            Desliza el control para ver la diferencia.
          </p>
        </div>

        <div className="mt-12">
          {comparisonImages.map((images, index) => (
            <ComparisonSlider 
              key={index}
              beforeImage={images.before}
              afterImage={images.after}
              title={images.title}
              description={images.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeforeAfter;