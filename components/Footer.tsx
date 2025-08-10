// components/Footer.tsx - Versión mejorada
"use client"
import React from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Heart,
  ChevronRight,
  Clock,
  Star,
  ArrowUp,
  Send
} from 'lucide-react';

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#313D52] text-white relative overflow-hidden">
      {/* Newsletter Section */}
      <div className="bg-[#78f3d3] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <h3 className="text-2xl font-bold text-[#313D52] mb-2">
                ¡Mantente al día con nuestros tips!
              </h3>
              <p className="text-[#313D52] opacity-80">
                Recibe consejos exclusivos para el cuidado de tus sneakers y ofertas especiales
              </p>
            </div>
            
            <div className="flex w-full md:w-auto">
              <div className="flex max-w-md w-full">
                <input
                  type="email"
                  placeholder="Tu email aquí..."
                  className="flex-1 px-4 py-3 rounded-l-lg border-0 focus:outline-none focus:ring-2 focus:ring-[#313D52] text-[#313D52]"
                />
                <button className="px-6 py-3 bg-[#313D52] text-white rounded-r-lg hover:bg-[#3e4a61] transition-colors flex items-center">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative background pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2378f3d3' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Footer Content */}
      <div className="relative pt-16 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center mb-6">
                <div className="text-3xl font-bold">
                  Vip<span className="text-[#78f3d3]">Cleaners</span>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Especialistas en limpieza y restauración premium para zapatillas. 
                Devolvemos la vida a tus sneakers favoritos con cuidado profesional y técnicas avanzadas.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-[#3e4a61] rounded-lg">
                  <div className="text-2xl font-bold text-[#78f3d3]">3K+</div>
                  <div className="text-xs text-gray-400">Pares Atendidos</div>
                </div>
                <div className="text-center p-3 bg-[#3e4a61] rounded-lg">
                  <div className="text-2xl font-bold text-[#78f3d3] flex items-center justify-center">
                    4.9 <Star size={16} className="ml-1" fill="currentColor" />
                  </div>
                  <div className="text-xs text-gray-400">Calificación</div>
                </div>
              </div>

              {/* Social Media */}
              <div className="flex space-x-3">
                <Link href="#" className="w-10 h-10 rounded-full bg-[#3e4a61] flex items-center justify-center hover:bg-[#78f3d3] hover:text-[#313D52] transition-all transform hover:scale-110">
                  <Facebook size={18} />
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-[#3e4a61] flex items-center justify-center hover:bg-[#78f3d3] hover:text-[#313D52] transition-all transform hover:scale-110">
                  <Instagram size={18} />
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-[#3e4a61] flex items-center justify-center hover:bg-[#78f3d3] hover:text-[#313D52] transition-all transform hover:scale-110">
                  <Twitter size={18} />
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-[#3e4a61] flex items-center justify-center hover:bg-[#78f3d3] hover:text-[#313D52] transition-all transform hover:scale-110">
                  <Youtube size={18} />
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 relative">
                Enlaces Rápidos
                <span className="absolute -bottom-2 left-0 w-12 h-1 bg-[#78f3d3] rounded-full"></span>
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#home" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center group">
                    <ChevronRight size={16} className="mr-2 transform group-hover:translate-x-1 transition-transform" />
                    Inicio
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center group">
                    <ChevronRight size={16} className="mr-2 transform group-hover:translate-x-1 transition-transform" />
                    Servicios
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center group">
                    <ChevronRight size={16} className="mr-2 transform group-hover:translate-x-1 transition-transform" />
                    Proceso
                  </a>
                </li>
                <li>
                  <a href="#gallery" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center group">
                    <ChevronRight size={16} className="mr-2 transform group-hover:translate-x-1 transition-transform" />
                    Galería
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center group">
                    <ChevronRight size={16} className="mr-2 transform group-hover:translate-x-1 transition-transform" />
                    Precios
                  </a>
                </li>
                <li>
                  <Link href="/tracking" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center group">
                    <ChevronRight size={16} className="mr-2 transform group-hover:translate-x-1 transition-transform" />
                    Rastrear Orden
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-6 relative">
                Nuestros Servicios
                <span className="absolute -bottom-2 left-0 w-12 h-1 bg-[#78f3d3] rounded-full"></span>
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center group">
                    <ChevronRight size={16} className="mr-2 transform group-hover:translate-x-1 transition-transform" />
                    Limpieza Básica
                    <span className="ml-auto text-[#78f3d3] text-sm">$139</span>
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center group">
                    <ChevronRight size={16} className="mr-2 transform group-hover:translate-x-1 transition-transform" />
                    Limpieza Premium
                    <span className="ml-auto text-[#78f3d3] text-sm">$189</span>
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center group">
                    <ChevronRight size={16} className="mr-2 transform group-hover:translate-x-1 transition-transform" />
                    Impermeabilización
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center group">
                    <ChevronRight size={16} className="mr-2 transform group-hover:translate-x-1 transition-transform" />
                    Restauración Completa
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center group">
                    <ChevronRight size={16} className="mr-2 transform group-hover:translate-x-1 transition-transform" />
                    Pickup a Domicilio
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-6 relative">
                Contacto
                <span className="absolute -bottom-2 left-0 w-12 h-1 bg-[#78f3d3] rounded-full"></span>
              </h3>
              
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <MapPin size={18} className="text-[#78f3d3] mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400 block">Calle del Sneaker 123</span>
                    <span className="text-gray-400">ROMA NTE., CDMX 53000</span>
                  </div>
                </li>
                <li className="flex items-center">
                  <Phone size={18} className="text-[#78f3d3] mr-3 flex-shrink-0" />
                  <span className="text-gray-400">442-123-4567</span>
                </li>
                <li className="flex items-center">
                  <Mail size={18} className="text-[#78f3d3] mr-3 flex-shrink-0" />
                  <span className="text-gray-400">info@vipcleaners.com</span>
                </li>
              </ul>

              {/* Hours */}
              <div className="bg-[#3e4a61] rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Clock size={18} className="text-[#78f3d3] mr-2" />
                  <h4 className="font-semibold">Horarios</h4>
                </div>
                <div className="text-sm text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Lun - Vie:</span>
                    <span>9:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sábado:</span>
                    <span>10:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Domingo:</span>
                    <span className="text-red-400">Cerrado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="pt-8 border-t border-[#3e4a61]">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <p className="text-gray-500 text-sm flex items-center">
                  &copy; {new Date().getFullYear()} VipCleaners. Todos los derechos reservados. | Diseñado con&nbsp;
                  <Heart size={14} className="text-[#78f3d3] mx-1" fill="currentColor" />&nbsp;para amantes de sneakers
                </p>
              </div>
              
              <div className="flex items-center space-x-6">
                <Link href="#" className="text-gray-500 hover:text-[#78f3d3] text-sm transition-colors">
                  Términos de Servicio
                </Link>
                <Link href="#" className="text-gray-500 hover:text-[#78f3d3] text-sm transition-colors">
                  Privacidad
                </Link>
                <button 
                  onClick={scrollToTop}
                  className="ml-4 w-10 h-10 bg-[#78f3d3] text-[#313D52] rounded-full flex items-center justify-center hover:bg-[#4de0c0] transition-all transform hover:scale-110"
                  aria-label="Volver arriba"
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;