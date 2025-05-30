// src/components/Contact.tsx
'use client'
// components/Contact.tsx
import React, { useState } from 'react';
import { MapPin, Phone, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Map from './Map';
import AnimateOnScroll from './AnimateOnScroll';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormStatus {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [formStatus, setFormStatus] = useState<FormStatus>({
    status: 'idle',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus({
        status: 'error',
        message: 'Por favor, completa todos los campos requeridos'
      });
      return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormStatus({
        status: 'error',
        message: 'Por favor, introduce un correo electrónico válido'
      });
      return;
    }
    
    setFormStatus({
      status: 'submitting',
      message: 'Enviando mensaje...'
    });
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Hubo un error al enviar tu mensaje');
      }
      
      setFormStatus({
        status: 'success',
        message: '¡Mensaje enviado! Te contactaremos pronto.'
      });
      
      // Resetear el formulario después de enviar con éxito
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Resetear el status después de 4 segundos
      setTimeout(() => {
        setFormStatus({
          status: 'idle',
          message: ''
        });
      }, 4000);
      
    } catch (error) {
      setFormStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Hubo un error al enviar tu mensaje'
      });
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="contact">
      <div className="max-w-7xl mx-auto">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <span className="text-sm sm:text-base font-medium uppercase tracking-wider text-[#78D5D3]">CONTACTO</span>
            <h2 className="mt-2 text-3xl font-bold text-[#313D52] sm:text-4xl">Ponte en Contacto</h2>
            <p className="mt-4 max-w-2xl mx-auto text-[#6c7a89]">
              ¿Tienes preguntas o necesitas más información? ¡Estamos aquí para ayudarte! Nuestro equipo está siempre listo para responder tus inquietudes y asistirte con el cuidado de tus zapatillas.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <AnimateOnScroll type="fade-right">
              <h3 className="text-2xl font-bold text-[#313D52] mb-6">Hablemos</h3>
              <p className="text-[#6c7a89] mb-8">
                Nuestro equipo siempre está al pendiente para resolver tus dudas del servicio, o el cuidado de tus sneakers.
              </p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-[#f5f9f8] flex items-center justify-center flex-shrink-0 mr-4">
                    <MapPin size={24} className="text-[#78D5D3]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#313D52] mb-1">Visítanos</h4>
                    <p className="text-[#6c7a89]">Calle del Sneaker 123<br />ROMA NTE., CDMX 53000</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-[#f5f9f8] flex items-center justify-center flex-shrink-0 mr-4">
                    <Phone size={24} className="text-[#78D5D3]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#313D52] mb-1">Llámanos</h4>
                    <p className="text-[#6c7a89]">(55) 1234-5678<br />Lun-Sab: 10AM - 7PM</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-[#f5f9f8] flex items-center justify-center flex-shrink-0 mr-4">
                    <Mail size={24} className="text-[#78D5D3]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#313D52] mb-1">Envíanos un correo</h4>
                    <p className="text-[#6c7a89]">info@vipcleaners.com<br />support@vipcleaners.com</p>
                  </div>
                </div>
              </div>
              
              {/* Mapa */}
              <div className="mt-8 h-64">
                {/* <Map address="Roma Norte, CDMX, Mexico" /> */}
              </div>
            </AnimateOnScroll>
          </div>

          {/* Contact Form */}
          <div className="bg-[#f5f9f8] p-8 rounded-2xl shadow-[0_10px_15px_-3px_rgba(49,61,82,0.1),0_4px_6px_-2px_rgba(49,61,82,0.05)]">
            <form id="contactForm" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[#313D52] font-medium mb-2" htmlFor="name">Nombre Completo</label>
                <input 
                  type="text" 
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre" 
                  required 
                  className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                />
              </div>
              
              <div>
                <label className="block text-[#313D52] font-medium mb-2" htmlFor="email">Correo Electrónico</label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Tu correo" 
                  required 
                  className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                />
              </div>
              
              <div>
                <label className="block text-[#313D52] font-medium mb-2" htmlFor="subject">Asunto</label>
                <input 
                  type="text" 
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="¿Cómo podemos ayudarte?" 
                  className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                />
              </div>
              
              <div>
                <label className="block text-[#313D52] font-medium mb-2" htmlFor="message">Mensaje</label>
                <textarea 
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Cuéntanos más sobre tus necesidades..." 
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-[#e0e6e5] focus:outline-none focus:ring-2 focus:ring-[#78f3d3] resize-y"
                ></textarea>
              </div>
              
              {/* Mensaje de estado */}
              {formStatus.status === 'error' && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start">
                  <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                  <span>{formStatus.message}</span>
                </div>
              )}
              
              {formStatus.status === 'success' && (
                <div className="bg-[#e0f7f0] text-[#4de0b3] p-3 rounded-lg flex items-start">
                  <CheckCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                  <span>{formStatus.message}</span>
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={formStatus.status === 'submitting'}
                className={`w-full py-3 px-6 rounded-lg bg-[#78f3d3] text-[#313D52] font-semibold shadow-[0_4px_6px_-1px_rgba(49,61,82,0.1),0_2px_4px_-1px_rgba(49,61,82,0.06)] hover:shadow-[0_10px_15px_-3px_rgba(49,61,82,0.1),0_4px_6px_-2px_rgba(49,61,82,0.05)] transition-all hover:bg-[#4de0c0] transform hover:-translate-y-1 focus:outline-none flex justify-center items-center ${
                  formStatus.status === 'submitting' ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {formStatus.status === 'submitting' ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Mensaje"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;