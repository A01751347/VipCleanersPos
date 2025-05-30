// components/Logo.tsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LogoProps {
  scrolled?: boolean;
}

const Logo: React.FC<LogoProps> = ({ scrolled = false }) => {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  // Este componente puede ser reemplazado con un SVG real cuando esté disponible
  const renderTextLogo = () => (
    <>
      <span className={scrolled ? 'text-[#313D52]' : isHomePage ? 'text-white' : 'text-[#313D52]'}>
        Kick
      </span>
      <span className="text-[#78f3d3]">Clean</span>
    </>
  );

  if (isHomePage) {
    return (
      <a 
        href="#home" 
        className="text-2xl font-bold"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        {renderTextLogo()}
      </a>
    );
  }

  return (
    <Link href="/" className="text-2xl font-bold">
      {renderTextLogo()}
    </Link>
  );
};

export default Logo;