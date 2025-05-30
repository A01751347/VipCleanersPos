// app/clientes/CartSummary.tsx - VERSIÓN CON IVA INCLUIDO
'use client'
import React from 'react';

interface CartSummaryProps {
  subtotal: number;  // Precio sin IVA
  iva: number;       // IVA calculado
  total: number;     // Precio final (con IVA incluido)
}

const CartSummary: React.FC<CartSummaryProps> = ({ subtotal, iva, total }) => {
  // Función para formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Log para debugging
  console.log('📊 CartSummary (IVA incluido) recibió:', { subtotal, iva, total });

  return (
    <div className="bg-[#f5f9f8] p-4 rounded-lg">
      <h3 className="font-medium text-[#313D52] mb-3">Resumen de la Orden</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#6c7a89]">Subtotal (sin IVA):</span>
          <span className="text-[#313D52] font-medium">{formatCurrency(subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-[#6c7a89]">IVA (16%):</span>
          <span className="text-[#313D52] font-medium">{formatCurrency(iva)}</span>
        </div>
        
        <div className="border-t border-[#e0e6e5] pt-2 mt-3">
          <div className="flex justify-between">
            <span className="font-semibold text-[#313D52]">Total:</span>
            <span className="font-bold text-lg text-[#313D52]">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
      
    
    </div>
  );
};

export default CartSummary;