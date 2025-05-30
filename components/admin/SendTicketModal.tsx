// components/admin/SendTicketModal.tsx
'use client'
import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Image,
  Copy,
  MessageSquare
} from 'lucide-react';

interface SendTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    orden_id: number;
    codigo_orden: string;
    cliente_nombre: string;
    cliente_apellidos?: string;
    cliente_email: string;
    total: number;
  };
}

const SendTicketModal: React.FC<SendTicketModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Opciones del formulario
  const [includeImages, setIncludeImages] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [sendCopy, setSendCopy] = useState(false);
  const [copyEmail, setCopyEmail] = useState('');
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };
  
  const handleSendTicket = async () => {
    if (!order.cliente_email || order.cliente_email.trim() === '') {
      setError('El cliente no tiene un email registrado');
      return;
    }
    
    if (sendCopy && (!copyEmail || copyEmail.trim() === '')) {
      setError('Por favor ingresa un email para la copia');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/orders/${order.orden_id}/send-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includeImages,
          customMessage: customMessage.trim() || null,
          sendCopy,
          copyEmail: sendCopy ? copyEmail.trim() : null
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el ticket');
      }
      
      setSuccess(true);
      
      // Cerrar el modal después de 3 segundos
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCustomMessage('');
        setCopyEmail('');
        setIncludeImages(false);
        setSendCopy(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error enviando ticket:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar el ticket');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    if (!isLoading && !success) {
      onClose();
      setError(null);
      setCustomMessage('');
      setCopyEmail('');
      setIncludeImages(false);
      setSendCopy(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#e0e6e5]">
          <div className="flex items-center">
            <Mail size={24} className="text-[#78f3d3] mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-[#313D52]">Enviar Ticket por Email</h2>
              <p className="text-sm text-[#6c7a89]">Orden: {order.codigo_orden}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading || success}
            className="text-[#6c7a89] hover:text-[#313D52] disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            // Success State
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#e0f7f0] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-[#78f3d3]" />
              </div>
              <h3 className="text-lg font-semibold text-[#313D52] mb-2">
                ¡Ticket Enviado!
              </h3>
              <p className="text-[#6c7a89] mb-4">
                El ticket ha sido enviado exitosamente a:
              </p>
              <p className="text-[#313D52] font-medium">
                {order.cliente_email}
              </p>
              {sendCopy && copyEmail && (
                <p className="text-sm text-[#6c7a89] mt-2">
                  Copia enviada a: {copyEmail}
                </p>
              )}
            </div>
          ) : (
            // Form State
            <>
              {/* Cliente Info */}
              <div className="bg-[#f5f9f8] p-4 rounded-lg mb-6">
                <h3 className="font-medium text-[#313D52] mb-2">Información del Cliente</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Nombre:</strong> {order.cliente_nombre} {order.cliente_apellidos || ''}</p>
                  <p><strong>Email:</strong> {order.cliente_email}</p>
                  <p><strong>Total:</strong> {formatCurrency(order.total)}</p>
                </div>
              </div>

              {/* Opciones del Email */}
              <div className="space-y-4 mb-6">
                {/* Mensaje Personalizado */}
                <div>
                  <label className="flex items-center text-sm font-medium text-[#6c7a89] mb-2">
                    <MessageSquare size={16} className="mr-2" />
                    Mensaje Personalizado (Opcional)
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Agregue un mensaje personalizado que aparecerá en el ticket..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm resize-none"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-[#6c7a89] mt-1">
                    Máximo 500 caracteres
                  </p>
                </div>

                {/* Incluir Imágenes */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeImages"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    disabled={isLoading}
                    className="mr-3"
                  />
                  <label htmlFor="includeImages" className="flex items-center text-sm text-[#313D52]">
                    <Image size={16} className="mr-2 text-[#6c7a89]" />
                    Incluir imágenes del calzado (si están disponibles)
                  </label>
                </div>

                {/* Enviar Copia */}
                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="sendCopy"
                      checked={sendCopy}
                      onChange={(e) => setSendCopy(e.target.checked)}
                      disabled={isLoading}
                      className="mr-3"
                    />
                    <label htmlFor="sendCopy" className="flex items-center text-sm text-[#313D52]">
                      <Copy size={16} className="mr-2 text-[#6c7a89]" />
                      Enviar copia a otro email
                    </label>
                  </div>
                  
                  {sendCopy && (
                    <input
                      type="email"
                      value={copyEmail}
                      onChange={(e) => setCopyEmail(e.target.value)}
                      placeholder="email@ejemplo.com"
                      className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm"
                      disabled={isLoading}
                    />
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-start">
                  <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

            </>
          )}
        </div>

        {/* Footer - Solo mostrar botones si no está en estado de éxito */}
        {!success && (
          <div className="flex justify-end space-x-3 p-6 border-t border-[#e0e6e5]">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 border border-[#e0e6e5] text-[#6c7a89] rounded-lg hover:bg-[#f5f9f8] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSendTicket}
              disabled={isLoading || !order.cliente_email}
              className="px-6 py-2 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center disabled:opacity-50 disabled:hover:bg-[#78f3d3]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Enviar Ticket
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendTicketModal;