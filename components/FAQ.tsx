'use client'
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AnimateOnScroll from './AnimateOnScroll';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggle: () => void;
  index: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, toggle, index }) => {
  return (
    <AnimateOnScroll type="fade-up" delay={0.1 * index}>
      <div className="border-b border-[#e0e6e5] py-4">
        <button 
          onClick={toggle}
          className="flex justify-between items-center w-full text-left focus:outline-none"
        >
          <h3 className="text-lg font-medium text-[#313D52]">{question}</h3>
          {isOpen ? 
            <ChevronUp size={20} className="text-[#78f3d3]" /> : 
            <ChevronDown size={20} className="text-[#6c7a89]" />
          }
        </button>
        
        <div className={`mt-2 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
          <p className="text-[#6c7a89] pb-2">{answer}</p>
        </div>
      </div>
    </AnimateOnScroll>
  );
};

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  
  const faqs = [
    {
      question: "¿Cuánto tiempo tardan en limpiar mis zapatillas?",
      answer: "El tiempo de entrega varía según el servicio elegido. La limpieza básica se completa en 48 horas, mientras que la limpieza premium tiene un servicio prioritario de 24 horas. En temporadas de alta demanda, podría haber ligeras variaciones que te comunicaremos al momento de la reserva."
    },
    {
      question: "¿Qué productos utilizan para la limpieza?",
      answer: "Utilizamos productos profesionales específicos para cada tipo de material: cuero, gamuza, lona, etc. Todos nuestros productos son ecológicos y no dañinos para tus zapatillas ni para el medio ambiente. Elegimos cuidadosamente limpiadores, acondicionadores y protectores de la más alta calidad."
    },
    {
      question: "¿Puedo enviar cualquier tipo de zapatilla?",
      answer: "Sí, trabajamos con todo tipo de zapatillas: deportivas, casuales, de vestir y más. Tenemos experiencia con marcas como Nike, Adidas, Jordan, New Balance, Vans, Converse y muchas otras. Cada par recibe un tratamiento personalizado según su material y necesidades específicas."
    },
    {
      question: "¿Qué sucede si mis zapatillas están muy dañadas?",
      answer: "Antes de iniciar el proceso, evaluamos el estado de tus zapatillas. Si detectamos daños severos, te contactaremos para informarte sobre las posibilidades de restauración y cualquier costo adicional. Mientras que podemos tratar manchas difíciles y desgaste, algunos daños estructurales pueden estar fuera de lo que podemos reparar completamente."
    },
    {
      question: "¿Cómo funciona el servicio a domicilio?",
      answer: "Nuestro servicio a domicilio incluye recolección y entrega en la dirección que nos indiques dentro de nuestra área de cobertura. Programamos la visita en un horario conveniente para ti, recogemos tus zapatillas, realizamos el servicio en nuestras instalaciones y las devolvemos impecables en el tiempo acordado."
    }
  ];
  
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="faq">
      <div className="max-w-3xl mx-auto">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <span className="text-sm sm:text-base font-medium uppercase tracking-wider text-[#78D5D3]">Preguntas Frecuentes</span>
            <h2 className="mt-2 text-3xl font-bold text-[#313D52] sm:text-4xl">Resolvemos tus dudas</h2>
            <p className="mt-4 max-w-2xl mx-auto text-[#6c7a89]">
              Encuentra respuestas a las preguntas más comunes sobre nuestros servicios de limpieza y restauración de zapatillas.
            </p>
          </div>
        </AnimateOnScroll>
        
        <div className="mt-10">
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              toggle={() => toggleFAQ(index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;