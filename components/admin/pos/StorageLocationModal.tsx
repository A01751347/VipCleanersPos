'use client';
// components/admin/pos/StorageLocationModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Box, 
  Edit3,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  RefreshCw
} from 'lucide-react';

interface LocationData {
  detalleServicioId: number;
  ordenId: number;
  marca: string;
  modelo: string;
  talla?: string;
  color?: string;
  cajaAlmacenamiento: string;
  codigoUbicacion: string;
  notasEspeciales?: string;
}
export type { LocationData };

interface OrderItem {
  detalleServicioId: number;
  ordenId: number;
  nombre: string;
  marca?: string;
  modelo?: string;
  talla?: string;
  color?: string;
  descripcion?: string;
}

interface StorageLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (locations: LocationData[]) => Promise<void>;
  orderItems: OrderItem[];
  existingLocations?: LocationData[];
  empleadoId: number;
}

export default function StorageLocationModal({
  isOpen,
  onClose,
  onSubmit,
  orderItems,
  existingLocations = [],
  empleadoId
}: StorageLocationModalProps) {
  const [locations, setLocations] = useState<{[key: number]: { cajaAlmacenamiento: string; codigoUbicacion: string; notasEspeciales: string }}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState<{[key: number]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState('');

  const predefinedBoxes = [
    'A1', 'A2', 'A3', 'A4', 'A5',
    'B1', 'B2', 'B3', 'B4', 'B5', 
    'C1', 'C2', 'C3', 'C4', 'C5',
    'D1', 'D2', 'D3', 'D4', 'D5',
    'E1', 'E2', 'E3', 'E4', 'E5'
  ];

  // Inicializar ubicaciones existentes
  useEffect(() => {
    if (existingLocations.length > 0) {
      const existingMap: {[key: number]: { cajaAlmacenamiento: string; codigoUbicacion: string; notasEspeciales: string }} = {};
      existingLocations.forEach(loc => {
        existingMap[loc.detalleServicioId] = {
          cajaAlmacenamiento: loc.cajaAlmacenamiento,
          codigoUbicacion: loc.codigoUbicacion,
          notasEspeciales: loc.notasEspeciales || ''
        };
      });
      setLocations(existingMap);
    }
  }, [existingLocations]);

  const updateLocation = (itemId: number, field: string, value: string) => {
    setLocations(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
    setError(null);
  };

  const generateLocationCode = async (itemId: number, caja: string) => {
    if (!caja || caja === 'custom') return;
    
    setIsGeneratingCode(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const response = await fetch('/api/admin/storage-locations/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caja })
      });
      
      const data = await response.json();
      
      if (data.success) {
        updateLocation(itemId, 'codigoUbicacion', data.codigo);
      } else {
        console.error('Error generando código:', data.error);
      }
    } catch (error) {
      console.error('Error generando código:', error);
    } finally {
      setIsGeneratingCode(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleBoxChange = (itemId: number, caja: string) => {
    updateLocation(itemId, 'cajaAlmacenamiento', caja);
    
    if (caja && caja !== 'custom') {
      // Auto-generar código de ubicación
      generateLocationCode(itemId, caja);
    } else {
      updateLocation(itemId, 'codigoUbicacion', '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar que todos los items tengan ubicación asignada
    const missingLocations = orderItems.filter(item => 
      !locations[item.detalleServicioId]?.cajaAlmacenamiento || 
      !locations[item.detalleServicioId]?.codigoUbicacion
    );

    if (missingLocations.length > 0) {
      setError('Por favor asigna caja y código de ubicación para todos los items');
      return;
    }

    // Verificar que no haya códigos duplicados
    const codes = Object.values(locations).map(loc => loc.codigoUbicacion).filter(Boolean);
    const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
    
    if (duplicateCodes.length > 0) {
      setError(`Códigos de ubicación duplicados: ${duplicateCodes.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const locationData: LocationData[] = orderItems.map(item => ({
        detalleServicioId: item.detalleServicioId,
        ordenId: item.ordenId,
        marca: item.marca || '',
        modelo: item.modelo || '',
        talla: item.talla,
        color: item.color,
        cajaAlmacenamiento: locations[item.detalleServicioId].cajaAlmacenamiento,
        codigoUbicacion: locations[item.detalleServicioId].codigoUbicacion,
        notasEspeciales: locations[item.detalleServicioId].notasEspeciales
      }));

      await onSubmit(locationData);
      onClose();
    } catch (error) {
      console.error('Error asignando ubicaciones:', error);
      setError('Error al asignar ubicaciones. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setLocations({});
      setError(null);
      setSearchTerm('');
      onClose();
    }
  };

  // Filtrar items por búsqueda
  const filteredItems = orderItems.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.marca?.toLowerCase().includes(searchLower) ||
      item.modelo?.toLowerCase().includes(searchLower) ||
      item.descripcion?.toLowerCase().includes(searchLower) ||
      item.color?.toLowerCase().includes(searchLower)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#e0e6e5] bg-gradient-to-r from-[#313D52] to-[#3e4a61] text-white">
          <div>
            <h2 className="text-xl font-semibold">Asignar Ubicaciones de Almacenamiento</h2>
            <p className="text-sm mt-1 opacity-90">
              Define dónde se almacenará cada par de tenis - {orderItems.length} items
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#e0e6e5] bg-[#f5f9f8]">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-[#6c7a89]" />
            <input
              type="text"
              placeholder="Buscar por marca, modelo, descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {filteredItems.map((item, index) => (
                <div key={item.detalleServicioId} className="border-2 border-[#e0e6e5] rounded-lg p-6 bg-[#f5f9f8] hover:border-[#78f3d3] transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#313D52] text-lg flex items-center">
                        <Box size={20} className="mr-2 text-[#78f3d3]" />
                        {item.marca} {item.modelo}
                      </h3>
                      <div className="text-[#6c7a89] mt-1 space-y-1">
                        <p className="font-medium">{item.nombre}</p>
                        {item.talla && <p className="text-sm">Talla: {item.talla}</p>}
                        {item.color && <p className="text-sm">Color: {item.color}</p>}
                        {item.descripcion && (
                          <p className="text-sm italic bg-white px-2 py-1 rounded mt-2">
                            {item.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center bg-[#78f3d3] text-[#313D52] px-3 py-1 rounded-lg font-medium">
                      <MapPin size={16} className="mr-1" />
                      #{index + 1}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Caja de almacenamiento */}
                    <div>
                      <label className="block text-sm font-medium text-[#313D52] mb-2">
                        Caja de Almacenamiento *
                      </label>
                      <select
                        value={locations[item.detalleServicioId]?.cajaAlmacenamiento || ''}
                        onChange={(e) => handleBoxChange(item.detalleServicioId, e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-3 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3] disabled:opacity-50 bg-white"
                        required
                      >
                        <option value="">Seleccionar caja...</option>
                        {predefinedBoxes.map(box => (
                          <option key={box} value={box}>Caja {box}</option>
                        ))}
                        <option value="custom">Personalizada...</option>
                      </select>
                      
                      {locations[item.detalleServicioId]?.cajaAlmacenamiento === 'custom' && (
                        <input
                          type="text"
                          placeholder="Nombre de caja personalizada"
                          value={locations[item.detalleServicioId]?.cajaAlmacenamiento === 'custom' ? '' : locations[item.detalleServicioId]?.cajaAlmacenamiento || ''}
                          onChange={(e) => updateLocation(item.detalleServicioId, 'cajaAlmacenamiento', e.target.value)}
                          disabled={isSubmitting}
                          className="w-full mt-2 px-3 py-2 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3] disabled:opacity-50 bg-white"
                          required
                        />
                      )}
                    </div>

                    {/* Código de ubicación */}
                    <div>
                      <label className="block text-sm font-medium text-[#313D52] mb-2">
                        Código de Ubicación *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={locations[item.detalleServicioId]?.codigoUbicacion || ''}
                          onChange={(e) => updateLocation(item.detalleServicioId, 'codigoUbicacion', e.target.value)}
                          disabled={isSubmitting}
                          placeholder="EST2-F3-P1"
                          className="w-full px-3 py-3 pr-12 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3] disabled:opacity-50 bg-white"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const caja = locations[item.detalleServicioId]?.cajaAlmacenamiento;
                            if (caja && caja !== 'custom') {
                              generateLocationCode(item.detalleServicioId, caja);
                            }
                          }}
                          disabled={
                            !locations[item.detalleServicioId]?.cajaAlmacenamiento || 
                            locations[item.detalleServicioId]?.cajaAlmacenamiento === 'custom' || 
                            isSubmitting ||
                            isGeneratingCode[item.detalleServicioId]
                          }
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-[#78f3d3] hover:bg-[#f5f9f8] rounded disabled:opacity-50 disabled:hover:bg-transparent"
                          title="Auto-generar código"
                        >
                          {isGeneratingCode[item.detalleServicioId] ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RefreshCw size={16} />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-[#6c7a89] mt-1">
                        Formato: ESTANTE-FILA-POSICIÓN
                      </p>
                    </div>

                    {/* Notas especiales */}
                    <div>
                      <label className="block text-sm font-medium text-[#313D52] mb-2">
                        Notas Especiales
                      </label>
                      <textarea
                        value={locations[item.detalleServicioId]?.notasEspeciales || ''}
                        onChange={(e) => updateLocation(item.detalleServicioId, 'notasEspeciales', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Cuidados especiales, observaciones..."
                        rows={3}
                        className="w-full px-3 py-2 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3] resize-none disabled:opacity-50 bg-white"
                      />
                    </div>
                  </div>

                  {/* Indicador de estado */}
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#e0e6e5]">
                    <div className="flex items-center">
                      {locations[item.detalleServicioId]?.cajaAlmacenamiento && locations[item.detalleServicioId]?.codigoUbicacion ? (
                        <>
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          <span className="text-sm text-green-700 font-medium">
                            Ubicación asignada: {locations[item.detalleServicioId].cajaAlmacenamiento} - {locations[item.detalleServicioId].codigoUbicacion}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 border-2 border-amber-400 rounded-full mr-2 animate-pulse" />
                          <span className="text-sm text-amber-700">
                            Pendiente de asignar ubicación
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start">
                <AlertCircle size={20} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-between items-center pt-6 mt-6 border-t border-[#e0e6e5]">
              <div className="text-sm text-[#6c7a89]">
                {filteredItems.length !== orderItems.length && (
                  <span>Mostrando {filteredItems.length} de {orderItems.length} items</span>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-6 py-3 border-2 border-[#e0e6e5] text-[#6c7a89] rounded-lg hover:bg-[#f5f9f8] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={20} className="mr-2" />
                      Guardar Ubicaciones ({orderItems.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}