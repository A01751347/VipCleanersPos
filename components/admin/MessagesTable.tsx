'use client'
// components/admin/MessagesTable.tsx
import React, { useState } from 'react';
import {
  Eye,
  CheckSquare,
  Trash2,
  MoreVertical,
  ChevronDown,
  Mail,
  MailOpen,
  Archive,
  Star,
  Clock,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  is_read?: boolean;
  is_starred?: boolean;
  is_archived?: boolean;
}

interface MessagesTableProps {
  messages: Message[];
  onStatusChange?: () => void;
  /**
   * Si es true, muestra solo mensajes archivados; si es false, solo no archivados.
   */
  showArchived?: boolean;
}

const MessagesTable: React.FC<MessagesTableProps> = ({ messages = [], onStatusChange, showArchived = false }) => {
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isUpdating, setIsUpdating] = useState<{ id: number; action: string; } | null>(null);

  // Filtrar mensajes según el flag showArchived
  const displayMessages = messages.filter(msg => (!!msg.is_archived) === showArchived);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    if (messageDate.getFullYear() === today.getFullYear()) {
      return messageDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    }
    return messageDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleDropdown = (id: number) => {
    setActiveDropdown(prev => (prev === id ? null : id));
  };

  const toggleSelectMessage = (id: number) => {
    setSelectedMessages(prev => prev.includes(id)
      ? prev.filter(mid => mid !== id)
      : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(displayMessages.map(m => m.id));
    }
    setSelectAll(prev => !prev);
  };

  // Helpers for status updates
  const updateStatus = async (id: number, action: 'read' | 'starred' | 'archived', value: boolean) => {
    try {
      setIsUpdating({ id, action });
      setActiveDropdown(null);
      const response = await fetch(`/api/admin/messages/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
      if (!response.ok) throw new Error('Error al actualizar el estado');
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error(error);
      alert('Error al actualizar el estado del mensaje');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleMarkAsRead = (id: number, isRead: boolean) => updateStatus(id, 'read', isRead);
  const handleStarMessage = (id: number, isStarred: boolean) => updateStatus(id, 'starred', isStarred);
  const handleArchiveMessage = (id: number, isArchived: boolean) => updateStatus(id, 'archived', isArchived);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este mensaje?')) return;
    try {
      setIsUpdating({ id, action: 'delete' });
      setActiveDropdown(null);
      await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error(error);
      alert('Error al eliminar el mensaje');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
      <table className="min-w-full divide-y divide-[#e0e6e5]">
        <thead>
          <tr>
            <th className="px-4 py-3 w-10">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-[#e0e6e5] text-[#78f3d3] focus:ring-[#78f3d3]"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                />
              </div>
            </th>
            <th className="px-4 py-3 w-10"></th>
            {['name', 'subject', 'created_at'].map((field, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-xs font-medium text-[#6c7a89] uppercase tracking-wider cursor-pointer hover:bg-[#f5f9f8]"
                onClick={() => toggleSort(field)}
              >
                <div className="flex items-center">
                  <span>{field === 'name' ? 'Remitente' : field === 'subject' ? 'Asunto' : 'Fecha'}</span>
                  {sortField === field && (
                    <ChevronDown
                      size={16}
                      className={`ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                    />
                  )}
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-[#6c7a89] uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#e0e6e5]">
          {messages.map((message) => (
            <tr
              key={message.id}
              className={`hover:bg-[#f5f9f8] ${!message.is_read ? 'bg-[#f0fdfb]' : ''} ${message.is_archived ? 'opacity-70' : ''} ${isUpdating && isUpdating.id === message.id ? 'opacity-50' : ''}`}
            >
              <td className="px-4 py-4 w-10">
                <input
                  type="checkbox"
                  className="rounded border-[#e0e6e5] text-[#78f3d3] focus:ring-[#78f3d3]"
                  checked={selectedMessages.includes(message.id)}
                  onChange={() => toggleSelectMessage(message.id)}
                  disabled={isUpdating !== null}
                />
              </td>
              <td className="px-4 py-4 w-10">
                {isUpdating && isUpdating.id === message.id ? (
                  <Loader2 size={18} className="animate-spin text-[#78f3d3]" />
                ) : (
                  <div className="flex space-x-1">
                    {message.is_read ? (
                      <MailOpen size={18} className="text-[#6c7a89]" />
                    ) : (
                      <Mail size={18} className="text-[#78f3d3]" />
                    )}
                    {message.is_starred ? (
                      <Star size={18} className="text-yellow-400" />
                    ) : null}

                    {message.is_archived ? (
                      <Archive size={18} className="text-[#6c7a89]" />
                    ) : null}

                  </div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-[#313D52]">{message.name}</div>
                <div className="text-xs text-[#6c7a89]">{message.email}</div>
              </td>
              <td className="px-4 py-4">
                <div className={`text-sm ${!message.is_read ? 'font-semibold text-[#313D52]' : 'text-[#6c7a89]'}`}>
                  {message.subject}
                </div>
                <div className="text-xs text-[#6c7a89] truncate max-w-md">
                  {message.message.substring(0, 120)}...
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-[#6c7a89]">
                <div className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  {formatDate(message.created_at)}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="relative inline-block text-left">
                  <button
                    onClick={() => toggleDropdown(message.id)}
                    className="p-1 rounded-full hover:bg-[#e0e6e5] text-[#6c7a89]"
                    disabled={isUpdating !== null}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {activeDropdown === message.id && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white z-50 ring-1 ring-[#e0e6e5] divide-y divide-[#e0e6e5]">
                      <div className="py-1">
                        <Link
                          href={`/admin/messages/${message.id}`}
                          className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8]"
                        >
                          <Eye size={16} className="mr-3 text-[#6c7a89]" />
                          Ver mensaje
                        </Link>
                        {message.is_read ? (
                          <button
                            onClick={() => handleMarkAsRead(message.id, false)}
                            className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          >
                            <Mail size={16} className="mr-3 text-[#6c7a89]" />
                            Marcar como no leído
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkAsRead(message.id, true)}
                            className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          >
                            <CheckSquare size={16} className="mr-3 text-[#6c7a89]" />
                            Marcar como leído
                          </button>
                        )}
                      </div>

                      <div className="py-1">
                        {message.is_starred ? (
                          <button
                            onClick={() => handleStarMessage(message.id, false)}
                            className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          >
                            <Star size={16} className="mr-3 text-[#6c7a89]" />
                            Quitar destacado
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStarMessage(message.id, true)}
                            className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          >
                            <Star size={16} className="mr-3 text-[#6c7a89]" />
                            Destacar
                          </button>
                        )}

                        {message.is_archived ? (
                          <button
                            onClick={() => handleArchiveMessage(message.id, false)}
                            className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          >
                            <Archive size={16} className="mr-3 text-[#6c7a89]" />
                            Desarchivar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchiveMessage(message.id, true)}
                            className="flex items-center px-4 py-2 text-sm text-[#313D52] hover:bg-[#f5f9f8] w-full text-left"
                          >
                            <Archive size={16} className="mr-3 text-[#6c7a89]" />
                            Archivar
                          </button>
                        )}
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <Trash2 size={16} className="mr-3" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MessagesTable;