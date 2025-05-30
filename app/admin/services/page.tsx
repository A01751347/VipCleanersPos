// app/admin/services/page.tsx
'use client'
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Download,
  Loader2,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Shield,
  AlertCircle
} from 'lucide-react';

interface Service {
  servicio_id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_estimado_minutos?: number;
  requiere_identificacion: boolean;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion?: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    tiempo_estimado_minutos: '',
    requiere_identificacion: false,
    activo: true
  });

  const loadServices = async () => {
    try {
      setIsRefreshing(true);

      const response = await fetch('/api/admin/services?onlyActive=false');

      if (!response.ok) {
        throw new Error('Error al cargar los servicios');
      }

      const data = await response.json();
      setServices(data.services || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Error al cargar los servicios. Intente nuevamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleRefresh = () => {
    loadServices();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'No especificado';

    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;

    return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      nombre: service.nombre,
      descripcion: service.descripcion,
      precio: service.precio.toString(),
      tiempo_estimado_minutos: service.tiempo_estimado_minutos?.toString() || '',
      requiere_identificacion: service.requiere_identificacion,
      activo: service.activo
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingService(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      tiempo_estimado_minutos: '',
      requiere_identificacion: false,
      activo: true
    });
    setShowModal(true);
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const response = await fetch(`/api/admin/services/${service.servicio_id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !service.activo })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el servicio');
      }

      loadServices();
    } catch (error: any) {
      console.error('Error toggling service:', error);
      alert(error.message || 'Error al actualizar el servicio');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingService
        ? `/api/admin/services/${editingService.servicio_id}`
        : '/api/admin/services';

      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          precio: parseFloat(formData.precio),
          tiempo_estimado_minutos: formData.tiempo_estimado_minutos ? parseInt(formData.tiempo_estimado_minutos) : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el servicio');
      }

      setShowModal(false);
      loadServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      alert(error.message || 'Error al guardar el servicio');
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`¿Estás seguro de eliminar el servicio "${service.nombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/services/${service.servicio_id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el servicio');
      }

      const result = await response.json();
      alert(result.message);
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      alert(error.message || 'Error al eliminar el servicio');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#313D52]">Gestión de Servicios</h1>
          <p className="text-sm text-[#6c7a89]">Administra los servicios disponibles</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-[#313D52] text-white rounded-lg hover:bg-[#3e4a61] transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Nuevo Servicio
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

      {/* Lista de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center py-20">
            <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-10 text-red-500">
            <p>{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <AlertCircle size={48} className="mx-auto text-[#e0e6e5] mb-4" />
            <p className="text-[#6c7a89] font-medium">No hay servicios registrados</p>
            <p className="text-sm text-[#6c7a89]">Crea el primer servicio para comenzar</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 mt-4 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Nuevo Servicio
            </button>
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.servicio_id}
              className={`bg-white rounded-lg border border-[#e0e6e5] overflow-hidden ${
                !service.activo ? 'opacity-60' : ''
              }`}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium text-[#313D52]">
                    {service.nombre}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {service.activo ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : (
                      <XCircle size={20} className="text-red-500" />
                    )}
                  </div>
                </div>

                <p className="text-sm text-[#6c7a89] mb-4">
                  {service.descripcion}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-[#6c7a89]">
                      <DollarSign size={16} className="mr-1" />
                      Precio:
                    </span>
                    <span className="font-medium text-[#313D52]">
                      {formatCurrency(service.precio)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-[#6c7a89]">
                      <Clock size={16} className="mr-1" />
                      Tiempo:
                    </span>
                    <span className="text-sm text-[#313D52]">
                      {formatTime(service.tiempo_estimado_minutos)}
                    </span>
                  </div>

                  {service.requiere_identificacion && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-sm text-[#6c7a89]">
                        <Shield size={16} className="mr-1" />
                        Requiere ID:
                      </span>
                      <span className="text-sm text-orange-600">Sí</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#e0e6e5]">
                  <button
                    onClick={() => handleToggleActive(service)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      service.activo
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {service.activo ? 'Desactivar' : 'Activar'}
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(service)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-[#78f3d3] hover:text-[#4de0c0] transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-[#313D52] mb-4">
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Nombre del servicio
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Precio
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Tiempo estimado (minutos)
                </label>
                <input
                  type="number"
                  value={formData.tiempo_estimado_minutos}
                  onChange={(e) => setFormData({...formData, tiempo_estimado_minutos: e.target.value})}
                  className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiere_id"
                  checked={formData.requiere_identificacion}
                  onChange={(e) => setFormData({...formData, requiere_identificacion: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="requiere_id" className="text-sm text-[#6c7a89]">
                  Requiere identificación
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="activo" className="text-sm text-[#6c7a89]">
                  Servicio activo
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-[#6c7a89] border border-[#e0e6e5] rounded-lg hover:bg-[#f5f9f8] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
                >
                  {editingService ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}