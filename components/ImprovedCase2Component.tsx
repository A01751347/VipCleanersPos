import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign, 
  Clock, 
  Shield, 
  Loader2,
  Edit3,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  Brush,
  Sparkles,
  Wrench
} from 'lucide-react';

// Interfaces para TypeScript
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
  shoesType: string;
}

interface FormData {
  services: SelectedService[];
}

interface ImprovedCase2Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  serviceOptions: ServiceOption[];
  servicesLoading: boolean;
  addService: () => void;
  removeService: (index: number) => void;
  updateService: (index: number, field: keyof SelectedService, value: string | number) => void;
}

const ImprovedCase2Component: React.FC<ImprovedCase2Props> = ({
  formData,
  setFormData,
  serviceOptions,
  servicesLoading,
  addService,
  removeService,
  updateService
}) => {
  // Estados internos del componente para UI
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number>(0);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set([0]));
  const [completedServices, setCompletedServices] = useState<Set<number>>(new Set());

  // Wrapper functions para manejar la lógica interna
  const handleAddService = () => {
    addService(); // Función del padre
    const newIndex = formData.services.length;
    setCurrentEditingIndex(newIndex);
    setExpandedServices(new Set([newIndex]));
  };

  const handleRemoveService = (index: number) => {
    removeService(index); // Función del padre
    
    // Ajustar el índice de edición actual
    if (currentEditingIndex >= index) {
      setCurrentEditingIndex(Math.max(0, currentEditingIndex - 1));
    }
    
    // Actualizar servicios expandidos y completados
    const newExpanded = new Set<number>();
    const newCompleted = new Set<number>();
    
    expandedServices.forEach((i: number) => {
      if (i < index) {
        newExpanded.add(i);
      } else if (i > index) {
        newExpanded.add(i - 1);
      }
    });
    
    completedServices.forEach((i: number) => {
      if (i < index) {
        newCompleted.add(i);
      } else if (i > index) {
        newCompleted.add(i - 1);
      }
    });
    
    if (newExpanded.size === 0) newExpanded.add(0);
    setExpandedServices(newExpanded);
    setCompletedServices(newCompleted);
  };

  const handleUpdateService = (index: number, field: keyof SelectedService, value: string | number) => {
    updateService(index, field, value); // Función del padre
    
    // Verificar si el servicio está completo
    const updatedService = { ...formData.services[index], [field]: value };
    if (isServiceComplete(updatedService)) {
      setCompletedServices(prev => new Set(prev).add(index));
    } else {
      setCompletedServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const toggleServiceExpansion = (index: number) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedServices(newExpanded);
  };

  const editService = (index: number) => {
    setCurrentEditingIndex(index);
    setExpandedServices(new Set([index]));
  };

  const isServiceComplete = (service: SelectedService): boolean => {
    return service.shoesType.trim() !== '' && service.serviceId !== null;
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('básica') || name.includes('basica')) {
      return <Brush size={18} className="text-[#61c9ae]" />;
    } else if (name.includes('premium')) {
      return <Sparkles size={18} className="text-[#61c9ae]" />;
    } else if (name.includes('restauración') || name.includes('restauracion')) {
      return <Wrench size={18} className="text-[#61c9ae]" />;
    }
    return <Package size={18} className="text-[#61c9ae]" />;
  };

  const getTotalPrice = (): number => {
    return formData.services.reduce((total, service) => {
      const serviceOption = serviceOptions.find(opt => opt.id === service.serviceId);
      return total + (serviceOption ? serviceOption.price * service.quantity : 0);
    }, 0);
  };

  const getCompletedCount = (): number => {
    return formData.services.filter(service => isServiceComplete(service)).length;
  };

  // Renderizado del Case 2 mejorado
  return (
    <div className="space-y-6">
      {/* Header con progreso mejorado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Package size={24} className="text-[#61c9ae] mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-[#313D52]">Servicios y Calzado</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span>Paso 2 de 4</span>
              <div className="flex items-center">
                <CheckCircle size={14} className="mr-1 text-green-500" />
                <span>{getCompletedCount()} de {formData.services.length} completados</span>
              </div>
              <div className="flex items-center">
                <Package size={14} className="mr-1 text-[#61c9ae]" />
                <span>{formData.services.reduce((sum, s) => sum + s.quantity, 0)} pares total</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleAddService}
          className="flex items-center px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-all font-medium shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Agregar Servicio
        </button>
      </div>

      {servicesLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={32} className="animate-spin text-[#61c9ae]" />
        </div>
      ) : (
        <div className="space-y-4">
          {formData.services.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Cargando servicios...</p>
            </div>
          ) : (
            formData.services.map((service, index) => {
              const isExpanded = expandedServices.has(index);
              const isComplete = isServiceComplete(service);
              const isCurrentlyEditing = currentEditingIndex === index;
              const serviceOption = serviceOptions.find(opt => opt.id === service.serviceId);

              return (
                <div 
                  key={index} 
                  className={`border-2 rounded-lg transition-all duration-200 ${
                    isCurrentlyEditing 
                      ? 'border-[#78f3d3] shadow-lg bg-[#78f3d3]/5' 
                      : isComplete 
                        ? 'border-green-200 bg-green-50/30' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Header del servicio colapsable */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <button 
                          className="flex items-center hover:bg-gray-100 p-1 rounded transition-colors"
                          onClick={() => toggleServiceExpansion(index)}
                        >
                          {isExpanded ? 
                            <ChevronDown size={20} className="text-gray-400" /> : 
                            <ChevronRight size={20} className="text-gray-400" />
                          }
                        </button>
                        
                        <div className="flex items-center space-x-3">
                          {isComplete ? (
                            <CheckCircle size={20} className="text-green-500" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                              <div className={`w-2 h-2 rounded-full ${isCurrentlyEditing ? 'bg-[#78f3d3]' : 'bg-gray-300'}`} />
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <h4 className="font-medium text-[#313D52]">
                              Servicio {index + 1}
                            </h4>
                            {isCurrentlyEditing && (
                              <span className="ml-2 px-2 py-1 text-xs bg-[#78f3d3] text-[#313D52] rounded-full font-medium">
                                Editando
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Vista previa del servicio cuando está colapsado */}
                        {!isExpanded && isComplete && (
                          <div className="flex items-center space-x-4 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
                            <div className="flex items-center">
                              {getServiceIcon(serviceOption?.name || '')}
                              <span className="ml-2 font-medium">{service.shoesType}</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span>{service.quantity} par{service.quantity > 1 ? 'es' : ''}</span>
                            <span className="text-gray-400">•</span>
                            <div className="flex items-center text-[#61c9ae] font-medium">
                              <span>{serviceOption?.name}</span>
                              <span className="ml-2">${serviceOption ? serviceOption.price * service.quantity : 0}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {!isExpanded && isComplete && !isCurrentlyEditing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editService(index);
                            }}
                            className="p-2 text-gray-400 hover:text-[#61c9ae] hover:bg-[#78f3d3]/10 rounded-lg transition-all"
                            title="Editar servicio"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                        
                        {!isExpanded && isComplete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleServiceExpansion(index);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        
                        {formData.services.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveService(index);
                            }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar servicio"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenido expandible del servicio */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-[#313D52] mb-2">
                            Marca y Modelo del Calzado *
                          </label>
                          <input
                            type="text"
                            value={service.shoesType}
                            onChange={(e) => handleUpdateService(index, 'shoesType', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
                            placeholder="Ej. Nike Air Jordan 1, Adidas Ultraboost"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#313D52] mb-2">
                            Cantidad de pares *
                          </label>
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => handleUpdateService(index, 'quantity', Math.max(1, service.quantity - 1))}
                              className="p-3 border border-gray-300 rounded-l-lg hover:bg-gray-50 transition-all"
                            >
                              <Minus size={16} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={service.quantity}
                              onChange={(e) => handleUpdateService(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-4 py-3 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-[#78f3d3] focus:border-transparent transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateService(index, 'quantity', service.quantity + 1)}
                              className="p-3 border border-gray-300 rounded-r-lg hover:bg-gray-50 transition-all"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#313D52] mb-4">
                          Tipo de servicio *
                        </label>
                        <div className="space-y-3">
                          {serviceOptions.map((serviceOption) => (
                            <div
                              key={serviceOption.id}
                              onClick={() => handleUpdateService(index, 'serviceId', serviceOption.id)}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                service.serviceId === serviceOption.id
                                  ? 'border-[#78f3d3] bg-[#78f3d3]/10 shadow-sm'
                                  : 'border-gray-200 hover:border-[#78f3d3]/50 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center">
                                  {getServiceIcon(serviceOption.name)}
                                  <h5 className="font-medium text-[#313D52] ml-3">{serviceOption.name}</h5>
                                </div>
                                <div className="flex items-center">
                                 
                                  <span className="text-lg font-bold text-[#61c9ae]">${serviceOption.price}</span>
                                  {service.quantity > 1 && (
                                    <span className="text-sm text-gray-600 ml-2">
                                      x{service.quantity} = ${serviceOption.price * service.quantity}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{serviceOption.description}</p>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Clock size={12} className="mr-1" />
                                  <span>{serviceOption.duration} min</span>
                                </div>
                                {serviceOption.requiresIdentification && (
                                  <div className="flex items-center text-amber-600">
                                    <Shield size={12} className="mr-1" />
                                    <span>Requiere ID</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Botón para marcar como completo o continuar editando */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          {isComplete ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle size={16} className="mr-1" />
                              Servicio completo
                            </div>
                          ) : (
                            <div className="flex items-center text-amber-600">
                              <div className="w-4 h-4 border-2 border-amber-500 rounded-full mr-1" />
                              Completa todos los campos
                            </div>
                          )}
                        </div>
                        
                        {isComplete && (
                          <button
                            onClick={() => toggleServiceExpansion(index)}
                            className="px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-all font-medium text-sm"
                          >
                            Ocultar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Resumen de servicios mejorado */}
          {formData.services.length > 0 && (
            <div className="bg-gradient-to-r from-[#78f3d3]/10 to-[#4de0c0]/10 p-6 rounded-lg border border-[#78f3d3]/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-[#313D52] flex items-center">
                  <Package size={20} className="mr-2 text-[#61c9ae]" />
                  Resumen de Servicios
                </h4>
                <div className="text-sm text-gray-600">
                  {getCompletedCount()}/{formData.services.length} servicios listos
                </div>
              </div>
              
              <div className="space-y-3">
                {formData.services.map((service, index) => {
                  const serviceOption = serviceOptions.find(opt => opt.id === service.serviceId);
                  const isComplete = isServiceComplete(service);
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between bg-white p-3 rounded-lg border ${
                        isComplete ? 'border-green-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        {isComplete ? (
                          <CheckCircle size={16} className="text-green-500 mr-3" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-3" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${isComplete ? 'text-[#313D52]' : 'text-gray-400'}`}>
                            {serviceOption?.name || 'Servicio no seleccionado'}
                          </p>
                          <p className={`text-sm ${isComplete ? 'text-gray-600' : 'text-gray-400'}`}>
                            {service.shoesType || 'Calzado no especificado'} - {service.quantity} par{service.quantity > 1 ? 'es' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isComplete ? 'text-[#61c9ae]' : 'text-gray-400'}`}>
                          ${serviceOption ? serviceOption.price * service.quantity : 0}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-semibold text-[#313D52]">Total Servicios:</span>
                      <span className="ml-2 text-sm text-gray-600">
                        ({formData.services.reduce((sum, s) => sum + s.quantity, 0)} pares)
                      </span>
                    </div>
                    <span className="font-bold text-xl text-[#61c9ae]">
                      ${getTotalPrice()}
                    </span>
                  </div>
                  
                  
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImprovedCase2Component;