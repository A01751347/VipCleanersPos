// components/Navbar.tsx - Mobile responsive fix
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
  { name: 'Cómo funciona', href: '', id: 'how-it-works'},
  { name: 'Precios', href: '', id: 'pricing'},
  { name: 'Contacto', href: '', id: 'contact'},
  { name: 'Blog', href: '/blog', id: 'blog' , external: true},
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

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      {/* Top Contact Bar - Hidden on mobile */}
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

// Top contact bar component - Hidden on mobile for better space usage
const TopContactBar: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="hidden xl:block bg-[#313D52] text-white py-2 text-sm">
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

// Main navbar component - Better mobile spacing
const MainNavbar: React.FC<{
  scrolled: boolean;
  isHomePage: boolean;
  menuOpen: boolean;
  toggleMenu: () => void;
  scrollToSection: (id: string) => void;
  pathname: string;
}> = ({ scrolled, isHomePage, menuOpen, toggleMenu, scrollToSection, pathname }) => {
  // Adjust top position based on top bar visibility
  const topPosition = !scrolled && isHomePage ? 'top-8 xl:top-10' : 'top-0';
  
  const navbarClasses = `fixed ${topPosition} left-0 w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 transition-all duration-300 ${
    scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-2 sm:py-3' : 'bg-transparent'
  } ${!isHomePage && !scrolled ? 'bg-white shadow-sm' : ''}`;

  return (
    <nav 
      className={navbarClasses}
      style={{ zIndex: 40 }}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo - Better mobile sizing */}
        <Logo isHomePage={isHomePage} scrolled={scrolled} scrollToSection={scrollToSection} />

        {/* Desktop Navigation - Hidden on smaller screens earlier */}
        <DesktopNavigation 
          scrolled={scrolled} 
          isHomePage={isHomePage} 
          scrollToSection={scrollToSection} 
        />

        {/* Desktop CTA Button - Hidden on smaller screens */}
        <DesktopCTAButton />

        {/* Mobile Menu Button - Better touch target */}
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

// Logo component - Better mobile font sizes
const Logo: React.FC<{
  isHomePage: boolean;
  scrolled: boolean;
  scrollToSection: (id: string) => void;
}> = ({ isHomePage, scrolled, scrollToSection }) => {
  const logoClasses = "text-xl sm:text-2xl lg:text-3xl font-bold";
  
  const logoContent = (
    <>
      <span className={`${scrolled ? 'text-[#313D52]' : 'text-white'} transition-colors`}>
        Vip
      </span>
      <span className="text-[#78f3d3]">Cleaners</span>
    </>
  );

  if (isHomePage) {
    return (
      <a 
        href="#home" 
        className={logoClasses}
        onClick={(e) => {
          e.preventDefault();
          scrollToSection('home');
        }}
      >
        {logoContent}
      </a>
    );
  }

  return (
    <Link href="/" className={logoClasses}>
      {logoContent}
    </Link>
  );
};

// Desktop navigation links - Better breakpoint
const DesktopNavigation: React.FC<{
  scrolled: boolean;
  isHomePage: boolean;
  scrollToSection: (id: string) => void;
}> = ({ scrolled, isHomePage, scrollToSection }) => (
  <div className="hidden xl:flex items-center space-x-6 lg:space-x-8">
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
  const linkClasses = `text-sm lg:text-base font-medium transition-colors hover:text-[#78f3d3] ${
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

// Desktop CTA button - Hidden on smaller screens
const DesktopCTAButton: React.FC = () => (
  <div className="hidden xl:block">
    <BookingButton className="px-4 lg:px-6 py-2 lg:py-3 bg-[#78f3d3] text-[#313D52] font-bold rounded-full hover:bg-[#4de0c0] transition-all duration-300 text-sm lg:text-base">
      Reserva Ahora
    </BookingButton>
  </div>
);

// Mobile menu button - Better touch target and positioning
const MobileMenuButton: React.FC<{
  menuOpen: boolean;
  toggleMenu: () => void;
  scrolled: boolean;
  isHomePage: boolean;
}> = ({ menuOpen, toggleMenu, scrolled, isHomePage }) => (
  <button 
    className="xl:hidden p-2 sm:p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#78f3d3] transition-colors"
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

// Breadcrumb component - Better mobile spacing
const Breadcrumb: React.FC<{ isHomePage: boolean; pathname: string }> = ({ isHomePage, pathname }) => {
  if (isHomePage) return null;

  const getPageName = (path: string): string => {
    switch (path) {
      case '/tracking': return 'Rastrear Pedido';
      case '/blog': return 'Blog';
      case '/gallery': return 'Galería';
      default: return 'Página';
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-2 px-3 sm:px-4 text-xs sm:text-sm text-[#6c7a89]">
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

// Mobile menu component - Improved mobile UX
const MobileMenu: React.FC<{
  menuOpen: boolean;
  toggleMenu: () => void;
  scrollToSection: (id: string) => void;
}> = ({ menuOpen, toggleMenu, scrollToSection }) => (
  <>
    {/* Overlay */}
    {menuOpen && (
      <div 
        className="xl:hidden fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        style={{ zIndex: 45 }}
        onClick={toggleMenu}
      />
    )}
    
    {/* Menu Panel */}
    <div 
      className={`xl:hidden fixed top-0 right-0 h-full w-80 max-w-full bg-white transform transition-transform duration-300 ease-in-out shadow-2xl ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ zIndex: 50 }}
    >
      <div className="flex flex-col h-full">
        {/* Mobile menu header */}
        <MobileMenuHeader toggleMenu={toggleMenu} />
        
        {/* Mobile navigation links */}
        <MobileMenuContent scrollToSection={scrollToSection} toggleMenu={toggleMenu} />
        
        {/* Mobile CTA */}
        <MobileCTAButton />
      </div>
    </div>
  </>
);

// Mobile menu header - Better spacing
const MobileMenuHeader: React.FC<{ toggleMenu: () => void }> = ({ toggleMenu }) => (
  <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[#e0e6e5]">
    <Link href="/" className="text-xl sm:text-2xl font-bold">
      <span className="text-[#313D52]">Vip</span>
      <span className="text-[#78f3d3]">Cleaners</span>
    </Link>
    <button 
      className="p-2 text-[#78f3d3] focus:outline-none hover:bg-[#f5f9f8] rounded-full transition-colors"
      onClick={toggleMenu}
      aria-label="Close menu"
    >
      <X size={24} />
    </button>
  </div>
);

// Mobile menu content - Better mobile spacing and scrolling
const MobileMenuContent: React.FC<{
  scrollToSection: (id: string) => void;
  toggleMenu: () => void;
}> = ({ scrollToSection, toggleMenu }) => (
  <div className="flex-1 flex flex-col py-4 sm:py-6 overflow-y-auto">
    {/* Navigation links */}
    <div className="space-y-1 px-4 sm:px-6">
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

// Individual mobile nav link - Better touch targets
const MobileNavLink: React.FC<{
  link: NavLink;
  scrollToSection: (id: string) => void;
  toggleMenu: () => void;
}> = ({ link, scrollToSection, toggleMenu }) => {
  const linkClasses = "block py-3 sm:py-4 px-3 sm:px-4 text-[#313D52] text-base sm:text-lg font-medium hover:bg-[#f5f9f8] hover:text-[#78f3d3] transition-colors rounded-lg";

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

// Mobile contact info - Better mobile layout
const MobileContactInfo: React.FC = () => (
  <div className="mt-6 sm:mt-8 mx-4 sm:mx-6 p-4 sm:p-6 bg-[#f5f9f8] rounded-lg">
    <h4 className="font-semibold text-[#313D52] mb-3 text-base sm:text-lg">Contacto Rápido</h4>
    <div className="space-y-2 sm:space-y-3">
      <MobileContactItem icon={Phone} text="442-123-4567" />
      <MobileContactItem icon={MapPin} text="Roma Norte, CDMX" />
    </div>
  </div>
);

// Mobile contact item - Better mobile sizing
const MobileContactItem: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex items-center">
    <Icon size={16} className="mr-3 text-[#78f3d3] flex-shrink-0" />
    <span className="text-sm sm:text-base text-[#313D52]">{text}</span>
  </div>
);

// Mobile CTA button - Full width and better spacing
const MobileCTAButton: React.FC = () => (
  <div className="p-4 sm:p-6 border-t border-[#e0e6e5] mt-auto">
    <BookingButton className="w-full py-3 sm:py-4 bg-[#78f3d3] text-[#313D52] font-bold rounded-full hover:bg-[#4de0c0] transition-all duration-300 text-base sm:text-lg">
      Reserva Ahora
    </BookingButton>
  </div>
);

export default Navbar;