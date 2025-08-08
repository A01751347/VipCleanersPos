'use client'
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  Loader2,
  Package,
  CreditCard,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ClientDetail {
  cliente_id: number;
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  direccion?: string;
  codigo_postal?: string;
  ciudad?: string;
  estado?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_nacimiento?: string;
  puntos_fidelidad: number;
  total_ordenes: number;
  total_gastado: number;
  ultimas_ordenes?: Order[];
}

interface Order {
  orden_id: number;
  codigo_orden: string;
  fecha_recepcion: string;
  total: number;
  estado_nombre: string;
  estado_color: string;
  estado_pago: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClientDetails = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/admin/clients?id=${clientId}`);

      if (!response.ok) {
        throw new Error('Error al cargar los detalles del cliente');
      }

      const data = await response.json();
      setClient(data.client);
      setError(null);
    } catch (err) {
      console.error('Error fetching client details:', err);
      setError('Error al cargar los detalles del cliente. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClientDetails();
  }, [clientId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'parcial':
        return 'bg-blue-100 text-blue-800';
      case 'pagado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>{error || 'Cliente no encontrado'}</p>
        <Link
          href="/admin/clients"
          className="mt-4 inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver a clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center mb-2">
            <Link href="/admin/clients" className="mr-2 text-[#6c7a89] hover:text-[#313D52] transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold text-[#313D52]">
              {client.nombre} {client.apellidos}
            </h1>
          </div>
          <p className="text-sm text-[#6c7a89]">
            Cliente desde {formatDate(client.fecha_creacion)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/clients/${client.cliente_id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
          >
            <Edit size={16} className="mr-2" />
            Editar Cliente
          </Link>

          <Link
            href="/admin/pos"
            className="inline-flex items-center px-4 py-2 bg-[#313D52] text-white rounded-lg hover:bg-[#3e4a61] transition-colors"
          >
            <ShoppingBag size={16} className="mr-2" />
            Nueva Orden
          </Link>
        </div>
      </div>

      {/* Información principal en grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Información personal */}
        <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
          <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
            <h2 className="font-medium text-[#313D52] flex items-center">
              <User size={18} className="mr-2 text-[#6c7a89]" />
              Información Personal
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs text-[#6c7a89]">Nombre completo</label>
              <p className="text-[#313D52] font-medium">
                {client.nombre} {client.apellidos}
              </p>
            </div>

            <div>
              <label className="text-xs text-[#6c7a89]">Teléfono</label>
              <p className="text-[#313D52] flex items-center">
                <Phone size={14} className="mr-1 text-[#6c7a89]" />
                {client.telefono}
              </p>
            </div>

            <div>
              <label className="text-xs text-[#6c7a89]">Email</label>
              <p className="text-[#313D52] flex items-center">
                <Mail size={14} className="mr-1 text-[#6c7a89]" />
                {client.email || 'No registrado'}
              </p>
            </div>

            <div>
              <label className="text-xs text-[#6c7a89]">Dirección</label>
              {client.direccion ? (
                <div className="text-[#313D52] flex items-start">
                  <MapPin size={14} className="mr-1 mt-0.5 text-[#6c7a89] flex-shrink-0" />
                  <div>
                    <p>{client.direccion}</p>
                    <p className="text-sm">
                      {client.ciudad && `${client.ciudad}, `}
                      {client.estado && `${client.estado} `}
                      {client.codigo_postal}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[#6c7a89]">No registrada</p>
              )}
            </div>

            {client.fecha_nacimiento && (
              <div>
                <label className="text-xs text-[#6c7a89]">Fecha de nacimiento</label>
                <p className="text-[#313D52] flex items-center">
                  <Calendar size={14} className="mr-1 text-[#6c7a89]" />
                  {formatDate(client.fecha_nacimiento)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
          <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
            <h2 className="font-medium text-[#313D52] flex items-center">
              <TrendingUp size={18} className="mr-2 text-[#6c7a89]" />
              Estadísticas
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#313D52]">
                {client.total_ordenes}
              </div>
              <p className="text-sm text-[#6c7a89]">Órdenes totales</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-[#313D52]">
                {formatCurrency(client.total_gastado)}
              </div>
              <p className="text-sm text-[#6c7a89]">Total gastado</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-[#313D52]">
                {formatCurrency(client.total_ordenes > 0 ? client.total_gastado / client.total_ordenes : 0)}
              </div>
              <p className="text-sm text-[#6c7a89]">Ticket promedio</p>
            </div>
          </div>
        </div>

        {/* Programa de fidelidad */}
        <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
          <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
            <h2 className="font-medium text-[#313D52] flex items-center">
              <Award size={18} className="mr-2 text-[#6c7a89]" />
              Programa de Fidelidad
            </h2>
          </div>
          <div className="p-4">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-[#78f3d3]">
                {client.puntos_fidelidad}
              </div>
              <p className="text-sm text-[#6c7a89]">Puntos acumulados</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#6c7a89]">Nivel actual:</span>
                <span className="font-medium text-[#313D52]">
                  {client.puntos_fidelidad < 100 ? 'Bronce' :
                   client.puntos_fidelidad < 500 ? 'Plata' :
                   client.puntos_fidelidad < 1000 ? 'Oro' : 'Platino'}
                </span>
              </div>

              <div className="w-full bg-[#f5f9f8] rounded-full h-2">
                <div
                  className="bg-[#78f3d3] h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((client.puntos_fidelidad % 100), 100)}%`
                  }}
                />
              </div>

              <p className="text-xs text-[#6c7a89] text-center">
                {100 - (client.puntos_fidelidad % 100)} puntos para el siguiente nivel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Últimas órdenes */}
      <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
        <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5] flex justify-between items-center">
          <h2 className="font-medium text-[#313D52] flex items-center">
            <Package size={18} className="mr-2 text-[#6c7a89]" />
            Últimas Órdenes
          </h2>
          <Link
            href={`/admin/orders?clientId=${client.cliente_id}`}
            className="text-sm text-[#78f3d3] hover:underline"
          >
            Ver todas
          </Link>
        </div>

        <div className="overflow-x-auto">
          {client.ultimas_ordenes && client.ultimas_ordenes.length > 0 ? (
            <table className="min-w-full divide-y divide-[#e0e6e5]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Pago
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e6e5]">
                {client.ultimas_ordenes.map((order) => (
                  <tr key={order.orden_id} className="hover:bg-[#f5f9f8]">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52]">
                      {order.codigo_orden}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[#6c7a89]">
                      {formatDate(order.fecha_recepcion)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#313D52]">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                        style={{
                          backgroundColor: `#${order.estado_color}20`,
                          color: `#${order.estado_color}`
                        }}
                      >
                        {order.estado_nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.estado_pago)}`}>
                        <CreditCard size={12} className="mr-1" />
                        {order.estado_pago}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/orders/${order.orden_id}`}
                        className="text-[#78f3d3] hover:text-[#4de0c0]"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-[#6c7a89]">
              <Package size={48} className="mx-auto mb-4 text-[#e0e6e5]" />
              <p>No hay órdenes registradas para este cliente</p>
              <Link
                href="/admin/pos"
                className="inline-flex items-center px-4 py-2 mt-4 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
              >
                <ShoppingBag size={16} className="mr-2" />
                Crear primera orden
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}