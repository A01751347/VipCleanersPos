"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Loader2, CheckCircle, AlertCircle, User, Package, Calendar, Mail, Phone,
  Clock, DollarSign, Brush, Sparkles, Wrench, Plus, Minus, Trash2,
  ChevronLeft, ChevronRight, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// (Opcional) declara los handlers aquí, antes de usarlos:
const handleTurnstileVerify = (setToken: (t: string) => void, setErr: (v: boolean) => void) =>
  (token: string) => { setToken(token); setErr(false); };

const handleTurnstileError = (setToken: (t: string) => void, setErr: (v: boolean) => void) =>
  () => { setToken(""); setErr(true); };

const handleTurnstileExpire = (setToken: (t: string) => void) =>
  () => { setToken(""); };
// Types
// ======================
interface ServiceOption {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number;
  requiresIdentification?: boolean;
}

interface SelectedService {
  serviceId: string;
  quantity: number;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  services: SelectedService[];
  deliveryMethod: "store";
  bookingDate: string;
  bookingTime: string;
  requiresPickup: false;
}

interface FormStatus {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
  bookingReference?: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ======================
// Turnstile Component
// ======================
const TurnstileWidget: React.FC<{
  onVerify: (token: string) => void;
  onError: () => void;
  onExpire: () => void;
}> = ({ onVerify, onError, onExpire }) => {
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [widgetId, setWidgetId] = useState<string | null>(null);

  // Cargar el script de Turnstile
  useEffect(() => {
    if (window.turnstile) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup si es necesario
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Renderizar el widget cuando esté cargado
  useEffect(() => {
    if (isLoaded && turnstileRef.current && window.turnstile && !widgetId) {
      try {
        const id = window.turnstile.render(turnstileRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || 'your-site-key-here',
          callback: onVerify,
          'error-callback': onError,
          'expired-callback': onExpire,
          theme: 'light',
          size: 'normal',
        });
        setWidgetId(id);
      } catch (error) {
        console.error('Error rendering Turnstile:', error);
        onError();
      }
    }
  }, [isLoaded, onVerify, onError, onExpire, widgetId]);

  // Cleanup del widget
  useEffect(() => {
    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (error) {
          console.error('Error removing Turnstile widget:', error);
        }
      }
    };
  }, [widgetId]);

  return (
    <div className="flex flex-col items-center">
      <div ref={turnstileRef} />
      {!isLoaded && (
        <div className="flex items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50">
          <Loader2 size={16} className="animate-spin mr-2" />
          <span className="text-sm text-gray-600">Cargando verificación...</span>
        </div>
      )}
    </div>
  );
};

// Declarar tipos para Turnstile
declare global {
  interface Window {
    turnstile: {
      render: (element: HTMLElement, options: any) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

// Turnstile handlers are provided as curried helpers above and bound in-component

// ======================
// Calendar Component
// ======================
const CalendarPicker: React.FC<{
  selectedDate: string;
  onDateSelect: (date: string) => void;
  minDate: string;
}> = ({ selectedDate, onDateSelect, minDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Juli", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Deshabilitar fechas pasadas o domingos
    const isSunday = date.getDay() === 0; // 0 = domingo
    return date < today || isSunday;
  };


  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateSelected = (date: Date) => {
    return formatDate(date) === selectedDate;
  };

  const days = getDaysInMonth(currentMonth);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };
  // Componente Calendario
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-10" />;
          }

          const disabled = isDateDisabled(day);
          const selected = isDateSelected(day);

          return (
            <button
              key={index}
              onClick={() => !disabled && onDateSelect(formatDate(day))}
              disabled={disabled}
              className={`
              h-10 w-full rounded-lg text-sm font-medium transition-all
              ${disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : selected
                    ? 'bg-[#78f3d3] text-[#313D52] shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }
            `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ======================
// Main Component
// ======================
const BookingSimple: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    services: [],
    deliveryMethod: "store",
    bookingDate: "",
    bookingTime: "",
    requiresPickup: false,
  });

  const [formStatus, setFormStatus] = useState<FormStatus>({ status: "idle", message: "" });
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileError, setTurnstileError] = useState<boolean>(false);

  useEffect(() => setMounted(true), []);

  // Body scroll control
  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      // Guardar la posición actual
      const scrollY = window.scrollY;
      // Bloqueo robusto (iOS-friendly)
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll'; // mantiene el ancho (no salta el layout)
    } else {
      // Restaurar
      const top = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      // Volver a la posición previa
      if (top) window.scrollTo(0, -parseInt(top, 10));
    }

    return () => {
      // Limpieza por si se desmonta con el modal abierto
      const top = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      if (top) window.scrollTo(0, -parseInt(top, 10));
    };
  }, [isOpen, mounted]);

  // Load services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const response = await fetch("/api/admin/services");

        if (response.ok) {
          const data = await response.json();
          const activeServices = (data.services || []).filter((s: any) => s.activo);
          const converted: ServiceOption[] = activeServices.map((s: any) => ({
            id: s.servicio_id.toString(),
            name: s.nombre,
            price: Number(s.precio),
            description: s.descripcion,
            duration: s.tiempo_estimado || 60,
            requiresIdentification: s.requiere_identificacion,
          }));
          setServiceOptions(converted);
          if (converted.length > 0 && formData.services.length === 0) {
            setFormData((prev) => ({
              ...prev,
              services: [{ serviceId: converted[0].id, quantity: 1 }],
            }));
          }
        } else {
          // Fallback services
          const fallback: ServiceOption[] = [
            {
              id: "1",
              name: "Limpieza Básica",
              price: 175,
              description: "Limpieza exterior, agujetas y tratamiento desodorizante",
              duration: 60,
            },
            {
              id: "2",
              name: "Limpieza Premium",
              price: 249,
              description: "Servicio completo + protección avanzada",
              duration: 90,
            },
          ];
          setServiceOptions(fallback);
          if (formData.services.length === 0) {
            setFormData((prev) => ({
              ...prev,
              services: [{ serviceId: fallback[0].id, quantity: 1 }],
            }));
          }
        }
      } catch (e) {
        // Fallback on error
        const fallback: ServiceOption[] = [
          {
            id: "1",
            name: "Limpieza Básica",
            price: 145,
            description: "Limpieza exterior, agujetas y tratamiento desodorizante",
            duration: 60,
          },
        ];
        setServiceOptions(fallback);
        if (formData.services.length === 0) {
          setFormData((prev) => ({
            ...prev,
            services: [{ serviceId: fallback[0].id, quantity: 1 }],
          }));
        }
      } finally {
        setServicesLoading(false);
      }
    };
    if (isOpen) fetchServices();
  }, [isOpen]);

  // Helpers
  const getServiceIcon = (serviceName: string) => {
    const name = (serviceName || "").toLowerCase();
    if (name.includes("básica") || name.includes("basica")) return <Brush size={16} className="text-[#78f3d3]" />;
    if (name.includes("profunda") || name.includes("premium")) return <Sparkles size={16} className="text-[#78f3d3]" />;
    if (name.includes("restauraci")) return <Wrench size={16} className="text-[#78f3d3]" />;
    return <Brush size={16} className="text-[#78f3d3]" />;
  };

  const calculateTotal = useMemo(() => {
    return formData.services.reduce((total, s) => {
      const opt = serviceOptions.find((o) => o.id === s.serviceId);
      return total + (opt ? opt.price * s.quantity : 0);
    }, 0);
  }, [formData.services, serviceOptions]);

  // Handlers
  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (field === "phone") {
      const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
      setFormData((p) => ({ ...p, [field]: cleaned }));
    } else {
      setFormData((p) => ({ ...p, [field]: e.target.value }));
    }
  };

  const addService = () => {
    if (serviceOptions.length === 0) return;
    setFormData((p) => ({
      ...p,
      services: [...p.services, { serviceId: serviceOptions[0].id, quantity: 1 }],
    }));
  };

  const updateService = (index: number, patch: Partial<SelectedService>) => {
    setFormData((p) => ({
      ...p,
      services: p.services.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const removeService = (index: number) => {
    setFormData((p) => ({ ...p, services: p.services.filter((_, i) => i !== index) }));
  };

  // Validation
  const validateAll = (): boolean => {
    const issues: string[] = [];
    if (!formData.fullName.trim()) issues.push("Nombre completo es requerido.");
    if (!/\S+@\S+\.\S+/.test(formData.email)) issues.push("Email válido es requerido.");
    if (formData.phone.length !== 10) issues.push("El teléfono debe tener 10 dígitos.");
    if (formData.services.length === 0) issues.push("Agrega al menos un servicio.");
    if (!formData.bookingDate || !formData.bookingTime) issues.push("Selecciona fecha y hora.");
    if (!turnstileToken) issues.push("Completa la verificación de seguridad.");

    if (issues.length) {
      setFormStatus({ status: "error", message: issues[0] });
      return false;
    }
    setFormStatus({ status: "idle", message: "" });
    return true;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateAll()) return;
    setFormStatus({ status: "submitting", message: "Procesando tu reserva..." });

    try {
      const servicesToSend = formData.services.map((s) => ({
        serviceId: s.serviceId,
        quantity: s.quantity,
        shoesType: "Tenis sin especificar",
        serviceName: serviceOptions.find((o) => o.id === s.serviceId)?.name || "",
        servicePrice: serviceOptions.find((o) => o.id === s.serviceId)?.price || 0,
      }));

      const totalServiceCost = calculateTotal;
      const mainService = formData.services[0];

      const combinedShoesDescription = formData.services
        .map((s) => `Tenis sin especificar (${s.quantity} par${s.quantity > 1 ? "es" : ""})`)
        .join(", ");

      const bookingData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        services: servicesToSend,
        totalServiceCost,
        shoesType: combinedShoesDescription,
        serviceType: mainService?.serviceId || "",
        deliveryMethod: "store",
        requiresPickup: false,
        address: null,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        pickupCost: 0,
        pickupZone: null,
        timestamp: new Date().toISOString(),
        source: "booking_simple_store_only",
        turnstileToken: turnstileToken, // Enviar el token de Turnstile
      };

      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Error al procesar la reserva");

      const bookingReference =
        result.bookingReference || result.orderId || `RES-${Date.now().toString().slice(-6)}`;

      setFormStatus({ status: "success", message: "¡Orden creada exitosamente!", bookingReference });
    } catch (error: any) {
      setFormStatus({
        status: "error",
        message: error instanceof Error ? error.message : "Hubo un error al procesar tu reserva. Intenta nuevamente.",
      });
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overscroll-contain"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="
            bg-white rounded-2xl shadow-2xl w-full max-w-6xl
            max-h-screen overflow-y-auto
            lg:h-[90vh] lg:overflow-y-hidden
            flex flex-col
          " >
            {/* Header */}
            <div className="bg-[#313D52] text-white p-6 rounded-t-2xl">
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <h2 className="text-2xl font-bold">Reserva tu Servicio</h2>
      <p className="text-white/80 text-sm">Rápido y sencillo</p>
    </div>

    <button
      onClick={onClose}
      className="shrink-0 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
    >
      <X size={20} />
    </button>
  </div>
</div>



            {/* Content */}
            <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] lg:overflow-hidden">

              {/* Left side - Form */}
              <div
                className="
      space-y-5 
      lg:pr-2 
      lg:overflow-y-auto 
      overscroll-contain
    "
                style={{ WebkitOverflowScrolling: 'touch' }}
              >

                {/* Contact Info */}
                <div>
                  <h3 className="flex items-center text-lg font-semibold text-[#313D52] mb-3">
                    <User size={18} className="text-[#78f3d3] mr-2" />
                    Contacto
                  </h3>

                  <div className="grid grid-cols-1 mb-2">
                    <input
                      type="text"
                      placeholder="Nombre Completo"
                      value={formData.fullName}
                      onChange={handleInputChange("fullName")}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange("email")}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono (10 dígitos)"
                      value={formData.phone}
                      onChange={handleInputChange("phone")}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h3 className="flex items-center text-lg font-semibold text-[#313D52] mb-3">
                    <Package size={18} className="text-[#78f3d3] mr-2" />
                    Servicios
                  </h3>
                  {servicesLoading ? (
                    <div className="flex items-center text-gray-600">
                      <Loader2 size={16} className="animate-spin mr-2" /> Cargando...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.services.map((s, idx) => {
                        const opt = serviceOptions.find((o) => o.id === s.serviceId);
                        return (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getServiceIcon(opt?.name || "")}
                                <span className="font-medium">Servicio #{idx + 1}</span>
                              </div>
                              {formData.services.length > 1 && (
                                <button
                                  onClick={() => removeService(idx)}
                                  className="text-red-600 hover:bg-red-50 rounded p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <select
                                value={s.serviceId}
                                onChange={(e) => updateService(idx, { serviceId: e.target.value })}
                                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#78f3d3]"
                              >
                                {serviceOptions.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name} — ${o.price}
                                  </option>
                                ))}
                              </select>


                              <div className="ml-auto shrink-0 flex items-center gap-2">
                                <button
                                  onClick={() => updateService(idx, { quantity: Math.max(1, s.quantity - 1) })}
                                  className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                  disabled={s.quantity <= 1}
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="font-medium min-w-[3ch] text-center">{s.quantity}</span>
                                <button
                                  onClick={() => updateService(idx, { quantity: s.quantity + 1 })}
                                  className="w-8 h-8 rounded bg-[#78f3d3] hover:bg-[#4de0c0] flex items-center justify-center"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        onClick={addService}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#78f3d3] hover:bg-[#78f3d3]/5 transition-all flex items-center justify-center gap-2 text-gray-600"
                      >
                        <Plus size={16} /> Agregar servicio
                      </button>
                    </div>
                  )}
                </div>

                {/* Services Summary */}
                <div className="hidden lg:block">

                <h3 className="text-lg font-semibold text-[#313D52] mb-4">Resumen de tu orden</h3>

                  <div className="space-y-2 mb-6">
                    {formData.services.map((s, i) => {
                      const opt = serviceOptions.find((o) => o.id === s.serviceId);
                      return (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <div>
                            <div className="font-medium">{opt?.name || "Servicio"}</div>
                            <div className="text-gray-600">{s.quantity} par{s.quantity > 1 ? "es" : ""}</div>
                          </div>
                          <div className="font-medium">${opt ? opt.price * s.quantity : 0}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-[#78f3d3] rounded-lg p-4 text-[#313D52]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Servicios</span>
                      <span className="text-sm">${calculateTotal}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm">Entrega en tienda</span>
                      <span className="text-sm text-green-700">Gratis</span>
                    </div>
                    <div className="border-t border-[#313D52]/20 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Total</span>
                        <div className="flex items-center">
                          <DollarSign size={20} />
                          <span className="text-2xl font-bold">{calculateTotal}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>



              {/* Right side - Summary */}
              <div
                className="order-1 lg:order-2 bg-gray-50 rounded-xl p-6 flex flex-col min-w-0 lg:overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >

                {/* Date & Time */}
                <div>
                  <h3 className="flex items-center text-lg font-semibold text-[#313D52] mb-3">
                    <Calendar size={18} className="text-[#78f3d3] mr-2" />
                    Fecha y Hora
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona una fecha</label>
                      <CalendarPicker
                        selectedDate={formData.bookingDate}
                        onDateSelect={(date) => setFormData(p => ({ ...p, bookingDate: date }))}
                        minDate={getMinDate()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona una hora</label>
                      <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg p-3">
                        {[
                          "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                          "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
                          "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
                        ].map((time) => (
                          <button
                            key={time}
                            onClick={() => setFormData(p => ({ ...p, bookingTime: time }))}
                            className={`p-2 text-sm rounded-lg border transition-all ${formData.bookingTime === time
                              ? 'bg-[#78f3d3] border-[#78f3d3] text-[#313D52] font-medium'
                              : 'border-gray-300 hover:border-[#78f3d3] hover:bg-[#78f3d3]/10'
                              }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>



                <div className="lg:hidden pt-4">

                <h3 className="text-lg font-semibold text-[#313D52] mb-4">Resumen de tu orden</h3>

                  <div className="space-y-2 mb-6">
                    {formData.services.map((s, i) => {
                      const opt = serviceOptions.find((o) => o.id === s.serviceId);
                      return (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <div>
                            <div className="font-medium">{opt?.name || "Servicio"}</div>
                            <div className="text-gray-600">{s.quantity} par{s.quantity > 1 ? "es" : ""}</div>
                          </div>
                          <div className="font-medium">${opt ? opt.price * s.quantity : 0}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-[#78f3d3] rounded-lg p-4 text-[#313D52]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Servicios</span>
                      <span className="text-sm">${calculateTotal}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm">Entrega en tienda</span>
                      <span className="text-sm text-green-700">Gratis</span>
                    </div>
                    <div className="border-t border-[#313D52]/20 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Total</span>
                        <div className="flex items-center">
                          <DollarSign size={20} />
                          <span className="text-2xl font-bold">{calculateTotal}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Total */}
                <div className="mt-auto">

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={formStatus.status === "submitting"}
                    className="w-full mt-4 px-6 py-3 bg-[#313D52] text-white font-semibold rounded-lg hover:bg-[#2a3240] transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {formStatus.status === "submitting" ? (
                      <>
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        Confirmar Reserva
                        <CheckCircle size={18} className="ml-2" />
                      </>
                    )}
                  </button>

                  {/* Turnstile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mt-8 mb-2 flex items-center">
                      <Shield size={16} className="mr-2 text-[#78f3d3]" />
                      Verificación de seguridad
                    </label>
                    <TurnstileWidget
                      onVerify={handleTurnstileVerify(setTurnstileToken, setTurnstileError)}
                      onError={handleTurnstileError(setTurnstileToken, setTurnstileError)}
                      onExpire={handleTurnstileExpire(setTurnstileToken)}
                    />
                    {turnstileError && (
                      <p className="text-red-600 text-sm mt-2">
                        Error en la verificación. Por favor, intenta nuevamente.
                      </p>
                    )}
                  </div>


                  {/* Error */}
                  {formStatus.status === "error" && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                      <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                      <span className="text-sm">{formStatus.message}</span>
                    </div>
                  )}

                  {/* Success State */}
                  {/* Popup de confirmación */}
                  {formStatus.status === "success" &&
                    createPortal(
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        >
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6"
                            role="dialog"
                            aria-modal="true"
                          >
                            <button
                              onClick={() => setFormStatus({ status: "idle", message: "" })}
                              className="absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100 text-gray-600"
                              aria-label="Cerrar"
                            >
                              <X size={18} />
                            </button>

                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle size={28} className="text-green-600" />
                            </div>

                            <h4 className="text-xl font-bold text-center text-[#313D52] mb-2">
                              ¡Reserva Confirmada!
                            </h4>

                            <p className="text-sm text-center text-gray-600 mb-3">
                              Tu referencia:
                            </p>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center mb-4">
                              <span className="font-mono text-lg font-semibold text-[#313D52]">
                                {formStatus.bookingReference}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setFormStatus({ status: "idle", message: "" });
                                  onClose();
                                }}
                                className="flex-1 px-4 py-2 rounded-lg bg-[#313D52] text-white font-semibold hover:bg-[#2a3240] transition"
                              >
                                Listo
                              </button>
                              <button
                                onClick={() => setFormStatus({ status: "idle", message: "" })}
                                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                              >
                                Seguir aquí
                              </button>
                            </div>
                          </motion.div>
                        </motion.div>
                      </AnimatePresence>,
                      document.body
                    )
                  }

                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// Export component
const BookingButton: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  className,
  children
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={className}
        onClick={() => setOpen(true)}
      >
        {children || "Reserva Ahora"}
      </button>
      <BookingSimple isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default BookingButton;