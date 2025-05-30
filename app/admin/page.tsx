'use client'
import React, { useEffect, useState } from 'react';

import { 
  Calendar, 
  MessageSquare, 
  DollarSign,
  UserCheck,
  ShoppingBag,
  TrendingUp,
  Users,
  Package,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import DashboardCard from '../../components/admin/DashboardCard';
import RecentBookingsTable from '../../components/admin/RecentBookingsTable';
import RecentMessagesTable from '../../components/admin/RecentMessagesTable';
import { BarChartComponent } from '@/components/admin/BarChartComponent';

interface DashboardStats {
  totalBookings: number;
  pendingMessages: number;
  monthlySales: number;
  activeClients: number;
  metricas?: {
    ordenes_hoy: number;
    ventas_hoy: number;
    ordenes_mes: number;
    total_clientes: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    stats: true,
    bookings: true,
    messages: true
  });
  const [error, setError] = useState({
    stats: false,
    bookings: false,
    messages: false
  });

  // Función para formatear número a moneda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  useEffect(() => {
    // Cargar estadísticas del dashboard
    async function fetchDashboardStats() {
      try {
        const response = await fetch('/api/admin/dashboard/stats');
        
        if (!response.ok) {
          throw new Error('Error al cargar estadísticas');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(prev => ({ ...prev, stats: true }));
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    }

    // Cargar reservaciones recientes
    async function fetchRecentBookings() {
      try {
        const response = await fetch('/api/admin/bookings?recent=true&limit=5');
        
        if (!response.ok) {
          throw new Error('Error al cargar reservaciones recientes');
        }
        
        const data = await response.json();
        setRecentBookings(data.bookings || []);
      } catch (err) {
        console.error('Error fetching recent bookings:', err);
        setError(prev => ({ ...prev, bookings: true }));
      } finally {
        setLoading(prev => ({ ...prev, bookings: false }));
      }
    }

    // Cargar mensajes recientes
    async function fetchRecentMessages() {
      try {
        const response = await fetch('/api/admin/messages?recent=true&limit=5');
        
        if (!response.ok) {
          throw new Error('Error al cargar mensajes recientes');
        }
        
        const data = await response.json();
        setRecentMessages(data.messages || []);
      } catch (err) {
        console.error('Error fetching recent messages:', err);
        setError(prev => ({ ...prev, messages: true }));
      } finally {
        setLoading(prev => ({ ...prev, messages: false }));
      }
    }

    fetchDashboardStats();
    fetchRecentBookings();
    fetchRecentMessages();
  }, []);

  // Definir las estadísticas que se mostrarán en las tarjetas
  const dashboardStats = [
    { 
      id: 5, 
      title: 'Órdenes de Hoy', 
      value: stats && stats.metricas ? stats.metricas.ordenes_hoy.toString() : '-', 
      change: stats && stats.metricas ? formatCurrency(stats.metricas.ventas_hoy || 0) : '', 
      trend: 'neutral' as const,
      icon: ShoppingBag,
      iconColor: '#00b4d8',
      iconBg: '#e8f8fc',
      link: '/admin/orders',
      loading: loading.stats
    },
    { 
      id: 2, 
      title: 'Mensajes Pendientes', 
      value: stats ? stats.pendingMessages.toString() : '-', 
      change: stats && stats.pendingMessages > 0 ? 'Requiere atención' : 'Al día',
      trend: stats && stats.pendingMessages > 0 ? 'up' as const : 'neutral' as const, 
      icon: MessageSquare,
      iconColor: '#0ec493',
      iconBg: '#e0f7f0',
      link: '/admin/messages',
      loading: loading.stats
    },
    { 
      id: 3, 
      title: 'Ventas del Mes', 
      value: stats ? formatCurrency(stats.monthlySales) : '-', 
      change: stats && stats.metricas ? `${stats.metricas.ordenes_mes} órdenes` : '', 
      trend: 'up' as const,
      icon: DollarSign,
      iconColor: '#0ec493',
      iconBg: '#e0f7f0',
      link: '/admin/orders',
      loading: loading.stats
    },
    { 
      id: 4, 
      title: 'Clientes Activos', 
      value: stats ? stats.activeClients.toString() : '-', 
      change: stats && stats.metricas ? `${stats.metricas.total_clientes} total` : '', 
      trend: 'neutral' as const,
      icon: UserCheck,
      iconColor: '#00b4d8',
      iconBg: '#e8f8fc',
      link: '/admin/clients',
      loading: loading.stats
    },{ 
      id: 1, 
      title: 'Reservaciones Totales', 
      value: stats ? stats.totalBookings.toString() : '-', 
      change: '', 
      trend: 'neutral' as const,
      icon: Calendar,
      iconColor: '#0ec493',
      iconBg: '#e0f7f0',
      link: '/admin/bookings',
      loading: loading.stats
    },
    
    { 
      id: 6, 
      title: 'Total de Clientes', 
      value: stats && stats.metricas ? stats.metricas.total_clientes.toString() : '-', 
      change: '', 
      trend: 'neutral' as const,
      icon: Users,
      iconColor: '#00b4d8',
      iconBg: '#e8f8fc',
      link: '/admin/clients',
      loading: loading.stats
    }
  ];

  return (
    <div className="space-y-8 flex-wrap">
   

{/* Contenedor principal: tarjetas a la izquierda en 2x3, gráfica a la derecha */}
<div className="flex flex-col lg:flex-row gap-6">

  {/* Izquierda: grid 2x3 con altura automática */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 self-start">
    {dashboardStats.map(stat => (
      <Link key={stat.id} href={stat.link}>
        <DashboardCard
          title={stat.title}
          value={stat.value}
          change={stat.change}
          trend={stat.trend}
          icon={stat.icon}
          iconColor={stat.iconColor}
          iconBg={stat.iconBg}
          loading={stat.loading}
        />
      </Link>
    ))}
  </div>

  {/* Derecha: gráfica ocupa aprox. 1/3 */}
  <div className="w-full lg:w-1/2">
    <BarChartComponent />
  </div>

</div>


      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reservaciones recientes */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0e6e5] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-[#e0e6e5]">
            <div>
              <h2 className="text-lg font-semibold text-[#313D52]">Reservaciones Recientes</h2>
              <p className="text-sm text-[#6c7a89]">Últimas reservaciones realizadas</p>
            </div>
            <Link href="/admin/bookings" className="inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors text-sm font-medium">
              Ver Todas
            </Link>
          </div>
          <div className="p-6">
            {loading.bookings ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 size={30} className="animate-spin text-[#78f3d3]" />
              </div>
            ) : error.bookings ? (
              <div className="text-center py-8 text-red-500">
                <p>Error al cargar las reservaciones recientes</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 text-sm text-[#78f3d3] hover:underline"
                >
                  Reintentar
                </button>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-8 text-[#6c7a89]">
                <Calendar size={40} className="mx-auto mb-4 opacity-50" />
                <p>No hay reservaciones recientes</p>
              </div>
            ) : (
              <RecentBookingsTable bookings={recentBookings} />
            )}
          </div>
        </div>

        {/* Mensajes recientes */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0e6e5] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-[#e0e6e5]">
            <div>
              <h2 className="text-lg font-semibold text-[#313D52]">Mensajes Recientes</h2>
              <p className="text-sm text-[#6c7a89]">Últimos mensajes de contacto</p>
            </div>
            <Link href="/admin/messages" className="inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors text-sm font-medium">
              Ver Todos
            </Link>
          </div>
          <div className="p-6">
            {loading.messages ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 size={30} className="animate-spin text-[#78f3d3]" />
              </div>
            ) : error.messages ? (
              <div className="text-center py-8 text-red-500">
                <p>Error al cargar los mensajes recientes</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 text-sm text-[#78f3d3] hover:underline"
                >
                  Reintentar
                </button>
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="text-center py-8 text-[#6c7a89]">
                <MessageSquare size={40} className="mx-auto mb-4 opacity-50" />
                <p>No hay mensajes recientes</p>
              </div>
            ) : (
              <RecentMessagesTable messages={recentMessages} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}