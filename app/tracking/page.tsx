'use client'
import React, { useMemo, useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Package,
  Truck,
  Clock,
  Calendar,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingCart,
  Info,
} from 'lucide-react'

/**
 * ✅ Rediseño full-screen + mobile-first + datos extendidos
 * - Pantalla completa, responsive y con layout de 2/3 columnas en XL.
 * - Se agregan Productos, Pago, Dirección, Meta (tipo, reservación original, timestamps), y contadores.
 * - Normalización defensiva para aceptar payloads variados (camelCase/snake_case y diferentes keys del historial).
 *
 * API: ajusta API_PATH según tu backend.
 *   GET /api/track/:code  -> { data: any }
 */
const API_PATH = '/api/track'

// ===================== Tipos =====================
export type OrderService = {
  cantidad: number
  servicio_nombre: string
  servicio_descripcion?: string
  marca_calzado?: string
  modelo_calzado?: string
  descripcion_calzado?: string
  precio_unitario: number
  subtotal: number
  // opcional: ubicación en almacén
  caja_almacenamiento?: string
  codigo_ubicacion?: string
}

export type OrderProduct = {
  producto_nombre: string
  producto_descripcion?: string
  categoria_producto?: string
  cantidad: number
  precio_unitario: number
  descuento?: number
  subtotal: number
}

export type OrderHistory = {
  historial_id?: number | string
  estado_nombre: string
  estado_color?: string // hex sin # (e.g. '78f3d3')
  fecha_cambio: string
  empleado_nombre?: string
  comentario?: string
}

export type OrderAddress = {
  completa?: string
  calle?: string
  numeroExterior?: string
  colonia?: string
  ciudad?: string
  codigoPostal?: string
  instrucciones?: string
}

export type OrderTracking = {
  codigo: string // p.ej. ORD123456 ó 000123
  tipo?: 'orden' | 'reservacion'
  reservacionOriginal?: string
  cliente: {
    nombre: string
    apellidos?: string
    telefono?: string
    email?: string
  }
  fechas?: {
    recepcion?: string
    fecha_entrega_estimada?: string
    fecha_entrega_real?: string
    creacion?: string
    actualizacion?: string
  }
  estadoActual?: {
    nombre: string
    descripcion?: string
    color?: string // hex sin # o con #
  }
  servicios?: OrderService[]
  productos?: OrderProduct[]
  historial?: OrderHistory[]
  totales?: {
    subtotal?: number
    impuestos?: number
    total?: number
  }
  pago?: {
    estado?: string
    metodo?: string
  }
  direccion?: OrderAddress | null
  meta?: {
    origen?: string
    sla?: string
  }
  notas?: string
}

// ===================== Utilidades =====================
const statusStepMap: Record<string, number> = {
  pendiente: 0,
  recibido: 1,
  creada: 1,
  'en proceso': 2,
  procesando: 2,
  listo: 3,
  'listo para entrega': 3,
  completado: 3,
  entregado: 4,
}

const stepLabels = ['Pendiente', 'Recibido', 'En Proceso', 'Listo', 'Entregado']
const stepDescriptions = [
  'Tu pedido ha sido recibido y está pendiente de procesamiento.',
  'Tu calzado ha sido recibido en nuestra tienda.',
  'Estamos trabajando en tu calzado.',
  'Tu calzado está listo para ser entregado.',
  'Tu calzado ha sido entregado.',
]

function getStep(estado?: string) {
  if (!estado) return 0
  const key = estado.toLowerCase().trim()
  return statusStepMap[key] ?? 0
}

function fmtDate(d?: string) {
  if (!d) return 'No disponible'
  try {
    return new Date(d).toLocaleString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return 'Fecha inválida'
  }
}

function fmtMoney(n?: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
}

function ensureHex(color?: string) {
  if (!color) return undefined
  return color.startsWith('#') ? color : `#${color}`
}

// 🔄 Normaliza el payload del backend a nuestro modelo (tolerante a distintas keys)
function normalizeTrackingPayload(input: any): OrderTracking {
  if (!input) throw new Error('Payload vacío')

  // Fechas (acepta camel/snake y fallback a created_at / updated_at)
  const fechas = {
    recepcion: input.fechas?.recepcion ?? input.fecha_recepcion ?? input.fechaRecepcion ?? input.fechaCreacion ?? input.fecha_creacion,
    fecha_entrega_estimada: input.fecha_entrega_estimada ,
    fecha_entrega_real: input.fecha_entrega_real,
    creacion: input.fechaCreacion ?? input.fecha_creacion ?? input.created_at,
    actualizacion: input.updated_at ?? input.fecha_actualizacion,
  }

  // Historial (convierte a {estado_nombre, fecha_cambio, ...})
  const historial: OrderHistory[] | undefined = (input.historial || input.estados || []).map((h: any, idx: number) => ({
    historial_id: h.historial_id ?? h.id ?? idx,
    estado_nombre: h.estado_nombre ?? h.estado ?? h.nombre ?? '',
    estado_color: (h.estado_color ?? h.color ?? '78f3d3').replace('#',''),
    fecha_cambio: h.fecha_cambio ?? h.fecha ?? h.created_at ?? '',
    empleado_nombre: h.empleado_nombre ?? h.empleado ?? '',
    comentario: h.comentario ?? h.descripcion ?? '',
  }))

  // Servicios
  const servicios: OrderService[] | undefined = (input.servicios || []).map((s: any) => ({
    cantidad: Number(s.cantidad ?? 1),
    servicio_nombre: s.servicio_nombre ?? s.nombre ?? '',
    servicio_descripcion: s.servicio_descripcion ?? s.descripcion ?? '',
    marca_calzado: s.marca_calzado ,
    modelo_calzado: s.modelo_calzado ?? s.modelo ?? '',
    descripcion_calzado: s.descripcion_calzado ?? s.descripcionCalzado ?? '',
    precio_unitario: Number(s.precio_unitario ?? s.precio ?? 0),
    subtotal: Number(s.subtotal ?? 0),
    caja_almacenamiento: s.caja_almacenamiento ?? s.caja ?? '',
    codigo_ubicacion: s.codigo_ubicacion ?? s.ubicacion ?? '',
  }))

  // Productos
  const productos: OrderProduct[] | undefined = (input.productos || []).map((p: any) => ({
    producto_nombre: p.producto_nombre ?? p.nombre ?? '',
    producto_descripcion: p.producto_descripcion ?? p.descripcion ?? '',
    categoria_producto: p.categoria_producto ?? p.categoria ?? '',
    cantidad: Number(p.cantidad ?? 1),
    precio_unitario: Number(p.precio_unitario ?? p.precio ?? 0),
    descuento: Number(p.descuento ?? 0),
    subtotal: Number(p.subtotal ?? 0),
  }))

  // Dirección (acepta objeto directo o arreglo y arma completa)
  let direccion: OrderAddress | null = null
  const dir = input.direccion
  if (Array.isArray(dir) && dir.length) {
    const d = dir[0]
    direccion = {
      completa: d.completa ?? d.direccion_completa ?? undefined,
      calle: d.calle,
      numeroExterior: d.numeroExterior ?? d.numero_exterior,
      colonia: d.colonia,
      ciudad: d.ciudad,
      codigoPostal: d.codigoPostal ?? d.codigo_postal,
      instrucciones: d.instrucciones ?? d.instrucciones_entrega,
    }
  } else if (dir && typeof dir === 'object') {
    direccion = {
      completa: dir.completa ?? dir.direccion_completa,
      calle: dir.calle,
      numeroExterior: dir.numeroExterior ?? dir.numero_exterior,
      colonia: dir.colonia,
      ciudad: dir.ciudad,
      codigoPostal: dir.codigoPostal ?? dir.codigo_postal,
      instrucciones: dir.instrucciones ?? dir.instrucciones_entrega,
    }
  }

  // Totales
  const totales = input.totales ? {
    subtotal: Number(input.totales.subtotal ?? 0),
    impuestos: Number(input.totales.impuestos ?? 0),
    total: Number(input.totales.total ?? 0),
  } : {
    subtotal: Number(input.subtotal ?? 0),
    impuestos: Number(input.impuestos ?? 0),
    total: Number(input.total ?? 0),
  }

  const estadoActual = input.estadoActual ? {
    nombre: input.estadoActual.nombre,
    descripcion: input.estadoActual.descripcion,
    color: ensureHex(input.estadoActual.color),
  } : {
    nombre: input.estado_nombre ?? 'Pendiente',
    descripcion: input.estado_descripcion ?? 'Estado no disponible',
    color: ensureHex(input.estado_color ?? '78f3d3'),
  }

  return {
    codigo: input.codigo ?? input.codigo_orden ?? input.codigo_reservacion ?? input.booking_reference ?? '',
    tipo: input.tipo,
    reservacionOriginal: input.reservacionOriginal ?? input.codigo_reservacion,
    cliente: {
      nombre: input.cliente?.nombre ?? input.cliente_nombre ?? input.client_name ?? input.full_name ?? '',
      apellidos: input.cliente?.apellidos ?? input.cliente_apellidos ?? input.client_lastname ?? '',
      telefono: input.cliente?.telefono ?? input.cliente_telefono ?? input.client_phone ?? '',
      email: input.cliente?.email ?? input.cliente_email ?? input.client_email ?? '',
    },
    fechas,
    estadoActual,
    servicios,
    productos,
    historial,
    totales,
    pago: input.pago ?? { estado: input.estado_pago, metodo: input.metodo_pago },
    direccion: direccion ?? (input.direccion_completa ? {
      completa: input.direccion_completa,
      calle: input.calle,
      numeroExterior: input.numero_exterior,
      colonia: input.colonia,
      ciudad: input.ciudad,
      codigoPostal: input.codigo_postal,
      instrucciones: input.instrucciones_entrega,
    } : null),
    meta: {
      origen: input.origen ?? input.metodo_creacion,
      sla: input.sla ?? input.estatus_tiempo,
    },
    notas: input.notas ?? input.notes,
  }
}

// ===================== Página principal =====================
const TrackingPage: React.FC = () => {
  const [code, setCode] = useState('')
  const [data, setData] = useState<OrderTracking | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const currentStep = useMemo(() => getStep(data?.estadoActual?.nombre), [data])

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setStatus('error')
      setMessage('Por favor ingresa un código de orden')
      setData(null)
      return
    }
    setStatus('loading')
    setMessage('Buscando tu orden...')
    setData(null)

    try {
      const url = `${API_PATH}/${encodeURIComponent(code.trim())}`
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'No se encontró la orden')
      const payload = json?.data || json
      const normalized = normalizeTrackingPayload(payload)
      setData(normalized)
      setStatus('ok')
      setMessage('Orden encontrada')
    } catch (err: any) {
      setStatus('error')
      setMessage(err?.message || 'Ocurrió un error al buscar')
      setData(null)
    }
  }

  const reset = () => {
    setCode('')
    setData(null)
    setStatus('idle')
    setMessage('')
  }

  return (
    <div className="min-h-screen md:min-h-[100dvh] flex flex-col bg-gradient-to-b from-[#f6fffd] via-white to-[#effff9]">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-8">
        {status === 'idle' && !data && (
          <Hero onSubmit={search} code={code} setCode={setCode} />
        )}

        {(data || status === 'error') && (
          <CompactSearch
            onSubmit={search}
            onReset={reset}
            code={code}
            setCode={setCode}
            status={status}
            message={message}
          />
        )}

        {data && (
          <Results data={data} currentStep={currentStep} />
        )}

        {!data && status === 'error' && <ErrorState message={message} />}
        {!data && status === 'idle' && <EmptyHints />}
      </main>
      <Footer />
    </div>
  )
}

export default TrackingPage

// ===================== Subcomponentes =====================
const Hero: React.FC<{
  code: string
  setCode: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}> = ({ code, setCode, onSubmit }) => (
  <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#78f3d3] bg-opacity-20 rounded-full mb-6">
            <Search size={40} className="text-[#313D52]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0f172a] tracking-tight mb-4">
            Rastrear mi <span className="text-[#0f766e]">Orden</span>
          </h1>
          <p className="text-lg md:text-xl text-[#475569] max-w-2xl">
            Ingresa tu código para conocer el estado de tu orden en tiempo real.
          </p>
          <form onSubmit={onSubmit} className="mt-8 max-w-2xl">
            <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 p-4 md:p-6">
              <label htmlFor="orderCode" className="block text-sm font-medium text-[#0f172a] mb-2">Código de orden</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={20} className="text-[#64748b]" />
                </div>
                <input
                  id="orderCode"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej. ORD789012 o 000123"
                  className="w-full pl-12 pr-4 py-4 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 text-lg"
                />
              </div>
              <button type="submit" className="mt-4 w-full py-3 bg-[#78f3d3] text-[#0f172a] font-semibold rounded-xl hover:bg-[#4de0c0] transition-all flex items-center justify-center">
                <Search size={20} className="mr-2" /> Buscar
              </button>
            </div>
          </form>
        </div>
        <div className="lg:col-span-5 hidden lg:block">
          <div className="relative h-[360px]">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#a7f3d0] via-[#99f6e4] to-[#f0fdfa] blur-2xl opacity-60" />
            <div className="relative h-full w-full rounded-3xl bg-white/60 ring-1 ring-black/5 backdrop-blur-md" />
          </div>
        </div>
      </div>
    </div>
  </section>
)

const CompactSearch: React.FC<{
  code: string
  setCode: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onReset: () => void
  status: 'idle' | 'loading' | 'ok' | 'error'
  message: string
}> = ({ code, setCode, onSubmit, onReset, status, message }) => (
  <div className="bg-white/80 backdrop-blur-sm border-b border-[#e2e8f0] sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <form onSubmit={onSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-[#64748b]" />
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Buscar otra orden..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6] bg-white/90"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-4 py-2 bg-[#78f3d3] text-[#0f172a] rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-70 flex items-center text-sm"
            >
              {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </form>
        </div>
        <button onClick={onReset} className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-lg" title="Nueva búsqueda">↺</button>
        {status !== 'idle' && (
          <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-[#475569]'} truncate max-w-[40%]`}>{message}</p>
        )}
      </div>
    </div>
  </div>
)

const Results: React.FC<{ data: OrderTracking; currentStep: number }> = ({ data, currentStep }) => (
  <section className="py-6 sm:py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Encabezado ancho completo */}
      <Header data={data} />

      {/* Grid responsive: 2 columnas principales en XL */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Columna izquierda (más ancha) */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <Progress data={data} currentStep={currentStep} />
          </Card>

          {Boolean((data.servicios || []).length) && (
            <Card>
              <Services data={data} />
            </Card>
          )}

          {Boolean((data.productos || []).length) && (
            <Card>
              <Products data={data} />
            </Card>
          )}

        </div>

        {/* Columna derecha (detalles) */}
        <div className="xl:col-span-1 space-y-6 ]">
          <Card>
            <Client data={data} />
          </Card>
          <Card>
            <Dates data={data} />
          </Card>
          {data.pago && (
            <Card>
              <Payment data={data} />
            </Card>
          )}
          {data.direccion && (
            <Card>
              <Address data={data} />
            </Card>
          )}
          {data.totales && (
            <Card>
              <Totals data={data} />
            </Card>
          )}
          {(data.tipo || data.reservacionOriginal || data.meta?.origen || data.meta?.sla) && (
            <Card>
              <Meta data={data} />
            </Card>
          )}
          {data.notas && (
            <Card>
              <Notes notas={data.notas} />
            </Card>
          )}
        </div>
      </div>
    </div>
  </section>
)

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-4">{children}</div>
)

const Header: React.FC<{ data: OrderTracking }> = ({ data }) => (
  <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] text-white p-6 md:p-8 ring-1 ring-black/5">
    <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#78f3d3]/20" />
    <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-[#14b8a6]/10" />
    <div className="relative flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Orden de Servicio</h2>
          {data.fechas?.recepcion && (
            <p className="text-[#78f3d3] mt-1">Recepción: {fmtDate(data.fechas.recepcion)}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {data.tipo && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/10">
              <Info size={14} className="mr-1" /> {data.tipo === 'orden' ? 'Orden' : 'Reservación'}
            </span>
          )}
          {data.pago?.estado && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/10">
              <CreditCard size={14} className="mr-1" /> {data.pago.estado}
            </span>
          )}
          {typeof data.servicios?.length === 'number' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/10">
              <Package size={14} className="mr-1" /> {data.servicios?.length} serv.
            </span>
          )}
          {typeof data.productos?.length === 'number' && data.productos!.length > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/10">
              <ShoppingCart size={14} className="mr-1" /> {data.productos?.length} prod.
            </span>
          )}
          <span className="inline-block px-4 py-2 bg-[#78f3d3] text-[#0f172a] rounded-full font-bold text-lg tracking-wider">{data.codigo}</span>
        </div>
      </div>
      {data.meta?.sla && (
        <div className="text-sm text-[#cbd5e1]">SLA: <span className="text-white font-medium">{data.meta.sla}</span></div>
      )}
    </div>
  </div>
)

const Client: React.FC<{ data: OrderTracking }> = ({ data }) => (
  <div>
    <div className="flex items-center mb-4">
      <User size={20} className="text-[#14b8a6] mr-3" />
      <h3 className="text-lg font-semibold text-[#0f172a]">Cliente</h3>
    </div>
    <div className="grid grid-cols-1 gap-3 text-sm">
      <div>
        <p className="text-[#64748b]">Nombre</p>
        <p className="text-[#0f172a] font-medium">{data.cliente.nombre} {data.cliente.apellidos}</p>
      </div>
      <div className="space-y-1">
        {data.cliente.email && (
          <p className="flex items-center break-all"><Mail size={14} className="mr-2 text-[#64748b]" />{data.cliente.email}</p>
        )}
        {data.cliente.telefono && (
          <p className="flex items-center"><Phone size={14} className="mr-2 text-[#64748b]" />{data.cliente.telefono}</p>
        )}
      </div>
    </div>
  </div>
)

const Dates: React.FC<{ data: OrderTracking }> = ({ data }) => (
  <div>
    <div className="flex items-center mb-3">
      <Calendar size={18} className="text-[#14b8a6] mr-2" />
      <h4 className="font-semibold text-[#0f172a]">Fechas</h4>
    </div>
    <div className="grid grid-cols-1 gap-2 text-sm">
      <div><span className="text-[#64748b]">Recepción:</span> <span className="font-medium text-[#0f172a]">{fmtDate(data.fechas?.recepcion)}</span></div>
      
      <div><span className="text-[#64748b]">Entrega estimada:</span> <span className="font-medium text-[#0f172a]">{fmtDate(data.fechas?.fecha_entrega_estimada)}</span></div>
      <div><span className="text-[#64748b]">Entrega real:</span> <span className="font-medium text-[#0f172a]">{fmtDate(data.fechas?.fecha_entrega_real)}</span></div>
      
    </div>
  </div>
)

const Services: React.FC<{ data: OrderTracking }> = ({ data }) => {
  const list = data.servicios || []
  if (!list.length) return null
  return (
    <div>
      <div className="flex items-center mb-4">
        <Package size={20} className="text-[#14b8a6] mr-3" />
        <h3 className="text-lg font-semibold text-[#0f172a]">Servicios</h3>
      </div>
      <div className="space-y-3">
        {list.map((s, i) => (
          <div key={i} className="rounded-xl p-4 border border-[#e2e8f0] bg-[#f8fafc]">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-[#0f172a] truncate">{s.servicio_nombre}</h5>
                {s.servicio_descripcion && <p className="text-sm text-[#64748b]">{s.servicio_descripcion}</p>}
                <p className="text-sm text-[#64748b] mt-1">
                  <span className="font-medium">Calzado:</span> {s.marca_calzado} {s.modelo_calzado} {s.descripcion_calzado && `- ${s.descripcion_calzado}`}
                </p>
                
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="font-semibold text-[#0f172a]">{fmtMoney(s.subtotal)}</p>
                <p className="text-xs text-[#64748b]">{s.cantidad} x {fmtMoney(s.precio_unitario)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const Products: React.FC<{ data: OrderTracking }> = ({ data }) => {
  const list = data.productos || []
  if (!list.length) return null
  return (
    <div>
      <div className="flex items-center mb-4">
        <ShoppingCart size={20} className="text-[#14b8a6] mr-3" />
        <h3 className="text-lg font-semibold text-[#0f172a]">Productos</h3>
      </div>
      <div className="space-y-3">
        {list.map((p, i) => (
          <div key={i} className="rounded-xl p-4 border border-[#e2e8f0] bg-[#ffffff]">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-[#0f172a] truncate">{p.producto_nombre}</h5>
                <p className="text-xs text-[#64748b]">{p.categoria_producto}</p>
                {p.producto_descripcion && <p className="text-sm text-[#64748b] mt-1">{p.producto_descripcion}</p>}
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="font-semibold text-[#0f172a]">{fmtMoney(p.subtotal)}</p>
                <p className="text-xs text-[#64748b]">{p.cantidad} x {fmtMoney(p.precio_unitario)}</p>
                {p.descuento ? <p className="text-xs text-[#64748b]">Desc: {fmtMoney(p.descuento)}</p> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const Totals: React.FC<{ data: OrderTracking }> = ({ data }) => {
  const t = data.totales
  if (!t) return null
  return (
    <div>
      <div className="bg-[#f8fafc] rounded-xl p-4">
        <div className="flex justify-between text-sm mb-1"><span className="text-[#64748b]">Subtotal</span><span className="text-[#0f172a]">{fmtMoney(t.subtotal)}</span></div>
        <div className="flex justify-between text-sm mb-2"><span className="text-[#64748b]">Impuestos</span><span className="text-[#0f172a]">{fmtMoney(t.impuestos)}</span></div>
        <div className="flex justify-between items-center"><span className="font-semibold text-[#0f172a]">Total</span><span className="text-2xl font-bold text-[#0f172a]">{fmtMoney(t.total)}</span></div>
      </div>
    </div>
  )
}

const payBadgeClasses = (estado?: string) => {
  const st = (estado || '').toLowerCase()
  if (['pagado','paid','completado','completada'].includes(st)) return 'bg-green-50 text-green-700 ring-green-200'
  if (['pendiente','pending'].includes(st)) return 'bg-yellow-50 text-yellow-700 ring-yellow-200'
  if (['fallido','failed','cancelado','cancelada'].includes(st)) return 'bg-red-50 text-red-700 ring-red-200'
  return 'bg-slate-50 text-slate-700 ring-slate-200'
}

const Payment: React.FC<{ data: OrderTracking }> = ({ data }) => (
  <div>
    <div className="flex items-center mb-3">
      <CreditCard size={18} className="text-[#14b8a6] mr-2" />
      <h4 className="font-semibold text-[#0f172a]">Pago</h4>
    </div>
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ring ${payBadgeClasses(data.pago?.estado)}`}>
      {data.pago?.estado || 'Desconocido'} {data.pago?.metodo ? `· ${data.pago.metodo}` : ''}
    </div>
  </div>
)

const Address: React.FC<{ data: OrderTracking }> = ({ data }) => {
  const d = data.direccion
  if (!d) return null
  return (
    <div>
      <div className="flex items-center mb-3">
        <MapPin size={18} className="text-[#14b8a6] mr-2" />
        <h4 className="font-semibold text-[#0f172a]">Dirección</h4>
      </div>
      {d.completa ? (
        <p className="text-sm text-[#0f172a] whitespace-pre-wrap">{d.completa}</p>
      ) : (
        <div className="text-sm text-[#0f172a] space-y-0.5">
          <p>{[d.calle, d.numeroExterior].filter(Boolean).join(' ')}</p>
          <p>{[d.colonia, d.ciudad].filter(Boolean).join(', ')}</p>
          <p>{d.codigoPostal}</p>
        </div>
      )}
      {d.instrucciones && (
        <p className="text-xs text-[#64748b] mt-2">Instrucciones: {d.instrucciones}</p>
      )}
    </div>
  )
}

const Meta: React.FC<{ data: OrderTracking }> = ({ data }) => (
  <div className="text-sm">
    <div className="flex items-center mb-3">
      <Info size={18} className="text-[#14b8a6] mr-2" />
      <h4 className="font-semibold text-[#0f172a]">Información adicional</h4>
    </div>
    <div className="grid grid-cols-1 gap-2">
      {data.tipo && <p><span className="text-[#64748b]">Tipo:</span> <span className="text-[#0f172a] font-medium">{data.tipo === 'orden' ? 'Orden' : 'Reservación'}</span></p>}
      {data.reservacionOriginal && <p><span className="text-[#64748b]">Reservación original:</span> <span className="text-[#0f172a] font-medium">{data.reservacionOriginal}</span></p>}
      {data.meta?.origen && <p><span className="text-[#64748b]">Origen:</span> <span className="text-[#0f172a] font-medium">{data.meta.origen}</span></p>}
      {data.meta?.sla && <p><span className="text-[#64748b]">SLA:</span> <span className="text-[#0f172a] font-medium">{data.meta.sla}</span></p>}
    </div>
  </div>
)

const Progress: React.FC<{ data: OrderTracking; currentStep: number }> = ({ data, currentStep }) => (
  <div>
    <h3 className="text-xl font-bold text-[#0f172a] mb-6">Estado del Servicio</h3>
    <div className="relative mb-10">
      <div className="absolute top-6 left-0 right-0 h-2 bg-[#e2e8f0] rounded-full" />
      <div
        className="absolute top-6 left-0 h-2 bg-gradient-to-r from-[#78f3d3] to-[#4de0c0] rounded-full transition-[width] duration-500"
        style={{ width: `${(currentStep / 4) * 100}%` }}
      />
      <div className="flex justify-between">
        {[0,1,2,3,4].map((step) => {
          const isActive = step <= currentStep
          const isCurrent = step === currentStep
          return (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all ${isCurrent ? 'bg-[#78f3d3] text-[#0f172a] ring-4 ring-[#d1fae5] shadow-xl scale-110' : isActive ? 'bg-[#78f3d3] text-[#0f172a]' : 'bg-[#e2e8f0] text-[#64748b]'}`}>
                {step === 0 && <Clock size={20} />}
                {step === 1 && <Package size={20} />}
                {step === 2 && <Truck size={20} />}
                {step === 3 && <CheckCircle size={20} />}
                {step === 4 && <Phone size={20} />}
              </div>
              <p className={`text-sm font-medium mt-3 ${isCurrent ? 'text-[#0f766e]' : isActive ? 'text-[#0f172a]' : 'text-[#64748b]'}`}>{stepLabels[step]}</p>
            </div>
          )
        })}
      </div>
    </div>

    <div className="bg-[#f0fdf4] p-4 rounded-xl border border-[#dcfce7]">
      <div className="flex items-start">
        <Calendar size={20} className="text-[#14b8a6] mr-3 mt-0.5" />
        <div>
          <h4 className="text-lg font-bold text-[#0f172a] mb-1">Estado actual: {data.estadoActual?.nombre || stepLabels[currentStep]}</h4>
          <p className="text-[#64748b]">{data.estadoActual?.descripcion || stepDescriptions[currentStep]}</p>
        </div>
      </div>
    </div>
  </div>
)

const History: React.FC<{ data: OrderTracking }> = ({ data }) => {
  const items = data.historial || []
  if (!items.length) return null
  return (
    <div>
      <h4 className="font-semibold text-[#0f172a] mb-4 flex items-center"><Clock size={18} className="mr-2 text-[#14b8a6]" />Historial</h4>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#e2e8f0]" />
        <div className="space-y-4">
          {items.map((it, idx) => (
            <div key={it.historial_id ?? idx} className="relative flex items-start ml-8">
              <div className="absolute -left-8 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white" style={{ borderColor: ensureHex(it.estado_color || '78f3d3') }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ensureHex(it.estado_color || '78f3d3') }} />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-[#0f172a]">{it.estado_nombre}</h5>
                <p className="text-sm text-[#64748b]">{fmtDate(it.fecha_cambio)}</p>
                {it.empleado_nombre && <p className="text-sm text-[#64748b]">Por: {it.empleado_nombre}</p>}
                {it.comentario && <p className="text-sm italic text-[#475569] bg-[#f8fafc] p-2 rounded mt-2">"{it.comentario}"</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const Notes: React.FC<{ notas: string }> = ({ notas }) => (
  <div>
    <div className="flex items-center mb-3"><FileText size={18} className="text-[#14b8a6] mr-2" /><h3 className="text-lg font-semibold text-[#0f172a]">Notas</h3></div>
    <div className="bg-[#f8fafc] p-4 rounded-xl"><p className="text-[#0f172a] whitespace-pre-wrap">{notas}</p></div>
  </div>
)

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <section className="py-10 px-4 sm:px-6 lg:px-8">
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center ring-1 ring-black/5">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <AlertCircle size={32} className="text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-[#0f172a] mb-2">No se encontró la orden</h3>
        <p className="text-[#475569] mb-6">{message}</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
          <h4 className="font-medium text-red-800 mb-2">Consejos:</h4>
          <ul className="text-sm text-red-700 space-y-1 list-disc pl-5">
            <li>Verifica que el código esté escrito correctamente</li>
            <li>Si tu código llevaba prefijo (p.ej. ORD), inclúyelo</li>
            <li>Revisa el correo de confirmación</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
)

const EmptyHints: React.FC = () => (
  <section className="py-16 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-black/5">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#78f3d3] bg-opacity-20 rounded-full mb-3">
          <Package size={22} className="text-[#0f172a]" />
        </div>
        <h3 className="font-semibold text-[#0f172a] mb-1">Órdenes</h3>
        <p className="text-sm text-[#475569]">Tu código puede lucir como <code className="bg-[#f1f5f9] px-1.5 py-0.5 rounded text-[#0f172a] font-mono">ORD123456</code> o un folio numérico.</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-black/5">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#78f3d3] bg-opacity-20 rounded-full mb-3">
          <Clock size={22} className="text-[#0f172a]" />
        </div>
        <h3 className="font-semibold text-[#0f172a] mb-1">Actualizaciones</h3>
        <p className="text-sm text-[#475569]">Verás el progreso, historial y totales de tu orden aquí mismo.</p>
      </div>
    </div>
  </section>
)