'use client'
// components/admin/pos/OrderSuccess.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Printer, AlertCircle, Upload, FileText, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';

interface OrderSuccessProps {
  ordenId: number;
  codigoOrden: string;
  requiereIdentificacion: boolean;
  onStartNew: () => void;
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({
  ordenId,
  codigoOrden,
  requiereIdentificacion,
  onStartNew
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Función para subir la identificación
  const handleUploadIdentification = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Crear FormData para subir el archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', 'identificacion');
      formData.append('entidadTipo', 'orden');
      formData.append('entidadId', ordenId.toString());
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al subir la identificación');
      }
      
      setUploadSuccess(true);
    } catch (error) {
      console.error('Error al subir identificación:', error);
      setUploadError(error instanceof Error ? error.message : 'Error al subir la identificación');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handler para cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tipo de archivo (solo imágenes)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Solo se permiten archivos de imagen (JPEG, JPG, PNG)');
      return;
    }
    
    // Validar tamaño del archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('El archivo no debe superar los 5MB');
      return;
    }
    
    handleUploadIdentification(file);
  };
  
  // Función para imprimir ticket (simulada)
  const handlePrintTicket = () => {
    // En un entorno real, esto enviaría la orden a una impresora
    // Para esta simulación, solo mostramos un mensaje en consola
    console.log(`Imprimiendo ticket para la orden ${codigoOrden}`);
    
    // Podríamos abrir una ventana de impresión con el ticket formateado
    window.open(`/admin/orders/${ordenId}/print`, '_blank');
  };
  
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-16 h-16 bg-[#e0f7f0] rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-[#78f3d3]" />
        </div>
        <h1 className="text-2xl font-bold text-[#313D52]">¡Orden Creada con Éxito!</h1>
        <p className="mt-2 text-[#6c7a89]">
          La orden ha sido registrada correctamente en el sistema.
        </p>
      </div>
      
      <div className="bg-[#f5f9f8] p-6 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[#6c7a89] font-medium">Código de Orden:</span>
          <span className="text-xl font-bold text-[#313D52]">{codigoOrden}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-[#6c7a89] font-medium">Orden ID:</span>
          <span className="text-[#313D52] font-medium">{ordenId}</span>
        </div>
      </div>
      
      {/* Sección condicional para subir identificación */}
      {requiereIdentificacion && !uploadSuccess && (
        <div className="mb-6">
          <div className={`p-4 rounded-lg ${uploadError ? 'bg-red-50' : 'bg-amber-50'} mb-4`}>
            <div className="flex items-start">
              <AlertCircle size={20} className={`mr-2 flex-shrink-0 ${uploadError ? 'text-red-500' : 'text-amber-500'}`} />
              <div>
                <p className={`font-medium ${uploadError ? 'text-red-700' : 'text-amber-700'}`}>
                  {uploadError ? 'Error al subir identificación' : 'Identificación requerida'}
                </p>
                <p className={`text-sm mt-1 ${uploadError ? 'text-red-600' : 'text-amber-600'}`}>
                  {uploadError || 'Esta orden requiere una identificación oficial del cliente.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-[#e0e6e5] rounded-lg p-6 text-center">
            <Upload size={32} className="mx-auto mb-2 text-[#6c7a89]" />
            <p className="text-[#313D52] font-medium mb-2">Subir Identificación</p>
            <p className="text-sm text-[#6c7a89] mb-4">
              Sube una fotografía o escaneo de la identificación oficial del cliente.
              Solo archivos JPG, JPEG o PNG, máximo 5MB.
            </p>
            <label className="inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors cursor-pointer">
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload size={18} className="mr-2" />
                  Seleccionar Archivo
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      )}
      
      {/* Confirmación de identificación subida */}
      {requiereIdentificacion && uploadSuccess && (
        <div className="p-4 bg-green-50 rounded-lg mb-6">
          <div className="flex items-start">
            <CheckCircle size={20} className="mr-2 flex-shrink-0 text-green-500" />
            <div>
              <p className="font-medium text-green-700">Identificación subida correctamente</p>
              <p className="text-sm mt-1 text-green-600">
                La identificación del cliente se ha registrado en el sistema.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Botones de acción */}
      <div className="flex flex-col space-y-3">
        <button
          onClick={handlePrintTicket}
          className="w-full py-3 bg-[#313D52] text-white rounded-lg flex items-center justify-center font-medium hover:bg-[#3e4a61] transition-colors"
        >
          <Printer size={20} className="mr-2" />
          Imprimir Ticket
        </button>
        
        <Link 
          href={`/admin/orders/${ordenId}`}
          className="w-full py-3 border border-[#e0e6e5] text-[#313D52] rounded-lg flex items-center justify-center font-medium hover:bg-[#f5f9f8] transition-colors"
        >
          <FileText size={20} className="mr-2" />
          Ver Detalles de la Orden
        </Link>
        
        <button
          onClick={onStartNew}
          className="w-full py-3 bg-[#78f3d3] text-[#313D52] rounded-lg flex items-center justify-center font-medium hover:bg-[#4de0c0] transition-colors"
        >
          <RefreshCw size={20} className="mr-2" />
          Nueva Venta
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;