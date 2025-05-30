'use client'
// components/Map.tsx
import React, { useEffect } from 'react';

interface MapProps {
  address: string;
  zoom?: number;
}

const Map: React.FC<MapProps> = ({ address, zoom = 15 }) => {
  useEffect(() => {
    // Este script carga un mapa embebido usando el API de MapBox.
    // Puedes reemplazarlo con Google Maps o cualquier otro servicio similar.
    const loadMap = () => {
      const mapEl = document.getElementById('contact-map');
      if (!mapEl) return;
      
      const encodedAddress = encodeURIComponent(address);
      
      // Esta es una implementación simplificada. Para un mapa real necesitarías usar la API de Google Maps o Mapbox.
      mapEl.innerHTML = `
        <iframe 
          width="100%" 
          height="100%" 
          frameborder="0" 
          style="border:0" 
          src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodedAddress}&zoom=${zoom}" 
          allowfullscreen
        ></iframe>
      `;
    };
    
    loadMap();
  }, [address, zoom]);
  
  return (
    <div 
      id="contact-map"
      className="h-full w-full bg-gray-200 min-h-[300px] md:min-h-0 rounded-xl overflow-hidden"
    >
      {/* El mapa se cargará aquí */}
      <div className="h-full w-full flex items-center justify-center text-gray-400">
        Cargando mapa...
      </div>
    </div>
  );
};

export default Map;