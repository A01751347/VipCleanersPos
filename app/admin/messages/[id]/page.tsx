'use client'
// app/admin/messages/[id]/page.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Mail, 
  MailOpen,
  User, 
  Calendar,
  FileText,
  Star,
  Archive,
  CheckCircle,
  XCircle,
  Edit,
  Loader2,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface MessageDetails {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  created_at: string;
}

export default function MessageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [message, setMessage] = useState<MessageDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const messageId = parseInt(params.id as string, 10);

  useEffect(() => {
    if (isNaN(messageId)) {
      setError('ID de mensaje inválido');
      setIsLoading(false);
      return;
    }

    fetchMessageDetails();
  }, [messageId]);

  const fetchMessageDetails = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/messages/${messageId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Mensaje no encontrado');
        }
        throw new Error('Error al cargar los detalles del mensaje');
      }
      
      const data = await response.json();
      setMessage(data);
      setError(null);
      
      // Marcar como leído si no lo está
      if (!data.is_read) {
        handleStatusUpdate('read', true);
      }
    } catch (err) {
      console.error('Error fetching message details:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (action: string, value: boolean) => {
    if (!message) return;

    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/admin/messages/${message.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, value }),
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }
      
      // Refrescar los datos
      await fetchMessageDetails();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error al actualizar el estado del mensaje');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/messages"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-[#6c7a89]" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[#313D52]">Mensaje no encontrado</h1>
            <p className="text-sm text-[#6c7a89]">El mensaje solicitado no existe o ha sido eliminado</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-[#e0e6e5] p-6 text-center">
          <div className="text-red-500 mb-4">
            <XCircle size={48} className="mx-auto" />
          </div>
          <h2 className="text-lg font-semibold text-[#313D52] mb-2">Error</h2>
          <p className="text-[#6c7a89] mb-4">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={fetchMessageDetails}
              className="px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
            >
              Reintentar
            </button>
            <Link 
              href="/admin/messages"
              className="px-4 py-2 bg-gray-100 text-[#313D52] rounded-lg hover:bg-gray-200 transition-colors"
            >
              Volver a Mensajes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/messages"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-[#6c7a89]" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[#313D52]">
              Mensaje de {message.name}
            </h1>
            <p className="text-sm text-[#6c7a89]">Detalles completos del mensaje de contacto</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {message.is_read ? (
              <MailOpen size={16} className="text-[#6c7a89]" />
            ) : (
              <Mail size={16} className="text-[#78f3d3]" />
            )}
            {message.is_starred ?  (
              <Star size={16} className="text-yellow-400" />
            ): (
              null
            )}
            {message.is_archived ? (
              <Archive size={16} className="text-[#6c7a89]" />
            ): (
              null
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject and Sender */}
          <div className="bg-white rounded-lg border border-[#e0e6e5] p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-2">Asunto</label>
                <h2 className="text-xl font-semibold text-[#313D52]">{message.subject}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">Remitente</label>
                  <div className="flex items-center">
                    <User size={16} className="text-[#6c7a89] mr-2" />
                    <p className="text-[#313D52] font-medium">{message.name}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-1">Email</label>
                  <div className="flex items-center">
                    <Mail size={16} className="text-[#6c7a89] mr-2" />
                    <a 
                      href={`mailto:${message.email}`} 
                      className="text-[#28d3d3] hover:underline"
                    >
                      {message.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="bg-white rounded-lg border border-[#e0e6e5] p-6">
            <div className="flex items-center mb-4">
              <FileText size={20} className="text-[#78f3d3] mr-2" />
              <h3 className="text-lg font-semibold text-[#313D52]">Contenido del Mensaje</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-[#313D52] whitespace-pre-wrap leading-relaxed">
                {message.message}
              </p>
            </div>
          </div>

          {/* Quick Reply */}
          <div className="bg-white rounded-lg border border-[#e0e6e5] p-6">
            <h3 className="text-lg font-semibold text-[#313D52] mb-4">Respuesta Rápida</h3>
            <div className="space-y-4">
              <button 
                onClick={() => window.open(`mailto:${message.email}?subject=Re: ${message.subject}&body=Hola ${message.name},%0D%0A%0D%0AGracias por contactarnos.%0D%0A%0D%0ASaludos,%0D%0AEquipo CleanKicks`)}
                className="w-full flex items-center justify-center px-4 py-3 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors font-medium"
              >
                <Mail size={16} className="mr-2" />
                Responder por Email
              </button>
              
              <p className="text-sm text-[#6c7a89] text-center">
                Se abrirá tu cliente de email con una respuesta pre-configurada
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          <div className="bg-white rounded-lg border border-[#e0e6e5] p-6">
            <h3 className="text-lg font-semibold text-[#313D52] mb-4">Acciones</h3>
            
            <div className="space-y-3">
              {!message.is_read && (
                <button
                  onClick={() => handleStatusUpdate('read', true)}
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Marcar como Leído
                </button>
              )}
              
              <button
                onClick={() => handleStatusUpdate('starred', !message.is_starred)}
                disabled={isUpdating}
                className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  message.is_starred 
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <Star size={16} className="mr-2" />
                {message.is_starred ? 'Quitar Destacado' : 'Destacar'}
              </button>
              
              <button
                onClick={() => handleStatusUpdate('archived', !message.is_archived)}
                disabled={isUpdating}
                className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  message.is_archived 
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                }`}
              >
                <Archive size={16} className="mr-2" />
                {message.is_archived ? 'Desarchivar' : 'Archivar'}
              </button>
            </div>
          </div>

          {/* Message Info */}
          <div className="bg-white rounded-lg border border-[#e0e6e5] p-6">
            <div className="flex items-center mb-4">
              <Calendar size={20} className="text-[#78f3d3] mr-2" />
              <h3 className="text-lg font-semibold text-[#313D52]">Información</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">Recibido</label>
                <div className="flex items-center">
                  <Clock size={14} className="text-[#6c7a89] mr-2" />
                  <p className="text-[#313D52]">{formatDate(message.created_at)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-1">Estado</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    {message.is_read ? (
                      <MailOpen size={14} className="text-green-600 mr-2" />
                    ) : (
                      <Mail size={14} className="text-blue-600 mr-2" />
                    )}
                    <span className="text-sm text-[#313D52]">
                      {message.is_read ? 'Leído' : 'No leído'}
                    </span>
                  </div>
                  
                  {message.is_starred ? (
                    <div className="flex items-center">
                      <Star size={14} className="text-yellow-600 mr-2" />
                      <span className="text-sm text-[#313D52]">Destacado</span>
                    </div>
                  ): (
                    null
                  )}
                  
                  {message.is_archived ? (
                    <div className="flex items-center">
                      <Archive size={14} className="text-gray-600 mr-2" />
                      <span className="text-sm text-[#313D52]">Archivado</span>
                    </div>
                  ): (
                    null
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}