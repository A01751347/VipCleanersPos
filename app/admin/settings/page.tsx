// app/admin/settings/page.tsx
'use client'
import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Save,
  Loader2,
  Building,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Clock,
  Bell,
  Printer,
  Database,
  Globe,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface BusinessSettings {
  nombre_negocio: string;
  direccion: string;
  telefono: string;
  email: string;
  website?: string;
  horario_apertura: string;
  horario_cierre: string;
  dias_operacion: string[];
  moneda: string;
  timezone: string;
  logo_url?: string;
}

interface SystemSettings {
  notificaciones_email: boolean;
  notificaciones_sms: boolean;
  backup_automatico: boolean;
  retencion_datos_dias: number;
  impresora_tickets: string;
  formato_fecha: string;
  idioma: string;
  tema_oscuro: boolean;
}

interface PricingSettings {
  iva_porcentaje: number;
  descuento_maximo: number;
  propina_sugerida: number[];
  precio_delivery: number;
  tiempo_gracia_minutos: number;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'business' | 'system' | 'pricing'>('business');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    nombre_negocio: '',
    direccion: '',
    telefono: '',
    email: '',
    website: '',
    horario_apertura: '08:00',
    horario_cierre: '18:00',
    dias_operacion: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
    moneda: 'MXN',
    timezone: 'America/Mexico_City',
    logo_url: ''
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    notificaciones_email: true,
    notificaciones_sms: false,
    backup_automatico: true,
    retencion_datos_dias: 365,
    impresora_tickets: '',
    formato_fecha: 'DD/MM/YYYY',
    idioma: 'es',
    tema_oscuro: false
  });

  const [pricingSettings, setPricingSettings] = useState<PricingSettings>({
    iva_porcentaje: 16,
    descuento_maximo: 50,
    propina_sugerida: [10, 15, 20],
    precio_delivery: 50,
    tiempo_gracia_minutos: 15
  });

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Error al cargar la configuración');
      }

      const data = await response.json();
      
      if (data.business) setBusinessSettings(data.business);
      if (data.system) setSystemSettings(data.system);
      if (data.pricing) setPricingSettings(data.pricing);
      
      setError(null);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Error al cargar la configuración. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: businessSettings,
          system: systemSettings,
          pricing: pricingSettings
        })
      });

      if (!response.ok) {
        throw new Error('Error al guardar la configuración');
      }

      setSuccessMessage('Configuración guardada exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Error al guardar la configuración. Intente nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const diasSemana = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  const tabs = [
    { id: 'business', label: 'Negocio', icon: Building },
    { id: 'system', label: 'Sistema', icon: Settings },
    { id: 'pricing', label: 'Precios', icon: DollarSign }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={40} className="animate-spin text-[#78f3d3]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#313D52]">Configuración</h1>
          <p className="text-sm text-[#6c7a89]">Administra la configuración de tu negocio</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle size={20} className="text-red-600 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle size={20} className="text-green-600 mr-2" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      {/* Pestañas */}
      <div className="bg-white rounded-lg border border-[#e0e6e5] overflow-hidden">
        <div className="border-b border-[#e0e6e5]">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-[#78f3d3] text-[#313D52]'
                      : 'border-transparent text-[#6c7a89] hover:text-[#313D52]'
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Configuración del Negocio */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Nombre del Negocio
                  </label>
                  <div className="relative">
                    <Building size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                    <input
                      type="text"
                      value={businessSettings.nombre_negocio}
                      onChange={(e) => setBusinessSettings({...businessSettings, nombre_negocio: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                      placeholder="Mi Lavandería"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                    <input
                      type="tel"
                      value={businessSettings.telefono}
                      onChange={(e) => setBusinessSettings({...businessSettings, telefono: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                      placeholder="+52 555 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                    <input
                      type="email"
                      value={businessSettings.email}
                      onChange={(e) => setBusinessSettings({...businessSettings, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                      placeholder="contacto@milavanderia.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Sitio Web
                  </label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                    <input
                      type="url"
                      value={businessSettings.website || ''}
                      onChange={(e) => setBusinessSettings({...businessSettings, website: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                      placeholder="https://milavanderia.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                  Dirección
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                  <textarea
                    value={businessSettings.direccion}
                    onChange={(e) => setBusinessSettings({...businessSettings, direccion: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    rows={3}
                    placeholder="Calle Principal 123, Colonia Centro, Ciudad, Estado"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Horario de Apertura
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                    <input
                      type="time"
                      value={businessSettings.horario_apertura}
                      onChange={(e) => setBusinessSettings({...businessSettings, horario_apertura: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Horario de Cierre
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                    <input
                      type="time"
                      value={businessSettings.horario_cierre}
                      onChange={(e) => setBusinessSettings({...businessSettings, horario_cierre: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                  Días de Operación
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {diasSemana.map((dia) => (
                    <label key={dia.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={businessSettings.dias_operacion.includes(dia.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBusinessSettings({
                              ...businessSettings,
                              dias_operacion: [...businessSettings.dias_operacion, dia.value]
                            });
                          } else {
                            setBusinessSettings({
                              ...businessSettings,
                              dias_operacion: businessSettings.dias_operacion.filter(d => d !== dia.value)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-[#313D52]">{dia.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Configuración del Sistema */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#313D52] flex items-center">
                    <Bell size={18} className="mr-2" />
                    Notificaciones
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.notificaciones_email}
                        onChange={(e) => setSystemSettings({...systemSettings, notificaciones_email: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-[#313D52]">Notificaciones por Email</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.notificaciones_sms}
                        onChange={(e) => setSystemSettings({...systemSettings, notificaciones_sms: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-[#313D52]">Notificaciones por SMS</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#313D52] flex items-center">
                    <Database size={18} className="mr-2" />
                    Respaldo de Datos
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.backup_automatico}
                        onChange={(e) => setSystemSettings({...systemSettings, backup_automatico: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-[#313D52]">Respaldo Automático</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                        Retención de Datos (días)
                      </label>
                      <input
                        type="number"
                        value={systemSettings.retencion_datos_dias}
                        onChange={(e) => setSystemSettings({...systemSettings, retencion_datos_dias: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                        min="30"
                        max="3650"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Impresora de Tickets
                  </label>
                  <div className="relative">
                    <Printer size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                    <select
                      value={systemSettings.impresora_tickets}
                      onChange={(e) => setSystemSettings({...systemSettings, impresora_tickets: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] appearance-none"
                    >
                      <option value="">Seleccionar impresora</option>
                      <option value="thermal_58mm">Térmica 58mm</option>
                      <option value="thermal_80mm">Térmica 80mm</option>
                      <option value="laser">Láser</option>
                      <option value="inkjet">Inyección de tinta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Formato de Fecha
                  </label>
                  <select
                    value={systemSettings.formato_fecha}
                    onChange={(e) => setSystemSettings({...systemSettings, formato_fecha: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] appearance-none"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Idioma
                  </label>
                  <select
                    value={systemSettings.idioma}
                    onChange={(e) => setSystemSettings({...systemSettings, idioma: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] appearance-none"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={systemSettings.tema_oscuro}
                      onChange={(e) => setSystemSettings({...systemSettings, tema_oscuro: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-[#313D52]">Tema Oscuro</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Configuración de Precios */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    IVA (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricingSettings.iva_porcentaje}
                    onChange={(e) => setPricingSettings({...pricingSettings, iva_porcentaje: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Descuento Máximo (%)
                  </label>
                  <input
                    type="number"
                    value={pricingSettings.descuento_maximo}
                    onChange={(e) => setPricingSettings({...pricingSettings, descuento_maximo: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Precio de Delivery
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-2.5 text-[#6c7a89]" />
                    <input
                      type="number"
                      step="0.01"
                      value={pricingSettings.precio_delivery}
                      onChange={(e) => setPricingSettings({...pricingSettings, precio_delivery: parseFloat(e.target.value)})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                    Tiempo de Gracia (minutos)
                  </label>
                  <input
                    type="number"
                    value={pricingSettings.tiempo_gracia_minutos}
                    onChange={(e) => setPricingSettings({...pricingSettings, tiempo_gracia_minutos: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    min="0"
                    max="60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6c7a89] mb-2">
                  Propinas Sugeridas (%)
                </label>
                <div className="flex space-x-2">
                  {pricingSettings.propina_sugerida.map((propina, index) => (
                    <input
                      key={index}
                      type="number"
                      value={propina}
                      onChange={(e) => {
                        const newPropinas = [...pricingSettings.propina_sugerida];
                        newPropinas[index] = parseInt(e.target.value);
                        setPricingSettings({...pricingSettings, propina_sugerida: newPropinas});
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                      min="0"
                      max="100"
                    />
                  ))}
                </div>
                <p className="text-xs text-[#6c7a89] mt-1">
                  Porcentajes sugeridos para propinas en el punto de venta
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}