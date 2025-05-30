// components/SmoothScroll.tsx
'use client'
import { useEffect } from 'react';

export default function SmoothScroll() {
  useEffect(() => {
    // Aplicar scroll suave a todo el HTML
    document.documentElement.style.scrollBehavior = 'smooth';

    // Manejar clics en enlaces internos
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.hash && link.origin + link.pathname === window.location.origin + window.location.pathname) {
        e.preventDefault();
        const targetElement = document.querySelector(link.hash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
          // Actualizar URL sin recargar
          window.history.pushState(null, '', link.hash);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  return null;
}