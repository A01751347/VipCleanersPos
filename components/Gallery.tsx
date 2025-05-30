'use client'
import React, { useState } from 'react';
import { X } from 'lucide-react';
import AnimateOnScroll from './AnimateOnScroll';
import Image from 'next/image';

interface GalleryItem {
  id: number;
  title: string;
  brand: string;
  beforeImage: string;
  afterImage: string;
  description: string;
}

const Gallery: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  
  const galleryItems: GalleryItem[] = [
    {
      id: 1,
      title: "Nike Air Force 1",
      brand: "Nike",
      beforeImage: "/assets/gallery/nike-af1-before.jpg",
      afterImage: "/assets/gallery/nike-af1-after.jpg",
      description: "Restauración completa de unos Nike Air Force 1 clásicos. Se eliminaron manchas profundas y se renovó el color blanco original."
    },
    {
      id: 2,
      title: "Adidas Yeezy 350",
      brand: "Adidas",
      beforeImage: "/assets/gallery/yeezy-before.jpg",
      afterImage: "/assets/gallery/yeezy-after.jpg",
      description: "Limpieza detallada de unos Yeezy Boost 350. Removimos manchas difíciles y restauramos el tejido knit a su estado original."
    },
    {
      id: 3,
      title: "Jordan 4 Retro",
      brand: "Jordan",
      beforeImage: "/assets/gallery/jordan4-before.jpg",
      afterImage: "/assets/gallery/jordan4-after.jpg",
      description: "Restauración completa de unos Air Jordan 4 Retro. Se recuperó el color, se limpió la entresuela y se repararon detalles de la malla."
    },
    {
      id: 4,
      title: "New Balance 990",
      brand: "New Balance",
      beforeImage: "/assets/gallery/nb990-before.jpg",
      afterImage: "/assets/gallery/nb990-after.jpg",
      description: "Limpieza premium de unos New Balance 990. Se trabajó a detalle la gamuza y los paneles mesh para una apariencia renovada."
    },
    {
      id: 5,
      title: "Converse Chuck Taylor",
      brand: "Converse",
      beforeImage: "/assets/gallery/converse-before.jpg",
      afterImage: "/assets/gallery/converse-after.jpg",
      description: "Restauración de unos Converse Chuck Taylor. Se realizó un blanqueamiento profundo y se renovó la goma de la puntera."
    },
    {
      id: 6,
      title: "Vans Old Skool",
      brand: "Vans",
      beforeImage: "/assets/gallery/vans-before.jpg",
      afterImage: "/assets/gallery/vans-after.jpg",
      description: "Lavado profundo y renovación de unos Vans Old Skool. Se recuperó el negro intenso y se limpió la entresuela blanca."
    }
  ];
  
  const openModal = (item: GalleryItem) => {
    setSelectedItem(item);
    document.body.style.overflow = 'hidden'; // Evitar scroll cuando el modal está abierto
  };
  
  const closeModal = () => {
    setSelectedItem(null);
    document.body.style.overflow = 'auto'; // Restaurar scroll
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="gallery">
      <div className="max-w-7xl mx-auto">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <span className="text-sm sm:text-base font-medium uppercase tracking-wider text-[#78D5D3]">Nuestros Resultados</span>
            <h2 className="mt-2 text-3xl font-bold text-[#313D52] sm:text-4xl">Galería de Trabajos</h2>
            <p className="mt-4 max-w-2xl mx-auto text-[#6c7a89]">
              Explora nuestra colección de transformaciones más impresionantes. Cada par de zapatillas cuenta una historia de renovación.
            </p>
          </div>
        </AnimateOnScroll>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item, index) => (
            <AnimateOnScroll key={item.id} type="fade-up" delay={0.05 * index}>
              <div 
                className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all"
                onClick={() => openModal(item)}
              >
                <div className="aspect-w-4 aspect-h-3">
                  {/* En un proyecto real, usar Next/Image con el src correcto */}
                  <div className="w-full h-full bg-gray-100 relative">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-all duration-500 transform group-hover:scale-110"
                      style={{ backgroundImage: `url(${item.afterImage})` }}
                    ></div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-lg">{item.title}</h3>
                  <p className="text-white/80 text-sm">{item.brand}</p>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
      
      {/* Modal detalle */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/80 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full"
            >
              <X size={24} className="text-[#313D52]" />
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="relative">
                <div className="absolute top-0 left-0 bg-[#e0e6e5] text-[#313D52] px-3 py-1 font-medium text-sm z-10">Antes</div>
                <div 
                  className="w-full h-80 md:h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedItem.beforeImage})` }}
                ></div>
              </div>
              
              <div className="relative">
                <div className="absolute top-0 left-0 bg-[#78f3d3] text-[#313D52] px-3 py-1 font-medium text-sm z-10">Después</div>
                <div 
                  className="w-full h-80 md:h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedItem.afterImage})` }}
                ></div>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-2xl font-bold text-[#313D52]">{selectedItem.title}</h3>
              <p className="text-[#6c7a89] mt-1 font-medium">{selectedItem.brand}</p>
              <p className="mt-4 text-[#6c7a89]">{selectedItem.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;