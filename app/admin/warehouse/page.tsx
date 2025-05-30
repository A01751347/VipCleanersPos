'use client';
// app/admin/warehouse/page.tsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  RefreshCw,
  Box,
  BarChart3,
  FileText,
  Eye
} from 'lucide-react';

interface StorageItem {
  detalle_servicio_id: number;
  codigo_orden: string;
  cliente: string;
  telefono: string;
  servicio: string;
  marca: string;
  modelo: string;
  descripcion_calzado: string;
  caja_almacenamiento: string;
  codigo_ubicacion: string;
  notas_especiales: string;
  fecha_almacenamiento: string;
  estado_orden: string;
  color_estado: string;
}

interface StorageStatistics {
  totalAlmacenados: number;
  pendientesUbicacion: number;
  tiempoPromedioAlmacenamiento: number;
  cajasMasUtilizadas: Array<{
    caja_almacenamiento: string;
    total_pares: number;
  }>;
}

interface LocationMap {
  caja_almacenamiento: string;
  codigo_ubicacion: string;
  total_pares: number;
  total_ordenes: number;
  codigos_orden: string;
  fecha_mas_antigua: string;
  fecha_mas_reciente: string;
  dias_promedio_almacenados: number;
}

export default function WarehousePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StorageItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [statistics, setStatistics] = useState<StorageStatistics | null>(null);
  const [locationMap, setLocationMap] = useState<LocationMap[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'map' | 'pending' | 'stats'>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadStatistics();
    loadLocationMap();
    loadPendingItems();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/admin/storage-locations?action=stats');
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.estadisticas);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const loadLocationMap = async () => {
    try {
      const response = await fetch('/api/admin/storage-locations?action=map');
      const data = await response.json();
      
      if (data.success) {
        setLocationMap(data.mapa);
      }
    } catch (error) {
      console.error('Error cargando mapa:', error);
    }
  };

  const loadPendingItems = async () => {
    try {
      const response = await fetch('/api/admin/storage-locations?action=pending');
      const data = await response.json();
      
      if (data.success) {
        setPendingItems(data.servicios);
      }
    } catch (error) {
      console.error('Error cargando items pendientes:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setError('Por favor ingresa un término de búsqueda');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/storage-locations?action=search&q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.resultados);
        if (data.resultados.length === 0) {
          setError('No se encontraron resultados para la búsqueda');
        }
      } else {
        setError(data.error || 'Error en la búsqueda');
      }
    } catch (error) {
      console.error('Error buscando:', error);
      setError('Error al realizar la búsqueda');
    } finally {
      setIsSearching(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadStatistics(),
      loadLocationMap(),
      loadPendingItems()
    ]);
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'recibido': return 'bg-blue-100 text-blue-800';
      case 'en proceso': return 'bg-yellow-100 text-yellow-800';
      case 'lavando': return 'bg-green-100 text-green-800';
      case 'secando': return 'bg-purple-100 text-purple-800';
      case 'listo para entrega': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#313D52]">Gestión de Almacén</h1>
          <p className="text-[#6c7a89] mt-1">
            Control y ubicación de tenis en almacenamiento
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Estadísticas rápidas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0e6e5]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6c7a89] text-sm">Total Almacenados</p>
                <p className="text-2xl font-bold text-[#313D52]">{statistics.totalAlmacenados}</p>
              </div>
              <Box className="text-[#78f3d3]" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0e6e5]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6c7a89] text-sm">Pendientes Ubicación</p>
                <p className="text-2xl font-bold text-amber-600">{statistics.pendientesUbicacion}</p>
              </div>
              <AlertTriangle className="text-amber-500" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0e6e5]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6c7a89] text-sm">Tiempo Promedio</p>
                <p className="text-2xl font-bold text-[#313D52]">{statistics.tiempoPromedioAlmacenamiento}d</p>
              </div>
              <Clock className="text-[#78f3d3]" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0e6e5]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6c7a89] text-sm">Caja Más Usada</p>
                <p className="text-2xl font-bold text-[#313D52]">
                  {statistics.cajasMasUtilizadas[0]?.caja_almacenamiento || '-'}
                </p>
              </div>
              <Package className="text-[#78f3d3]" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e0e6e5] mb-6">
        <div className="flex border-b border-[#e0e6e5]">
          {[
            { id: 'search', label: 'Búsqueda', icon: Search },
            { id: 'map', label: 'Mapa de Ubicaciones', icon: MapPin },
            { id: 'pending', label: 'Pendientes', icon: AlertTriangle },
            { id: 'stats', label: 'Estadísticas', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#78f3d3] border-b-2 border-[#78f3d3]'
                    : 'text-[#6c7a89] hover:text-[#313D52]'
                }`}
              >
                <Icon size={18} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Tab: Búsqueda */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por caja, código, orden, marca, modelo..."
                    className="w-full px-4 py-3 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSearching ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    <Search size={20} />
                  )}
                </button>
              </form>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertTriangle size={20} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#313D52]">
                    Resultados de búsqueda ({searchResults.length})
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border border-[#e0e6e5] rounded-lg">
                      <thead className="bg-[#f5f9f8]">
                        <tr>
                          <th className="px-4 py-3 text-left text-[#313D52] font-medium">Orden</th>
                          <th className="px-4 py-3 text-left text-[#313D52] font-medium">Cliente</th>
                          <th className="px-4 py-3 text-left text-[#313D52] font-medium">Tenis</th>
                          <th className="px-4 py-3 text-left text-[#313D52] font-medium">Ubicación</th>
                          <th className="px-4 py-3 text-left text-[#313D52] font-medium">Estado</th>
                          <th className="px-4 py-3 text-left text-[#313D52] font-medium">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((item, index) => (
                          <tr key={index} className="border-t border-[#e0e6e5] hover:bg-[#f5f9f8]">
                            <td className="px-4 py-3">
                              <div className="font-medium text-[#313D52]">{item.codigo_orden}</div>
                              <div className="text-sm text-[#6c7a89]">{item.servicio}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-[#313D52]">{item.cliente}</div>
                              <div className="text-sm text-[#6c7a89]">{item.telefono}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-[#313D52]">
                                {item.marca} {item.modelo}
                              </div>
                              {item.descripcion_calzado && (
                                <div className="text-sm text-[#6c7a89] italic">
                                  {item.descripcion_calzado}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <MapPin size={16} className="text-[#78f3d3] mr-1" />
                                <span className="font-mono text-sm">
                                  {item.caja_almacenamiento} - {item.codigo_ubicacion}
                                </span>
                              </div>
                              {item.notas_especiales && (
                                <div className="text-xs text-[#6c7a89] mt-1">
                                  {item.notas_especiales}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.estado_orden)}`}>
                                {item.estado_orden}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#6c7a89]">
                              {formatDate(item.fecha_almacenamiento)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Mapa de Ubicaciones */}
          {activeTab === 'map' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#313D52]">
                  Mapa de Ubicaciones Ocupadas
                </h3>
                <span className="text-sm text-[#6c7a89]">
                  {locationMap.length} ubicaciones ocupadas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locationMap.map((location, index) => (
                  <div key={index} className="bg-[#f5f9f8] border border-[#e0e6e5] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Box size={20} className="text-[#78f3d3] mr-2" />
                        <span className="font-mono font-semibold text-[#313D52]">
                          {location.caja_almacenamiento}
                        </span>
                      </div>
                      <span className="bg-[#78f3d3] text-[#313D52] px-2 py-1 rounded-full text-xs font-medium">
                        {location.total_pares} par{location.total_pares !== 1 ? 'es' : ''}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <MapPin size={14} className="text-[#6c7a89] mr-2" />
                        <span className="font-mono">{location.codigo_ubicacion}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <FileText size={14} className="text-[#6c7a89] mr-2" />
                        <span>{location.total_ordenes} orden{location.total_ordenes !== 1 ? 'es' : ''}</span>
                      </div>

                      <div className="flex items-center">
                        <Clock size={14} className="text-[#6c7a89] mr-2" />
                        <span>{Math.round(location.dias_promedio_almacenados)} días promedio</span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#e0e6e5]">
                        <p className="text-xs text-[#6c7a89] truncate" title={location.codigos_orden}>
                          Órdenes: {location.codigos_orden}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {locationMap.length === 0 && (
                <div className="text-center py-12">
                  <Package size={48} className="text-[#e0e6e5] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#6c7a89] mb-2">
                    No hay ubicaciones ocupadas
                  </h3>
                  <p className="text-[#6c7a89]">
                    Cuando se asignen ubicaciones a los tenis, aparecerán aquí.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Pendientes */}
          {activeTab === 'pending' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#313D52]">
                  Servicios Pendientes de Ubicación
                </h3>
                <span className="text-sm text-[#6c7a89]">
                  {pendingItems.length} items pendientes
                </span>
              </div>

              {pendingItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border border-[#e0e6e5] rounded-lg">
                    <thead className="bg-[#f5f9f8]">
                      <tr>
                        <th className="px-4 py-3 text-left text-[#313D52] font-medium">Orden</th>
                        <th className="px-4 py-3 text-left text-[#313D52] font-medium">Cliente</th>
                        <th className="px-4 py-3 text-left text-[#313D52] font-medium">Servicio</th>
                        <th className="px-4 py-3 text-left text-[#313D52] font-medium">Tenis</th>
                        <th className="px-4 py-3 text-left text-[#313D52] font-medium">Estado</th>
                        <th className="px-4 py-3 text-left text-[#313D52] font-medium">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingItems.map((item, index) => (
                        <tr key={index} className="border-t border-[#e0e6e5] hover:bg-[#f5f9f8]">
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#313D52]">{item.codigo_orden}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[#313D52]">{item.cliente}</div>
                            <div className="text-sm text-[#6c7a89]">{item.telefono}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[#313D52]">{item.servicio_nombre}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[#313D52]">
                              {item.marca} {item.modelo}
                            </div>
                            {item.descripcion_calzado && (
                              <div className="text-sm text-[#6c7a89] italic">
                                {item.descripcion_calzado}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.estado_orden)}`}>
                              {item.estado_orden}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#6c7a89]">
                            {formatDate(item.fecha_recepcion)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#313D52] mb-2">
                    ¡Excelente! No hay servicios pendientes
                  </h3>
                  <p className="text-[#6c7a89]">
                    Todos los tenis tienen su ubicación asignada.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Estadísticas */}
          {activeTab === 'stats' && statistics && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#313D52]">
                Estadísticas Detalladas del Almacén
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cajas más utilizadas */}
                <div className="bg-[#f5f9f8] border border-[#e0e6e5] rounded-lg p-6">
                  <h4 className="font-semibold text-[#313D52] mb-4">Cajas Más Utilizadas</h4>
                  <div className="space-y-3">
                    {statistics.cajasMasUtilizadas.slice(0, 5).map((caja, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-[#78f3d3] text-[#313D52] rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </div>
                          <span className="font-mono font-medium">Caja {caja.caja_almacenamiento}</span>
                        </div>
                        <span className="bg-white px-3 py-1 rounded-full text-sm font-medium">
                          {caja.total_pares} pares
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Métricas generales */}
                <div className="bg-[#f5f9f8] border border-[#e0e6e5] rounded-lg p-6">
                  <h4 className="font-semibold text-[#313D52] mb-4">Métricas Generales</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-[#e0e6e5] last:border-b-0">
                      <span className="text-[#6c7a89]">Total de pares almacenados:</span>
                      <span className="font-semibold text-[#313D52]">{statistics.totalAlmacenados}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-[#e0e6e5] last:border-b-0">
                      <span className="text-[#6c7a89]">Pendientes de ubicación:</span>
                      <span className="font-semibold text-amber-600">{statistics.pendientesUbicacion}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-[#e0e6e5] last:border-b-0">
                      <span className="text-[#6c7a89]">Tiempo promedio de almacenamiento:</span>
                      <span className="font-semibold text-[#313D52]">{statistics.tiempoPromedioAlmacenamiento} días</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[#6c7a89]">Eficiencia de ubicación:</span>
                      <span className="font-semibold text-green-600">
                        {statistics.totalAlmacenados > 0 
                          ? Math.round(((statistics.totalAlmacenados - statistics.pendientesUbicacion) / statistics.totalAlmacenados) * 100)
                          : 100
                        }%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}