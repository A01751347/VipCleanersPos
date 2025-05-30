// components/admin/MessageReplyModal.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  User,
  Mail,
  Calendar,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';

interface MessageReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
  };
  onReplySuccess?: () => void;
}

const MessageReplyModal: React.FC<MessageReplyModalProps> = ({
  isOpen,
  onClose,
  message,
  onReplySuccess
}) => {
  const [replyMessage, setReplyMessage] = useState('');
  const [includeOriginalMessage, setIncludeOriginalMessage] = useState(true);
  const [markAsRead, setMarkAsRead] = useState(true);
  const [saveInDatabase, setSaveInDatabase] = useState(true);
  const [showOriginalPreview, setShowOriginalPreview] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Templates de respuesta predefinidos
  const quickReplies = [
    {
      name: 'Agradecimiento',
      content: 'Hola {name},\n\nGracias por contactarnos. Hemos recibido tu mensaje y nos pondremos en contacto contigo muy pronto.\n\nSi tienes alguna pregunta urgente, no dudes en llamarnos.\n\nSaludos cordiales,'
    },
    {
      name: 'Información General',
      content: 'Hola {name},\n\nGracias por tu interés en nuestros servicios. Te enviamos la información que solicitas:\n\n[Agregar información específica aquí]\n\nSi necesitas más detalles, estaremos encantados de ayudarte.\n\nSaludos,'
    },
    {
      name: 'Cotización',
      content: 'Hola {name},\n\nGracias por tu solicitud de cotización. Para poder brindarte un presupuesto preciso, necesitaríamos algunos detalles adicionales:\n\n• [Detalle 1]\n• [Detalle 2]\n• [Detalle 3]\n\nUna vez que tengamos esta información, te enviaremos una cotización detallada.\n\nSaludos,'
    },
    {
      name: 'Disculpa por la demora',
      content: 'Hola {name},\n\nPrimero que nada, queremos disculparnos por la demora en responder tu mensaje.\n\n[Respuesta específica al mensaje]\n\nApreciamos tu paciencia y esperamos poder ayudarte.\n\nSaludos,'
    }
  ];
  
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const insertQuickReply = (template: typeof quickReplies[0]) => {
    const content = template.content.replace('{name}', message.name);
    setReplyMessage(content);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      setError('Por favor escribe un mensaje de respuesta');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/messages/${message.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyMessage: replyMessage.trim(),
          includeOriginalMessage,
          markAsRead,
          saveInDatabase
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la respuesta');
      }
      
      setSuccess(true);
      
      // Ejecutar callback de éxito si se proporciona
      if (onReplySuccess) {
        onReplySuccess();
      }
      
      // Cerrar el modal después de 3 segundos
      setTimeout(() => {
        handleClose();
      }, 3000);
      
    } catch (err) {
      console.error('Error enviando respuesta:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar la respuesta');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    if (!isLoading && !success) {
      onClose();
      // Reset del estado
      setReplyMessage('');
      setError(null);
      setSuccess(false);
      setIncludeOriginalMessage(true);
      setMarkAsRead(true);
      setSaveInDatabase(true);
      setShowOriginalPreview(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#e0e6e5]">
          <div className="flex items-center">
            <Mail size={24} className="text-[#78f3d3] mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-[#313D52]">
                Responder Mensaje
              </h2>
              <p className="text-sm text-[#6c7a89]">
                Para: {message.name} &lt;{message.email}&gt;
              </p>
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
                ¡Respuesta Enviada!
              </h3>
              <p className="text-[#6c7a89] mb-4">
                Tu respuesta ha sido enviada exitosamente a:
              </p>
              <p className="text-[#313D52] font-medium">
                {message.email}
              </p>
              <p className="text-sm text-[#6c7a89] mt-2">
                El mensaje se está enviando por email...
              </p>
            </div>
          ) : (
            // Form State
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Reply Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Mensaje de Respuesta *
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    rows={12}
                    className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm resize-y"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-[#6c7a89] mt-1">
                    {replyMessage.length} caracteres
                  </p>
                </div>

                {/* Quick Reply Templates */}
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Respuestas Rápidas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {quickReplies.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => insertQuickReply(template)}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs bg-[#f5f9f8] text-[#313D52] rounded-lg hover:bg-[#e0e6e5] transition-colors disabled:opacity-50 text-left"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeOriginal"
                      checked={includeOriginalMessage}
                      onChange={(e) => setIncludeOriginalMessage(e.target.checked)}
                      disabled={isLoading}
                      className="mr-3"
                    />
                    <label htmlFor="includeOriginal" className="text-sm text-[#313D52]">
                      Incluir mensaje original en la respuesta
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="markAsRead"
                      checked={markAsRead}
                      onChange={(e) => setMarkAsRead(e.target.checked)}
                      disabled={isLoading}
                      className="mr-3"
                    />
                    <label htmlFor="markAsRead" className="text-sm text-[#313D52]">
                      Marcar mensaje como leído
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="saveInDatabase"
                      checked={saveInDatabase}
                      onChange={(e) => setSaveInDatabase(e.target.checked)}
                      disabled={isLoading}
                      className="mr-3"
                    />
                    <label htmlFor="saveInDatabase" className="text-sm text-[#313D52]">
                      Guardar respuesta en la base de datos
                    </label>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-start">
                    <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>

              {/* Right Column - Original Message */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-[#6c7a89]">
                    Mensaje Original
                  </label>
                  <button
                    onClick={() => setShowOriginalPreview(!showOriginalPreview)}
                    className="flex items-center text-xs text-[#6c7a89] hover:text-[#313D52]"
                  >
                    {showOriginalPreview ? (
                      <>
                        <EyeOff size={14} className="mr-1" />
                        Ocultar Vista Previa
                      </>
                    ) : (
                      <>
                        <Eye size={14} className="mr-1" />
                        Mostrar Vista Previa
                      </>
                    )}
                  </button>
                </div>

                {/* Original Message Card */}
                <div className="bg-[#f5f9f8] border border-[#e0e6e5] rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User size={16} className="text-[#6c7a89] mr-2" />
                      <span className="text-sm font-medium text-[#313D52]">
                        {message.name}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Mail size={16} className="text-[#6c7a89] mr-2" />
                      <span className="text-sm text-[#313D52]">
                        {message.email}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Calendar size={16} className="text-[#6c7a89] mr-2" />
                      <span className="text-sm text-[#6c7a89]">
                        {formatDate(message.created_at)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center mb-2">
                        <FileText size={16} className="text-[#6c7a89] mr-2" />
                        <span className="text-sm font-medium text-[#313D52]">
                          Asunto: {message.subject}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-[#e0e6e5]">
                      <p className="text-sm text-[#313D52] whitespace-pre-wrap leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview of Reply Email (if enabled) */}
                {showOriginalPreview && includeOriginalMessage && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      Vista Previa del Email
                    </h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p><strong>Para:</strong> {message.email}</p>
                      <p><strong>Asunto:</strong> Re: {message.subject}</p>
                      <p><strong>Incluirá:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Tu mensaje de respuesta</li>
                        <li>El mensaje original del cliente</li>
                        <li>Información de contacto de la empresa</li>
                        <li>Formato profesional HTML + texto plano</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Character Counter and Tips */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[#313D52] mb-2">
                    💡 Consejos para una buena respuesta:
                  </h4>
                  <ul className="text-xs text-[#6c7a89] space-y-1">
                    <li>• Saluda al cliente por su nombre</li>
                    <li>• Sé específico y claro en tu respuesta</li>
                    <li>• Incluye información de contacto si es relevante</li>
                    <li>• Mantén un tono profesional y amigable</li>
                    <li>• Agradece al cliente por su interés</li>
                  </ul>
                </div>
              </div>
            </div>
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
              onClick={handleSendReply}
              disabled={isLoading || !replyMessage.trim()}
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
                  Enviar Respuesta
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReplyModal;