'use client'
// components/admin/StatusFilter.tsx
import React, { useState } from 'react';
import { Filter, Check } from 'lucide-react';

interface StatusFilterProps {
  selectedStatus: string[];
  onChange: (statuses: string[]) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ selectedStatus, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const statuses = [
    { value: '9', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { value: '1', label: 'Recibido', color: 'bg-blue-100 text-blue-800' },
    { value: '2', label: 'En Proceso', color: 'bg-orange-100 text-orange-800' },
    { value: '6', label: 'Completado', color: 'bg-green-100 text-green-800' },
    { value: '7', label: 'Entregado', color: 'bg-green-100 text-green-800' },
    { value: '8', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ];

  const toggleStatus = (status: string) => {
    if (selectedStatus.includes(status)) {
      onChange(selectedStatus.filter(s => s !== status));
    } else {
      onChange([...selectedStatus, status]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStatus.length === statuses.length) {
      onChange([]);
    } else {
      onChange(statuses.map(s => s.value));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between px-4 py-2 w-48 rounded-lg border border-[#e0e6e5] bg-white hover:bg-[#f5f9f8] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
      >
        <div className="flex items-center">
          <Filter size={16} className="mr-2 text-[#6c7a89]" />
          <span className="text-sm">
            {selectedStatus.length === 0 
              ? 'Todos los estados' 
              : selectedStatus.length === 1 
                ? statuses.find(s => s.value === selectedStatus[0])?.label
                : `${selectedStatus.length} estados`}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute mt-1 w-64 bg-white border border-[#e0e6e5] rounded-lg shadow-lg z-10">
          <div className="p-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md hover:bg-[#f5f9f8]"
            >
              <span>{selectedStatus.length === statuses.length ? 'Deseleccionar todos' : 'Seleccionar todos'}</span>
              {selectedStatus.length === statuses.length && (
                <Check size={16} className="text-[#78f3d3]" />
              )}
            </button>
            
            <div className="h-px bg-[#e0e6e5] my-1"></div>
            
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => toggleStatus(status.value)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md hover:bg-[#f5f9f8]"
              >
                <div className="flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${status.color.split(' ')[0]}`}></span>
                  <span>{status.label}</span>
                </div>
                {selectedStatus.includes(status.value) && (
                  <Check size={16} className="text-[#78f3d3]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusFilter;