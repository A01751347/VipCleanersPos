'use client'
// components/admin/RecentMessagesTable.tsx
import React from 'react';
import { 
  Mail,
  MailOpen,
  Star,
  Clock,
  MessageSquare
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

interface RecentMessagesTableProps {
  messages: Message[];
}

const RecentMessagesTable: React.FC<RecentMessagesTableProps> = ({ messages = [] }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    // Si es hoy, mostrar solo la hora
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es ayer, mostrar "Ayer"
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    
    // Si es este año, mostrar día y mes
    if (messageDate.getFullYear() === today.getFullYear()) {
      return messageDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    }
    
    // Para años anteriores, mostrar día, mes y año
    return messageDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Si no hay mensajes, mostrar mensaje
  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-[#6c7a89]">
        <MessageSquare size={40} className="mx-auto mb-4 opacity-50" />
        <p>No hay mensajes recientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.slice(0, 5).map((message) => (
        <Link 
          key={message.id} 
          href={`/admin/messages`}
          className="block"
        >
          <div className={`p-4 rounded-lg border transition-colors hover:bg-[#f5f9f8] ${
            !message.is_read 
              ? 'bg-[#f0fdfb] border-[#78f3d3]/30' 
              : 'bg-white border-[#e0e6e5]'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  {message.is_read ? (
                    <MailOpen size={16} className="text-[#6c7a89] flex-shrink-0" />
                  ) : (
                    <Mail size={16} className="text-[#78f3d3] flex-shrink-0" />
                  )}
                  {message.is_starred ?(
                    <Star size={16} className="text-yellow-400 flex-shrink-0" />
                  ):(
                    null
                  )}
                  <span className={`text-sm font-medium truncate ${
                    !message.is_read ? 'text-[#313D52]' : 'text-[#6c7a89]'
                  }`}>
                    {message.name}
                  </span>
                </div>
                
                <h4 className={`text-sm mb-1 truncate ${
                  !message.is_read ? 'font-semibold text-[#313D52]' : 'text-[#313D52]'
                }`}>
                  {message.subject}
                </h4>
                
                <p className="text-xs text-[#6c7a89] truncate">
                  {message.message.substring(0, 80)}...
                </p>
                
                <div className="flex items-center mt-2 text-xs text-[#6c7a89]">
                  <Clock size={12} className="mr-1" />
                  {formatDate(message.created_at)}
                </div>
              </div>
              
              {!message.is_read && (
                <div className="w-2 h-2 bg-[#78f3d3] rounded-full flex-shrink-0 mt-2"></div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RecentMessagesTable;