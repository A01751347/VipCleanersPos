'use client'
// components/admin/OrderItemsList.tsx
import React from 'react';
import { Brush, ShoppingBag } from 'lucide-react';

interface OrderService {
  detalle_servicio_id: number;
  servicio_id: number;
  servicio_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  modelo_id: number | null;
  marca: string | null;
  modelo: string | null;
  descripcion: string | null;
}

interface OrderProduct {
  detalle_producto_id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface OrderItemsListProps {
  services: OrderService[];
  products: OrderProduct[];
}

const OrderItemsList: React.FC<OrderItemsListProps> = ({ services, products }) => {
  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Calcular el total
  const getTotalServices = () => {
    return services.reduce((total, service) => total + service.subtotal, 0);
  };

  const getTotalProducts = () => {
    return products.reduce((total, product) => total + product.subtotal, 0);
  };

  const getGrandTotal = () => {
    return getTotalServices() + getTotalProducts();
  };

  return (
    <div className="space-y-6">
      {/* Servicios */}
      <div>
        <div className="flex items-center mb-4 text-[#313D52] font-medium">
          <Brush size={18} className="mr-2 text-[#6c7a89]" />
          <h3>Servicios</h3>
        </div>
        
        {services.length === 0 ? (
          <p className="text-[#6c7a89] italic">No hay servicios en esta orden</p>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.detalle_servicio_id} className="flex justify-between pb-3 border-b border-[#e0e6e5] last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium text-[#313D52]">{service.servicio_nombre}</p>
                  {(service.marca || service.modelo) && (
                    <p className="text-sm text-[#6c7a89]">
                      {service.marca} {service.modelo}
                    </p>
                  )}
                  {service.descripcion && (
                    <p className="text-sm text-[#6c7a89]">{service.descripcion}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#313D52]">{formatCurrency(service.subtotal)}</p>
                  <p className="text-xs text-[#6c7a89]">
                    {service.cantidad} x {formatCurrency(service.precio_unitario)}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="text-right pt-2">
              <p className="font-medium text-[#313D52]">
                Subtotal Servicios: {formatCurrency(getTotalServices())}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Productos */}
      <div>
        <div className="flex items-center mb-4 text-[#313D52] font-medium">
          <ShoppingBag size={18} className="mr-2 text-[#6c7a89]" />
          <h3>Productos</h3>
        </div>
        
        {products.length === 0 ? (
          <p className="text-[#6c7a89] italic">No hay productos en esta orden</p>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.detalle_producto_id} className="flex justify-between pb-3 border-b border-[#e0e6e5] last:border-b-0 last:pb-0">
                <p className="font-medium text-[#313D52]">{product.producto_nombre}</p>
                <div className="text-right">
                  <p className="font-medium text-[#313D52]">{formatCurrency(product.subtotal)}</p>
                  <p className="text-xs text-[#6c7a89]">
                    {product.cantidad} x {formatCurrency(product.precio_unitario)}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="text-right pt-2">
              <p className="font-medium text-[#313D52]">
                Subtotal Productos: {formatCurrency(getTotalProducts())}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Total General */}
      {(services.length > 0 || products.length > 0) && (
        <div className="border-t border-[#e0e6e5] pt-4">
          <div className="flex justify-between">
            <p className="font-bold text-lg text-[#313D52]">Total:</p>
            <p className="font-bold text-lg text-[#313D52]">{formatCurrency(getGrandTotal())}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderItemsList;