'use client'
// app/admin/debug/page.tsx
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Database, Wrench } from 'lucide-react';

interface OrderCheck {
  orden_id: number;
  codigo_orden: string;
  estado_actual_id: number;
  estado_actual_nombre: string;
  total_estados_historial: number;
  ultimo_cambio: string | null;
}

const DebugPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const checkIntegrity = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/debug/order-history');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
        setMessage({
          type: 'info',
          text: `Verificación completada. Se encontraron ${data.orders.length} órdenes.`
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Error al verificar integridad'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error de conexión al verificar integridad'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const repairHistory = async () => {
    if (!confirm('¿Estás seguro de que quieres reparar el historial de órdenes? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/debug/order-history', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message
        });
        // Recargar la verificación después de la reparación
        await checkIntegrity();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Error al reparar historial'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error de conexión al reparar historial'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#313D52] mb-2">
            Diagnóstico del Sistema
          </h1>
          <p className="text-[#6c7a89]">
            Herramientas para diagnosticar y reparar problemas en la base de datos
          </p>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-700' :
            message.type === 'error' ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle size={20} className="mr-2" />
            ) : message.type === 'error' ? (
              <AlertTriangle size={20} className="mr-2" />
            ) : (
              <Database size={20} className="mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* Sección de historial de órdenes */}
        <div className="bg-white rounded-lg border border-[#e0e6e5] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#313D52] mb-1">
                Historial de Estados de Órdenes
              </h2>
              <p className="text-[#6c7a89] text-sm">
                Verifica y repara el historial de cambios de estado de las órdenes
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={checkIntegrity}
                disabled={isLoading}
                className="flex items-center px-4 py-2 border border-[#e0e6e5] text-[#313D52] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                  <Database size={16} className="mr-2" />
                )}
                Verificar Integridad
              </button>
              
              <button
                onClick={repairHistory}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                  <Wrench size={16} className="mr-2" />
                )}
                Reparar Historial
              </button>
            </div>
          </div>

          {orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e0e6e5]">
                    <th className="text-left py-3 px-4 font-medium text-[#313D52]">Código</th>
                    <th className="text-left py-3 px-4 font-medium text-[#313D52]">Estado Actual</th>
                    <th className="text-left py-3 px-4 font-medium text-[#313D52]">Registros en Historial</th>
                    <th className="text-left py-3 px-4 font-medium text-[#313D52]">Último Cambio</th>
                    <th className="text-left py-3 px-4 font-medium text-[#313D52]">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orden_id} className="border-b border-[#e0e6e5]">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{order.codigo_orden}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#313D52]">{order.estado_actual_nombre}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${
                          order.total_estados_historial === 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {order.total_estados_historial}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#6c7a89] text-sm">
                          {order.ultimo_cambio ? 
                            new Date(order.ultimo_cambio).toLocaleString('es-MX') : 
                            'Sin registros'
                          }
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {order.total_estados_historial === 0 ? (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle size={16} className="mr-1" />
                            <span className="text-sm">Sin historial</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <CheckCircle size={16} className="mr-1" />
                            <span className="text-sm">Correcto</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {orders.length === 0 && !isLoading && (
            <div className="text-center py-8 text-[#6c7a89]">
              Haz clic en &quotVerificar Integridad&quot para revisar el estado de las órdenes
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Información importante</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• La verificación muestra las últimas 10 órdenes y su estado del historial</li>
            <li>• La reparación agrega automáticamente registros faltantes en el historial</li>
            <li>• Solo se reparan órdenes que no tienen ningún registro en el historial</li>
            <li>• Esta operación es segura y no modifica datos existentes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;