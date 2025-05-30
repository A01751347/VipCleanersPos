// components/admin/ShoesDetailCard.tsx
'use client'
import React from 'react';
import { Box, Tag, Brush } from 'lucide-react';

interface ShoesDetail {
  detalle_servicio_id: number;
  marca: string | null;
  modelo: string | null;
  descripcion: string | null;
  caja_almacenamiento?: string | null;
  codigo_ubicacion?: string | null;
  notas_especiales?: string | null;
  fecha_recepcion: string;
}

interface ShoesDetailCardProps {
  shoesDetails: ShoesDetail[];
}

const ShoesDetailCard: React.FC<ShoesDetailCardProps> = ({ shoesDetails }) => {
  if (!shoesDetails || shoesDetails.length === 0) {
    return (
      <div className="text-center py-4 text-[#6c7a89] italic">
        No hay detalles de calzado disponibles
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shoesDetails.map((detail, index) => (
        <div 
          key={detail.detalle_servicio_id} 
          className="bg-white p-4 rounded-lg border border-[#e0e6e5] hover:shadow-sm transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-[#313D52] flex items-center">
                <Brush size={18} className="mr-2" />
                {detail.marca || 'Sin marca'} {detail.modelo || 'Sin modelo'}
              </h3>
              {detail.descripcion && (
                <p className="text-sm text-[#6c7a89] mt-1">{detail.descripcion}</p>
              )}
            </div>
            {detail.codigo_ubicacion && (
              <div className="bg-[#f5f9f8] px-3 py-1 rounded-lg flex items-center">
                <Box size={16} className="mr-2 text-[#78f3d3]" />
                <span className="text-sm font-medium text-[#313D52]">
                  {detail.caja_almacenamiento || 'Caja'} - {detail.codigo_ubicacion}
                </span>
              </div>
            )}
          </div>
          
          {detail.notas_especiales && (
            <div className="mt-3 bg-[#e0f7f0] px-3 py-2 rounded-lg">
              <p className="text-sm text-[#313D52]">
                <span className="font-medium">Notas especiales:</span> {detail.notas_especiales}
              </p>
            </div>
          )}
          
          <div className="mt-3 flex items-center">
            <Tag size={14} className="mr-1 text-[#6c7a89]" />
            <p className="text-xs text-[#6c7a89]">
              Recibido: {new Date(detail.fecha_recepcion).toLocaleDateString('es-MX')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShoesDetailCard;