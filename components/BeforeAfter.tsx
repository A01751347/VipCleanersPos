// src/components/BeforeAfter.tsx
"use client";
// components/BeforeAfter.tsx
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
    <div className="w-full max-w-3xl mx-auto mb-12">
      {title && (
        <h3 className="text-lg font-semibold text-[#313D52] mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-[#64748B] mb-4">{description}</p>
      )}
      
      <div className="rounded-xl overflow-hidden shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]">
        <div 
          ref={containerRef}
          className="w-full h-[300px] sm:h-[400px] md:h-[500px] relative overflow-hidden cursor-col-resize"
          onMouseDown={(e) => {
            setIsDragging(true);
            handleMove(e.clientX);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            handleMove(e.touches[0].clientX);
          }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {/* After Image (Full Background) */}
          <div 
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ 
              backgroundImage: `url(${afterImage})`,
              backgroundSize: 'cover' 
            }}
          />

          {/* Before Image (Clipped) */}
          <div 
            className="absolute inset-0 bg-cover bg-center z-10"
            style={{ 
              backgroundImage: `url(${beforeImage})`,
              backgroundSize: 'cover',
              clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)`,
            }}
          />

          {/* Divider Line */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white z-20 drop-shadow-md"
            style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
          />

          {/* Slider Button */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
            style={{ left: `${position}%` }}
          >
            <div className="flex items-center justify-center">
              <ChevronLeft size={16} className="text-gray-500" />
              <ChevronRight size={16} className="text-gray-500" />
            </div>
          </div>
        </div>

        <div className="flex justify-between px-4 py-2 bg-[#F1F5F9]">
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
  // Array of images for multiple comparisons
  const comparisonImages: ComparisonImage[] = [
    {
      before: '/assets/Ultraboost-Sucio.png',
      after: '/assets/Ultraboost-Limpio.png',
      title: 'Adidas Ultraboost',
      description: 'Limpieza profunda y restauración de la entresuela.'
    },
    // Add more comparison images as needed
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="before-after">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-sm sm:text-base font-medium uppercase tracking-wider text-[#78D5D3]">Nuestros Resultados</span>
          <h2 className="mt-2 text-3xl font-bold text-[#313D52] sm:text-4xl">El Antes y Después</h2>
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