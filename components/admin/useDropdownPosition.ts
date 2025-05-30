// components/admin/useDropdownPosition.ts
import { useEffect, useRef, useState } from 'react';

export const useDropdownPosition = (isOpen: boolean) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'right' | 'left'>('right');

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const rect = dropdown.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // Si el dropdown se sale del viewport por la derecha, posicionarlo a la izquierda
      if (rect.right > viewportWidth - 20) {
        setPosition('left');
      } else {
        setPosition('right');
      }
    }
  }, [isOpen]);

  const getPositionClasses = () => {
    return position === 'right' ? 'right-0' : 'left-0';
  };

  return { dropdownRef, position, getPositionClasses };
};