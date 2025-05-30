'use client'
// components/admin/pos/NewClientForm.tsx
import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface Client {
  id?: number;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  codigo_postal?: string;
  ciudad?: string;
  estado?: string;
}

interface NewClientFormProps {
  onSubmit: (client: Client) => void;
  onCancel: () => void;
}

const NewClientForm: React.FC<NewClientFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Client>({
    nombre: '',
    apellidos: '',
    telefono: '',
    email: '',
    direccion: '',
    codigo_postal: '',
    ciudad: '',
    estado: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpiar error específico cuando el usuario comienza a escribir
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    // Validación del nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    // Validación del teléfono
    if (!formData.telefono) {
      newErrors.telefono = 'El teléfono es obligatorio';
    } else if (!/^\d{10}$/.test(formData.telefono.replace(/\D/g, ''))) {
      newErrors.telefono = 'Ingresa un número de teléfono válido (10 dígitos)';
    }
    
    // Validación del email (opcional pero debe ser válido si se proporciona)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    
    // Validación del código postal (opcional pero debe ser válido)
    if (formData.codigo_postal && !/^\d{5}$/.test(formData.codigo_postal)) {
      newErrors.codigo_postal = 'El código postal debe tener 5 dígitos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    if (!validateForm()) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Enviar datos a la API
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el cliente');
      }
      
      // Devolver cliente creado con ID asignado
      onSubmit({
        ...formData,
        id: data.clientId
      });
    } catch (error) {
      console.error('Error al crear cliente:', error);
      setApiError(error instanceof Error ? error.message : 'Error al crear el cliente');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="space-y-4">
        {/* Datos personales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-[#6c7a89] mb-1">
              Nombre *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-[#6c7a89]" />
              </div>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  errors.nombre ? 'border-red-300 bg-red-50' : 'border-[#e0e6e5]'
                } focus:outline-none focus:ring-2 focus:ring-[#78f3d3]`}
                placeholder="Nombre del cliente"
              />
            </div>
            {errors.nombre && (
              <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="apellidos" className="block text-sm font-medium text-[#6c7a89] mb-1">
              Apellidos
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-[#6c7a89]" />
              </div>
              <input
                type="text"
                id="apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                placeholder="Apellidos (opcional)"
              />
            </div>
          </div>
        </div>
        
        {/* Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-[#6c7a89] mb-1">
              Teléfono *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone size={16} className="text-[#6c7a89]" />
              </div>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  errors.telefono ? 'border-red-300 bg-red-50' : 'border-[#e0e6e5]'
                } focus:outline-none focus:ring-2 focus:ring-[#78f3d3]`}
                placeholder="10 dígitos"
              />
            </div>
            {errors.telefono && (
              <p className="mt-1 text-xs text-red-500">{errors.telefono}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#6c7a89] mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-[#6c7a89]" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-[#e0e6e5]'
                } focus:outline-none focus:ring-2 focus:ring-[#78f3d3]`}
                placeholder="correo@ejemplo.com (opcional)"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>
        </div>
        
        {/* Dirección */}
        <div>
          <label htmlFor="direccion" className="block text-sm font-medium text-[#6c7a89] mb-1">
            Dirección
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin size={16} className="text-[#6c7a89]" />
            </div>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
              placeholder="Calle, número, colonia (opcional)"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="codigo_postal" className="block text-sm font-medium text-[#6c7a89] mb-1">
              Código Postal
            </label>
            <input
              type="text"
              id="codigo_postal"
              name="codigo_postal"
              value={formData.codigo_postal}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.codigo_postal ? 'border-red-300 bg-red-50' : 'border-[#e0e6e5]'
              } focus:outline-none focus:ring-2 focus:ring-[#78f3d3]`}
              placeholder="5 dígitos"
            />
            {errors.codigo_postal && (
              <p className="mt-1 text-xs text-red-500">{errors.codigo_postal}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="ciudad" className="block text-sm font-medium text-[#6c7a89] mb-1">
              Ciudad
            </label>
            <input
              type="text"
              id="ciudad"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
              placeholder="Ciudad (opcional)"
            />
          </div>
          
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-[#6c7a89] mb-1">
              Estado
            </label>
            <input
              type="text"
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
              placeholder="Estado (opcional)"
            />
          </div>
        </div>
      </div>
      
      {/* Mensaje de error de la API */}
      {apiError && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-start">
          <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm">{apiError}</span>
        </div>
      )}
      
      {/* Botones */}
      <div className="mt-6 flex justify-end space-x-3">
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
              Guardando...
            </>
          ) : (
            'Guardar Cliente'
          )}
        </button>
      </div>
    </form>
  );
};

export default NewClientForm;