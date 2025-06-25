"use client"
import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BookingButton from './BookingButton';

interface NavLink {
  name: string;
  href: string;
  id: string;
  external?: boolean;
}

const navLinks: NavLink[] = [
  { name: 'Servicios', href: '#services', id: 'services' },
  { name: 'Proceso', href: '#how-it-works', id: 'how-it-works' },
  { name: 'Precios', href: '#pricing', id: 'pricing' },
  { name: 'Contacto', href: '#contact', id: 'contact' },
  { name: 'Galería', href: '/gallery', id: 'gallery' , external: true},
  { name: 'Rastrear', href: '/tracking', id: 'tracking', external: true }
];

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 20);
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

  return (
    <>
      {/* Top Contact Bar */}
      <TopContactBar show={!scrolled && isHomePage} />
      
      {/* Main Navigation */}
      <MainNavbar 
        scrolled={scrolled}
        isHomePage={isHomePage}
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        scrollToSection={scrollToSection}
        pathname={pathname}
      />

      {/* Mobile Menu */}
      <MobileMenu 
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        scrollToSection={scrollToSection}
      />
    </>
  );
};

// Top contact bar component
const TopContactBar: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="hidden lg:block bg-[#313D52] text-white py-2 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
       
      </div>
    </div>
  );
};

// Contact information
const ContactInfo: React.FC = () => (
  <div className="flex items-center space-x-6">
    <ContactItem icon={Phone} text="442-123-4567" />
    <ContactItem icon={MapPin} text="Roma Norte, CDMX" />
  </div>
);

// Individual contact item
const ContactItem: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex items-center">
    <Icon size={14} className="mr-2 text-[#78f3d3]" />
    <span>{text}</span>
  </div>
);

// Promotional message
const PromoMessage: React.FC = () => (
  <div className="text-[#78f3d3] font-medium">
    ¡Pickup gratis en zona centro!
  </div>
);

// Main navbar component
const MainNavbar: React.FC<{
  scrolled: boolean;
  isHomePage: boolean;
  menuOpen: boolean;
  toggleMenu: () => void;
  scrollToSection: (id: string) => void;
  pathname: string;
}> = ({ scrolled, isHomePage, menuOpen, toggleMenu, scrollToSection, pathname }) => {
  const navbarClasses = `fixed top-0 left-0 w-full px-4 sm:px-6 lg:px-8 py-4 z-50 transition-all duration-300 ${
    scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent'
  } ${!isHomePage && !scrolled ? 'bg-white shadow-sm' : ''}`;

  return (
    <nav className={navbarClasses}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Logo isHomePage={isHomePage} scrolled={scrolled} scrollToSection={scrollToSection} />

        {/* Desktop Navigation */}
        <DesktopNavigation 
          scrolled={scrolled} 
          isHomePage={isHomePage} 
          scrollToSection={scrollToSection} 
        />

        {/* CTA Button */}
        <DesktopCTAButton />

        {/* Mobile Menu Button */}
        <MobileMenuButton 
          menuOpen={menuOpen}
          toggleMenu={toggleMenu}
          scrolled={scrolled}
          isHomePage={isHomePage}
        />
      </div>

      {/* Breadcrumb */}
      <Breadcrumb isHomePage={isHomePage} pathname={pathname} />
    </nav>
  );
};

// Logo component
const Logo: React.FC<{
  isHomePage: boolean;
  scrolled: boolean;
  scrollToSection: (id: string) => void;
}> = ({ isHomePage, scrolled, scrollToSection }) => {
  const logoContent = (
    <div className="logo-link">
      <span className={`${scrolled ? 'text-[#313D52]' : 'text-white'} transition-colors`}>
        Vip
      </span>
      <span className="text-[#78f3d3]">Cleaners</span>
    </div>
  );

  if (isHomePage) {
    return (
      <a 
        href="#home" 
        className="logo-link"
        onClick={(e) => {
          e.preventDefault();
          scrollToSection('home');
        }}
      >
        <span className={`${scrolled ? 'text-[#313D52]' : 'text-white'} transition-colors`}>
          Vip
        </span>
        <span className="text-[#78f3d3]">Cleaners</span>
      </a>
    );
  }

  return (
    <Link href="/" className="logo-link">
      <span className="text-[#313D52]">Vip</span>
      <span className="text-[#78f3d3]">Cleaners</span>
    </Link>
  );
};

// Desktop navigation links
const DesktopNavigation: React.FC<{
  scrolled: boolean;
  isHomePage: boolean;
  scrollToSection: (id: string) => void;
}> = ({ scrolled, isHomePage, scrollToSection }) => (
  <div className="hidden lg:flex items-center space-x-8">
    {navLinks.map((link) => (
      <NavLinkItem 
        key={link.name}
        link={link}
        scrolled={scrolled}
        isHomePage={isHomePage}
        scrollToSection={scrollToSection}
      />
    ))}
  </div>
);

// Individual navigation link
const NavLinkItem: React.FC<{
  link: NavLink;
  scrolled: boolean;
  isHomePage: boolean;
  scrollToSection: (id: string) => void;
}> = ({ link, scrolled, isHomePage, scrollToSection }) => {
  const linkClasses = `navbar-link ${
    scrolled || !isHomePage ? 'text-[#313D52]' : 'text-white'
  }`;

  if (link.external) {
    return (
      <Link href={link.href} className={linkClasses}>
        {link.name}
      </Link>
    );
  }

  return (
    <a
      href={link.href}
      onClick={(e) => {
        e.preventDefault();
        scrollToSection(link.id);
      }}
      className={linkClasses}
    >
      {link.name}
    </a>
  );
};

// Desktop CTA button
const DesktopCTAButton: React.FC = () => (
  <BookingButton className="desktop-cta-button">
    <span>Reserva Ahora</span>
  </BookingButton>
);

// Mobile menu button
const MobileMenuButton: React.FC<{
  menuOpen: boolean;
  toggleMenu: () => void;
  scrolled: boolean;
  isHomePage: boolean;
}> = ({ menuOpen, toggleMenu, scrolled, isHomePage }) => (
  <button 
    className="lg:hidden p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
    onClick={toggleMenu}
    aria-label="Toggle menu"
  >
    {menuOpen ? (
      <X size={24} className="text-[#78f3d3]" />
    ) : (
      <Menu size={24} className={scrolled || !isHomePage ? 'text-[#313D52]' : 'text-white'} />
    )}
  </button>
);

// Breadcrumb component
const Breadcrumb: React.FC<{ isHomePage: boolean; pathname: string }> = ({ isHomePage, pathname }) => {
  if (isHomePage) return null;

  const getPageName = (path: string): string => {
    switch (path) {
      case '/tracking': return 'Rastrear Pedido';
      default: return 'Página';
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-2 text-sm text-[#6c7a89]">
      <Link href="/" className="hover:text-[#78f3d3] transition-colors">
        Inicio
      </Link>
      <span className="mx-2">/</span>
      <span className="text-[#313D52] font-medium">
        {getPageName(pathname)}
      </span>
    </div>
  );
};

// Mobile menu component
const MobileMenu: React.FC<{
  menuOpen: boolean;
  toggleMenu: () => void;
  scrollToSection: (id: string) => void;
}> = ({ menuOpen, toggleMenu, scrollToSection }) => (
  <div className={`lg:hidden fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
    menuOpen ? 'translate-x-0' : 'translate-x-full'
  }`}>
    <div className="flex flex-col h-full">
      {/* Mobile menu header */}
      <MobileMenuHeader toggleMenu={toggleMenu} />
      
      {/* Mobile navigation links */}
      <MobileMenuContent scrollToSection={scrollToSection} toggleMenu={toggleMenu} />
      
      {/* Mobile CTA */}
      <MobileCTAButton />
    </div>
  </div>
);

// Mobile menu header
const MobileMenuHeader: React.FC<{ toggleMenu: () => void }> = ({ toggleMenu }) => (
  <div className="flex justify-between items-center p-6 border-b border-[#e0e6e5]">
    <a href="#home" className="text-2xl font-bold">
      <span className="text-[#313D52]">Vip</span>
      <span className="text-[#78f3d3]">Cleaners</span>
    </a>
    <button 
      className="p-2 text-[#78f3d3] focus:outline-none"
      onClick={toggleMenu}
      aria-label="Close menu"
    >
      <X size={24} />
    </button>
  </div>
);

// Mobile menu content
const MobileMenuContent: React.FC<{
  scrollToSection: (id: string) => void;
  toggleMenu: () => void;
}> = ({ scrollToSection, toggleMenu }) => (
  <div className="flex-1 flex flex-col py-6">
    {/* Navigation links */}
    <div className="space-y-2 px-6">
      {navLinks.map((link) => (
        <MobileNavLink 
          key={link.name}
          link={link}
          scrollToSection={scrollToSection}
          toggleMenu={toggleMenu}
        />
      ))}
    </div>

    {/* Contact info */}
    <MobileContactInfo />
  </div>
);

// Individual mobile nav link
const MobileNavLink: React.FC<{
  link: NavLink;
  scrollToSection: (id: string) => void;
  toggleMenu: () => void;
}> = ({ link, scrollToSection, toggleMenu }) => {
  const linkClasses = "block py-3 px-4 text-[#313D52] text-lg font-medium hover:bg-[#f5f9f8] hover:text-[#78f3d3] transition-colors rounded-lg";

  if (link.external) {
    return (
      <Link 
        href={link.href}
        className={linkClasses}
        onClick={() => toggleMenu()}
      >
        {link.name}
      </Link>
    );
  }

  return (
    <a
      href={link.href}
      onClick={(e) => {
        e.preventDefault();
        scrollToSection(link.id);
      }}
      className={linkClasses}
    >
      {link.name}
    </a>
  );
};

// Mobile contact info
const MobileContactInfo: React.FC = () => (
  <div className="mt-8 px-6 py-4 bg-[#f5f9f8] mx-6 rounded-lg">
    <h4 className="font-semibold text-[#313D52] mb-3">Contacto Rápido</h4>
    <div className="space-y-2 text-sm">
      <ContactItem icon={Phone} text="442-123-4567" />
      <ContactItem icon={MapPin} text="Roma Norte, CDMX" />
    </div>
  </div>
);

// Mobile CTA button
const MobileCTAButton: React.FC = () => (
  <div className="p-6 border-t border-[#e0e6e5]">
    <BookingButton className="mobile-cta-button">
      Reserva Ahora
    </BookingButton>
  </div>
);

export default Navbar;