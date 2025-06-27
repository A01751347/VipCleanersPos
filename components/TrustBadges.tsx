'use client'
import React from 'react';
import AnimateOnScroll from './AnimateOnScroll';
import Image from 'next/image';

const TrustBadges: React.FC = () => {
    // En un proyecto real, estas serían imágenes de logos de marcas
    const brands = [
        { name: "Nike", logo: "/assets/brands/nike.png" },
        { name: "Adidas", logo: "/assets/brands/adidas.png" },
        { name: "New Balance", logo: "/assets/brands/new-balance.png" },
        { name: "Jordan", logo: "/assets/brands/jordan.png" },
        { name: "Converse", logo: "/assets/brands/converse.png" },
        { name: "Vans", logo: "/assets/brands/vans.png" }
    ];

    return (
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#f5f9f8]">
            <div className="max-w-7xl mx-auto">
                <AnimateOnScroll>
                    <div className="text-center mb-8">
                        <h3 className="text-lg font-semibold text-[#313D52]">Especialistas en todas las marcas premium</h3>
                        <p className="text-[#6c7a89] mt-2">Expertos en el cuidado de tus zapatillas favoritas, sin importar la marca</p>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll type="fade-up">
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                        {brands.map((brand, index) => (
                            <div key={index} className="w-24 h-24 flex items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                                {/* En un proyecto real, usar Image de Next.js */}
                                <Image
                                    src={brand.logo}
                                    alt={brand.name}
                                    width={80}
                                    height={80}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        ))}
                    </div>
                </AnimateOnScroll>

            </div>
        </section>
    );
};

export default TrustBadges;