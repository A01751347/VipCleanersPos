'use client'
// components/admin/pos/PaymentForm.tsx
import React, { useState } from 'react';
import { CreditCard, DollarSign, RefreshCw, Smartphone, Loader2, AlertCircle } from 'lucide-react';

interface PaymentFormProps {
  total: number;
  onSubmit: (data: { metodoPago: string; monto: number; referencia?: string; terminalId?: string }) => void;
  onCancel: () => void;
}

// Tipos de métodos de pago
type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'mercado_pago';

const PaymentForm: React.FC<PaymentFormProps> = ({ total, onSubmit, onCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [amount, setAmount] = useState<string>(total.toFixed(2));
  const [reference, setReference] = useState<string>('');
  const [terminalId, setTerminalId] = useState<string>('');
  const [change, setChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Función para formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Calcular cambio cuando el monto en efectivo cambia
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    
    // Calcular cambio solo para pagos en efectivo
    if (paymentMethod === 'efectivo') {
      const numAmount = parseFloat(newAmount) || 0;
      setChange(numAmount > total ? numAmount - total : 0);
    }
    
    // Limpiar error
    if (errors.amount) {
      setErrors({ ...errors, amount: '' });
    }
  };
  
  // Cambiar método de pago
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    
    // Resetear campos específicos del método
    setReference('');
    setTerminalId('');
    
    // Para métodos que no son efectivo, el monto es exactamente el total
    if (method !== 'efectivo') {
      setAmount(total.toFixed(2));
      setChange(0);
    }
  };
  
  // Validar y enviar formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: {[key: string]: string} = {};
    const numAmount = parseFloat(amount);
    
    // Validar monto
    if (!amount || isNaN(numAmount)) {
      newErrors.amount = 'Ingresa un monto válido';
    } else if (numAmount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    } else if (paymentMethod !== 'efectivo' && numAmount !== total) {
      // Para métodos de pago que no son efectivo, el monto debe ser exacto
      newErrors.amount = 'El monto debe ser igual al total';
      setAmount(total.toFixed(2));
    } else if (paymentMethod === 'efectivo' && numAmount < total) {
      newErrors.amount = 'El monto debe ser al menos igual al total';
    }
    
    // Validar referencia para transferencia
    if (paymentMethod === 'transferencia' && !reference.trim()) {
      newErrors.reference = 'Ingresa una referencia';
    }
    
    // Validar terminal para tarjeta
    if (paymentMethod === 'tarjeta' && !terminalId.trim()) {
      newErrors.terminalId = 'Selecciona una terminal';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    // Simular procesamiento de pago
    setTimeout(() => {
      onSubmit({
        metodoPago: paymentMethod,
        monto: numAmount,
        referencia: reference || undefined,
        terminalId: terminalId || undefined
      });
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="mb-6">
        <div className="text-center mb-8">
          <div className="text-sm text-[#6c7a89]">Total a pagar</div>
          <div className="text-3xl font-bold text-[#313D52]">{formatCurrency(total)}</div>
        </div>
        
        {/* Métodos de pago */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#6c7a89] mb-2">
            Método de pago
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handlePaymentMethodChange('efectivo')}
              className={`p-3 rounded-lg flex items-center justify-center border ${
                paymentMethod === 'efectivo'
                  ? 'bg-[#e0f7f0] border-[#78f3d3] text-[#313D52]'
                  : 'border-[#e0e6e5] text-[#6c7a89] hover:bg-[#f5f9f8]'
              }`}
            >
              <DollarSign size={20} className="mr-2" />
              Efectivo
            </button>
            
            <button
              type="button"
              onClick={() => handlePaymentMethodChange('tarjeta')}
              className={`p-3 rounded-lg flex items-center justify-center border ${
                paymentMethod === 'tarjeta'
                  ? 'bg-[#e0f7f0] border-[#78f3d3] text-[#313D52]'
                  : 'border-[#e0e6e5] text-[#6c7a89] hover:bg-[#f5f9f8]'
              }`}
            >
              <CreditCard size={20} className="mr-2" />
              Tarjeta
            </button>
            
            <button
              type="button"
              onClick={() => handlePaymentMethodChange('transferencia')}
              className={`p-3 rounded-lg flex items-center justify-center border ${
                paymentMethod === 'transferencia'
                  ? 'bg-[#e0f7f0] border-[#78f3d3] text-[#313D52]'
                  : 'border-[#e0e6e5] text-[#6c7a89] hover:bg-[#f5f9f8]'
              }`}
            >
              <RefreshCw size={20} className="mr-2" />
              Transferencia
            </button>
            
            <button
              type="button"
              onClick={() => handlePaymentMethodChange('mercado_pago')}
              className={`p-3 rounded-lg flex items-center justify-center border ${
                paymentMethod === 'mercado_pago'
                  ? 'bg-[#e0f7f0] border-[#78f3d3] text-[#313D52]'
                  : 'border-[#e0e6e5] text-[#6c7a89] hover:bg-[#f5f9f8]'
              }`}
            >
              <Smartphone size={20} className="mr-2" />
              Mercado Pago
            </button>
          </div>
        </div>
        
        {/* Campos específicos según método de pago */}
        <div className="space-y-4">
          {/* Monto */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-[#6c7a89] mb-1">
              {paymentMethod === 'efectivo' ? 'Monto recibido' : 'Monto a cobrar'}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-[#6c7a89] sm:text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min={paymentMethod === 'efectivo' ? total : undefined}
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                className={`block w-full pl-8 pr-12 py-3 rounded-lg border ${
                  errors.amount ? 'border-red-300 bg-red-50' : 'border-[#e0e6e5]'
                } focus:outline-none focus:ring-2 focus:ring-[#78f3d3]`}
                placeholder="0.00"
                readOnly={paymentMethod !== 'efectivo'}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[#6c7a89] sm:text-sm">MXN</span>
              </div>
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
            )}
            
            {/* Mostrar cambio cuando se paga con efectivo */}
            {paymentMethod === 'efectivo' && parseFloat(amount) > total && (
              <div className="mt-2 text-[#313D52] font-medium flex justify-end">
                <span className="text-[#6c7a89] mr-2">Cambio:</span> {formatCurrency(change)}
              </div>
            )}
          </div>
          
          {/* Referencia para transferencia */}
          {paymentMethod === 'transferencia' && (
            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-[#6c7a89] mb-1">
                Referencia de transferencia
              </label>
              <input
                type="text"
                id="reference"
                value={reference}
                onChange={(e) => {
                  setReference(e.target.value);
                  if (errors.reference) setErrors({ ...errors, reference: '' });
                }}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.reference ? 'border-red-300 bg-red-50' : 'border-[#e0e6e5]'
                } focus:outline-none focus:ring-2 focus:ring-[#78f3d3]`}
                placeholder="Número o ID de transferencia"
              />
              {errors.reference && (
                <p className="mt-1 text-xs text-red-500">{errors.reference}</p>
              )}
            </div>
          )}
          
          {/* Terminal para tarjeta */}
          {paymentMethod === 'tarjeta' && (
            <div>
              <label htmlFor="terminalId" className="block text-sm font-medium text-[#6c7a89] mb-1">
                Terminal
              </label>
              <select
                id="terminalId"
                value={terminalId}
                onChange={(e) => {
                  setTerminalId(e.target.value);
                  if (errors.terminalId) setErrors({ ...errors, terminalId: '' });
                }}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.terminalId ? 'border-red-300 bg-red-50' : 'border-[#e0e6e5]'
                } focus:outline-none focus:ring-2 focus:ring-[#78f3d3]`}
              >
                <option value="">Seleccionar terminal...</option>
                <option value="1">Terminal Principal</option>
                <option value="2">Terminal Secundaria</option>
              </select>
              {errors.terminalId && (
                <p className="mt-1 text-xs text-red-500">{errors.terminalId}</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Botones */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-[#e0e6e5] text-[#6c7a89] rounded-lg hover:bg-[#f5f9f8] transition-colors"
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard size={18} className="mr-2" />
              Completar Pago
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;