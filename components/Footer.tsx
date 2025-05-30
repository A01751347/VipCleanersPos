"use client"
// components/Footer.tsx
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
  ChevronRight
} from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#313D52] text-white pt-16 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="text-2xl font-bold mb-6">Vip<span className="text-[#78f3d3]">Cleaners</span></div>
            <p className="text-gray-400 mb-6">
              Limpieza y servicios de restauración premium para zapatillas. 
              Damos nueva vida a tus zapatillas con cuidado profesional.
            </p>
            <div className="flex space-x-4">
              <Link href="/" className="w-10 h-10 rounded-full bg-[#3e4a61] flex items-center justify-center hover:bg-[#78f3d3] hover:text-[#313D52] transition-colors">
                <Facebook size={18} />
              </Link>
              <Link href="/" className="w-10 h-10 rounded-full bg-[#3e4a61] flex items-center justify-center hover:bg-[#78f3d3] hover:text-[#313D52] transition-colors">
                <Instagram size={18} />
              </Link>
              <Link href="/" className="w-10 h-10 rounded-full bg-[#3e4a61] flex items-center justify-center hover:bg-[#78f3d3] hover:text-[#313D52] transition-colors">
                <Twitter size={18} />
              </Link>
              <Link href="/" className="w-10 h-10 rounded-full bg-[#3e4a61] flex items-center justify-center hover:bg-[#78f3d3] hover:text-[#313D52] transition-colors">
                <Youtube size={18} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 relative">
              Enlaces Rápidos
              <span className="absolute -bottom-2 left-0 w-10 h-1 bg-[#78f3d3]"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#home" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center">
                  <ChevronRight size={16} className="mr-2" />
                  Inicio
                </a>
              </li>
              <li>
                <a href="#services" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center">
                  <ChevronRight size={16} className="mr-2" />
                  Servicios
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center">
                  <ChevronRight size={16} className="mr-2" />
                  Proceso
                </a>
              </li>
              <li>
                <a href="#before-after" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center">
                  <ChevronRight size={16} className="mr-2" />
                  Galería
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center">
                  <ChevronRight size={16} className="mr-2" />
                  Precios
                </a>
              </li>
              <li>
                <Link href="/tracking" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center">
                  <ChevronRight size={16} className="mr-2" />
                  Rastrear Orden
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6 relative">
              Servicios
              <span className="absolute -bottom-2 left-0 w-10 h-1 bg-[#78f3d3]"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center">
                  <ChevronRight size={16} className="mr-2" />
                  Limpieza Básica
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center">
                  <ChevronRight size={16} className="mr-2" />
                  Limpieza Premium
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center">
                  <ChevronRight size={16} className="mr-2" />
                  Impermeabilización
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center">
                  <ChevronRight size={16} className="mr-2" />
                  Membresía Básica
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#78f3d3] transition-colors flex items-center">
                  <ChevronRight size={16} className="mr-2" />
                  Membresía Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6 relative">
              Información de contacto
              <span className="absolute -bottom-2 left-0 w-10 h-1 bg-[#78f3d3]"></span>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin size={18} className="text-[#78f3d3] mt-1 mr-3 flex-shrink-0" />
                <span className="text-gray-400">Calle del Sneaker 123<br />ROMA NTE., CDMX 53000</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="text-[#78f3d3] mr-3 flex-shrink-0" />
                <span className="text-gray-400">(55) 124-5678</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="text-[#78f3d3] mr-3 flex-shrink-0" />
                <span className="text-gray-400">info@vipcleaners.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-[#3e4a61] text-center text-gray-500 text-sm">
          <p className="flex items-center justify-center">
            &copy; {new Date().getFullYear()} VipCleaners. All Rights Reserved. | Diseñado con&nbsp;
            <Heart size={14} className="text-[#78f3d3]" fill="currentColor" />&nbsp;para amantes de sneakers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;