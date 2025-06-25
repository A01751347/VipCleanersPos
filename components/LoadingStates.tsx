// components/LoadingStates.tsx - Componentes de loading mejorados
'use client'
import React from 'react';
import { Loader2, Package, CheckCircle } from 'lucide-react';

// Loading Spinner básico
export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = "" 
}) => (
  <Loader2 
    size={size} 
    className={`animate-spin text-[#78f3d3] ${className}`} 
  />
);

// Loading para botones
export const ButtonLoading: React.FC<{ text?: string }> = ({ text = "Cargando..." }) => (
  <div className="flex items-center">
    <LoadingSpinner size={16} className="mr-2" />
    <span>{text}</span>
  </div>
);

// Loading skeleton para cards
export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
    <div className="flex items-center mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="ml-4 flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
    </div>
    <div className="mt-6 h-10 bg-gray-200 rounded-lg"></div>
  </div>
);

// Loading para formularios de reserva
export const BookingFormLoading: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
    <div>
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
      <div className="h-32 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="flex justify-between">
      <div className="h-12 bg-gray-200 rounded-lg w-24"></div>
      <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
    </div>
  </div>
);

// Loading para tracking
export const TrackingLoading: React.FC = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
    {/* Header skeleton */}
    <div className="bg-gray-300 p-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-6 bg-gray-400 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-400 rounded w-32"></div>
        </div>
        <div className="h-8 bg-gray-400 rounded-full w-24"></div>
      </div>
    </div>
    
    {/* Content skeleton */}
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div>
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
      
      {/* Timeline skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start">
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-4"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Loading fullscreen con branding
export const FullPageLoading: React.FC<{ message?: string }> = ({ 
  message = "Cargando..." 
}) => (
  <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
    <div className="text-center">
      {/* Logo animado */}
      <div className="mb-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-[#e0e6e5] rounded-full"></div>
          <div className="absolute inset-0 w-24 h-24 border-4 border-[#78f3d3] rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={32} className="text-[#78f3d3]" />
          </div>
        </div>
      </div>
      
      {/* Brand */}
      <div className="mb-4">
        <span className="text-2xl font-bold text-[#313D52]">Vip</span>
        <span className="text-2xl font-bold text-[#78f3d3]">Cleaners</span>
      </div>
      
      <p className="text-[#6c7a89] text-lg">{message}</p>
      
      {/* Dots loading animation */}
      <div className="flex justify-center mt-4 space-x-1">
        <div className="w-2 h-2 bg-[#78f3d3] rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-[#78f3d3] rounded-full animate-bounce delay-75"></div>
        <div className="w-2 h-2 bg-[#78f3d3] rounded-full animate-bounce delay-150"></div>
      </div>
    </div>
  </div>
);

// Success animation
export const SuccessAnimation: React.FC<{ message?: string }> = ({ 
  message = "¡Éxito!" 
}) => (
  <div className="text-center py-8">
    <div className="relative mb-6">
      {/* Círculo de fondo */}
      <div className="w-24 h-24 bg-[#e0f7f0] rounded-full mx-auto flex items-center justify-center">
        <CheckCircle size={48} className="text-[#78f3d3] animate-pulse" />
      </div>
      
      {/* Anillo animado */}
      <div className="absolute inset-0 w-24 h-24 border-4 border-[#78f3d3] rounded-full mx-auto animate-ping opacity-20"></div>
    </div>
    
    <h3 className="text-2xl font-bold text-[#313D52] mb-2">{message}</h3>
  </div>
);

// Progress bar component
export const ProgressBar: React.FC<{ 
  progress: number; 
  label?: string;
  showPercentage?: boolean;
}> = ({ progress, label, showPercentage = true }) => (
  <div className="w-full">
    {label && (
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-[#313D52]">{label}</span>
        {showPercentage && (
          <span className="text-sm text-[#6c7a89]">{Math.round(progress)}%</span>
        )}
      </div>
    )}
    <div className="w-full bg-[#e0e6e5] rounded-full h-2">
      <div 
        className="bg-[#78f3d3] h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      ></div>
    </div>
  </div>
);

// Step loading for multi-step processes
export const StepLoading: React.FC<{ 
  steps: string[]; 
  currentStep: number;
  completed?: number[];
}> = ({ steps, currentStep, completed = [] }) => (
  <div className="w-full max-w-md mx-auto">
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isCompleted = completed.includes(index);
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;
        
        return (
          <div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              isCompleted 
                ? 'bg-[#78f3d3] border-[#78f3d3] text-[#313D52]'
                : isCurrent
                  ? 'bg-white border-[#78f3d3] text-[#78f3d3]'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
            }`}>
              {isCompleted ? (
                <CheckCircle size={16} />
              ) : isCurrent ? (
                <LoadingSpinner size={16} />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>
            
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${
                isCompleted || isCurrent ? 'text-[#313D52]' : 'text-gray-400'
              }`}>
                {step}
              </p>
              {isCurrent && (
                <p className="text-xs text-[#6c7a89]">Procesando...</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// Typing animation for text
export const TypingAnimation: React.FC<{ 
  text: string; 
  speed?: number;
  className?: string;
}> = ({ text, speed = 50, className = "" }) => {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

// Loading overlay for forms
export const FormOverlay: React.FC<{ 
  isVisible: boolean; 
  message?: string;
}> = ({ isVisible, message = "Procesando..." }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
      <div className="text-center">
        <LoadingSpinner size={32} className="mb-4" />
        <p className="text-[#313D52] font-medium">{message}</p>
      </div>
    </div>
  );
};

// Pulse loading for images
export const ImagePlaceholder: React.FC<{ 
  width?: string; 
  height?: string;
  className?: string;
}> = ({ width = "w-full", height = "h-48", className = "" }) => (
  <div className={`${width} ${height} bg-gray-200 rounded-lg animate-pulse flex items-center justify-center ${className}`}>
    <Package size={32} className="text-gray-400" />
  </div>
);

// Floating action loading
export const FloatingLoading: React.FC<{ 
  isVisible: boolean;
  message?: string;
}> = ({ isVisible, message = "Guardando..." }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-[#313D52] text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50 animate-slide-up">
      <LoadingSpinner size={16} className="mr-3" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// Data table loading
export const TableLoading: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="w-full">
    {/* Header */}
    <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="h-4 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    ))}
  </div>
);

// Network status indicator
export const NetworkStatus: React.FC<{ isOnline: boolean }> = ({ isOnline }) => (
  <div className={`fixed top-4 right-4 px-3 py-2 rounded-lg text-sm font-medium z-50 transition-all ${
    isOnline 
      ? 'bg-green-100 text-green-800 border border-green-200' 
      : 'bg-red-100 text-red-800 border border-red-200'
  }`}>
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full mr-2 ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      } ${!isOnline ? 'animate-pulse' : ''}`}></div>
      {isOnline ? 'Conectado' : 'Sin conexión'}
    </div>
  </div>
);

export default {
  LoadingSpinner,
  ButtonLoading,
  CardSkeleton,
  BookingFormLoading,
  TrackingLoading,
  FullPageLoading,
  SuccessAnimation,
  ProgressBar,
  StepLoading,
  TypingAnimation,
  FormOverlay,
  ImagePlaceholder,
  FloatingLoading,
  TableLoading,
  NetworkStatus
};