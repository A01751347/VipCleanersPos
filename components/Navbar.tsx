// components/Navbar.tsx
"use client"
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BookingButton from './BookingButton';

interface NavLink {
  name: string;
  href: string;
  id: string;
  external?: boolean;
}

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = (): void => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = (): void => {
    setMenuOpen(!menuOpen);
  };

  const scrollToSection = (id: string): void => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  };

  const navLinks: NavLink[] = [
    { name: 'Servicios', href: '#services', id: 'services' },
    { name: 'Proceso', href: '#how-it-works', id: 'how-it-works' },
    { name: 'Galería', href: '#before-after', id: 'before-after' },
    { name: 'Precios', href: '#pricing', id: 'pricing' },
    { name: 'Contacto', href: '#contact', id: 'contact' },
    { name: 'Rastrear', href: '/tracking', id: 'tracking', external: true }
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full px-4 sm:px-6 lg:px-8 py-4 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        {isHomePage ? (
          <a 
            href="#home" 
            className="text-2xl font-bold"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('home');
            }}
          >
            <span className={scrolled ? 'text-[#78D5D3]' : 'text-white'}>Vip</span>
            <span className={scrolled ? 'text-[#313D52]' : 'text-[#78D5D3]'}>Cleaners</span>
          </a>
        ) : (
          <Link href="/" className="text-2xl font-bold">
            <span className="text-[#313D52]">Vip</span>
            <span className="text-[#78f3d3]">Cleaners</span>
          </Link>
        )}

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            link.external ? (
              <Link 
                key={link.name}
                href={link.href}
                className={`font-medium hover:text-[#78f3d3] transition-colors ${
                  scrolled ? 'text-[#313D52]' : 'text-white'
                }`}
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.id);
                }}
                className={`font-medium hover:text-[#78f3d3] transition-colors ${
                  scrolled ? 'text-[#313D52]' : 'text-white'
                }`}
              >
                {link.name}
              </a>
            )
          ))}
        </div>

        {/* CTA Button */}
        <BookingButton 
          className={`hidden md:block px-6 py-2 bg-[#78f3d3] text-[#313D52] font-semibold rounded-full hover:bg-[#4de0c0] transition-colors shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]`}
        >
          Reserva Ahora
        </BookingButton>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-[#78f3d3] focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <X size={28} />
          ) : (
            <Menu size={28} className={scrolled ? 'text-[#313D52]' : 'text-white'} />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col p-8 h-full">
          <div className="flex justify-between items-center mb-8">
            <a href="#home" className="text-2xl font-bold">
              <span className="text-[#313D52]">Vip</span>
              <span className="text-[#78f3d3]">Cleaners</span>
            </a>
            <button 
              className="text-[#78f3d3] focus:outline-none"
              onClick={toggleMenu}
              aria-label="Close menu"
            >
              <X size={28} />
            </button>
          </div>

          <div className="flex flex-col space-y-6">
            {navLinks.map((link) => (
              link.external ? (
                <Link 
                  key={link.name}
                  href={link.href}
                  className="text-[#313D52] text-lg font-medium hover:text-[#78f3d3] transition-colors py-2 border-b border-gray-200"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.id);
                  }}
                  className="text-[#313D52] text-lg font-medium hover:text-[#78f3d3] transition-colors py-2 border-b border-gray-200"
                >
                  {link.name}
                </a>
              )
            ))}
          </div>

          <BookingButton 
            className="mt-auto px-6 py-3 bg-[#78f3d3] text-[#313D52] font-semibold rounded-full text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:bg-[#4de0c0] transition-colors"
          >
            Reserva Ahora
          </BookingButton>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;