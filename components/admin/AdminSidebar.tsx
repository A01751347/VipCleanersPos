
// components/admin/AdminSidebar.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  ShoppingCart,
  Package,
  MessageSquare,
  Users,
  CreditCard,
  BarChart2,
  Warehouse,
  BaggageClaim,
  Box,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import LogoutButton from './LogoutButton'

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onCloseMobile?: () => void
}

type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }> }

const groups: { label: string; items: readonly NavItem[] }[] = [
  {
    label: 'General',
    items: [
      { name: 'Dashboard', href: '/admin', icon: Home },
      { name: 'Punto de Venta', href: '/admin/pos', icon: ShoppingCart },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { name: 'Órdenes', href: '/admin/orders', icon: Package },
      { name: 'Mensajes', href: '/admin/messages', icon: MessageSquare },
      { name: 'Clientes', href: '/admin/clients', icon: Users },
      { name: 'Pagos', href: '/admin/payments', icon: CreditCard },
    ],
  },
  {
    label: 'Operación',
    items: [
      { name: 'Reportes', href: '/admin/reports', icon: BarChart2 },
      { name: 'Almacenamiento', href: '/admin/warehouse', icon: Warehouse },
      { name: 'Servicios', href: '/admin/services', icon: BaggageClaim },
      { name: 'Productos', href: '/admin/products', icon: Box },
    ],
  },
]

const AdminSidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggleCollapse, onCloseMobile }) => {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href))

  return (
    <div id="admin-sidebar" className={`flex h-full flex-col border-r border-zinc-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70`}> 
      {/* Marca */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 p-4">
      <div className={`flex items-end gap-1 ${collapsed ? "hidden" : ""}`}>
          <span className="text-lg font-bold text-[#313D52]">Vip</span>
          <span className="text-lg font-bold text-[#78f3d3]">Cleaners</span>
        </div>
        {/* Toggle (sólo md+) */}
        <button
          onClick={onToggleCollapse}
          className="hidden rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-50 md:inline-flex"
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-3">
        {groups.map((group) => (
          <div key={group.label} className="mb-2">
            {/* Encabezado de grupo */}
            <div className={`px-3 py-1 ${collapsed ? 'hidden' : 'block'}`}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{group.label}</span>
            </div>
            <ul className="space-y-1 px-2">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      title={collapsed ? item.name : undefined}
                      className={`relative group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78f3d3] ${
                        active
                          ? 'bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]'
                          : 'text-[#6c7a89] hover:bg-zinc-100 hover:text-[#313D52]'
                      } ${collapsed ? 'md:justify-center md:px-2' : ''}`}
                    >
                      {/* Indicador activo a la izquierda */}
                      {active && (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-gradient-to-b from-emerald-400 to-teal-400" />
                      )}
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className={`${collapsed ? 'hidden' : 'block'}`}>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-zinc-200 p-3">
      <LogoutButton
  className={`${collapsed ? 'md:justify-center md:px-2' : ''}`}
  collapsed={collapsed}
/>
      </div>
    </div>
  )
}

export default AdminSidebar
