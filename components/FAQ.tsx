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
      "question": "¿Cuánto tardan en limpiar mis tenis?",
      "answer": "Depende de la prioridad que elijas. La limpieza queda lista en 48 horas, mientras que el servicio express lo entregamos en 24 horas. En temporadas con mucha demanda, el tiempo puede variar un poco, pero siempre te avisamos al momento de agendar."
    },
    {
      "question": "¿Qué productos usan para limpiar?",
      "answer": "Usamos productos profesionales para cada material: piel, gamuza, lona, etc. Todos son ecológicos y seguros. Elegimos limpiadores, acondicionadores y protectores de la mejor calidad."
    },
    {
      "question": "¿Puedo mandar cualquier tipo de tenis?",
      "answer": "Sí, trabajamos con todo tipo de pares: deportivos, casuales, de vestir y más. Tenemos experiencia con marcas como Nike, Adidas, Jordan, New Balance, Vans, Converse y muchas otras. Cada par recibe un cuidado especial según su material y estado."
    },
    {
      "question": "¿Qué pasa si mis tenis están muy dañados?",
      "answer": "Antes de empezar, revisamos el estado de tus tenis. Si vemos daños fuertes, te avisamos y te decimos qué tan posible es continuar con el servicio."
    },
    {
      "question": "¿Cómo funciona el servicio a domicilio?",
      "answer": "Pasamos por tus tenis hasta tu casa u oficina (en nuestra zona de cobertura) y te los regresamos limpios. Agenda la recolección via WhatsApp en el horario que mejor te quede, nosotros los limpiamos y te los devolvemos impecables en el tiempo acordado."
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