'use client'
// components/admin/UploadIdentificationModal.tsx
import React, { useState, useRef } from 'react';
import { X, Upload, File, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';

interface UploadIdentificationModalProps {
  onClose: () => void;
  onSubmit: (file: File) => void;
}

const UploadIdentificationModal: React.FC<UploadIdentificationModalProps> = ({ 
  onClose, 
  onSubmit 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manejar selección de archivo
  const handleFileSelect = (file: File) => {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('El formato de archivo no es válido. Por favor, sube una imagen (JPEG, JPG, PNG, WEBP).');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    
    // Crear URL para vista previa
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setError(null);
  };
  
  // Manejar cambio en el input de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  // Manejar click en el área de drop
  const handleDivClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Manejar drag & drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Llamar a la función onSubmit proporcionada por el padre
      await onSubmit(selectedFile);
      
      // El componente padre se encargará de cerrar el modal después de la carga exitosa
    } catch (error) {
      console.error('Error al subir la identificación:', error);
      setError('Ha ocurrido un error al subir el archivo. Por favor, intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6c7a89] hover:text-[#313D52] p-1 rounded-full hover:bg-[#f5f9f8]"
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>
        
        <div className="p-6 border-b border-[#e0e6e5]">
          <h2 className="text-lg font-semibold text-[#313D52]">Subir Identificación</h2>
          <p className="text-[#6c7a89] text-sm mt-1">
            Sube una fotografía o escaneo de una identificación oficial del cliente.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Área de drop de archivos */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging 
                ? 'border-[#78f3d3] bg-[#e0f7f0]' 
                : 'border-[#e0e6e5] hover:border-[#78f3d3] hover:bg-[#f5f9f8]'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleDivClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              disabled={isSubmitting}
            />
            
            {previewUrl ? (
              <div className="mb-4">
                <div className="relative w-full max-w-xs mx-auto h-48 border border-[#e0e6e5] rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="mt-2 text-sm text-[#6c7a89]">
                  {selectedFile?.name} ({(selectedFile?.size || 0) / 1024 < 1024 
                    ? `${Math.round((selectedFile?.size || 0) / 1024)} KB` 
                    : `${(selectedFile?.size || 0) / 1024 / 1024 < 10 
                      ? ((selectedFile?.size || 0) / 1024 / 1024).toFixed(2) 
                      : Math.round((selectedFile?.size || 0) / 1024 / 1024)
                    } MB`}
                  )
                </p>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-[#f5f9f8] rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon size={32} className="text-[#6c7a89]" />
                </div>
                <p className="text-[#313D52] font-medium mb-2">
                  Arrastra y suelta una imagen aquí
                </p>
                <p className="text-sm text-[#6c7a89] mb-4">
                  O haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-[#6c7a89]">
                  Formatos permitidos: JPG, JPEG, PNG, WEBP. Tamaño máximo: 5MB
                </p>
              </div>
            )}
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
              disabled={isSubmitting || !selectedFile}
              className={`px-6 py-2 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center ${
                isSubmitting || !selectedFile ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload size={18} className="mr-2" />
                  Subir Archivo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadIdentificationModal;