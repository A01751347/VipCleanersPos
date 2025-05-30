'use client'
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Loader2,
  UserPlus,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Edit,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface Client {
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
  total_ordenes?: number;
  total_gastado?: number;
  puntos_fidelidad?: number;
}

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = async (
    page: number = currentPage,
    search: string = searchQuery
  ) => {
    try {
      setIsRefreshing(true);

      let url = `/api/admin/clients?page=${page}&pageSize=${itemsPerPage}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar los clientes');
      }

      const data = await response.json();

      setClients(data.clients || []);
      setTotalClients(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Error al cargar los clientes. Intente nuevamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadClients(1, searchQuery);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      loadClients(newPage, searchQuery);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      loadClients(newPage, searchQuery);
    }
  };

  const handleRefresh = () => {
    loadClients(currentPage, searchQuery);
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/admin/clients/export?search=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Cabecera y acciones */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#313D52]">Gestión de Clientes</h1>
          <p className="text-sm text-[#6c7a89]">Administra la información de tus clientes</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/clients/new"
            className="inline-flex items-center px-4 py-2 bg-[#313D52] text-white rounded-lg hover:bg-[#3e4a61] transition-colors"
          >
            <UserPlus size={16} className="mr-2" />
            Nuevo Cliente
          </Link>

          <button
            onClick={handleExportData}
            className="inline-flex items-center px-4 py-2 bg-[#f5f9f8] text-[#313D52] rounded-lg border border-[#e0e6e5] hover:bg-[#e0e6e5] transition-colors"
          >
            <Download size={16} className="mr-2" />
            Exportar
          </button>

          <button
            className="inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Actualizar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
        <form onSubmit={handleSearch} className="flex items-center relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-[#6c7a89]" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full py-2 pl-10 pr-4 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm"
          />
        </form>
      </div>

      {/* Lista de clientes */}
      <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">
            <p>{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto text-[#e0e6e5] mb-4" />
            <p className="text-[#6c7a89] font-medium">No se encontraron clientes</p>
            <p className="text-sm text-[#6c7a89]">Intenta con otros filtros o crea un nuevo cliente</p>
            <Link
              href="/admin/clients/new"
              className="inline-flex items-center px-4 py-2 mt-4 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
            >
              <UserPlus size={16} className="mr-2" />
              Nuevo Cliente
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e0e6e5]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Órdenes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Total Gastado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Miembro desde
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e0e6e5]">
                {clients.map((client) => (
                    console.log("client",client),
                  <tr key={client.cliente_id} className="hover:bg-[#f5f9f8]">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-[#f5f9f8] rounded-full flex items-center justify-center">
                          <span className="text-[#313D52] font-medium">
                            {client.nombre.charAt(0)}{client.apellidos?.charAt(0) || ''}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-[#313D52]">
                            {client.nombre} {client.apellidos}
                          </div>
                          <div className="text-xs text-[#6c7a89]">
                            ID: {client.cliente_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-[#313D52] flex items-center">
                        <Phone size={14} className="mr-1 text-[#6c7a89]" />
                        {client.telefono}
                      </div>
                      <div className="text-sm text-[#313D52] flex items-center">
                        <Mail size={14} className="mr-1 text-[#6c7a89]" />
                        {client.email || 'No registrado'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-[#313D52]">
                        {client.direccion ? (
                          <div className="flex items-start">
                            <MapPin size={14} className="mr-1 mt-0.5 text-[#6c7a89] flex-shrink-0" />
                            <div>
                              <div>{client.direccion}</div>
                              <div className="text-xs text-[#6c7a89]">
                                {client.ciudad && `${client.ciudad}, `}
                                {client.estado && `${client.estado} `}
                                {client.codigo_postal}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#6c7a89]">No registrada</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-[#313D52]">
                        {client.total_ordenes || 0} órdenes
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#313D52]">
                        {formatCurrency(client.total_gastado || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-[#6c7a89] flex items-center">
                        <Calendar size={14} className="mr-1" />
                        {formatDate(client.fecha_creacion)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/admin/clients/${client.cliente_id}`}
                          className="text-[#78f3d3] hover:text-[#4de0c0]"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/admin/clients/${client.cliente_id}/edit`}
                          className="text-[#6c7a89] hover:text-[#313D52]"
                        >
                          <Edit size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!isLoading && !error && clients.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-[#e0e6e5]">
            <div className="text-sm text-[#6c7a89]">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalClients)}</span> de{' '}
              <span className="font-medium">{totalClients}</span> clientes
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${
                  currentPage === 1
                    ? 'text-[#e0e6e5] cursor-not-allowed'
                    : 'text-[#313D52] hover:bg-[#f5f9f8]'
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              <span className="text-sm text-[#313D52]">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${
                  currentPage === totalPages
                    ? 'text-[#e0e6e5] cursor-not-allowed'
                    : 'text-[#313D52] hover:bg-[#f5f9f8]'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}