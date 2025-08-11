'use client'
// app/admin/orders/[id]/page.tsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  Edit,
  Clock,
  Calendar,
  Package,
  Banknote,
  User,
  ShoppingBag,
  MapPin,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UploadCloud,
  Image as ImageIcon,
  Plus,
  DollarSign,
  Info,
  Truck,
  CreditCard,
  Smartphone,
  ArrowRight,
  Brush,
  Box,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import OrderStatusTimeline from '../../../../components/admin/OrderStatusTimeline';
import OrderItemsList from '../../../../components/admin/OrderItemsList';
import OrderStatusUpdateModal from '../../../../components/admin/OrderStatusUpdateModal';
import OrderPaymentModal from '../../../../components/admin/OrderPaymentModal';
import UploadIdentificationModal from '../../../../components/admin/UploadIdentificationModal';
import EditShoeModal from '../../../../components/admin/orders/EditShoeModal';
import StorageLocationModal, { LocationData } from '../../../../components/admin/pos/StorageLocationModal';

import SendTicketModal from '../../../../components/admin/SendTicketModal';
// Interfaces for type checking
interface OrderDetail {
  orden_id: number;
  codigo_orden: string;
  cliente_id: number;
  cliente_nombre: string;
  cliente_apellidos: string;
  cliente_email: string;
  cliente_telefono: string;
  requiere_pickup: boolean;
  costo_pickup: number;
  direccion_id: number;
  total: number;
  subtotal: number;
  impuestos: number;
  descuento: number;
  fecha_recepcion: string;
  fecha_entrega_estimada: string;
  fecha_entrega_real: string | null;
  estado_actual: string;
  estado_actual_id: number;
  estado_pago: string;
  metodo_pago: string;
  notas: string | null;
  requiere_identificacion: boolean;
  tiene_identificacion_registrada: boolean;
  empleado_recepcion_nombre: string;
  empleado_entrega_nombre: string | null;
  direccion: OrderDirection[];
  servicios: OrderService[];
  productos: OrderProduct[];
  historial: OrderStatusHistory[];
  pagos: OrderPayment[];
  imagenes: OrderImage[];
}

interface OrderService {
  detalle_servicio_id: number;
  servicio_id: number;
  servicio_nombre: string;
  cantidad: number;
  precio_unitario: number;

  marca_calzado: string;

  modelo_calzado: string;
  subtotal: number;
  modelo_id: number | null;
  marca: string | null;
  modelo: string | null;
  descripcion: string | null;
  talla: string | null;
  color: string  | null;
  // Additional fields for storage location
  caja_almacenamiento?: string | null;
  codigo_ubicacion?: string | null;
  notas_especiales?: string | null;
}

interface OrderProduct {
  detalle_producto_id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface OrderDirection {
  direccion_id: number;
  cliente_id: number;
  alias: string;
  calle: string;
  numero_exterior: number;
  numero_interior: number;
  colonia: string;
  municipio_delegacion: string;
  ciudad: string;
  estado: string;
  codigo_postal: number;
  telefono_contacto: string;
  instrucciones_entrega: string;

}

interface OrderStatusHistory {
  historial_id: number;
  estado_id: number;
  estado_nombre: string;
  estado_color: string;
  fecha_cambio: string;
  empleado_nombre: string;
  comentario: string | null;
}

interface OrderPayment {
  pago_id: number;
  monto: number;
  metodo: string;
  referencia: string | null;
  terminal_id: string | null;
  fecha_pago: string;
  empleado_nombre: string;
  estado: string;
}

interface OrderImage {
  archivo_id: number;
  tipo: string;
  nombre_archivo: string;
  url: string;
  fecha_creacion: string;
}

// StorageLocationModal (bulk o individual)
type StorageOrderItem = {
  detalleServicioId: number;
  ordenId: number;
  nombre: string;
  marca?: string;
  modelo?: string;
  talla?: string;
  color?: string;
  descripcion?: string;
};


export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;


  const [storageItems, setStorageItems] = useState<StorageOrderItem[]>([]);
  const [existingLocations, setExistingLocations] = useState<LocationData[]>([]);
  const [currentEmpleadoId] = useState(1); // TODO: obtén del contexto/auth real
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toStorageItem = (s: OrderService): StorageOrderItem => ({
    detalleServicioId: s.detalle_servicio_id,
    ordenId: order!.orden_id,
    nombre: s.servicio_nombre,
    marca: s.marca ?? s.marca_calzado ?? '',
    modelo: s.modelo ?? s.modelo_calzado ?? '',
    talla: s.talla ?? undefined,
    color: s.color ?? undefined,
    descripcion: s.descripcion ?? undefined,
  });
  
  const toExistingLocation = (s: OrderService): LocationData => ({
    detalleServicioId: s.detalle_servicio_id,
    ordenId: order!.orden_id,
    marca: s.marca ?? s.marca_calzado ?? '',
    modelo: s.modelo ?? s.modelo_calzado ?? '',
    talla: s.talla ?? undefined,
    color: s.color ?? undefined,
    cajaAlmacenamiento: s.caja_almacenamiento as string,
    codigoUbicacion: s.codigo_ubicacion as string,
    notasEspeciales: s.notas_especiales ?? undefined,
  });
  



  // Modal states


const [showStorageModal, setShowStorageModal] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [selectedShoe, setSelectedShoe] = useState<{ id: number, name: string } | null>(null);

  const [showSendTicketModal, setShowSendTicketModal] = useState(false);

  // Assign storage box for a specific pair of shoes
  const handleAssignStorage = async (data: {
    shoeId: number;
    boxName: string;
    locationCode: string;
    specialNotes?: string;
  }) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/shoes/${data.shoeId}/storage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caja_almacenamiento: data.boxName,
          codigo_ubicacion: data.locationCode,
          notas_especiales: data.specialNotes || null
        }),
      });

      if (!response.ok) {
        throw new Error('Error al asignar ubicación de almacenamiento');
      }

      // Close modal and reload data
      setIsStorageModalOpen(false);
      setSelectedShoe(null);
      loadOrderDetails();
    } catch (error) {
      console.error('Error updating storage location:', error);
      throw error; // Re-throw so the modal can handle it
    }
  };

// Un solo servicio (desde la fila)
const openStorageModalForService = (s: OrderService) => {
  const items = [toStorageItem(s)];
  const existing = s.caja_almacenamiento && s.codigo_ubicacion ? [toExistingLocation(s)] : [];
  setStorageItems(items);
  setExistingLocations(existing);
  setShowStorageModal(true);
};

// Todos los PENDIENTES de ubicación
const openStorageModalForPending = () => {
  if (!order) return;
  const pending = order.servicios.filter(s => !s.caja_almacenamiento || !s.codigo_ubicacion);
  if (pending.length === 0) return;
  setStorageItems(pending.map(toStorageItem));
  setExistingLocations([]); // sólo pendientes → no precargamos
  setShowStorageModal(true);
};

// Todos (para editar en bloque)
const openStorageModalForAll = () => {
  if (!order) return;
  setStorageItems(order.servicios.map(toStorageItem));
  setExistingLocations(
    order.servicios
      .filter(s => s.caja_almacenamiento && s.codigo_ubicacion)
      .map(toExistingLocation)
  );
  setShowStorageModal(true);
};


const handleStorageLocationSubmit = async (locations: LocationData[]) => {
  try {
    const res = await fetch('/api/admin/storage-locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: locations.map(l => ({
          detalleServicioId: l.detalleServicioId,
          ordenId: l.ordenId,
          cajaAlmacenamiento: l.cajaAlmacenamiento,
          codigoUbicacion: l.codigoUbicacion,
          notasEspeciales: l.notasEspeciales,
        })),
        empleadoId: currentEmpleadoId,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error al asignar ubicaciones');
    }

    setShowStorageModal(false);
    setStorageItems([]);
    setExistingLocations([]);
    await loadOrderDetails(); // 🔄 refresca la orden
  } catch (err) {
    console.error(err);
    alert(err instanceof Error ? err.message : 'Error al asignar ubicaciones');
    throw err; // para que el modal muestre el error si lo necesita
  }
};


  

  const loadOrderDetails = async () => {
    try {
      setIsRefreshing(true);

      const response = await fetch(`/api/admin/orders?id=${orderId}`);

      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la orden');
      }

      const data = await response.json();
      setOrder(data.order);
      setError(null);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Error al cargar los detalles de la orden. Intente nuevamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const [isEditShoeOpen, setIsEditShoeOpen] = useState(false);
const [shoeToEdit, setShoeToEdit] = useState<null | {
  detalle_servicio_id: number;
  marca?: string | null;
  modelo?: string | null;
  descripcion?: string | null;
  talla?: string | null;
  color?: string | null;
  servicio_nombre: string;
}>(null);

  // Load data on component mount
  useEffect(() => {
    loadOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';

    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const renderShoesTable = () => {
    if (!order) return null;
  
    // Filtra servicios que tienen detalle de calzado (marca/modelo/desc), pero
    // si quieres mostrar TODOS, simplemente usa order.servicios sin filtrar.
    const rows = order.servicios;
  
    return (
      <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
        <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
          <h2 className="font-semibold text-[#313D52]">Detalles del Calzado</h2>
        </div>
  
        <div className="overflow-auto">
          <table className="min-w-full table-fixed">
            {/* columnas fijas (no se recorren) */}
            <colgroup>
              <col style={{ width: '20%' }} /> {/* Servicio */}
              <col style={{ width: '24%' }} /> {/* Detalle de calzado */}
              <col style={{ width: '20%' }} /> {/* Comentarios */}
              <col style={{ width: '10%' }} /> {/* Color */}
              <col style={{ width: '10%' }} /> {/* Talla */}
              <col style={{ width: '16%' }} /> {/* Ubicación */}
              <col style={{ width: '10%' }} /> {/* Precio */}
              <col style={{ width: '6%'  }} /> {/* Acciones */}
            </colgroup>
  
            <thead className="bg-[#f5f9f8]">
              <tr className="text-[#6c7a89] text-xs uppercase tracking-wider">
                <th className="px-3 py-3 text-left">Servicio</th>
                <th className="px-3 py-3 text-left">Detalle de Calzado</th>
                <th className="px-3 py-3 text-left">Comentarios</th>
                <th className="px-3 py-3 text-left">Color</th>
                <th className="px-3 py-3 text-left">Talla</th>
                <th className="px-3 py-3 text-left">Ubicación</th>
                <th className="px-3 py-3 text-right">Precio</th>
                <th className="px-2 py-3 text-right" />
              </tr>
            </thead>
  
            <tbody className="divide-y divide-[#e0e6e5] text-sm">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#6c7a89] italic">
                    No hay servicios registrados en esta orden
                  </td>
                </tr>
              ) : (
                rows.map((s, idx) => {
                  const marca = s.marca ?? s.marca_calzado ?? '';
                  const modelo = s.modelo ?? s.modelo_calzado ?? '';
                  const detalle = (marca || modelo) ? `${marca} ${modelo}`.trim() : 'Tenis sin especificar';
                  const comentarios = s.descripcion?.trim() || 'Sin Comentarios';
                  const color = s.color?.trim() || 'Sin Color';
                  const talla = s.talla?.trim() || 'Sin Talla';
                  const tieneUbicacion = Boolean(s.caja_almacenamiento);
  
                  return (
                    <tr key={s.detalle_servicio_id} className={idx % 2 ? 'bg-[#fafbfb]' : 'bg-white'}>
                      {/* Servicio */}
                      <td className="px-3 py-3 text-[#313D52] font-medium whitespace-nowrap">
                        {s.servicio_nombre}
                      </td>
  
                      {/* Detalle */}
                      <td className="px-3 py-3 text-[#313D52] truncate">{detalle || '—'}</td>
  
                      {/* Comentarios */}
                      <td className="px-3 py-3 text-[#6c7a89] truncate">{comentarios}</td>
  
                      {/* Color */}
                      <td className="px-3 py-3 text-[#313D52] whitespace-nowrap">{color}</td>
  
                      {/* Talla */}
                      <td className="px-3 py-3 text-[#313D52] whitespace-nowrap">{talla}</td>
  
                      {/* Ubicación */}
                      <td className="px-3 py-3">
                        {tieneUbicacion ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#e0f7f0] text-[#007a60]">
                            Caja {s.caja_almacenamiento}
                            {s.codigo_ubicacion && (
                              <span className="ml-1 opacity-80">({s.codigo_ubicacion})</span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700">
                            Pendiente de Ubicar
                          </span>
                        )}
                      </td>
  
                      {/* Precio */}
                      <td className="px-3 py-3 text-right text-[#313D52] tabular-nums">
                        {formatCurrency(s.precio_unitario)}
                      </td>
  
                      {/* Acciones */}
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Editar calzado */}
                          <button
                            onClick={() => openEditShoe(s)}
                            className="p-1.5 rounded hover:bg-[#f5f9f8] border border-transparent hover:border-[#e0e6e5]"
                            title="Editar calzado"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#6c7a89]" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </button>
  
                          {/* Editar/Asignar ubicación */}
                          <button
                            onClick={() =>
                              openStorageModalForService(s)
                            }
                            className="p-1.5 rounded hover:bg-[#f5f9f8] border border-transparent hover:border-[#e0e6e5]"
                            title={tieneUbicacion ? 'Editar ubicación' : 'Asignar ubicación'}
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#6c7a89]" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </button>
  
                          {/* Eliminar (opcional) */}
                          <button
                            //onClick={() => handleRemoveService(s.detalle_servicio_id)}
                            className="p-1.5 rounded hover:bg-red-50 border border-transparent hover:border-red-200"
                            title="Eliminar"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pendiente</span>;
      case 'parcial':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Parcial</span>;
      case 'pagado':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Pagado</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  // Translate payment method
  const getPaymentMethodTranslation = (method: string) => {
    switch (method) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'transferencia': return 'Transferencia';
      case 'mercado_pago': return 'Mercado Pago';
      default: return method;
    }
  };

  // Get icon for payment method
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "": return "";
      case 'efectivo': return <Banknote size={16} />;
      case 'tarjeta': return <CreditCard size={16} />;
      case 'transferencia': return <RefreshCw size={16} />;
      case 'mercado_pago': return <Smartphone size={16} />;
      default: return <DollarSign size={16} />;
    }
  };

  // Print ticket
  const handlePrintTicket = () => {
    window.print();
  };

  // Abre modal de edición con valores actuales
const openEditShoe = (shoe: any) => {
  setShoeToEdit({
    detalle_servicio_id: shoe.detalle_servicio_id,
    marca: shoe.marca ?? shoe.marca_calzado ?? '',
    modelo: shoe.modelo ?? shoe.modelo_calzado ?? '',
    descripcion: shoe.descripcion ?? '',
    talla: (shoe as any).talla ?? '',
    color: (shoe as any).color ?? '',
    servicio_nombre: shoe.servicio_nombre
  });
  setIsEditShoeOpen(true);
};

// Guardar edición y luego abrir ubicación
const submitEditShoe = async (vals: {
  marca: string | null; modelo: string | null; descripcion: string | null; talla: string | null; color: string | null;
}) => {
  if (!shoeToEdit || !order) return;
  const url = `/api/admin/orders/${order.orden_id}/shoes/${shoeToEdit.detalle_servicio_id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vals),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || 'No se pudo actualizar el calzado');
  }
  // refresca datos
  await loadOrderDetails();

  // al cerrar el modal de edición, abre el de ubicación del mismo par
  setIsEditShoeOpen(false);
  
};


  // Improved handleUpdateStatus function for your React component
  const handleUpdateStatus = async (newStatusId: number, comentario: string) => {
    try {
      console.log('Iniciando actualización de estado:', {
        ordenId: orderId,
        newStatusId,
        comentario
      });

      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estadoId: newStatusId,
          comentario: comentario || null
        }),
      });

      const responseData = await response.json();

      console.log('Respuesta del servidor:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Error al actualizar el estado');
      }

      // Show success message
      console.log('Estado actualizado exitosamente:', responseData);

      // Close modal first
      setIsStatusModalOpen(false);

      // Then reload data
      await loadOrderDetails();

      // You can add a toast notification here if you have one
      // toast.success('Estado actualizado correctamente');

    } catch (error) {
      console.error('Error updating status:', error);

      // Better error handling
      let errorMessage = 'Error al actualizar el estado de la orden';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Show error to user (you can replace alert with a better notification system)
      alert(`Error: ${errorMessage}`);

      // Don't close the modal on error, so user can try again
    }
  };

  // Register payment
  const handleAddPayment = async (paymentData: {
    monto: number;
    metodo: string;
    referencia?: string;
    terminalId?: string;
  }) => {
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ordenId: parseInt(orderId),
          ...paymentData
        }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar el pago');
      }

      // Close modal and reload data
      setIsPaymentModalOpen(false);
      loadOrderDetails();
    } catch (error) {
      console.error('Error registering payment:', error);
      alert('Error al registrar el pago');
    }
  };

  // Upload identification
  const handleUploadIdentification = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', 'identificacion');
      formData.append('entidadTipo', 'orden');
      formData.append('entidadId', orderId);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la identificación');
      }

      // Close modal and reload data
      setIsUploadModalOpen(false);
      loadOrderDetails();
    } catch (error) {
      console.error('Error uploading identification:', error);
      alert('Error al subir la identificación');
    }
  };

  // Calculate amount paid
  const calculateAmountPaid = () => {
    if (!order?.pagos || order.pagos.length === 0) return 0;
  
    return order.pagos.reduce((sum, payment) => {
      const monto = Number(payment.monto) || 0; // Asegura número válido
      return sum + monto;
    }, 0);
  };
  
  // Calculate balance
  const calculateBalance = () => {
    if (!order) return 0;
    const paid = calculateAmountPaid();
    return order.total - paid;
  };

  // Render identification section
  const renderIdentificationSection = () => {
    if (!order) return null;

    // Check if there are identification images
    const idImages = order.imagenes.filter(img => img.tipo === 'identificacion');

    if (!order.requiere_identificacion) {
      return null;
    }

    if (idImages.length > 0) {
      // Already has identification registered
      return (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-start">
            <CheckCircle size={20} className="mt-0.5 mr-3 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-700">Identificación registrada</p>
              <p className="text-sm text-green-600 mb-3">
                El cliente ha proporcionado identificación válida para esta orden.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {idImages.map((img) => (
                  <div key={img.archivo_id} className="bg-white p-2 rounded border border-green-200">
                    <div className="text-xs text-green-700 mb-1">
                      {new Date(img.fecha_creacion).toLocaleDateString()}
                    </div>
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline text-sm"
                    >
                      <ImageIcon size={14} className="mr-1" />
                      Ver imagen
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Needs identification but doesn't have it
      return (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-start">
            <AlertTriangle size={20} className="mt-0.5 mr-3 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-700">Se requiere identificación</p>
              <p className="text-sm text-amber-600 mb-3">
                Esta orden requiere identificación del cliente. Por favor, registra una identificación válida.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors text-sm font-medium"
              >
                <UploadCloud size={16} className="mr-1.5" />
                Subir identificación
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  // Render shoes details section with enhanced storage information
  const renderShoesDetails = () => {
    if (!order || !order.servicios || order.servicios.length === 0) return null;

    // Filter only shoe-related services
    const shoesServices = order.servicios.filter(s =>
      s.marca || s.modelo || s.descripcion || s.marca_calzado || s.modelo_calzado
    );
    

    if (shoesServices.length === 0) return null;

    return (
      <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
        <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
          <h2 className="font-semibold text-[#313D52] flex items-center">
            <Box size={18} className="mr-2 text-[#6c7a89]" />
            Detalles del Calzado
          </h2>
        </div>
        <div className="p-4">
          <div className="space-y-5">
            {shoesServices.map((shoe) => (
              <div key={shoe.detalle_servicio_id} className="bg-white p-4 rounded-lg border border-[#e0e6e5] hover:shadow-md transition-shadow">
                {/* Shoe header with service information */}
                <div className="flex justify-between items-start">
  <div>
    <h3 className="font-semibold text-[#313D52] flex items-center text-lg">
      <Brush size={20} className="mr-2 text-[#78f3d3]" />
      1x {shoe.servicio_nombre}
    </h3>
    <div className="text-sm text-[#313D52] mt-1 font-medium">
      {shoe.marca_calzado || shoe.marca || ''} {shoe.modelo_calzado || shoe.modelo || ''}
    </div>
  </div>

  <div className="flex items-center gap-2">
    <button
      onClick={() => openEditShoe(shoe)}
      className="px-3 py-1.5 text-xs rounded-lg border border-[#e0e6e5] hover:bg-[#f5f9f8]"
      title="Editar calzado"
    >
      Editar
    </button>
    <span className="font-bold text-base text-[#313D52] bg-[#f5f9f8] px-3 py-1 rounded-lg">
      {formatCurrency(shoe.subtotal)}
    </span>
  </div>
</div>

                {/* Shoe details and specifications */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Left column: General details */}
                  <div className="bg-[#f9fafa] rounded-lg p-3 col-span-2">
                    <h4 className="font-medium text-sm text-[#6c7a89] uppercase mb-2">Detalles</h4>

                    {/* Detailed description */}
                    <div className="mb-2">
                      <span className="text-sm text-[#313D52]">
                        {shoe.descripcion || 'Sin descripción adicional'}
                      </span>
                    </div>

                    {/* Pricing details */}
                    <div className="flex justify-between text-xs text-[#6c7a89]">
                      <span>Servicio individual</span>
                      <span>Precio: {formatCurrency(shoe.precio_unitario)}</span>
                    </div>
                  </div>

                  {/* Right column: Storage information with highlighted box */}
                  <div className={`rounded-lg p-3 relative ${shoe.caja_almacenamiento ? 'bg-[#e0f7f0]' : 'bg-yellow-50'}`}>
                    <h4 className="font-medium text-sm uppercase mb-2 flex items-center">
                      <Box size={14} className="mr-1" />
                      <span className={shoe.caja_almacenamiento ? 'text-[#00a67e]' : 'text-amber-700'}>
                        Almacenamiento
                      </span>
                    </h4>

                    {shoe.caja_almacenamiento ? (
                      <>
                        <div className="mb-2">
                          <div className="flex items-center">
                            <span className="font-bold text-[#00a67e] text-lg">
                              {shoe.caja_almacenamiento}
                            </span>
                            <span className="ml-2 px-2 py-0.5 bg-white rounded text-xs text-[#313D52]">
                              {shoe.codigo_ubicacion || 'Sin código'}
                            </span>
                          </div>
                          {shoe.notas_especiales && (
                            <div className="mt-1 text-sm text-[#006e54]">
                              <span className="font-medium">Notas:</span> {shoe.notas_especiales}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <AlertTriangle size={24} className="mb-2 text-amber-500" />
                        <p className="text-sm text-amber-700 text-center mb-2">
                          Sin ubicación asignada
                        </p>
                        
                      </div>
                    )}
                  </div>
                </div>

                {/* Status indicator for this specific shoe */}
                <div className="mt-3 flex justify-between items-center pt-2 border-t border-[#e0e6e5]">
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${shoe.caja_almacenamiento
                      ? 'bg-green-500'
                      : order.estado_actual_id >= 2
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                      }`}></span>
                    <span className="text-xs text-[#6c7a89]">
                      {shoe.caja_almacenamiento
                        ? 'Almacenado'
                        : order.estado_actual_id >= 2
                          ? 'Pendiente de almacenar'
                          : 'Pendiente de recepción'
                      }
                    </span>
                  </div>

                  {/* Shoe identification code */}
                  <span className="text-xs bg-[#f5f9f8] px-2 py-1 rounded">
                    ID: {shoe.detalle_servicio_id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>{error}</p>
        <Link
          href="/admin/orders"
          className="mt-4 inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver a órdenes
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <p className="text-[#6c7a89]">No se encontró la orden</p>
        <Link
          href="/admin/orders"
          className="mt-4 inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver a órdenes
        </Link>
      </div>
    );
  }

  

  const balance = calculateBalance();
  const direccionPickup = order.direccion[0]
  console.log("faaa", direccionPickup)


  // Sumar precio_unitario * cantidad de cada servicio
  const totalServicios = order.servicios.reduce(
    (sum, service) => sum + service.precio_unitario * (service.cantidad || 1),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center mb-2">
            <Link href="/admin/orders" className="mr-2 text-[#6c7a89] hover:text-[#313D52] transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold text-[#313D52]">Orden #{order.codigo_orden}</h1>
          </div>
          <p className="text-sm text-[#6c7a89]">
            Creada el {formatDate(order.fecha_recepcion)} por {order.empleado_recepcion_nombre}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handlePrintTicket}
            className="inline-flex items-center px-4 py-2 bg-[#f5f9f8] text-[#313D52] rounded-lg border border-[#e0e6e5] hover:bg-[#e0e6e5] transition-colors"
          >
            <Printer size={16} className="mr-2" />
            Imprimir
          </button>


          <button
            onClick={() => setShowSendTicketModal(true)}
            disabled={!order?.cliente_email}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!order?.cliente_email ? 'El cliente no tiene email registrado' : 'Enviar ticket por email'}
          >
            <Mail size={16} className="mr-2" />
            Enviar Ticket
          </button>


          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
          >
            <Edit size={16} className="mr-2" />
            Cambiar Estado
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            disabled={balance <= 0}
            className={`inline-flex items-center px-4 py-2 rounded-lg border ${balance <= 0
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-[#313D52] text-white border-[#313D52] hover:bg-[#3e4a61]'
              } transition-colors`}
          >
            <DollarSign size={16} className="mr-2" />
            {balance <= 0 ? 'Pagado' : 'Registrar Pago'}
          </button>
        </div>
      </div>
{/* Main information grid — NUEVO LAYOUT */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

  {/* COLUMNA IZQUIERDA (2/3) */}
  <div className="lg:col-span-8 space-y-6">
    {/* Detalles del Calzado (tabla ancha) */}
    {renderShoesTable()}

    {/* Fila: Productos (izq) + (der) Timeline y Pagos apilados */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
     
        {/* Timeline */}
        <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
          <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
            <h2 className="font-medium text-[#313D52] flex items-center">
              <Clock size={18} className="mr-2 text-[#6c7a89]" />
              Historial de Estado
            </h2>
          </div>

          <div className="p-4">
            {(order.historial ?? []).length === 0 ? (
              <div className="text-center py-4 text-[#6c7a89]">No hay historial disponible</div>
            ) : (
              <div className="max-h-80 overflow-auto pr-2">
                <ul className="space-y-5">
                  {(order.historial ?? []).map((history, index, arr) => {
                    const raw = String(history.estado_color || '').trim();
                    const toHex = (c: string) => {
                      if (!c) return '#6c7a89';
                      if (c.startsWith('#')) return c;
                      const named: Record<string, string> = {
                        yellow: '#eab308',
                        green: '#16a34a',
                        red: '#dc2626',
                        blue: '#2563eb',
                        gray: '#6c7a89'
                      };
                      return named[c.toLowerCase()] ?? '#6c7a89';
                    };
                    const stroke = toHex(raw);
                    const fill = `${stroke}33`;
                    const isLast = index === arr.length - 1;

                    return (
                      <li key={history.historial_id} className="grid grid-cols-[32px_1fr] gap-3">
                        <div className="relative">
                          <span
                            className="absolute top-0 left-1/2 -translate-x-1/2 z-10 h-5 w-5 rounded-full border-2"
                            style={{ borderColor: stroke, backgroundColor: fill }}
                            aria-hidden
                          >
                            <span
                              className={`absolute inset-0 m-auto h-2 w-2 rounded-full ${index === 0 ? 'ring-2 ring-offset-1' : ''}`}
                              style={{ backgroundColor: stroke, boxShadow: index === 0 ? `0 0 0 2px ${stroke}` : undefined }}
                            />
                          </span>
                          {!isLast && (
                            <span
                              className="absolute left-1/2 -translate-x-1/2 top-5 bottom-[-8px] w-px bg-[#e0e6e5]"
                              aria-hidden
                            />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-[#313D52]">{history.estado_nombre}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[#f5f9f8] text-[#6c7a89]">
                              {formatDate(history.fecha_cambio)}
                            </span>
                          </div>
                          <p className="text-sm text-[#6c7a89]">
                            Por: {history.empleado_nombre || 'Sistema'}
                          </p>
                          {history.comentario && (
                            <p className="mt-1 text-sm italic text-[#6c7a89] bg-[#f5f9f8] p-2 rounded">
                              “{history.comentario}”
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      {/* Derecha: Timeline + Pagos apilados */}
      <div className="space-y-6">


         {/* Productos */}
      <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
        <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
          <h2 className="font-medium text-[#313D52] flex items-center">
            <ShoppingBag size={18} className="mr-2 text-[#6c7a89]" />
            Productos
          </h2>
        </div>
        <div className="p-4">
          {order.productos.length === 0 ? (
            <div className="text-center py-4 text-[#6c7a89]">
              <p>No hay productos registrados en esta orden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {order.productos.map((product) => (
                <div key={product.detalle_producto_id} className="border-b border-[#e0e6e5] pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-[#313D52]">{product.producto_nombre}</h3>
                    <div className="text-right">
                      <p className="text-[#313D52] font-medium">{formatCurrency(product.subtotal)}</p>
                      <p className="text-xs text-[#6c7a89]">
                        {product.cantidad} x {formatCurrency(product.precio_unitario)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


        {/* Pagos Registrados */}
        <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
          <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
            <h2 className="font-medium text-[#313D52] flex items-center">
              <Banknote size={18} className="mr-2 text-[#6c7a89]" />
              Pagos Registrados
            </h2>
          </div>
          <div className="p-4">
            {order.pagos.length === 0 ? (
              <div className="text-center py-4 text-[#6c7a89]">
                <p>No hay pagos registrados</p>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="mt-3 inline-flex items-center px-3 py-1.5 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors text-sm"
                  disabled={balance <= 0}
                >
                  <Plus size={16} className="mr-1.5" />
                  Registrar Pago
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {order.pagos.map((payment) => (
                  <div key={payment.pago_id} className="border-b border-[#e0e6e5] pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          {getPaymentMethodIcon(payment.metodo)}
                          <h3 className="font-medium text-[#313D52] ml-2">
                            {getPaymentMethodTranslation(payment.metodo)}
                          </h3>
                        </div>
                        <p className="text-sm text-[#6c7a89] mt-1">
                          {formatDate(payment.fecha_pago)}
                        </p>
                        <p className="text-xs text-[#6c7a89]">
                          Por: {payment.empleado_nombre}
                        </p>
                        {payment.referencia && (
                          <p className="text-xs text-[#6c7a89]">
                            Ref: {payment.referencia}
                          </p>
                        )}
                      </div>
                      <span className="font-medium text-[#313D52]">
                        {formatCurrency(payment.monto)}
                      </span>
                    </div>
                  </div>
                ))}

                {balance > 0 && (
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full mt-2 py-2 bg-[#313D52] text-white rounded-lg flex items-center justify-center hover:bg-[#3e4a61] transition-colors text-sm"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Registrar Pago
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Notas (ocupa las dos columnas izquierdas cuando existe) */}
    {order.notas && (
      <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
        <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
          <h2 className="font-medium text-[#313D52] flex items-center">
            <Info size={18} className="mr-2 text-[#6c7a89]" />
            Notas
          </h2>
        </div>
        <div className="p-4">
          <p className="text-[#6c7a89]">{order.notas}</p>
        </div>
      </div>
    )}
  </div>

  {/* COLUMNA DERECHA (1/3): rail con tarjetas */}
  <div className="lg:col-span-4 space-y-6">
    {/* Información del Cliente */}
    <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
      <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
        <h2 className="font-medium text-[#313D52] flex items-center">
          <User size={18} className="mr-2 text-[#6c7a89]" />
          Información del Cliente
        </h2>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <h3 className="font-semibold text-[#313D52] text-lg">
            {order.cliente_nombre}
          </h3>
          <div className="text-sm text-[#6c7a89]">
            <p>ID: {order.cliente_id}</p>
            <p>Email: {order.cliente_email || 'No registrado'}</p>
            <p>Teléfono: {order.cliente_telefono || 'No registrado'}</p>
          </div>
        </div>
        <Link
          href={`/admin/clients/${order.cliente_id}`}
          className="text-[#78f3d3] hover:text-[#4de0c0] text-sm font-medium inline-flex items-center"
        >
          Ver perfil completo
          <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>

    {/* Pickup (si existe) */}
    {direccionPickup && (
      <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
        <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
          <h2 className="font-medium text-[#313D52] flex items-center">
            <MapPin size={18} className="mr-2 text-[#6c7a89]" />
            Pickup
          </h2>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <h3 className="font-semibold text-[#313D52] text-lg mb-1">
              {direccionPickup.alias}
            </h3>
            <div className="text-sm text-[#6c7a89] space-y-1">
              <p>
                {direccionPickup.calle} {direccionPickup.numero_exterior}
                {direccionPickup.numero_interior && `, Int. ${direccionPickup.numero_interior}`}
              </p>
              <p>
                {direccionPickup.colonia}, {direccionPickup.municipio_delegacion}
              </p>
              <p>
                {direccionPickup.ciudad}, {direccionPickup.estado}, CP {direccionPickup.codigo_postal}
              </p>
              <p>Teléfono de contacto: {direccionPickup.telefono_contacto || 'No registrado'}</p>
              {direccionPickup.instrucciones_entrega && (
                <p>Instrucciones: {direccionPickup.instrucciones_entrega}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Fechas */}
    <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
      <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
        <h2 className="font-medium text-[#313D52] flex items-center">
          <Calendar size={18} className="mr-2 text-[#6c7a89]" />
          Fechas
        </h2>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-[#6c7a89]">Recepción:</span>
            <span className="text-[#313D52]">{formatDate(order.fecha_recepcion)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6c7a89]">Entrega estimada:</span>
            <span className="text-[#313D52]">{formatDate(order.fecha_entrega_estimada)}</span>
          </div>
          {order.fecha_entrega_real && (
            <div className="flex justify-between">
              <span className="text-[#6c7a89]">Entrega real:</span>
              <span className="text-[#313D52]">{formatDate(order.fecha_entrega_real)}</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Información de Pago (resumen de totales) */}
    <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
      <div className="px-4 py-3 bg-[#f5f9f8] border-b border-[#e0e6e5]">
        <h2 className="font-medium text-[#313D52] flex items-center">
          <Banknote size={18} className="mr-2 text-[#6c7a89]" />
          Información de Pago
        </h2>
      </div>
      <div className="p-4">
        <div className="mb-3 flex justify-between items-center">
          <span className="text-[#6c7a89]">Estado:</span>
          {getPaymentStatusBadge(order.estado_pago)}
        </div>
        <div className="mb-3 flex justify-between">
          <span className="text-[#6c7a89]">Método de pago:</span>
          <span className="text-[#313D52] flex items-center">
            {getPaymentMethodIcon(order.metodo_pago)}
            <span className="ml-1">{getPaymentMethodTranslation(order.metodo_pago)}</span>
          </span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-[#6c7a89]">Envio:</span>
          <span className="text-[#313D52]">{formatCurrency(order.costo_pickup)}</span>
        </div>
        {order.descuento > 0 && (
          <div className="flex justify-between mb-1 text-green-600">
            <span>Descuento:</span>
            <span>-{formatCurrency(order.descuento)}</span>
          </div>
        )}
        <div className="border-t border-[#e0e6e5] my-3 pt-3">
          <div className="flex justify-between mb-1">
            <span className="text-[#6c7a89]">Subtotal:</span>
            <span className="text-[#313D52]">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-[#6c7a89]">IVA (16%):</span>
            <span className="text-[#313D52]">{formatCurrency(order.impuestos)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <span className="text-[#313D52]">Total:</span>
            <span className="text-[#313D52]">{formatCurrency(order.total)}</span>
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-[#e0e6e5]">
            <span className="text-[#6c7a89]">Pagado:</span>
            <span className="text-[#313D52]">{formatCurrency(calculateAmountPaid())}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
              {balance > 0 ? 'Pendiente:' : 'Cambio:'}
            </span>
            <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
              {formatCurrency(Math.abs(balance))}
            </span>
          </div>
        </div>

        {balance > 0 && (
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full mt-2 py-2 bg-[#313D52] text-white rounded-lg flex items-center justify-center hover:bg-[#3e4a61] transition-colors"
          >
            <DollarSign size={16} className="mr-2" />
            Registrar Pago
          </button>
        )}
      </div>
    </div>
  </div>
</div>


      {/* Modals */}
      {isStatusModalOpen && (
        <OrderStatusUpdateModal
          currentStatus={order.estado_actual_id}
          onClose={() => setIsStatusModalOpen(false)}
          onSubmit={handleUpdateStatus}
        />
      )}

      {isPaymentModalOpen && (
        <OrderPaymentModal
          total={order.total}
          amountPaid={calculateAmountPaid()}
          onClose={() => setIsPaymentModalOpen(false)}
          onSubmit={handleAddPayment}
        />
      )}

      {isUploadModalOpen && (
        <UploadIdentificationModal
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={handleUploadIdentification}
        />
      )}

{showStorageModal && (
  <StorageLocationModal
    isOpen={showStorageModal}
    onClose={() => {
      setShowStorageModal(false);
      setStorageItems([]);
      setExistingLocations([]);
    }}
    onSubmit={handleStorageLocationSubmit}
    orderItems={storageItems}
    existingLocations={existingLocations}
    empleadoId={currentEmpleadoId}
  />
)}

      {isEditShoeOpen && shoeToEdit && (
        <EditShoeModal
          isOpen={isEditShoeOpen}
          onClose={() => setIsEditShoeOpen(false)}
          initialValues={{
            marca: shoeToEdit.marca || '',
            modelo: shoeToEdit.modelo || '',
            descripcion: shoeToEdit.descripcion || '',
            talla: shoeToEdit.talla || '',
            color: shoeToEdit.color || ''
          }}
          onSubmit={submitEditShoe}
        />
      )}
      {showSendTicketModal && order && (
        <SendTicketModal
          isOpen={showSendTicketModal}
          onClose={() => setShowSendTicketModal(false)}
          order={{
            orden_id: order.orden_id,
            codigo_orden: order.codigo_orden,
            cliente_nombre: order.cliente_nombre,
            cliente_apellidos: order.cliente_apellidos,
            cliente_email: order.cliente_email,
            total: order.total
          }}
        />
        
      )}
    </div>
  );
}