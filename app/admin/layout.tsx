// app/admin/layout.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import AdminSidebar from '../../components/admin/AdminSidebar'
import AdminHeader from '../../components/admin/AdminHeader'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false) // móvil
  const [collapsed, setCollapsed] = useState(false) // desktop (md+)

  // Cierra el sidebar al cambiar de ruta (en móvil)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (isLoginPage) {
    return (
      <div className={`${inter.variable} min-h-screen bg-[#f5f9f8]`}> 
        <main className="mx-auto max-w-md p-6">{children}</main>
      </div>
    )
  }

  return (
    <div className={`${inter.variable} flex min-h-screen bg-[#f5f9f8] text-zinc-900`}> 
      {/* Overlay (móvil) */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      {/* Sidebar contenedor */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-full transform bg-white shadow-xl transition-transform md:static md:translate-x-0 ${
          collapsed ? 'md:w-20' : 'md:w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        aria-label="Barra lateral de administración"
      >
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onCloseMobile={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar móvil (hamburger) */}
        <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-[#e0e6e5] bg-white/80 p-3 backdrop-blur md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 truncate">
            <span className="text-sm font-semibold text-[#313D52]">Vip</span>
            <span className="text-sm font-semibold text-[#78f3d3]">Cleaners</span>
            <span className="ml-2 text-xs text-zinc-500">Panel</span>
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar menú"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Header (desktop y tablet) */}
        <div className="hidden md:block">
          <AdminHeader />
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}