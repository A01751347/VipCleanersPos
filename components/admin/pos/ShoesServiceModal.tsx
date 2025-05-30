'use client';
// components/admin/pos/ShoesServiceModal.tsx
import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Save, 
  Loader2, 
  AlertCircle,
  Trash2,
  Plus
} from 'lucide-react';

interface ShoesServiceData {
  servicioId: number;
  marca: string;
  modelo: string;
  talla: string;
  color: string;
  descripcion: string;
  fotos: File[];
}

interface ShoesServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShoesServiceData) => Promise<void>;
  serviceName: string;
  servicePrice: number;
  servicioId: number;
}

export default function ShoesServiceModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  serviceName, 
  servicePrice,
  servicioId 
}: ShoesServiceModalProps) {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    talla: '',
    color: '',
    descripcion: ''
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          setError('Una o más imágenes son demasiado grandes. Máximo 5MB por imagen.');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoPreview(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
        setPhotos(prev => [...prev, file]);
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.marca.trim() || !formData.modelo.trim() || !formData.talla.trim()) {
      setError('Marca, modelo y talla son obligatorios');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit({
        servicioId,
        ...formData,
        fotos: photos
      });
      
      // Reset form
      setFormData({ marca: '', modelo: '', talla: '', color: '', descripcion: '' });
      setPhotos([]);
      setPhotoPreview([]);
      onClose();
    } catch (error) {
      console.error('Error al agregar servicio:', error);
      setError('Error al agregar el servicio. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ marca: '', modelo: '', talla: '', color: '', descripcion: '' });
      setPhotos([]);
      setPhotoPreview([]);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#e0e6e5]">
          <div>
            <h2 className="text-xl font-semibold text-[#313D52]">Agregar Detalles del Calzado</h2>
            <p className="text-[#6c7a89] text-sm mt-1">
              {serviceName} - ${Number(servicePrice).toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-[#f5f9f8] rounded-full transition-colors disabled:opacity-50"
          >
            <X size={24} className="text-[#6c7a89]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica del calzado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#313D52] mb-2">
                  Marca *
                </label>
                <input
                  type="text"
                  value={formData.marca}
                  onChange={(e) => handleInputChange('marca', e.target.value)}
                  placeholder="Nike, Adidas, Puma..."
                  className="w-full px-4 py-3 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3] focus:border-[#78f3d3]"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#313D52] mb-2">
                  Modelo *
                </label>
                <input
                  type="text"
                  value={formData.modelo}
                  onChange={(e) => handleInputChange('modelo', e.target.value)}
                  placeholder="Air Force 1, Stan Smith..."
                  className="w-full px-4 py-3 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3] focus:border-[#78f3d3]"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#313D52] mb-2">
                  Talla *
                </label>
                <input
                  type="text"
                  value={formData.talla}
                  onChange={(e) => handleInputChange('talla', e.target.value)}
                  placeholder="7, 7.5, 8, 8.5..."
                  className="w-full px-4 py-3 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3] focus:border-[#78f3d3]"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#313D52] mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="Blanco, Negro, Azul..."
                  className="w-full px-4 py-3 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3] focus:border-[#78f3d3]"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Descripción adicional */}
            <div>
              <label className="block text-sm font-medium text-[#313D52] mb-2">
                Descripción del estado y cuidados especiales
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                placeholder="Estado del calzado, manchas, desgaste, instrucciones especiales de limpieza..."
                rows={4}
                className="w-full px-4 py-3 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3] focus:border-[#78f3d3] resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Sección de fotos */}
            <div>
              <label className="block text-sm font-medium text-[#313D52] mb-3">
                Fotos del calzado (opcional)
              </label>
              
              {/* Botón para agregar fotos */}
              <div className="mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-[#e0e6e5] rounded-lg hover:border-[#78f3d3] hover:bg-[#f5f9f8] transition-colors disabled:opacity-50"
                >
                  <Camera size={24} className="mr-3 text-[#6c7a89]" />
                  <span className="text-[#6c7a89]">
                    {photos.length === 0 
                      ? 'Agregar fotos del calzado' 
                      : `Agregar más fotos (${photos.length} agregadas)`
                    }
                  </span>
                </button>
                <p className="text-xs text-[#6c7a89] mt-2">
                  Formatos permitidos: JPG, PNG, WEBP. Máximo 5MB por imagen.
                </p>
              </div>

              {/* Preview de fotos */}
              {photoPreview.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photoPreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-[#e0e6e5]"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        disabled={isSubmitting}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle size={20} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-[#e0e6e5]">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-3 border border-[#e0e6e5] text-[#6c7a89] rounded-lg hover:bg-[#f5f9f8] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.marca.trim() || !formData.modelo.trim() || !formData.talla.trim()}
                className="px-8 py-3 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus size={20} className="mr-2" />
                    Agregar al Carrito
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}