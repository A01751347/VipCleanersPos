'use client';
// components/admin/pos/EnhancedPaymentModal.tsx
import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  RefreshCw,
  Check, 
  Loader2,
  AlertCircle
} from 'lucide-react';

interface PaymentData {
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mercado_pago';
  monto: number;
  referencia?: string;
}

interface CartItem {
  id: number;
  tipo: 'producto' | 'servicio';
  nombre: string;
  precio: number;
  cantidad: number;
  marca?: string;
  modelo?: string;
  talla?: string;
  color?: string;
  descripcion?: string;
}

interface EnhancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentData) => Promise<void>;
  cartItems: CartItem[];
  subtotal: number;
  iva: number;
  total: number;
}

export default function EnhancedPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  cartItems,
  subtotal,
  iva,
  total
}: EnhancedPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'mercado_pago'>('efectivo');
  const [amountReceived, setAmountReceived] = useState<string>(total.toString());
  const [reference, setReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = Math.max(0, parseFloat(amountReceived || '0') - total);
  const isValidPayment = parseFloat(amountReceived || '0') >= total;

  const paymentMethods = [
    { 
      id: 'efectivo', 
      name: 'Efectivo', 
      icon: DollarSign, 
      color: 'bg-green-100 text-green-700 border-green-200',
      activeColor: 'bg-green-600 text-white border-green-600'
    },
    { 
      id: 'tarjeta', 
      name: 'Tarjeta', 
      icon: CreditCard, 
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      activeColor: 'bg-blue-600 text-white border-blue-600'
    },
    { 
      id: 'transferencia', 
      name: 'Transferencia', 
      icon: RefreshCw, 
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      activeColor: 'bg-purple-600 text-white border-purple-600'
    },
    { 
      id: 'mercado_pago', 
      name: 'Mercado Pago', 
      icon: Smartphone, 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      activeColor: 'bg-yellow-600 text-white border-yellow-600'
    }
  ];

  const handleMethodChange = (method: typeof paymentMethod) => {
    setPaymentMethod(method);
    setReference('');
    setError(null);
    
    // Auto-llenar el monto exacto para métodos electrónicos
    if (method !== 'efectivo') {
      setAmountReceived(total.toFixed(2));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountReceived(value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(amountReceived);
    
    if (!isValidPayment) {
      setError(`El monto debe ser mayor o igual a $${total.toFixed(2)}`);
      return;
    }

    if (paymentMethod !== 'efectivo' && !reference.trim()) {
      setError('Por favor ingresa una referencia para el pago electrónico');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      await onSubmit({
        metodoPago: paymentMethod,
        monto: amount,
        referencia: reference.trim() || undefined
      });
    } catch (error) {
      console.error('Error procesando pago:', error);
      setError('Error al procesar el pago. Intenta nuevamente.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setPaymentMethod('efectivo');
      setAmountReceived(total.toString());
      setReference('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#e0e6e5] bg-[#f5f9f8]">
          <h2 className="text-xl font-semibold text-[#313D52]">Procesar Pago</h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 hover:bg-[#e0e6e5] rounded-full transition-colors disabled:opacity-50"
          >
            <X size={24} className="text-[#6c7a89]" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Panel izquierdo: Resumen del pedido */}
          <div className="w-1/2 p-6 border-r border-[#e0e6e5] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-[#313D52]">Resumen del Pedido</h3>
            
            <div className="space-y-3 mb-6">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex justify-between items-start p-3 bg-[#f5f9f8] rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-[#313D52]">{item.nombre}</h4>
                    {(item.marca || item.modelo) && (
                      <p className="text-sm text-[#6c7a89]">
                        {item.marca} {item.modelo}
                        {item.talla && ` - Talla ${item.talla}`}
                      </p>
                    )}
                    {item.color && (
                      <p className="text-sm text-[#6c7a89]">Color: {item.color}</p>
                    )}
                    <p className="text-sm text-[#6c7a89]">
                      ${Number(item.precio).toFixed(2)} x {item.cantidad}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#313D52]">
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="border-t border-[#e0e6e5] pt-4 space-y-2">
              <div className="flex justify-between text-[#6c7a89]">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#6c7a89]">
                <span>IVA (16%):</span>
                <span>${iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-[#313D52] border-t border-[#e0e6e5] pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Panel derecho: Método de pago */}
          <div className="w-1/2 p-6">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-6 text-[#313D52]">Método de Pago</h3>
              
              {/* Selector de método de pago */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handleMethodChange(method.id as any)}
                      disabled={isProcessing}
                      className={`p-4 border-2 rounded-lg transition-all disabled:opacity-50 ${
                        isSelected 
                          ? method.activeColor
                          : method.color + ' hover:opacity-80'
                      }`}
                    >
                      <Icon size={24} className="mx-auto mb-2" />
                      <p className="text-sm font-medium">
                        {method.name}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Monto recibido */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#313D52] mb-2">
                  Monto Recibido
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c7a89] font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountReceived}
                    onChange={handleAmountChange}
                    disabled={isProcessing}
                    className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg text-lg font-semibold transition-colors ${
                      !isValidPayment 
                        ? 'border-red-300 bg-red-50 text-red-900' 
                        : 'border-[#e0e6e5] focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]'
                    } focus:outline-none disabled:opacity-50`}
                    placeholder="0.00"
                    required
                  />
                </div>
                {!isValidPayment && (
                  <p className="text-red-600 text-sm mt-1">
                    El monto debe ser mayor o igual a ${total.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Cambio (solo para efectivo) */}
              {paymentMethod === 'efectivo' && change > 0 && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-medium">Cambio a entregar:</span>
                    <span className="text-green-800 font-bold text-xl">${change.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Referencia (para métodos electrónicos) */}
              {paymentMethod !== 'efectivo' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#313D52] mb-2">
                    Referencia / Autorización *
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Número de autorización, referencia o ID de transacción"
                    className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3] disabled:opacity-50"
                    required
                  />
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle size={16} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* Botones */}
              <div className="mt-auto flex space-x-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 border-2 border-[#e0e6e5] text-[#6c7a89] rounded-lg hover:bg-[#f5f9f8] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !isValidPayment}
                  className="flex-1 px-6 py-3 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={20} className="animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Check size={20} className="mr-2" />
                      Confirmar Pago
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}