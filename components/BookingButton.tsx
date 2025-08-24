"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  FormEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Package,
  Calendar,
  DollarSign,
  Brush,
  Sparkles,
  Wrench,
  Plus,
  Minus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ======================
// Constantes / Utils
// ======================

const TIME_SLOTS = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
] as const;

const formatDateISO = (date: Date) => date.toISOString().split("T")[0];

// (Opcional) Handlers curried para Turnstile
const handleTurnstileVerify =
  (setToken: (t: string) => void, setErr: (v: boolean) => void) =>
  (token: string) => {
    setToken(token);
    setErr(false);
  };

const handleTurnstileError =
  (setToken: (t: string) => void, setErr: (v: boolean) => void) => () => {
    setToken("");
    setErr(true);
  };

const handleTurnstileExpire = (setToken: (t: string) => void) => () => {
  setToken("");
};

// ======================
// Tipos
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
  deliveryMethod: "store" | "pickup";
  bookingDate: string;
  bookingTime: string;
  requiresPickup: boolean;
  acceptTerms: boolean; 
  acceptWhatsapp: boolean; 
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
// Tipos Turnstile
// ======================

type TurnstileTheme = "light" | "dark" | "auto";
type TurnstileSize = "normal" | "invisible" | "compact";

type TurnstileRenderOptions = {
  sitekey: string;
  callback?: (t: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
  appearance?: "always" | "execute" | "interaction-only";
  action?: string;
  cData?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
    __TURNSTILE_SCRIPT_ADDED__?: boolean;
  }
}

// ======================
// Toasts (top-right)
// ======================

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const Toasts: React.FC<{
  toasts: ToastItem[];
  onClose: (id: number) => void;
}> = ({ toasts, onClose }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-[100000] flex flex-col gap-2"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className={[
              "pointer-events-auto rounded-lg shadow-lg border px-4 py-3 w-80 backdrop-blur",
              t.kind === 'success' && "bg-green-50/95 border-green-200 text-green-800",
              t.kind === 'error' && "bg-red-50/95 border-red-200 text-red-800",
              t.kind === 'info' && "bg-sky-50/95 border-sky-200 text-sky-900",
            ].join(' ')}
            role="status"
          >
            <div className="flex items-start gap-3">
              {t.kind === 'success' && <CheckCircle size={18} className="mt-[2px]" />}
              {t.kind === 'error' && <AlertCircle size={18} className="mt-[2px]" />}
              {t.kind === 'info' && <Shield size={18} className="mt-[2px]" />}

              <div className="text-sm leading-snug">{t.message}</div>

              <button
                onClick={() => onClose(t.id)}
                className="ml-auto text-black/60 hover:text-black transition p-1 rounded"
                aria-label="Cerrar notificación"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};


// ======================
// Turnstile Component
// ======================

const TurnstileWidget: React.FC<{
  onVerify: (token: string) => void;
  onError: () => void;
  onExpire: () => void;
  nonce?: string; // 👈 optional
}> = ({ onVerify, onError, onExpire, nonce }) => {
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(!!window.turnstile);
  const [widgetId, setWidgetId] = useState<string | null>(null);

  // Cargar el script de Turnstile una sola vez
  useEffect(() => {
    if (window.turnstile) {
      setIsLoaded(true);
      return;
    }
    if (window.__TURNSTILE_SCRIPT_ADDED__) return;

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true; script.defer = true;
    if (nonce) script.nonce = nonce; 
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
    window.__TURNSTILE_SCRIPT_ADDED__ = true;

    // Importante: NO retiramos el script en cleanup para evitar romper otros widgets.
  }, [nonce]);

  // Renderizar el widget cuando esté cargado
  useEffect(() => {
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!sitekey) {
      // Si no hay sitekey, no intentamos renderizar
      return;
    }

    if (isLoaded && turnstileRef.current && window.turnstile && !widgetId) {
      try {
        const id = window.turnstile.render(turnstileRef.current, {
          sitekey,
          callback: onVerify,
          "error-callback": onError,
          "expired-callback": onExpire,
          theme: "light",
          size: "normal",
          appearance: "always",
          action: "booking",
        });
        setWidgetId(id);
      } catch (error) {
        console.error("Error rendering Turnstile:", error);
        onError();
      }
    }
  }, [isLoaded, onVerify, onError, onExpire, widgetId]);

  // Cleanup del widget en unmount
  useEffect(() => {
    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (error) {
          console.error("Error removing Turnstile widget:", error);
        }
      }
    };
  }, [widgetId]);

  const missingKey = !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <div className="flex flex-col items-center">
      {missingKey ? (
        <div className="flex items-center justify-center p-4 border border-amber-300 rounded-lg bg-amber-50 text-amber-800 text-sm">
          Falta configurar <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>.
        </div>
      ) : (
        <>
          <div ref={turnstileRef} />
          {!isLoaded && (
            <div className="flex items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50">
              <Loader2 size={16} className="animate-spin mr-2" />
              <span className="text-sm text-gray-600">Cargando verificación...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ======================
// Calendar Component
// ======================

const CalendarPicker: React.FC<{
  selectedDate: string;
  onDateSelect: (date: string) => void;
  minDate: string;
  maxDate: string; // 👈 nuevo
}> = ({ selectedDate, onDateSelect, minDate, maxDate }) => {

  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Celdas vacías antes del primer día del mes
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const minDateObj = useMemo(() => {
    const t = new Date(minDate);
    t.setHours(0, 0, 0, 0);
    // También limitamos por "hoy".
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return t < today ? today : t;
  }, [minDate]);

  const maxDateObj = useMemo(() => {
    const t = new Date(maxDate);
    t.setHours(0, 0, 0, 0);
    return t;
  }, [maxDate]);


  const isDateDisabled = useCallback(
    (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const isSunday = d.getDay() === 0;
      return d < minDateObj || d > maxDateObj || isSunday;
    },
    [minDateObj, maxDateObj]
  );



  const isDateSelected = useCallback(
    (date: Date) => formatDateISO(date) === selectedDate,
    [selectedDate]
  );

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  const goToPreviousMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    // Evita navegar a meses completamente antes de minDateObj
    const firstDayPrev = new Date(prev.getFullYear(), prev.getMonth(), 1);
    const lastDayPrev = new Date(prev.getFullYear(), prev.getMonth() + 1, 0);
    if (lastDayPrev < minDateObj) return;
    setCurrentMonth(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    // Si el primer día del próximo mes es después de maxDateObj, no navegar
    if (next > maxDateObj) return;
    setCurrentMonth(next);
  };


  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4"
      role="group"
      aria-label="Selector de fecha"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="font-semibold text-gray-900" aria-live="polite">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2" role="row">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
            role="columnheader"
            aria-label={day}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Días del mes">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-10" aria-hidden="true" />;
          }

          const disabled = isDateDisabled(day);
          const selected = isDateSelected(day);
          const key = formatDateISO(day);

          return (
            <button
              key={key}
              onClick={() => !disabled && onDateSelect(formatDateISO(day))}
              disabled={disabled}
              role="gridcell"
              aria-selected={selected}
              className={`
                h-10 w-full rounded-lg text-sm font-medium transition-all
                ${
                  disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : selected
                    ? "bg-[#78f3d3] text-[#313D52] shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
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
  const MAX_PER_SERVICE = 25;

  const getTotalForService = (services: SelectedService[], serviceId: string) =>
    services.reduce((acc, s) => acc + (s.serviceId === serviceId ? s.quantity : 0), 0);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    services: [],
    deliveryMethod: "store",
    bookingDate: "",
    bookingTime: "",
    requiresPickup: false,
    acceptTerms: false, // 👈 nuevo
    acceptWhatsapp: false, // 👈 nuevo
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
const toastIdRef = useRef(0);

const showToast = useCallback((message: string, kind: ToastKind = 'error', ttl = 4000) => {
  const id = ++toastIdRef.current;
  setToasts((prev) => [...prev, { id, kind, message }]);
  // autodescartar
  window.setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, ttl);
}, []);

const closeToast = useCallback((id: number) => {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}, []);


  const [formStatus, setFormStatus] = useState<FormStatus>({
    status: "idle",
    message: "",
  });
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileError, setTurnstileError] = useState<boolean>(false);

  // Guarda estilos del body para restaurar
  const bodyStylesRef = useRef<{
    position?: string;
    top?: string;
    left?: string;
    right?: string;
    width?: string;
    overflowY?: string;
    paddingRight?: string;
  } | null>(null);

  // Mounted flag
  useEffect(() => setMounted(true), []);

  // Body scroll control con restauración limpia
  useEffect(() => {
    if (!mounted) return;

    const body = document.body;
    const docEl = document.documentElement;

    if (isOpen) {
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - docEl.clientWidth;

      // Guarda estilos actuales
      bodyStylesRef.current = {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        overflowY: body.style.overflowY,
        paddingRight: body.style.paddingRight,
      };

      // Aplica lock
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflowY = "scroll";
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      // Restaura
      const prev = bodyStylesRef.current;
      if (prev) {
        const top = body.style.top;
        body.style.position = prev.position ?? "";
        body.style.top = prev.top ?? "";
        body.style.left = prev.left ?? "";
        body.style.right = prev.right ?? "";
        body.style.width = prev.width ?? "";
        body.style.overflowY = prev.overflowY ?? "";
        body.style.paddingRight = prev.paddingRight ?? "";
        if (top) {
          const y = -parseInt(top, 10) || 0;
          window.scrollTo(0, y);
        }
      }
      bodyStylesRef.current = null;
    }

    return () => {
      // Cleanup defensivo
      const prev = bodyStylesRef.current;
      if (prev) {
        const top = document.body.style.top;
        document.body.style.position = prev.position ?? "";
        document.body.style.top = prev.top ?? "";
        document.body.style.left = prev.left ?? "";
        document.body.style.right = prev.right ?? "";
        document.body.style.width = prev.width ?? "";
        document.body.style.overflowY = prev.overflowY ?? "";
        document.body.style.paddingRight = prev.paddingRight ?? "";
        if (top) {
          const y = -parseInt(top, 10) || 0;
          window.scrollTo(0, y);
        }
      }
      bodyStylesRef.current = null;
    };
  }, [isOpen, mounted]);

  // Cargar servicios con AbortController
  useEffect(() => {
    if (!isOpen) return;

    const ac = new AbortController();
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const response = await fetch("/api/services", { signal: ac.signal });

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
        if (ac.signal.aborted) return;
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
        if (!ac.signal.aborted) setServicesLoading(false);
      }
    };

    fetchServices();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Diccionario id → opción
  const byId = useMemo(
    () => Object.fromEntries(serviceOptions.map((o) => [o.id, o] as const)),
    [serviceOptions]
  );

  // Total memorizado
  const calculateTotal = useMemo(() => {
    return formData.services.reduce((total, s) => {
      const opt = byId[s.serviceId];
      return total + (opt ? opt.price * s.quantity : 0);
    }, 0);
  }, [formData.services, byId]);

  // Formateador MXN
  const mxn = useMemo(
    () => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }),
    []
  );

  // Icono por servicio
  const getServiceIcon = useCallback((serviceName: string) => {
    const name = (serviceName || "").toLowerCase();
    if (name.includes("básica") || name.includes("basica"))
      return <Brush size={16} className="text-[#78f3d3]" />;
    if (name.includes("profunda") || name.includes("premium"))
      return <Sparkles size={16} className="text-[#78f3d3]" />;
    if (name.includes("restauraci")) return <Wrench size={16} className="text-[#78f3d3]" />;
    return <Brush size={16} className="text-[#78f3d3]" />;
  }, []);

  // Handlers
  const handleInputChange = useCallback(
    (field: keyof FormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (field === "phone") {
          const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
          setFormData((p) => ({ ...p, [field]: cleaned }));
        } else {
          setFormData((p) => ({ ...p, [field]: e.target.value }));
        }
      },
    []
  );

  const addService = useCallback(() => {
    if (serviceOptions.length === 0) return;
  
    // Busca el primer servicio que aún tenga cupo (< 25)
    const firstWithRoom = serviceOptions.find(
      (o) => getTotalForService(formData.services, o.id) < MAX_PER_SERVICE
    );
  
    if (!firstWithRoom) {
      showToast("Límite alcanzado: máximo 25 pares por tipo de servicio.", 'info');
      setFormStatus({ status: "error", message: "Límite alcanzado: 25 por tipo de servicio." });
      return;
    }
    
  
    setFormData((p) => ({
      ...p,
      services: [...p.services, { serviceId: firstWithRoom.id, quantity: 1 }],
    }));
  }, [serviceOptions, formData.services]);

  const updateService = useCallback((index: number, patch: Partial<SelectedService>) => {
    setFormData((p) => {
      const next = [...p.services];
      const current = next[index];
  
      const newServiceId = patch.serviceId ?? current.serviceId;
      const newQtyRaw = patch.quantity ?? current.quantity;
  
             // Total actual del servicio destino, excluyendo esta línea
       const totalExclThis = getTotalForService(
         formData.services.filter((_, i) => i !== index),
         newServiceId
       );
       const canIncrement = current.quantity < (MAX_PER_SERVICE - totalExclThis);
      
  
      // Máximo que puede tener esta línea sin pasarse del tope
      const maxForThisLine = Math.max(0, MAX_PER_SERVICE - totalExclThis);
  
      // Ajusta cantidad si se pasa
      const newQuantity = Math.min(newQtyRaw, maxForThisLine);
  
      next[index] = {
        serviceId: newServiceId,
        quantity: Math.max(1, newQuantity), // nunca menos de 1
      };
  
      // Si no hay cupo (maxForThisLine === 0), mantenemos quantity=1 pero avisamos
      if (maxForThisLine === 0) {
        // feedback opcional
        // setFormStatus({ status: "error", message: "Límite alcanzado para este servicio." });
      }
  
      return { ...p, services: next };
    });
  }, []);
  

  const removeService = useCallback((index: number) => {
    setFormData((p) => ({ ...p, services: p.services.filter((_, i) => i !== index) }));
  }, []);

  // Validación
  const validateAll = useCallback((): boolean => {
    const issues: string[] = [];
    if (!formData.fullName.trim()) issues.push("Completa tu nombre completo.");
    if (!/\S+@\S+\.\S+/.test(formData.email)) issues.push("Escribe un email válido.");
    if (formData.phone.length !== 10) issues.push("Tu teléfono debe tener 10 dígitos.");
    if (formData.services.length === 0) issues.push("Agrega al menos un servicio.");
    if (!formData.bookingDate || !formData.bookingTime) issues.push("Selecciona fecha y hora.");
    if (!turnstileToken) issues.push("Completa la verificación de seguridad.");
    if (!formData.acceptTerms) issues.push("Debes aceptar los términos y condiciones.");
  
    if (issues.length) {
      // muestra solo la primera para no saturar (o lanza varias, como prefieras)
      showToast(issues[0], 'error');
      setFormStatus({ status: 'error', message: issues[0] });
      return false;
    }
  
    setFormStatus({ status: 'idle', message: '' });
    return true;
  }, [formData, turnstileToken, showToast]);
  
  // Submit dentro de <form>
  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      if (e) e.preventDefault();
      if (!validateAll()) {
        // Si falla la validación, intentamos reset de Turnstile para forzar nuevo token
        try {
          window.turnstile?.reset();
        } catch {}
        return;
      }
      setFormStatus({ status: "submitting", message: "Procesando tu reserva..." });

      try {
        const servicesToSend = formData.services.map((s) => {
          const o = byId[s.serviceId];
          return {
            serviceId: s.serviceId,
            quantity: s.quantity,
            shoesType: "Tenis sin especificar",
            serviceName: o?.name || "",
            servicePrice: o?.price || 0,
          };
        });

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
          deliveryMethod: "store" as const,
          requiresPickup: false,
          address: null as string | null,
          bookingDate: formData.bookingDate,
          bookingTime: formData.bookingTime,
          pickupCost: 0,
          pickupZone: null as string | null,
          timestamp: new Date().toISOString(),
          source: "booking_simple_store_only",
          turnstileToken: turnstileToken,
          acceptTerms: formData.acceptTerms,
  acceptWhatsapp: formData.acceptWhatsapp,
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

        setFormStatus({
          status: "success",
          message: "¡Orden creada exitosamente!",
          bookingReference,
        });

        // Opcional: limpiar el token para evitar reuso
        setTurnstileToken("");
        try {
          window.turnstile?.reset();
        } catch {}
      } catch (error: any) {
        showToast(
          error instanceof Error ? error.message : "Hubo un error al procesar tu reserva. Intenta nuevamente.",
          'error'
        );
        setFormStatus({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Hubo un error al procesar tu reserva. Intenta nuevamente.",
        });
        // Reset del widget para permitir nuevo intento
        try {
          showToast("¡Orden creada exitosamente! 🎉", 'success');

          window.turnstile?.reset();
        } catch {}
      }
    },
    
    [validateAll, formData, byId, calculateTotal, turnstileToken]
    
  );

  const getMinDate = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateISO(tomorrow);
  }, []);

  const getMaxDate = useCallback(() => {
    const max = new Date();
    max.setDate(max.getDate() + 45);
    return formatDateISO(max);
  }, []);

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
          <Toasts toasts={toasts} onClose={closeToast} />

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
            "
          >
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
                  aria-label="Cerrar modal de reserva"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] lg:overflow-hidden">
              {/* Left side - Form */}
              <div
                className="space-y-5 lg:pr-2 lg:overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {/* Contact Info */}
                <form onSubmit={handleSubmit}>
                  <h3 className="flex items-center text-lg font-semibold text-[#313D52] mb-3 pt-6">
                    <User size={18} className="text-[#78f3d3] mr-2" />
                    Contacto
                  </h3>

                  <div className="grid grid-cols-1 mb-2">
                    <label htmlFor="fullName" className="sr-only">
                      Nombre Completo
                    </label>
                    <input
  id="fullName"
  type="text"
  placeholder="Nombre Completo"
  value={formData.fullName}
  onChange={handleInputChange("fullName")}
  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent"
  autoComplete="name"
  maxLength={60} // 👈 Limita a 60 caracteres
/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="email" className="sr-only">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange("email")}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent"
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="sr-only">
                        Teléfono
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="Teléfono (10 dígitos)"
                        value={formData.phone}
                        onChange={handleInputChange("phone")}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent"
                        autoComplete="tel"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mt-6">
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
                          const opt = byId[s.serviceId];
                          return (
                            <div
                              key={`svc-${idx}-${s.serviceId}`}
                              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {getServiceIcon(opt?.name || "")}
                                  <span className="font-medium">Servicio #{idx + 1}</span>
                                </div>
                                {formData.services.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeService(idx)}
                                    className="text-red-600 hover:bg-red-50 rounded p-1"
                                    aria-label={`Eliminar servicio #${idx + 1}`}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="sr-only" htmlFor={`svc-${idx}`}>
                                  Tipo de servicio
                                </label>
                                <select
                                  id={`svc-${idx}`}
                                  value={s.serviceId}
                                  onChange={(e) => updateService(idx, { serviceId: e.target.value })}
                                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#78f3d3]"
                                >
                                  {serviceOptions.map((o) => (
                                    <option key={o.id} value={o.id}>
                                      {o.name} — {mxn.format(o.price)}
                                    </option>
                                  ))}
                                </select>

                                <div className="ml-auto shrink-0 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateService(idx, { quantity: Math.max(1, s.quantity - 1) })
                                    }
                                    className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center disabled:opacity-50"
                                    disabled={s.quantity <= 1}
                                    aria-label="Disminuir cantidad"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="font-medium min-w-[3ch] text-center">
                                    {s.quantity}
                                  </span>
                                                                  <button
                                  type="button"
                                  onClick={() => updateService(idx, { quantity: s.quantity + 1 })}
                                  className="w-8 h-8 rounded bg-[#78f3d3] hover:bg-[#4de0c0] flex items-center justify-center disabled:opacity-50"
                                  aria-label="Aumentar cantidad"
                                  disabled={getTotalForService(formData.services, s.serviceId) >= MAX_PER_SERVICE}
                                >
  <Plus size={14} />
</button>

                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={addService}
                          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#78f3d3] hover:bg-[#78f3d3]/5 transition-all flex items-center justify-center gap-2 text-gray-600"
                        >
                          <Plus size={16} /> Agregar servicio
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Services Summary (desktop) */}
                  <div className="hidden lg:block mt-6">
                    <h3 className="text-lg font-semibold text-[#313D52] mb-4">
                      Resumen de tu orden
                    </h3>

                    <div className="space-y-2 mb-6">
                      {formData.services.map((s, i) => {
                        const opt = byId[s.serviceId];
                        return (
                          <div key={`sum-desktop-${i}`} className="flex justify-between items-center text-sm">
                            <div>
                              <div className="font-medium">{opt?.name || "Servicio"}</div>
                              <div className="text-gray-600">
                                {s.quantity} par{s.quantity > 1 ? "es" : ""}
                              </div>
                            </div>
                            <div className="font-medium">
                              {mxn.format(opt ? opt.price * s.quantity : 0)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-[#78f3d3] rounded-lg p-4 text-[#313D52]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Servicios</span>
                        <span className="text-sm">{mxn.format(calculateTotal)}</span>
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
                            <span className="text-2xl font-bold">
                              {calculateTotal}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit se queda al final del form en desktop pero renderizamos el botón fuera para sticky en mobile */}
                </form>
              </div>

              {/* Right side - Summary / Fecha y Hora + Turnstile + Submit */}
              <div
                className="order-1 lg:order-2 bg-gray-50 rounded-xl p-6 flex flex-col min-w-0 lg:overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {/* Date & Time */}
                <div>
                  <h3 className="flex items-center text-lg font-semibold text-[#313D52] mb-3">
                    <Calendar size={18} className="text-[#78f3d3] mr-2" />
                    Fecha y Hora
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecciona una fecha
                      </label>
                      <CalendarPicker
                        selectedDate={formData.bookingDate}
                        onDateSelect={(date) => setFormData((p) => ({ ...p, bookingDate: date }))}
                        minDate={getMinDate()}
                        maxDate={getMaxDate()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecciona una hora
                      </label>
                      <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg p-3">
                        {TIME_SLOTS.map((time) => (
                          <button
                            key={time}
                            onClick={() => setFormData((p) => ({ ...p, bookingTime: time }))}
                            className={`p-2 text-sm rounded-lg border transition-all ${
                              formData.bookingTime === time
                                ? "bg-[#78f3d3] border-[#78f3d3] text-[#313D52] font-medium"
                                : "border-gray-300 hover:border-[#78f3d3] hover:bg-[#78f3d3]/10"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services Summary (mobile) */}
                <div className="lg:hidden pt-4">
                  <h3 className="text-lg font-semibold text-[#313D52] mb-4">
                    Resumen de tu orden
                  </h3>

                  <div className="space-y-2 mb-6">
                    {formData.services.map((s, i) => {
                      const opt = byId[s.serviceId];
                      return (
                        <div key={`sum-mobile-${i}`} className="flex justify-between items-center text-sm">
                          <div>
                            <div className="font-medium">{opt?.name || "Servicio"}</div>
                            <div className="text-gray-600">
                              {s.quantity} par{s.quantity > 1 ? "es" : ""}
                            </div>
                          </div>
                          <div className="font-medium">
                            {mxn.format(opt ? opt.price * s.quantity : 0)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-[#78f3d3] rounded-lg p-4 text-[#313D52]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Servicios</span>
                      <span className="text-sm">{mxn.format(calculateTotal)}</span>
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
                          <span className="text-2xl font-bold">
                            {mxn.format(calculateTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verificación + Submit + estados */}
                <div className="mt-auto">
                  {/* Checks de aceptación */}
<div className="mt-6 space-y-3">
  <label className="flex items-start gap-2 text-sm text-gray-700">
    <input
      type="checkbox"
      checked={formData.acceptTerms}
      onChange={(e) => setFormData((p) => ({ ...p, acceptTerms: e.target.checked }))}
      className="mt-1"
    />
    <span>
      Acepto los{" "}
      <a href="/terminos" target="_blank" className="text-[#55ab95] underline">
        Términos y Condiciones
      </a>{" "}
       </span>
  </label>

  <label className="flex items-start gap-2 text-sm text-gray-700">
    <input
      type="checkbox"
      checked={formData.acceptWhatsapp}
      onChange={(e) => setFormData((p) => ({ ...p, acceptWhatsapp: e.target.checked }))}
      className="mt-1"
    />
    <span>
      Acepto recibir seguimiento de mi orden por WhatsApp y notificaciones relacionadas.
    </span>
  </label>
</div>

                  {/* Botón de submit fuera del <form>, dispara submit programático */}
                  <button
                    onClick={() => void handleSubmit()}
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
                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
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

                  {/* Success Overlay (sin segundo portal) */}
                  <AnimatePresence>
                    {formStatus.status === "success" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                      >
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6"
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
                            
                          </div>
                        </motion.div>
                      </motion.div>
                    )}

                  </AnimatePresence>
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
  children,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {children || "Reserva Ahora"}
      </button>
      <BookingSimple isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default BookingButton;
