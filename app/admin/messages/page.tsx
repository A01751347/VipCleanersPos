'use client'
// app/admin/messages/page.tsx
import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MailOpen,
  Search, 
  Filter,
  Star, 
  Archive,
  Calendar,
  User,
  MessageSquare,
  Reply,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  X,
  Clock,
  TrendingUp,
  Users,
  MessageCircle,
  StarIcon
} from 'lucide-react';
import MessageReplyModal from '../../../components/admin/MessageReplyModal';

interface Message {
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

interface MessageStats {
  total_mensajes: number;
  no_leidos: number;
  respondidos: number;
  sin_responder: number;
  destacados: number;
  archivados: number;
  promedio_respuesta_horas: number;
}

export default function MessagesPage() {
  // Estados principales
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<MessageStats>({
    total_mensajes: 0,
    no_leidos: 0,
    respondidos: 0,
    sin_responder: 0,
    destacados: 0,
    archivados: 0,
    promedio_respuesta_horas: 0
  });
  
  // Estados de UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  
  // Estados de filtros y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'starred' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('fecha_creacion');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Estados de acciones
  const [updatingStates, setUpdatingStates] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [currentPage, filter, searchQuery, sortField, sortDirection]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        filter,
        searchQuery,
        sortField,
        sortDirection
      });
      
      const response = await fetch(`/api/admin/messages?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los mensajes');
      }
      
      const data = await response.json();
      setMessages(data.messages);
      setTotalPages(data.totalPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/messages/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleStatusUpdate = async (messageId: number, action: string, value: boolean) => {
    try {
      setUpdatingStates(prev => ({ ...prev, [messageId]: true }));
      
      const response = await fetch(`/api/admin/messages/${messageId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, value }),
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }
      
      // Actualizar el mensaje en el estado local
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            [`is_${action}`]: value
          };
        }
        return msg;
      }));
      
      // Actualizar estadísticas
      fetchStats();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error al actualizar el estado del mensaje');
    } finally {
      setUpdatingStates(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const handleReplyClick = (message: Message) => {
    // Marcar como leído si no lo está
    if (!message.is_read) {
      handleStatusUpdate(message.id, 'read', true);
    }
    
    setSelectedMessage(message);
    setShowReplyModal(true);
  };

  const handleReplySuccess = () => {
    // Refrescar mensajes y estadísticas
    fetchMessages();
    fetchStats();
    setShowReplyModal(false);
    setSelectedMessage(null);
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

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    
    return formatDate(dateString);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[#6c7a89] mt-1">Gestiona todos los mensajes recibidos desde el formulario de contacto</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6c7a89]">Total Mensajes</p>
              <p className="text-2xl font-bold text-[#313D52]">{stats.total_mensajes}</p>
            </div>
            <div className="p-3 bg-[#e0f7f0] rounded-lg">
              <MessageCircle size={24} className="text-[#78f3d3]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6c7a89]">No Leídos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.no_leidos}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6c7a89]">Respondidos</p>
              <p className="text-2xl font-bold text-green-600">{stats.respondidos}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6c7a89]">Destacados</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.destacados}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <StarIcon size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-[#e0e6e5] p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c7a89]" />
              <input
                type="text"
                placeholder="Buscar mensajes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todos', count: stats.total_mensajes },
              { key: 'unread', label: 'No Leídos', count: stats.no_leidos },
              { key: 'starred', label: 'Destacados', count: stats.destacados },
              { key: 'archived', label: 'Archivados', count: stats.archivados }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key as any);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-[#78f3d3] text-[#313D52]'
                    : 'bg-gray-100 text-[#6c7a89] hover:bg-gray-200'
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    filter === key ? 'bg-[#313D52] text-white' : 'bg-white text-[#6c7a89]'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg border border-[#e0e6e5]">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#313D52] mb-2">Error al cargar mensajes</h3>
            <p className="text-[#6c7a89] mb-4">{error}</p>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <Mail size={48} className="text-[#6c7a89] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#313D52] mb-2">No hay mensajes</h3>
            <p className="text-[#6c7a89]">
              {filter === 'all' 
                ? 'No se han recibido mensajes aún.' 
                : `No hay mensajes ${filter === 'unread' ? 'no leídos' : filter === 'starred' ? 'destacados' : 'archivados'}.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e0e6e5]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 hover:bg-[#f5f9f8] transition-colors ${
                  !message.is_read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    {/* Header with sender info */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center">
                        {message.is_read ? (
                          <MailOpen size={16} className="text-[#6c7a89]" />
                        ) : (
                          <Mail size={16} className="text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        <User size={14} className="text-[#6c7a89] mr-1" />
                        <span className="font-semibold text-[#313D52]">{message.name}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Mail size={14} className="text-[#6c7a89] mr-1" />
                        <span className="text-sm text-[#6c7a89]">{message.email}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {message.is_starred ? (
                          <Star size={14} className="text-yellow-500" />
                        ):[null]}
                        {message.is_archived ?(
                          <Archive size={14} className="text-[#6c7a89]" />
                        ):[null]}
                      </div>
                    </div>

                    {/* Subject */}
                    <h3 className="font-semibold text-[#313D52] mb-1">
                      {message.subject}
                    </h3>

                    {/* Message preview */}
                    <p className="text-[#6c7a89] text-sm mb-2 leading-relaxed">
                      {truncateText(message.message, 120)}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center text-xs text-[#6c7a89]">
                      <Clock size={12} className="mr-1" />
                      <span>{formatRelativeTime(message.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    {/* Primary Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleReplyClick(message)}
                        className="flex items-center px-3 py-1.5 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors text-sm font-medium"
                        title="Responder mensaje"
                      >
                        <Reply size={14} className="mr-1" />
                        Responder
                      </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex space-x-1">
                      {!message.is_read && (
                        <button
                          onClick={() => handleStatusUpdate(message.id, 'read', true)}
                          disabled={updatingStates[message.id]}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Marcar como leído"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleStatusUpdate(message.id, 'starred', !message.is_starred)}
                        disabled={updatingStates[message.id]}
                        className={`p-1.5 rounded transition-colors ${
                          message.is_starred 
                            ? 'text-yellow-600 hover:bg-yellow-100' 
                            : 'text-[#6c7a89] hover:bg-gray-100'
                        }`}
                        title={message.is_starred ? 'Quitar destacado' : 'Destacar'}
                      >
                        <Star size={14} />
                      </button>
                      
                      <button
                        onClick={() => handleStatusUpdate(message.id, 'archived', !message.is_archived)}
                        disabled={updatingStates[message.id]}
                        className="p-1.5 text-[#6c7a89] hover:bg-gray-100 rounded transition-colors"
                        title={message.is_archived ? 'Desarchivar' : 'Archivar'}
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-[#e0e6e5]">
            <p className="text-sm text-[#6c7a89]">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-[#e0e6e5] rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f9f8]"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-[#e0e6e5] rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f9f8]"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedMessage && (
        <MessageReplyModal
          isOpen={showReplyModal}
          onClose={() => {
            setShowReplyModal(false);
            setSelectedMessage(null);
          }}
          message={selectedMessage}
          onReplySuccess={handleReplySuccess}
        />
      )}
    </div>
  );
}