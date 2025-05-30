'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, UserX, Loader2 } from 'lucide-react';

interface Client {
  id?: number;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  codigo_postal?: string;
  ciudad?: string;
  estado?: string;
}

interface ClientSearchProps {
  onSelectClient: (client: Client | null) => void;
  selectedClient: Client | null;
}

const ClientSearch: React.FC<ClientSearchProps> = ({ onSelectClient, selectedClient }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchClients = async () => {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const response = await fetch(`/api/admin/clients?search=${encodeURIComponent(searchQuery)}`);

        if (!response.ok) throw new Error('Error al buscar clientes');

        const data = await response.json();
        setSearchResults(data.clients || []);
        setIsDropdownOpen(data.clients && data.clients.length > 0);
      } catch (error) {
        console.error('Error al buscar clientes:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchClients();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleSearchFocus = () => {
    if (searchQuery.length >= 3 && searchResults.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const handleRemoveClient = () => {
    onSelectClient(null);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {selectedClient ? (
        <div className="bg-white p-3 rounded-lg border border-[#e0e6e5] flex justify-between items-center">
          <div>
            <div className="font-medium text-[#313D52]">
              {selectedClient.nombre} {selectedClient.apellidos || ''}
            </div>
            <div className="text-sm text-[#6c7a89]">
              {selectedClient.telefono} {selectedClient.email ? `• ${selectedClient.email}` : ''}
            </div>
          </div>
          <button
            onClick={handleRemoveClient}
            className="p-1 hover:bg-red-50 rounded text-red-500"
          >
            <UserX size={18} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-[#6c7a89]" />
          </div>
          <input
            type="text"
            placeholder="Buscar cliente por nombre, teléfono o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 size={16} className="animate-spin text-[#78f3d3]" />
            </div>
          )}

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-[#e0e6e5] shadow-lg max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                <ul>
                  {searchResults.map((client, index) => {
                    const uniqueKey =
                      client.id?.toString() ??
                      `${client.telefono ?? ''}-${client.email ?? ''}-${index}`;

                    return (
                      <li key={uniqueKey}>
                        <button
                          onClick={() => handleSelectClient(client)}
                          className="w-full text-left px-4 py-3 hover:bg-[#f5f9f8] border-b border-[#e0e6e5] last:border-b-0"
                        >
                          <div className="font-medium text-[#313D52]">
                            {client.nombre} {client.apellidos || ''}
                          </div>
                          <div className="text-sm text-[#6c7a89]">
                            {client.telefono} {client.email ? `• ${client.email}` : ''}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-4 px-4 text-center text-[#6c7a89]">
                  <p>No se encontraron resultados</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {searchQuery.length > 0 && searchQuery.length < 3 && (
        <p className="mt-1 text-xs text-[#6c7a89]">
          Ingresa al menos 3 caracteres para buscar
        </p>
      )}
    </div>
  );
};

export default ClientSearch;
