'use client'
// components/admin/AdminSidebar.tsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  Settings,
  ShoppingCart,
  Package,
  BarChart2,
  Users,
  CreditCard,
  Wrench
} from 'lucide-react';
import LogoutButton from './LogoutButton';

const AdminSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Punto de Venta', href: '/admin/pos', icon: ShoppingCart },
    { name: 'Órdenes', href: '/admin/orders', icon: Package },
    { name: 'Reservaciones', href: '/admin/bookings', icon: Calendar },
    { name: 'Mensajes', href: '/admin/messages', icon: MessageSquare },
    { name: 'Clientes', href: '/admin/clients', icon: Users },
    { name: 'Pagos', href: '/admin/payments', icon: CreditCard },
    { name: 'Reportes', href: '/admin/reports', icon: BarChart2 },
    { name: 'Configuración', href: '/admin/settings', icon: Settings },
    { name: 'Diagnóstico', href: '/admin/debug', icon: Wrench },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-[#e0e6e5]">
        <span className="text-xl font-bold text-[#313D52]">
          Vip<span className="text-[#78f3d3]">Cleaners</span>
        </span>
        <div className="text-xs text-[#6c7a89]">Panel de Administración</div>
      </div>

      <nav className="flex-1 py-6">
        <ul className="space-y-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    active 
                      ? 'bg-gradient-to-r from-[#4de0c0] to-[#4de0c0] text-[#313D52]' 
                      : 'text-[#6c7a89] hover:bg-[#e0e6e5] hover:text-[#313D52]'
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0 mr-3" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-[#e0e6e5]">
        <LogoutButton 
          className="flex items-center w-full p-3 rounded-lg text-[#6c7a89] hover:bg-[#e0e6e5] hover:text-[#313D52] transition-colors"
        />
      </div>
    </div>
  );
};

export default AdminSidebar;