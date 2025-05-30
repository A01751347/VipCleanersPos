'use client'
// app/admin/pos/page.tsx
import React, { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Users,
    Save,
    Trash2,
    X,
    Plus,
    UserPlus,
    Search,
    CreditCard,
    ArrowRight,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import ClientSearch from '../../../components/admin/pos/ClientSearch';


// Corregir rutas de importación
import ProductCatalog from '../../clientes/ProductCatalog';
import ServiceSelector from '../../clientes/ServiceSelector';
import CartSummary from '../../clientes/CartSummary';
import PaymentForm from '../../clientes/PaymentForm';
import NewClientForm from '../../clientes/NewClientForm';
import OrderSuccess from '../../clientes/OrderSuccess';

// Definir la interfaz para las reservaciones
interface Booking {
    id: number;
    booking_reference: string;
    full_name: string;
    email: string;
    service_type: string;
    shoes_type: string;
    delivery_method: string;
    status: string;
    booking_date: string;
    created_at: string;
}

type CartItemType = 'producto' | 'servicio';

// Interfaz para cliente
interface Client {
    id?: number;
    cliente_id?: number;  // Añadir esta propiedad
    nombre: string;
    apellidos?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    codigo_postal?: string;
    ciudad?: string;
    estado?: string;
    pais?: string;  // También podría ser útil tener este campo
    fecha_creacion?: string;
    fecha_actualizacion?: string;
    fecha_nacimiento?: string | null;
    puntos_fidelidad?: number;
    total_ordenes?: number;
    usuario_id?: number | null;
}

// Interfaz para elemento del carrito
interface CartItem {
    id: number;
    tipo: CartItemType;
    nombre: string;
    precio: number;
    cantidad: number;
    modeloId?: number;
    marca?: string;
    modelo?: string;
    descripcion?: string;
    tempId?: string; // Agregar esta línea para el ID temporal único
}

interface Service {
    servicio_id: number;
    nombre: string;
    requiere_identificacion: boolean;
}

// Vista del POS
export default function POSPage() {
    // Datos del pedido
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [notas, setNotas] = useState<string>('');
    const [tieneIdentificacion, setTieneIdentificacion] = useState<boolean>(false);
    const [services, setServices] = useState<Service[]>([]);

    // Control de UI
    const [activeTab, setActiveTab] = useState<'servicios' | 'productos'>('servicios');
    const [isClientFormOpen, setIsClientFormOpen] = useState<boolean>(false);
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Estado del proceso
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{
        ordenId: number;
        codigoOrden: string;
        requiereIdentificacion: boolean;
    } | null>(null);

    // Fetch services on mount
    useEffect(() => {
        const fetchServices = async () => {
            const response = await fetch('/api/admin/services');
            const data = await response.json();
            setServices(data.services || []);
        };
        fetchServices();
    }, []);
// 🔢 Funciones de cálculo para POS con IVA INCLUIDO
// Estas funciones reemplazan las versiones previas

const calcularTotalConIva = () => {
    const total = cart.reduce((sum, item) => {
        const precio = typeof item.precio === 'string' ? parseFloat(item.precio) : (item.precio || 0);
        const cantidad = typeof item.cantidad === 'string' ? parseInt(item.cantidad, 10) : (item.cantidad || 0);
        return sum + (precio * cantidad);
    }, 0);
    return total;
};

const calcularSubtotal = () => {
    const totalConIva = calcularTotalConIva();
    const subtotal = totalConIva / 1.16;
    return subtotal;
};

const calcularIva = () => {
    const totalConIva = calcularTotalConIva();
    const subtotal = calcularSubtotal();
    const iva = totalConIva - subtotal;
    return iva;
};

const calcularTotal = () => {
    const total = calcularTotalConIva();
    return total;
};

const verificarCalculos = () => {

    const servicios = cart.filter(item => item.tipo === 'servicio');
    const productos = cart.filter(item => item.tipo === 'producto');

    const totalServiciosConIva = servicios.reduce((sum, item) => {
        const precio = typeof item.precio === 'string' ? parseFloat(item.precio) : (item.precio || 0);
        const cantidad = typeof item.cantidad === 'string' ? parseInt(item.cantidad, 10) : (item.cantidad || 0);
        return sum + (precio * cantidad);
    }, 0);

    const totalProductosConIva = productos.reduce((sum, item) => {
        const precio = typeof item.precio === 'string' ? parseFloat(item.precio) : (item.precio || 0);
        const cantidad = typeof item.cantidad === 'string' ? parseInt(item.cantidad, 10) : (item.cantidad || 0);
        return sum + (precio * cantidad);
    }, 0);

    const subtotalServicios = totalServiciosConIva / 1.16;
    const subtotalProductos = totalProductosConIva / 1.16;

    const ivaServicios = totalServiciosConIva - subtotalServicios;
    const ivaProductos = totalProductosConIva - subtotalProductos;

    const subtotalTotal = subtotalServicios + subtotalProductos;
    const ivaTotal = ivaServicios + ivaProductos;
    const totalConIvaTotal = totalServiciosConIva + totalProductosConIva;

    const verificacion = Math.abs((subtotalTotal + ivaTotal) - totalConIvaTotal) < 0.01;

    return {
        subtotalServicios,
        subtotalProductos,
        subtotalTotal,
        ivaServicios,
        ivaProductos,
        ivaTotal,
        totalConIvaTotal
    };
};

// Función auxiliar para mostrar precios con IVA incluido en la UI
const formatPriceWithIvaNote = (price: number) => {
    return `$${price.toFixed(2)} (IVA incluido)`;
};

// Función para calcular el precio sin IVA de un item individual
const getPriceWithoutIva = (priceWithIva: number) => {
    return priceWithIva / 1.16;
};

// Función para calcular solo el IVA de un item individual
const getIvaFromPrice = (priceWithIva: number) => {
    const priceWithoutIva = getPriceWithoutIva(priceWithIva);
    return priceWithIva - priceWithoutIva;
};

// Verificar si algún servicio requiere identificación
const requiereIdentificacion = cart.some(item =>
    item.tipo === 'servicio' && item.id === 2
);

const addToCart = (item: CartItem) => {
    // Para productos, mantener el comportamiento actual (se pueden agrupar)
    if (item.tipo === 'producto') {
        const existingItemIndex = cart.findIndex(
            cartItem => cartItem.id === item.id && cartItem.tipo === item.tipo
        );

        if (existingItemIndex >= 0) {
            const updatedCart = [...cart];
            updatedCart[existingItemIndex].cantidad += item.cantidad;
            setCart(updatedCart);
        } else {
            setCart([...cart, item]);
        }
        return;
    }

    // Para servicios con detalles de calzado, verificar si ya existe un par igual
    if (item.tipo === 'servicio' && (item.marca || item.modelo || item.descripcion)) {
        const isDuplicate = cart.some(cartItem =>
            cartItem.tipo === 'servicio' &&
            cartItem.marca?.trim().toLowerCase() === item.marca?.trim().toLowerCase() &&
            cartItem.modelo?.trim().toLowerCase() === item.modelo?.trim().toLowerCase() &&
            cartItem.descripcion?.trim().toLowerCase() === item.descripcion?.trim().toLowerCase()
        );

        if (!isDuplicate) {
            const uniqueItem = {
                ...item,
                cantidad: 1,
                tempId: Date.now() + Math.random().toString(36).substring(2, 9)
            };
            setCart([...cart, uniqueItem]);
        } else {
            console.warn('⚠️ Este par ya fue agregado al carrito.');
        }
        return;
    }

    // Para servicios genéricos (sin marca/modelo/desc), permitir agrupación normal
    const existingItemIndex = cart.findIndex(
        cartItem =>
            cartItem.id === item.id &&
            cartItem.tipo === item.tipo &&
            !cartItem.marca &&
            !cartItem.modelo &&
            !cartItem.descripcion
    );

    if (existingItemIndex >= 0) {
        const updatedCart = [...cart];
        updatedCart[existingItemIndex].cantidad += item.cantidad;
        setCart(updatedCart);
    } else {
        setCart([...cart, item]);
    }
};

const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
};

const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    const newCart = [...cart];
    newCart[index].cantidad = newQuantity;
    setCart(newCart);
};

const clearCart = () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        setCart([]);
    }
};

const handleSearch = (term: string) => {
    setSearchTerm(term);
};

const handleCreateClient = (newClient: Client) => {
    setSelectedClient(newClient);
    setIsClientFormOpen(false);
};

// Función de checkout corregida que incluye productos y servicios
const handleCheckout = async (paymentData: { metodoPago: string; monto: number }) => {

    if (!selectedClient) {
        setError('Por favor selecciona un cliente');
        return;
    }
    if (cart.length === 0) {
        setError('El carrito está vacío');
        return;
    }
    const serviciosEnCarrito = cart.filter(item => item.tipo === 'servicio');
    if (serviciosEnCarrito.length === 0) {
        setError('Debe haber al menos un servicio en la orden');
        return;
    }

    const calculosVerificados = verificarCalculos();

    const totalOrden = calculosVerificados.totalConIvaTotal;
    if (paymentData.monto < totalOrden) {
        setError(`El monto pagado ($${paymentData.monto}) es menor al total de la orden ($${totalOrden.toFixed(2)})`);
        return;
    }

    try {
        setIsLoading(true);
        setError(null);

        const servicios = cart
            .filter(item => item.tipo === 'servicio')
            .map(item => ({
                servicioId: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id,
                cantidad: (item.marca || item.modelo || item.descripcion)
                    ? 1
                    : (typeof item.cantidad === 'string' ? parseInt(item.cantidad, 10) : item.cantidad),
                modeloId: item.modeloId ? (typeof item.modeloId === 'string' ? parseInt(item.modeloId, 10) : item.modeloId) : null,
                marca: item.marca || '',
                modelo: item.modelo || '',
                descripcion: item.descripcion || ''
            }));

        const productos = cart
            .filter(item => item.tipo === 'producto')
            .map(item => ({
                productoId: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id,
                cantidad: typeof item.cantidad === 'string' ? parseInt(item.cantidad, 10) : item.cantidad
            }));

        const clienteId = selectedClient.cliente_id ?? null;

        let requiereIdentificacion = false;
        for (const item of servicios) {
            const servicioEncontrado = services.find(s => s.servicio_id === item.servicioId);
            if (servicioEncontrado?.requiere_identificacion) {
                requiereIdentificacion = true;
                break;
            }
        }

        const orderData = {
            cliente: {
                cliente_id: clienteId,
                nombre: selectedClient.nombre,
                apellidos: selectedClient.apellidos || '',
                telefono: selectedClient.telefono || '',
                email: selectedClient.email || ''
            },
            servicios,
            productos,
            subtotal: calculosVerificados.subtotalTotal,
            iva: calculosVerificados.ivaTotal,
            total: calculosVerificados.totalConIvaTotal,
            metodoPago: paymentData.metodoPago,
            monto: typeof paymentData.monto === 'string' ? parseFloat(paymentData.monto) : paymentData.monto,
            tieneIdentificacion: !!tieneIdentificacion,
            notas: notas || ''
        };


        const response = await fetch('/api/admin/pos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Error al procesar la orden');
        }

        setCart([]);
        setSelectedClient(null);
        setNotas('');
        setTieneIdentificacion(false);
        setSearchTerm('');

        const cambio = paymentData.monto - totalOrden;
        let mensajeExito = `¡Orden ${result.codigoOrden} creada exitosamente!`;
        if (cambio > 0) {
            mensajeExito += `\n\nCambio a entregar: $${cambio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        }
        if (result.requiereIdentificacion && !tieneIdentificacion) {
            mensajeExito += '\n\n⚠️ IMPORTANTE: Este servicio requiere identificación. Asegúrate de solicitarla al cliente.';
        }
        alert(mensajeExito);
    } catch (err) {
        console.error('❌ Error al procesar orden:', err);
        setError(err instanceof Error ? err.message : 'Error al procesar la orden');
    } finally {
        setIsLoading(false);
    }
};

// Reset al estado inicial para nueva venta
const startNewOrder = () => {
    setCart([]);
    setSelectedClient(null);
    setNotas('');
    setTieneIdentificacion(false);
    setActiveTab('servicios');
    setSuccessData(null);
    setError(null);
};

// Si se ha completado una orden con éxito, mostrar pantalla de confirmación
if (successData) {
    return (
        <OrderSuccess
            ordenId={successData.ordenId}
            codigoOrden={successData.codigoOrden}
            requiereIdentificacion={successData.requiereIdentificacion}
            onStartNew={startNewOrder}
        />
    );
}


    return (
        <div className="flex flex-col w-full h-full lg:flex-row">
            {/* Panel izquierdo: Productos y Servicios */}
            <div className="flex-1 flex flex-col p-4 lg:max-w-6xl overflow-hidden h-full">
                {/* Cabecera */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-semibold text-[#313D52]">Punto de Venta</h1>

                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-[#6c7a89]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="py-2 pl-10 pr-4 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Pestañas */}
                <div className="flex mb-6 bg-[#f5f9f8] rounded-lg p-1">
                    <button
                        className={`flex-1 py-2 rounded-md transition-colors ${activeTab === 'servicios'
                            ? 'bg-white shadow-sm text-[#313D52]'
                            : 'text-[#6c7a89] hover:bg-white/50'
                            }`}
                        onClick={() => setActiveTab('servicios')}
                    >
                        Servicios
                    </button>
                    <button
                        className={`flex-1 py-2 rounded-md transition-colors ${activeTab === 'productos'
                            ? 'bg-white shadow-sm text-[#313D52]'
                            : 'text-[#6c7a89] hover:bg-white/50'
                            }`}
                        onClick={() => setActiveTab('productos')}
                    >
                        Productos
                    </button>
                </div>

                {/* Contenido de las pestañas */}
                {/* Contenido de las pestañas: múltiple por línea con flex-wrap */}
                <div className="flex flex-wrap  overflow-y-auto pb-4">
                    {activeTab === 'servicios' ? (
                        <ServiceSelector
                            onAddToCart={addToCart}
                            searchTerm={searchTerm}
                        />
                    ) : (
                        <ProductCatalog
                            onAddToCart={addToCart}
                            searchTerm={searchTerm}
                        />
                    )}
                </div>

            </div>

            {/* Panel derecho: Selección de cliente y carrito */}
            <div className="w-full lg:w-112 bg-[#f5f9f8] border-t lg:border-t-0 lg:border-l border-[#e0e6e5] flex flex-col h-full">
                {/* Sección de cliente */}
                <div className="p-4 border-b border-[#e0e6e5]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-medium text-[#313D52]">Cliente</h2>
                        <button
                            onClick={() => setIsClientFormOpen(true)}
                            className="flex items-center text-xs text-[#78f3d3] hover:underline"
                        >
                            <UserPlus size={14} className="mr-1" />
                            Nuevo Cliente
                        </button>
                    </div>

                    <ClientSearch
                        onSelectClient={setSelectedClient}
                        selectedClient={selectedClient}
                    />
                </div>

                {/* Carrito */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-medium text-[#313D52]">Carrito</h2>
                        <button
                            onClick={clearCart}
                            disabled={cart.length === 0}
                            className="flex items-center text-xs text-red-500 hover:underline disabled:opacity-50 disabled:hover:no-underline"
                        >
                            <Trash2 size={14} className="mr-1" />
                            Vaciar
                        </button>
                    </div>

                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                            <ShoppingCart size={32} className="text-[#e0e6e5] mb-2" />
                            <p className="text-[#6c7a89]">El carrito está vacío</p>
                            <p className="text-xs text-[#6c7a89] mt-1">Añade productos o servicios para comenzar</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                    <div className="flex-1">
                                        <div className="font-medium text-[#313D52]">{item.nombre}</div>
                                        <div className="text-sm text-[#6c7a89]">
                                            ${Number(item.precio).toFixed(2)} x {item.cantidad}
                                        </div>

                                        {item.modelo && (
                                            <div className="text-xs text-[#6c7a89] mt-1">
                                                {item.marca} {item.modelo}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center border rounded-md overflow-hidden">
                                            <button
                                                onClick={() => updateQuantity(index, item.cantidad - 1)}
                                                className="px-2 py-1 bg-[#f5f9f8] hover:bg-[#e0e6e5] text-[#313D52]"
                                            >
                                                -
                                            </button>
                                            <span className="px-2 py-1 bg-white">{item.cantidad}</span>
                                            <button
                                                onClick={() => updateQuantity(index, item.cantidad + 1)}
                                                className="px-2 py-1 bg-[#f5f9f8] hover:bg-[#e0e6e5] text-[#313D52]"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(index)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notas */}
                <div className="p-4 border-t border-[#e0e6e5]">
                    <label htmlFor="notas" className="block text-xs font-medium text-[#6c7a89] mb-1">
                        Notas de la orden
                    </label>
                    <textarea
                        id="notas"
                        rows={2}
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Notas adicionales para la orden..."
                        className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm resize-none"
                    />
                </div>

                {/* Resumen y botón de pago */}
                <div className="p-4 border-t border-[#e0e6e5] bg-white">
                    <CartSummary
                        subtotal={calcularSubtotal()}
                        iva={calcularIva()}
                        total={calcularTotal()}
                    />

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-start">
                            <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <button
                        onClick={() => setIsPaymentFormOpen(true)}
                        disabled={cart.length === 0 || !selectedClient || isLoading}
                        className="w-full mt-4 py-3 px-4 bg-[#78f3d3] text-[#313D52] font-medium rounded-lg flex items-center justify-center hover:bg-[#4de0c0] transition-colors disabled:opacity-50 disabled:hover:bg-[#78f3d3]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin mr-2" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <CreditCard size={20} className="mr-2" />
                                Procesar Pago
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Modal de nuevo cliente */}
            {isClientFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center p-4 border-b border-[#e0e6e5]">
                            <h2 className="text-lg font-semibold text-[#313D52]">Nuevo Cliente</h2>
                            <button
                                onClick={() => setIsClientFormOpen(false)}
                                className="text-[#6c7a89] hover:text-[#313D52]"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <NewClientForm
                            onSubmit={handleCreateClient}
                            onCancel={() => setIsClientFormOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Modal de pago */}
            {isPaymentFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center p-4 border-b border-[#e0e6e5]">
                            <h2 className="text-lg font-semibold text-[#313D52]">Procesar Pago</h2>
                            <button
                                onClick={() => setIsPaymentFormOpen(false)}
                                className="text-[#6c7a89] hover:text-[#313D52]"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <PaymentForm
                            total={calcularTotal()}
                            onSubmit={handleCheckout}
                            onCancel={() => setIsPaymentFormOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}