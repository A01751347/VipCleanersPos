'use client'
// components/admin/ShoesStorageModal.tsx
import React, { useState } from 'react';
import { X, Box, Save, Loader2, AlertCircle } from 'lucide-react';

interface ShoesStorageModalProps {
  shoeId: number;
  shoeName: string;
  onClose: () => void;
  onSubmit: (data: {
    shoeId: number;
    boxName: string;
    locationCode: string;
    specialNotes?: string;
  }) => Promise<void>;
}

const ShoesStorageModal: React.FC<ShoesStorageModalProps> = ({
  shoeId,
  shoeName,
  onClose,
  onSubmit
}) => {
  const [boxName, setBoxName] = useState('');
  const [locationCode, setLocationCode] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lista predefinida de cajas de almacenamiento
  const predefinedBoxes = [
    'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!boxName || !locationCode) {
      setError('La caja y el código de ubicación son obligatorios');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit({
        shoeId,
        boxName,
        locationCode,
        specialNotes: specialNotes || undefined
      });
    } catch (err) {
      console.error('Error al asignar ubicación:', err);
      setError('Error al guardar la ubicación. Intente nuevamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6c7a89] hover:text-[#313D52] p-1 rounded-full hover:bg-[#f5f9f8]"
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>
        
        <div className="p-6 border-b border-[#e0e6e5]">
          <h2 className="text-lg font-semibold text-[#313D52]">Asignar Ubicación de Almacenamiento</h2>
          <p className="text-[#6c7a89] text-sm mt-1">
            Asigna una caja y ubicación para: <span className="font-medium">{shoeName}</span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Caja de almacenamiento */}
            <div>
              <label htmlFor="boxName" className="block text-sm font-medium text-[#313D52] mb-1">
                Caja de Almacenamiento
              </label>
              <select
                id="boxName"
                value={boxName}
                onChange={(e) => setBoxName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                disabled={isSubmitting}
              >
                <option value="">Seleccionar caja...</option>
                {predefinedBoxes.map((box) => (
                  <option key={box} value={box}>Caja {box}</option>
                ))}
                <option value="custom">Otra...</option>
              </select>
              
              {boxName === 'custom' && (
                <input
                  type="text"
                  placeholder="Nombre personalizado de caja"
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                  value={boxName === 'custom' ? '' : boxName}
                  onChange={(e) => setBoxName(e.target.value)}
                  disabled={isSubmitting}
                />
              )}
            </div>
            
            {/* Código de ubicación */}
            <div>
              <label htmlFor="locationCode" className="block text-sm font-medium text-[#313D52] mb-1">
                Código de Ubicación
              </label>
              <input
                type="text"
                id="locationCode"
                placeholder="Ej: ESTANTE2-FILA3"
                value={locationCode}
                onChange={(e) => setLocationCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-[#6c7a89]">
                Código que identifica la ubicación específica dentro del almacén
              </p>
            </div>
            
            {/* Notas especiales */}
            <div>
              <label htmlFor="specialNotes" className="block text-sm font-medium text-[#313D52] mb-1">
                Notas Especiales (opcional)
              </label>
              <textarea
                id="specialNotes"
                rows={3}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Instrucciones especiales de almacenamiento o manipulación..."
                className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] resize-none"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          {/* Mensaje de error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-start">
              <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {/* Botones */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-[#e0e6e5] text-[#6c7a89] rounded-lg hover:bg-[#f5f9f8] transition-colors"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Guardar Ubicación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShoesStorageModal;