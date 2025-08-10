
// components/Navbar.tsx - depurado sin mensajes de pickup/garantía
'use client';
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
  { name: 'Cómo funciona', href: '', id: 'how-it-works' },
  { name: 'Precios', href: '', id: 'pricing' },
  { name: 'Contacto', href: '', id: 'contact' },
  { name: 'Blog', href: '/blog', id: 'blog', external: true },
  { name: 'Galería', href: '/gallery', id: 'gallery', external: true },
  { name: 'Rastrear', href: '/tracking', id: 'tracking', external: true }
];

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setMenuOpen((v) => !v);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  };

  return (
    <>
      <TopBar show={!scrolled && isHomePage} />
      <MainNavbar
        scrolled={scrolled}
        isHomePage={isHomePage}
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        scrollToSection={scrollToSection}
        pathname={pathname}
      />
      <MobileMenu menuOpen={menuOpen} toggleMenu={toggleMenu} scrollToSection={scrollToSection} />
    </>
  );
};

// Top bar sobria y sin promos de pickup
const TopBar: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <div className="hidden xl:block bg-[#313D52] text-white py-2 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <span className="flex items-center"><Phone size={14} className="mr-2 text-[#78f3d3]"/>442-123-4567</span>
          <span className="flex items-center"><MapPin size={14} className="mr-2 text-[#78f3d3]"/>Roma Norte, CDMX</span>
        </div>
        <div className="text-[#78f3d3] font-medium">Limpieza premium de sneakers en CDMX</div>
      </div>
    </div>
  );
};

const MainNavbar: React.FC<{
  scrolled: boolean;
  isHomePage: boolean;
  menuOpen: boolean;
  toggleMenu: () => void;
  scrollToSection: (id: string) => void;
  pathname: string;
}> = ({ scrolled, isHomePage, menuOpen, toggleMenu, scrollToSection, pathname }) => {
  const topPosition = !scrolled && isHomePage ? 'top-8 xl:top-10' : 'top-0';
  const navbarClasses = `fixed ${topPosition} left-0 w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 transition-all duration-300 ${
    scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-2 sm:py-3' : 'bg-transparent'
  } ${!isHomePage && !scrolled ? 'bg-white shadow-sm' : ''}`;

  return (
    <nav className={navbarClasses} style={{ zIndex: 40 }}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Logo isHomePage={isHomePage} scrolled={scrolled} scrollToSection={scrollToSection} />
        <DesktopNavigation scrolled={scrolled} isHomePage={isHomePage} scrollToSection={scrollToSection} />
        <DesktopCTAButton />
        <MobileMenuButton menuOpen={menuOpen} toggleMenu={toggleMenu} scrolled={scrolled} isHomePage={isHomePage} />
      </div>
      <Breadcrumb isHomePage={isHomePage} pathname={pathname} />
    </nav>
  );
};

const Logo: React.FC<{ isHomePage: boolean; scrolled: boolean; scrollToSection: (id: string) => void }>
= ({ isHomePage, scrolled, scrollToSection }) => {
  const logoClasses = 'text-xl sm:text-2xl lg:text-3xl font-bold';
  const logoContent = (
    <>
      <span className={`${scrolled ? 'text-[#313D52]' : 'text-white'} transition-colors`}>Vip</span>
      <span className="text-[#78f3d3]">Cleaners</span>
    </>
  );

  if (isHomePage) {
    return (
      <a
        href="#home"
        className={logoClasses}
        onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
      >
        {logoContent}
      </a>
    );
  }
  return <Link href="/" className={logoClasses}>{logoContent}</Link>;
};

const DesktopNavigation: React.FC<{ scrolled: boolean; isHomePage: boolean; scrollToSection: (id: string) => void }>
= ({ scrolled, isHomePage, scrollToSection }) => (
  <div className="hidden xl:flex items-center space-x-6 lg:space-x-8">
    {navLinks.map((link) => (
      <NavLinkItem key={link.name} link={link} scrolled={scrolled} isHomePage={isHomePage} scrollToSection={scrollToSection} />
    ))}
  </div>
);

const NavLinkItem: React.FC<{
  link: NavLink; scrolled: boolean; isHomePage: boolean; scrollToSection: (id: string) => void
}> = ({ link, scrolled, isHomePage, scrollToSection }) => {
  const linkClasses = `text-sm lg:text-base font-medium transition-colors hover:text-[#78f3d3] ${
    scrolled || !isHomePage ? 'text-[#313D52]' : 'text-white'
  }`;

  if (link.external) return <Link href={link.href} className={linkClasses}>{link.name}</Link>;

  return (
    <a
      href={link.href}
      onClick={(e) => { e.preventDefault(); scrollToSection(link.id); }}
      className={linkClasses}
    >
      {link.name}
    </a>
  );
};

const DesktopCTAButton: React.FC = () => (
  <div className="hidden xl:block">
    <BookingButton className="px-4 lg:px-6 py-2 lg:py-3 bg-[#78f3d3] text-[#313D52] font-bold rounded-full hover:bg-[#4de0c0] transition-all duration-300 text-sm lg:text-base">
      Reserva Ahora
    </BookingButton>
  </div>
);

const MobileMenuButton: React.FC<{ menuOpen: boolean; toggleMenu: () => void; scrolled: boolean; isHomePage: boolean }>
= ({ menuOpen, toggleMenu, scrolled, isHomePage }) => (
  <button
    className="xl:hidden p-2 sm:p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#78f3d3] transition-colors"
    onClick={toggleMenu}
    aria-label="Toggle menu"
  >
    {menuOpen ? <X size={24} className="text-[#78f3d3]" /> : <Menu size={24} className={scrolled || !isHomePage ? 'text-[#313D52]' : 'text-white'} />}
  </button>
);

const Breadcrumb: React.FC<{ isHomePage: boolean; pathname: string }> = ({ isHomePage, pathname }) => {
  if (isHomePage) return null;
  const getPageName = (path: string) => {
    switch (path) {
      case '/tracking': return 'Rastrear Pedido';
      case '/blog': return 'Blog';
      case '/gallery': return 'Galería';
      default: return 'Página';
    }
  };
  return (
    <div className="max-w-7xl mx-auto mt-2 px-3 sm:px-4 text-xs sm:text-sm text-[#6c7a89]">
      <Link href="/" className="hover:text-[#78f3d3] transition-colors">Inicio</Link>
      <span className="mx-2">/</span>
      <span className="text-[#313D52] font-medium">{getPageName(pathname)}</span>
    </div>
  );
};

const MobileMenu: React.FC<{ menuOpen: boolean; toggleMenu: () => void; scrollToSection: (id: string) => void }>
= ({ menuOpen, toggleMenu, scrollToSection }) => (
  <>
    {menuOpen && (
      <div className="xl:hidden fixed inset-0 bg-black/50 transition-opacity duration-300" style={{ zIndex: 45 }} onClick={toggleMenu} />
    )}
    <div
      className={`xl:hidden fixed top-0 right-0 h-full w-80 max-w-full bg-white transform transition-transform duration-300 ease-in-out shadow-2xl ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ zIndex: 50 }}
    >
      <div className="flex flex-col h-full">
        <MobileMenuHeader toggleMenu={toggleMenu} />
        <MobileMenuContent scrollToSection={scrollToSection} toggleMenu={toggleMenu} />
        <MobileCTAButton />
      </div>
    </div>
  </>
);

const MobileMenuHeader: React.FC<{ toggleMenu: () => void }> = ({ toggleMenu }) => (
  <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[#e0e6e5]">
    <Link href="/" className="text-xl sm:text-2xl font-bold">
      <span className="text-[#313D52]">Vip</span>
      <span className="text-[#78f3d3]">Cleaners</span>
    </Link>
    <button className="p-2 text-[#78f3d3] focus:outline-none hover:bg-[#f5f9f8] rounded-full transition-colors" onClick={toggleMenu} aria-label="Close menu">
      <X size={24} />
    </button>
  </div>
);

const MobileMenuContent: React.FC<{ scrollToSection: (id: string) => void; toggleMenu: () => void }>
= ({ scrollToSection, toggleMenu }) => (
  <div className="flex-1 flex flex-col py-4 sm:py-6 overflow-y-auto">
    <div className="space-y-1 px-4 sm:px-6">
      {navLinks.map((link) => (
        <MobileNavLink key={link.name} link={link} scrollToSection={scrollToSection} toggleMenu={toggleMenu} />
      ))}
    </div>
    <MobileContactInfo />
  </div>
);

const MobileNavLink: React.FC<{ link: NavLink; scrollToSection: (id: string) => void; toggleMenu: () => void }>
= ({ link, scrollToSection, toggleMenu }) => {
  const classes = 'block py-3 sm:py-4 px-3 sm:px-4 text-[#313D52] text-base sm:text-lg font-medium hover:bg-[#f5f9f8] hover:text-[#78f3d3] transition-colors rounded-lg';
  if (link.external) return <Link href={link.href} className={classes} onClick={() => toggleMenu()}>{link.name}</Link>;
  return (
    <a href={link.href} onClick={(e) => { e.preventDefault(); scrollToSection(link.id); }} className={classes}>
      {link.name}
    </a>
  );
};

const MobileContactInfo: React.FC = () => (
  <div className="mt-6 sm:mt-8 mx-4 sm:mx-6 p-4 sm:p-6 bg-[#f5f9f8] rounded-lg">
    <h4 className="font-semibold text-[#313D52] mb-3 text-base sm:text-lg">Contacto Rápido</h4>
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center"><Phone size={16} className="mr-3 text-[#78f3d3]" /><span className="text-sm sm:text-base text-[#313D52]">442-123-4567</span></div>
      <div className="flex items-center"><MapPin size={16} className="mr-3 text-[#78f3d3]" /><span className="text-sm sm:text-base text-[#313D52]">Roma Norte, CDMX</span></div>
    </div>
  </div>
);

const MobileCTAButton: React.FC = () => (
  <div className="p-4 sm:p-6 border-t border-[#e0e6e5] mt-auto">
    <BookingButton className="w-full py-3 sm:py-4 bg-[#78f3d3] text-[#313D52] font-bold rounded-full hover:bg-[#4de0c0] transition-all duration-300 text-base sm:text-lg">
      Reserva Ahora
    </BookingButton>
  </div>
);

export default Navbar;

