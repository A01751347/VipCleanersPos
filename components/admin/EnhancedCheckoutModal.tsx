import React, { useState } from 'react';
import { X, CreditCard, DollarSign, RefreshCw, Smartphone, Calculator, Receipt, User, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: {
    nombre: string;
    apellidos: string;
    telefono: string;
    email?: string;
  };
  items: Array<{
    nombre: string;
    precio: number;
    cantidad: number;
    tipo: 'servicio' | 'producto';
    marca?: string;
    modelo?: string;
    color?: string;
    talla?: string;
  }>;
  subtotal: number;
  iva: number;
  total: number;
  onConfirmPayment: (paymentData: {
    metodoPago: string;
    montoRecibido: number;
    referencia?: string;
    terminalId?: string;
    cuotas?: number;
    descuento?: number;
  }) => void;
}

const EnhancedCheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cliente,
  items,
  subtotal,
  iva,
  total,
  onConfirmPayment
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('efectivo');
  const [montoRecibido, setMontoRecibido] = useState<string>(total.toString());
  const [referencia, setReferencia] = useState<string>('');
  const [terminalId, setTerminalId] = useState<string>('');
  const [cuotas, setCuotas] = useState<number>(1);
  const [descuento, setDescuento] = useState<number>(0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [currentStep, setCurrentStep] = useState<number>(1);

  if (!isOpen) return null;

  const metodosP = [
    {
      id: 'efectivo',
      nombre: 'Efectivo',
      icon: DollarSign,
      descripcion: 'Pago en efectivo',
      color: 'bg-green-100 text-green-800 border-green-300'
    },
    {
      id: 'tarjeta',
      nombre: 'Tarjeta',
      icon: CreditCard,
      descripcion: 'Débito o Crédito',
      color: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
      id: 'transferencia',
      nombre: 'Transferencia',
      icon: RefreshCw,
      descripcion: 'Transferencia bancaria',
      color: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    {
      id: 'mercado_pago',
      nombre: 'Mercado Pago',
      icon: Smartphone,
      descripcion: 'Pago digital',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
    }
  ];

  const terminales = [
    { id: '1', nombre: 'Terminal Principal - Mostrador' },
    { id: '2', nombre: 'Terminal Móvil - Área de Servicio' },
    { id: '3', nombre: 'Terminal Backup - Oficina' }
  ];

  const totalConDescuento = total - descuento;
  const cambio = selectedPaymentMethod === 'efectivo' && parseFloat(montoRecibido) > totalConDescuento 
    ? parseFloat(montoRecibido) - totalConDescuento 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
    
    // Reset specific fields
    setReferencia('');
    setTerminalId('');
    setCuotas(1);
    
    // Set amount based on method
    if (method !== 'efectivo') {
      setMontoRecibido(totalConDescuento.toString());
    }
    
    setErrors({});
  };

  const validateStep1 = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!selectedPaymentMethod) {
      newErrors.metodo = 'Selecciona un método de pago';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: {[key: string]: string} = {};
    const monto = parseFloat(montoRecibido);
    
    if (!montoRecibido || isNaN(monto)) {
      newErrors.monto = 'Ingresa un monto válido';
    } else if (monto <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    } else if (selectedPaymentMethod === 'efectivo' && monto < totalConDescuento) {
      newErrors.monto = 'El monto debe ser al menos igual al total';
    } else if (selectedPaymentMethod !== 'efectivo' && monto !== totalConDescuento) {
      newErrors.monto = 'El monto debe ser exacto para este método de pago';
    }

    if (selectedPaymentMethod === 'transferencia' && !referencia.trim()) {
      newErrors.referencia = 'Ingresa la referencia de transferencia';
    }

    if (selectedPaymentMethod === 'tarjeta' && !terminalId) {
      newErrors.terminal = 'Selecciona una terminal';
    }

    if (descuento > total * 0.5) {
      newErrors.descuento = 'El descuento no puede ser mayor al 50%';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleConfirm = () => {
    if (!validateStep2()) return;

    onConfirmPayment({
      metodoPago: selectedPaymentMethod,
      montoRecibido: parseFloat(montoRecibido),
      referencia: referencia || undefined,
      terminalId: terminalId || undefined,
      cuotas: selectedPaymentMethod === 'tarjeta' ? cuotas : undefined,
      descuento: descuento > 0 ? descuento : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#313D52] to-[#3e4a61] px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-bold">Checkout - Procesamiento de Pago</h2>
            <p className="opacity-90">
              Cliente: {cliente.nombre} {cliente.apellidos} • {cliente.telefono}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-[#f5f9f8] border-b border-[#e0e6e5]">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-[#78f3d3]' : 'text-[#6c7a89]'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                currentStep >= 1 ? 'bg-[#78f3d3] text-white' : 'bg-[#e0e6e5]'
              }`}>
                1
              </div>
              <span className="font-medium">Método de Pago</span>
            </div>
            <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-[#78f3d3]' : 'bg-[#e0e6e5]'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-[#78f3d3]' : 'text-[#6c7a89]'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                currentStep >= 2 ? 'bg-[#78f3d3] text-white' : 'bg-[#e0e6e5]'
              }`}>
                2
              </div>
              <span className="font-medium">Detalles del Pago</span>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(95vh-160px)]">
          {/* Left Panel - Order Summary */}
          <div className="w-1/3 bg-[#f5f9f8] p-6 border-r border-[#e0e6e5] overflow-y-auto">
            <h3 className="font-semibold text-[#313D52] mb-4 flex items-center">
              <Receipt size={20} className="mr-2" />
              Resumen de la Orden
            </h3>

            {/* Items */}
            <div className="space-y-3 mb-6">
              {items.map((item, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-[#e0e6e5]">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-[#313D52] text-sm">{item.nombre}</h4>
                      {item.marca && (
                        <p className="text-xs text-[#6c7a89] mt-1">
                          {item.marca} {item.modelo} • {item.color} • Talla {item.talla}
                        </p>
                      )}
                      <p className="text-xs text-[#6c7a89]">
                        {item.cantidad} x {formatCurrency(item.precio)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-[#313D52]">
                      {formatCurrency(item.precio * item.cantidad)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-white p-4 rounded-lg border border-[#e0e6e5] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#6c7a89]">Subtotal:</span>
                <span className="text-[#313D52]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6c7a89]">IVA (16%):</span>
                <span className="text-[#313D52]">{formatCurrency(iva)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(descuento)}</span>
                </div>
              )}
              <div className="border-t border-[#e0e6e5] pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-[#313D52]">Total:</span>
                  <span className="text-[#313D52]">{formatCurrency(totalConDescuento)}</span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mt-6 bg-white p-4 rounded-lg border border-[#e0e6e5]">
              <h4 className="font-medium text-[#313D52] mb-2 flex items-center">
                <User size={16} className="mr-2" />
                Cliente
              </h4>
              <div className="text-sm space-y-1">
                <p className="text-[#313D52]">{cliente.nombre} {cliente.apellidos}</p>
                <p className="text-[#6c7a89]">{cliente.telefono}</p>
                {cliente.email && <p className="text-[#6c7a89]">{cliente.email}</p>}
              </div>
            </div>
          </div>

          {/* Right Panel - Payment Details */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#313D52] mb-6">
                  Selecciona el Método de Pago
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {metodosP.map((metodo) => {
                    const IconComponent = metodo.icon;
                    return (
                      <button
                        key={metodo.id}
                        onClick={() => handlePaymentMethodChange(metodo.id)}
                        className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                          selectedPaymentMethod === metodo.id
                            ? `${metodo.color} border-opacity-50 shadow-lg scale-105`
                            : 'border-[#e0e6e5] hover:border-[#78f3d3] hover:shadow-md'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className={`p-4 rounded-full ${
                            selectedPaymentMethod === metodo.id ? 'bg-white bg-opacity-30' : 'bg-[#f5f9f8]'
                          }`}>
                            <IconComponent size={32} className={
                              selectedPaymentMethod === metodo.id ? 'text-current' : 'text-[#6c7a89]'
                            } />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{metodo.nombre}</h4>
                            <p className="text-sm opacity-80">{metodo.descripcion}</p>
                          </div>
                          {selectedPaymentMethod === metodo.id && (
                            <CheckCircle size={24} className="text-current" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {errors.metodo && (
                  <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle size={16} className="mr-2" />
                    {errors.metodo}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#313D52] mb-6">
                  Detalles del Pago - {metodosP.find(m => m.id === selectedPaymentMethod)?.nombre}
                </h3>

                {/* Descuento */}
                <div className="bg-[#f5f9f8] p-4 rounded-lg">
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Descuento (Opcional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="0"
                      max={total * 0.5}
                      step="0.01"
                      value={descuento}
                      onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                      placeholder="0.00"
                    />
                    <span className="text-[#6c7a89]">MXN (Máx. 50%)</span>
                  </div>
                  {errors.descuento && <p className="mt-1 text-sm text-red-600">{errors.descuento}</p>}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    {selectedPaymentMethod === 'efectivo' ? 'Monto Recibido' : 'Monto a Cobrar'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-[#6c7a89]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      className={`w-full pl-8 pr-12 py-3 rounded-lg border ${
                        errors.monto ? 'border-red-300 bg-red-50' : 'border-[#e0e6e5]'
                      } focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-lg font-semibold`}
                      readOnly={selectedPaymentMethod !== 'efectivo'}
                    />
                    <span className="absolute right-3 top-3 text-[#6c7a89]">MXN</span>
                  </div>
                  {errors.monto && <p className="mt-1 text-sm text-red-600">{errors.monto}</p>}
                  
                  {cambio > 0 && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-green-700 font-medium">Cambio a entregar:</span>
                        <span className="text-green-800 font-bold text-lg">{formatCurrency(cambio)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method Specific Fields */}
                {selectedPaymentMethod === 'tarjeta' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                        Terminal
                      </label>
                      <select
                        value={terminalId}
                        onChange={(e) => setTerminalId(e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.terminal ? 'border-red-300 bg-red-50' : 'border-[#e0e6e5]'
                        } focus:outline-none focus:ring-2 focus:ring-[#78f3d3]`}
                      >
                        <option value="">Seleccionar terminal...</option>
                        {terminales.map(terminal => (
                          <option key={terminal.id} value={terminal.id}>{terminal.nombre}</option>
                        ))}
                      </select>
                      {errors.terminal && <p className="mt-1 text-sm text-red-600">{errors.terminal}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                        Cuotas
                      </label>
                      <select
                        value={cuotas}
                        onChange={(e) => setCuotas(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                      >
                        <option value={1}>1 cuota (sin intereses)</option>
                        <option value={3}>3 cuotas</option>
                        <option value={6}>6 cuotas</option>
                        <option value={12}>12 cuotas</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'transferencia' && (
                  <div>
                    <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                      Referencia de Transferencia
                    </label>
                    <input
                      type="text"
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      placeholder="Número de referencia o confirmación"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.referencia ? 'border-red-300 bg-red-50' : 'border-[#e0e6e5]'
                      } focus:outline-none focus:ring-2 focus:ring-[#78f3d3]`}
                    />
                    {errors.referencia && <p className="mt-1 text-sm text-red-600">{errors.referencia}</p>}
                  </div>
                )}

                {selectedPaymentMethod === 'mercado_pago' && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Smartphone size={20} className="text-blue-600 mr-2" />
                      <span className="font-medium text-blue-800">Pago con Mercado Pago</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      El cliente puede escanear el código QR o usar el link de pago para completar la transacción.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e0e6e5] p-6 bg-[#f5f9f8]">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-[#313D52]">
              Total a Cobrar: {formatCurrency(totalConDescuento)}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-[#e0e6e5] text-[#6c7a89] rounded-lg hover:bg-white transition-colors font-medium"
              >
                Cancelar
              </button>
              
              {currentStep === 1 ? (
                <button
                  onClick={handleNextStep}
                  disabled={!selectedPaymentMethod}
                  className="px-8 py-3 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors font-semibold flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                  <span className="ml-2">→</span>
                </button>
              ) : (
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border border-[#78f3d3] text-[#78f3d3] rounded-lg hover:bg-[#78f3d3] hover:text-[#313D52] transition-colors font-medium"
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-8 py-3 bg-[#313D52] text-white rounded-lg hover:bg-[#3e4a61] transition-colors font-semibold flex items-center"
                  >
                    <CreditCard size={20} className="mr-2" />
                    Confirmar Pago
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckoutModal;