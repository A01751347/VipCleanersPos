'use client';
// components/admin/pos/PointPaymentStatus.tsx
import React, { useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Smartphone,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface PointPaymentStatusProps {
  mercadoPagoOrderId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

type PaymentStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled' | 'error';

export default function PointPaymentStatus({
  mercadoPagoOrderId,
  amount,
  onSuccess,
  onError,
  onCancel
}: PointPaymentStatusProps) {
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [message, setMessage] = useState('Esperando pago en Point Smart...');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Polling para verificar estado del pago
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(
          `/api/admin/mercadopago?orderId=${encodeURIComponent(mercadoPagoOrderId)}`
        );

        if (!response.ok) {
          throw new Error('Error al consultar estado de pago');
        }

        const data = await response.json();

        if (data.status === 'approved' || data.order?.status === 'paid') {
          setStatus('approved');
          setMessage('¡Pago aprobado exitosamente!');
          clearInterval(pollInterval);
          clearInterval(timeInterval);

          // Esperar 2 segundos antes de llamar onSuccess para que el usuario vea el mensaje
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else if (data.status === 'rejected' || data.order?.status === 'rejected') {
          setStatus('rejected');
          setMessage('Pago rechazado. Intenta con otro método.');
          clearInterval(pollInterval);
          clearInterval(timeInterval);
        } else if (data.status === 'cancelled' || data.order?.status === 'cancelled') {
          setStatus('cancelled');
          setMessage('Pago cancelado.');
          clearInterval(pollInterval);
          clearInterval(timeInterval);
        } else {
          // Aún pendiente
          setStatus('processing');
          setMessage('Cliente está procesando el pago en Point Smart...');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setRetryCount(prev => prev + 1);

        if (retryCount >= 3) {
          setStatus('error');
          setMessage('Error al verificar el pago. Por favor, verifica manualmente.');
          clearInterval(pollInterval);
          clearInterval(timeInterval);
          onError('Error al verificar estado de pago');
        }
      }
    };

    // Iniciar polling cada 3 segundos
    pollInterval = setInterval(checkPaymentStatus, 3000);

    // Contador de tiempo
    timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Check inmediato
    checkPaymentStatus();

    // Timeout después de 5 minutos
    const timeout = setTimeout(() => {
      if (status === 'pending' || status === 'processing') {
        clearInterval(pollInterval);
        clearInterval(timeInterval);
        setStatus('error');
        setMessage('Tiempo de espera excedido. Verifica el estado del pago manualmente.');
      }
    }, 300000); // 5 minutos

    return () => {
      clearInterval(pollInterval);
      clearInterval(timeInterval);
      clearTimeout(timeout);
    };
  }, [mercadoPagoOrderId, retryCount, status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Loader2 size={64} className="animate-spin text-blue-500" />;
      case 'approved':
        return <CheckCircle size={64} className="text-green-500" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle size={64} className="text-red-500" />;
      case 'error':
        return <AlertCircle size={64} className="text-orange-500" />;
      default:
        return <Smartphone size={64} className="text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-50 border-red-200';
      case 'error':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#313D52] text-center">
            Pago con Mercado Pago Point
          </h2>
        </div>

        {/* Contenido */}
        <div className={`p-8 border-2 ${getStatusColor()} transition-all`}>
          {/* Icono de estado */}
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>

          {/* Monto */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 mb-1">Monto a cobrar</p>
            <p className="text-3xl font-bold text-[#313D52]">
              ${amount.toFixed(2)}
            </p>
          </div>

          {/* Mensaje de estado */}
          <div className="text-center mb-6">
            <p className="text-lg text-gray-700">{message}</p>
          </div>

          {/* Tiempo transcurrido */}
          {(status === 'pending' || status === 'processing') && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-white rounded-lg border border-gray-200">
                <Smartphone size={16} className="mr-2 text-blue-500" />
                <span className="text-sm text-gray-600">
                  Tiempo transcurrido: {formatTime(elapsedTime)}
                </span>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          {status === 'pending' || status === 'processing' ? (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                💡 Asegúrate de que el dispositivo Point Smart esté encendido y conectado.
                El pago aparecerá automáticamente en la pantalla del Point.
              </p>
            </div>
          ) : null}

          {/* Indicador de conexión */}
          {status === 'processing' && (
            <div className="mt-4 flex justify-center">
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Conectado con Point Smart
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="p-6 border-t border-gray-200">
          {status === 'pending' || status === 'processing' ? (
            <button
              onClick={onCancel}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar y volver
            </button>
          ) : status === 'approved' ? (
            <button
              onClick={onSuccess}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <CheckCircle size={20} className="mr-2" />
              Continuar
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setStatus('pending');
                  setMessage('Reintentando...');
                  setRetryCount(0);
                  setElapsedTime(0);
                }}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <RefreshCw size={20} className="mr-2" />
                Reintentar
              </button>
              <button
                onClick={onCancel}
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar y elegir otro método
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
