'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  MessageSquare,
  DollarSign,
  UserCheck,
  Users,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Loader2,
  Eye,
  Mail,
  MailOpen,
  Star,
  Clock,
  RefreshCcw,
} from 'lucide-react'

// --- UI (shadcn) ---
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'

// ================================================================
// Tipos
// ================================================================
interface DashboardStats {
  totalBookings: number
  pendingMessages: number
  monthlySales: number
  activeClients: number
  metricas?: {
    ordenes_hoy: number
    ventas_hoy: number
    ordenes_mes: number
    total_clientes: number
  }
}

interface Booking {
  id: number
  booking_reference: string
  full_name: string
  service_type: string
  booking_date: string
  status: string | number
  created_at: string
}

interface Message {
  id: number
  name: string
  email: string
  subject: string
  message: string
  created_at: string
  is_read?: boolean
  is_starred?: boolean
  is_archived?: boolean
}

interface WeeklySalesData {
  day: string
  dayName: string
  sales: number
  orders: number
  date: string
}

interface WeeklySalesResponse {
  data: WeeklySalesData[]
  totalSales: number
  totalOrders: number
  weekGrowth: number
  bestDay: { day: string; sales: number }
}

// ================================================================
// Utilidades
// ================================================================
const mxn = (v: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)

const compactNumber = (v: number) =>
  new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 }).format(v)

// Mapa de estados de reserva
const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  '9': { label: 'Pendiente', classes: 'bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300' },
  '1': { label: 'Recibido', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-300' },
  '2': { label: 'En Proceso', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-300' },
  '6': { label: 'Completado', classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300' },
  '7': { label: 'Entregado', classes: 'bg-violet-100 text-violet-800 dark:bg-violet-400/20 dark:text-violet-300' },
  '8': { label: 'Cancelado', classes: 'bg-rose-100 text-rose-800 dark:bg-rose-400/20 dark:text-rose-300' },
}

// ================================================================
// Página principal
// ================================================================
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [recentMessages, setRecentMessages] = useState<Message[]>([])
  const [weekly, setWeekly] = useState<WeeklySalesResponse | null>(null)

  const [loading, setLoading] = useState({ stats: true, bookings: true, messages: true, weekly: true })
  const [error, setError] = useState({ stats: false, bookings: false, messages: false, weekly: false })

  const refreshAll = async () => {
    await Promise.all([
      fetchDashboardStats(),
      fetchRecentBookings(),
      fetchRecentMessages(),
      fetchWeeklySales(),
    ])
  }

  useEffect(() => {
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchDashboardStats() {
    try {
      setLoading((p) => ({ ...p, stats: true }))
      const res = await fetch('/api/admin/dashboard/stats')
      if (!res.ok) throw new Error('Error al cargar estadísticas')
      const data = (await res.json()) as DashboardStats
      setStats(data)
    } catch (e) {
      console.error('Error fetching dashboard stats:', e)
      setError((p) => ({ ...p, stats: true }))
    } finally {
      setLoading((p) => ({ ...p, stats: false }))
    }
  }

  async function fetchRecentBookings() {
    try {
      setLoading((p) => ({ ...p, bookings: true }))
      const res = await fetch('/api/admin/bookings?recent=true&limit=5')
      if (!res.ok) throw new Error('Error al cargar reservaciones recientes')
      const data = await res.json()
      setRecentBookings((data?.bookings || []) as Booking[])
    } catch (e) {
      console.error('Error fetching recent bookings:', e)
      setError((p) => ({ ...p, bookings: true }))
    } finally {
      setLoading((p) => ({ ...p, bookings: false }))
    }
  }

  async function fetchRecentMessages() {
    try {
      setLoading((p) => ({ ...p, messages: true }))
      const res = await fetch('/api/admin/messages?recent=true&limit=5')
      if (!res.ok) throw new Error('Error al cargar mensajes recientes')
      const data = await res.json()
      setRecentMessages((data?.messages || []) as Message[])
    } catch (e) {
      console.error('Error fetching recent messages:', e)
      setError((p) => ({ ...p, messages: true }))
    } finally {
      setLoading((p) => ({ ...p, messages: false }))
    }
  }

  async function fetchWeeklySales() {
    try {
      setLoading((p) => ({ ...p, weekly: true }))
      const res = await fetch('/api/admin/dashboard/weekly-sales')
      if (!res.ok) throw new Error('Error al cargar ventas semanales')
      const data = (await res.json()) as WeeklySalesResponse
      setWeekly(data)
    } catch (e) {
      console.error('Error fetching weekly sales:', e)
      setError((p) => ({ ...p, weekly: true }))
    } finally {
      setLoading((p) => ({ ...p, weekly: false }))
    }
  }

  // KPIs (se memorizan para render más veloz)
  const kpis = useMemo(
    () => [
      {
        id: 5,
        title: 'Órdenes de Hoy',
        value: stats?.metricas ? String(stats.metricas.ordenes_hoy) : '-',
        hint: stats?.metricas ? `Ventas: ${mxn(stats.metricas.ventas_hoy || 0)}` : '',
        trend: 'neutral' as const,
        icon: ShoppingBag,
        href: '/admin/orders',
      },
      {
        id: 2,
        title: 'Mensajes Pendientes',
        value: stats ? String(stats.pendingMessages) : '-',
        hint: stats && stats.pendingMessages > 0 ? 'Requiere atención' : 'Al día',
        trend: stats && stats.pendingMessages > 0 ? ('up' as const) : ('neutral' as const),
        icon: MessageSquare,
        href: '/admin/messages',
      },
      {
        id: 3,
        title: 'Ventas del Mes',
        value: stats ? mxn(stats.monthlySales) : '-',
        hint: stats?.metricas ? `${stats.metricas.ordenes_mes} órdenes` : '',
        trend: 'up' as const,
        icon: DollarSign,
        href: '/admin/orders',
      },
      {
        id: 4,
        title: 'Clientes Activos',
        value: stats ? String(stats.activeClients) : '-',
        hint: stats?.metricas ? `${stats.metricas.total_clientes} total` : '',
        trend: 'neutral' as const,
        icon: UserCheck,
        href: '/admin/clients',
      },
      {
        id: 1,
        title: 'Reservaciones Totales',
        value: stats ? String(stats.totalBookings) : '-',
        hint: '',
        trend: 'neutral' as const,
        icon: Calendar,
        href: '/admin/bookings',
      },
      {
        id: 6,
        title: 'Total de Clientes',
        value: stats?.metricas ? String(stats.metricas.total_clientes) : '-',
        hint: '',
        trend: 'neutral' as const,
        icon: Users,
        href: '/admin/clients',
      },
    ],
    [stats]
  )

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Panel de Administración</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Resumen general y actividad reciente</p>
        </div>
        <button
          onClick={refreshAll}
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <RefreshCcw className="h-4 w-4" /> Recargar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => (
          <Link key={k.id} href={k.href} className="group">
            <KpiCard loading={loading.stats} title={k.title} value={k.value} hint={k.hint} trend={k.trend} icon={k.icon} />
          </Link>
        ))}
      </div>

      {/* Gráfica + Listas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <WeeklySalesCard loading={loading.weekly} error={error.weekly} weekly={weekly} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 gap-6">

        <RecentMessagesCard loading={loading.messages} error={error.messages} items={recentMessages} />
          </div>
      </div>
      <RecentBookingsCard loading={loading.bookings} error={error.bookings} items={recentBookings} />
        
    </div>
  )
}

// ================================================================
// Componentes UI
// ================================================================

type Trend = 'up' | 'down' | 'neutral'

function KpiCard({
  title,
  value,
  hint,
  trend,
  icon: Icon,
  loading,
}: {
  title: string
  value: string
  hint?: string
  trend: Trend
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
}) {
  return (
    <Card className="relative overflow-hidden border-zinc-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-900">
      <CardContent className="px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</p>
            {loading ? (
              <div className="mt-2 h-7 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            ) : (
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
            )}
            {!loading && hint ? (
              <div className="mt-1 inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <TrendPill trend={trend} />
                <span>{hint}</span>
                <span className="text-zinc-400">•</span>
                <span>vs. mes anterior</span>
              </div>
            ) : null}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 transition group-hover:scale-105 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-50 opacity-60 blur-xl dark:bg-emerald-400/10" />
    </Card>
  )
}

function TrendPill({ trend }: { trend: Trend }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : undefined
  const color = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-zinc-500'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium ${color} dark:bg-zinc-800/60`}>
      {Icon ? <Icon className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />}
      {trend === 'neutral' ? '—' : trend === 'up' ? '+ Mejora' : 'Baja'}
    </span>
  )
}

// -------------------- Reservaciones --------------------
function RecentBookingsCard({
  loading,
  error,
  items,
}: {
  loading?: boolean
  error?: boolean
  items: Booking[]
}) {
  return (
    <Card className="border-zinc-200/70 dark:border-zinc-800">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Reservaciones Recientes</CardTitle>
          <CardDescription>Últimas reservaciones realizadas</CardDescription>
        </div>
        <Link
          href="/admin/orders"
          className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
        >
          Ver todas
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : error ? (
          <ErrorState onRetry={() => window.location.reload()} message="Error al cargar las reservaciones recientes" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No hay reservaciones recientes"
            description="Cuando lleguen nuevas reservaciones, aparecerán aquí."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/70 dark:text-zinc-400">
                <tr>
                  <Th>Referencia</Th>
                  <Th>Cliente</Th>
                  <Th>Servicio</Th>
                  <Th>Fecha</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {items.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/60">
                    <Td className="font-medium text-zinc-900 dark:text-zinc-100">{b.booking_reference}</Td>
                    <Td className="text-zinc-600 dark:text-zinc-400">{b.full_name}</Td>
                    <Td className="text-zinc-600 dark:text-zinc-400">{serviceLabel(b.service_type)}</Td>
                    <Td className="text-zinc-600 dark:text-zinc-400">{formatDate(b.booking_date)}</Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        STATUS_MAP[String(b.status)]?.classes || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {STATUS_MAP[String(b.status)]?.label || 'Desconocido'}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <Link
                        aria-label={`Ver reservación ${b.booking_reference}`}
                        href={`/admin/orders/${b.id}`}
                        className="inline-flex items-center rounded-lg border border-zinc-200 p-2 text-emerald-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// -------------------- Mensajes --------------------
function RecentMessagesCard({
  loading,
  error,
  items,
}: {
  loading?: boolean
  error?: boolean
  items: Message[]
}) {
  return (
    <Card className="border-zinc-200/70 dark:border-zinc-800">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Mensajes Recientes</CardTitle>
          <CardDescription>Últimos mensajes de contacto</CardDescription>
        </div>
        <Link
          href="/admin/messages"
          className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
        >
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => window.location.reload()} message="Error al cargar los mensajes recientes" />
        ) : items.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No hay mensajes recientes" description="Cuando recibas nuevos mensajes, aparecerán aquí." />
        ) : (
          <div className="space-y-3">
            {items.slice(0, 5).map((m) => (
              <Link key={m.id} href={`/admin/messages`} className="block">
                <div
                  className={`rounded-lg border p-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                    !m.is_read ? 'border-emerald-300/50 bg-emerald-50/60 dark:border-emerald-400/30 dark:bg-emerald-500/10' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {m.is_read ? <MailOpen className="h-4 w-4 text-zinc-400" /> : <Mail className="h-4 w-4 text-emerald-500" />}
                        {m.is_starred && <Star className="h-4 w-4 text-amber-400" />}
                        <span className={`truncate text-sm ${!m.is_read ? 'font-semibold text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>{m.name}</span>
                      </div>
                      <h4 className={`truncate text-sm ${!m.is_read ? 'font-semibold text-zinc-900 dark:text-zinc-100' : 'text-zinc-200/90 dark:text-zinc-200'}`}>{m.subject}</h4>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{m.message.substring(0, 100)}...</p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {formatSmartDate(m.created_at)}
                      </div>
                    </div>
                    {!m.is_read && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// -------------------- Ventas semanales --------------------
function WeeklySalesCard({ loading, error, weekly }: { loading?: boolean; error?: boolean; weekly: WeeklySalesResponse | null }) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Ventas de la Semana</CardTitle>
          <CardDescription>Últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <p className="text-sm text-zinc-500">Cargando datos...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return <ErrorState message="Error al cargar datos de la gráfica" onRetry={() => window.location.reload()} />
  }

  if (!weekly) return null

  const chartData = weekly.data.map((d) => ({
    day: new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric' }).format(new Date(d.date)),
    sales: d.sales,
    orders: d.orders,
    fullDate: d.date,
  }))

  const isGrowthPositive = weekly.weekGrowth >= 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ventas de la Semana</CardTitle>
        <CardDescription>
          Total: {mxn(weekly.totalSales)} • {weekly.totalOrders} {weekly.totalOrders === 1 ? 'orden' : 'órdenes'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <ChartContainer config={{ sales: { label: 'Ventas', color: '#10b981' } }} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap={20}>
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={(v) => `${compactNumber(v)}`}
              />
              <ChartTooltip
                cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as any
                    return (
                      <div className="rounded-lg border bg-white p-2 text-xs shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
                        <p className="font-semibold text-emerald-600">Ventas: {mxn(data.sales)}</p>
                        <p className="text-zinc-500 dark:text-zinc-400">{data.orders} {data.orders === 1 ? 'orden' : 'órdenes'}</p>
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {new Date(data.fullDate).toLocaleDateString('es-MX', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="sales" fill="url(#fillSales)" stroke="#34d399" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-3 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {isGrowthPositive ? (
            <>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-700 dark:text-emerald-400">
                {weekly.weekGrowth > 0 ? `+${weekly.weekGrowth.toFixed(1)}%` : 'Sin cambio'}
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-rose-600" />
              <span className="text-rose-700 dark:text-rose-400">{weekly.weekGrowth.toFixed(1)}%</span>
            </>
          )}
          <span className="text-zinc-500">vs semana anterior</span>
        </div>
        <div className="text-zinc-600 dark:text-zinc-400">
          Mejor día:{' '}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {weekly.bestDay.day} ({mxn(weekly.bestDay.sales)})
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}

// -------------------- Auxiliares visuales --------------------
function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {description ? <p className="max-w-sm text-xs text-zinc-500 dark:text-zinc-400">{description}</p> : null}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-rose-200/50 bg-rose-50/40 dark:border-rose-500/20 dark:bg-rose-500/10">
      <CardContent className="flex h-[220px] flex-col items-center justify-center gap-3">
        <p className="text-sm font-medium text-rose-600 dark:text-rose-300">{message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-700 transition hover:bg-rose-50 dark:border-rose-500/40 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10"
        >
          <RefreshCcw className="h-4 w-4" /> Reintentar
        </button>
      </CardContent>
    </Card>
  )
}

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-t border-zinc-100 dark:border-zinc-800">
              {Array.from({ length: cols }).map((__, c) => (
                <td key={c} className="px-4 py-3">
                  <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>
}

// ================================================================
// Helpers de formato
// ================================================================
function serviceLabel(s: string) {
  if (s === 'basic') return 'Limpieza Básica'
  if (s === 'premium') return 'Limpieza Premium'
  return s
}

function formatDate(dateString?: string) {
  if (!dateString) return ''
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('es-MX', options)
}

function formatSmartDate(dateString?: string) {
  if (!dateString) return ''
  const messageDate = new Date(dateString)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (messageDate.toDateString() === today.toDateString()) {
    return messageDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Ayer'
  }
  if (messageDate.getFullYear() === today.getFullYear()) {
    return messageDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }
  return messageDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}
