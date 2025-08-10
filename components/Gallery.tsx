// components/Gallery.tsx - Versión con modal mejorado
'use client'
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Filter, 
  Search, 
  Eye, 
  Heart, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Star,
  Clock,
  Tag,
  Grid,
  List,
  Download,
  Maximize2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import AnimateOnScroll from './AnimateOnScroll';
import Image from 'next/image';

interface GalleryItem {
  id: number;
  title: string;
  brand: string;
  category: string;
  beforeImage: string;
  afterImage: string;
  coverImage: string;
  description: string;
  tags: string[];
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  timeSpent: string;
  featured?: boolean;
  rating?: number;
  clientName?: string;
  completedDate?: string;
  techniques: string[];
  beforeCondition: string;
  afterResult: string;
}

interface FilterOptions {
  category: string;
  brand: string;
  difficulty: string;
}

const Gallery: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'Todas',
    brand: 'Todas',
    difficulty: 'Todas'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'difficulty' | 'rating' | 'brand'>('newest');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const galleryItems: GalleryItem[] = [
    {
      id: 1,
      title: "Nike Air Force 1 Triple White",
      brand: "Nike",
      category: "Lifestyle",
      beforeImage: "/assets/gallery/nike-af1-before.jpg",
      afterImage: "/assets/gallery/nike-af1-after.jpg",
      coverImage: "/assets/gallery/nike-af1-cover.jpg",
      description: "Restauración completa de unos Nike Air Force 1 clásicos que parecían perdidos. Se eliminaron manchas profundas de barro, césped y desgaste urbano, renovando completamente el color blanco original con técnicas especializadas de blanqueamiento y protección.",
      tags: ["limpieza premium", "restauración", "blanco"],
      difficulty: "Medio",
      timeSpent: "3 horas",
      featured: true,
      rating: 5.0,
      clientName: "Carlos M.",
      completedDate: "2024-12-15",
      techniques: ["Limpieza profunda", "Blanqueamiento especializado", "Protección UV", "Acondicionamiento de cuero"],
      beforeCondition: "Manchas profundas de barro, desgaste en puntera, agujetas amarillentas",
      afterResult: "Blanco pristino restaurado, cuero hidratado, protección aplicada"
    },
    {
      id: 2,
      title: "Nike Dunk High Blue/White",
      brand: "Nike",
      category: "Sneakers",
      beforeImage: "/assets/gallery/dunk-before.jpg",
      afterImage: "/assets/gallery/dunk-after.jpg",
      coverImage: "/assets/gallery/dunk-after.jpg",
      description: "Restauración cuidadosa de unos Nike Dunk High en color azul y blanco que llegaron con desgaste evidente, suciedad profunda y desprendimiento de material en varias zonas. A pesar de los daños, se trabajó con técnicas delicadas para estabilizar las áreas comprometidas, limpiar a fondo y devolver la mayor frescura posible sin comprometer su integridad.",
      tags: ["nike", "dunk", "restauración", "limpieza profunda", "cuidados especiales"],
      difficulty: "Difícil",
      timeSpent: "5 horas",
      rating: 4.7,
      clientName: "Carlos M.",
      completedDate: "2025-07-28",
      techniques: ["Limpieza profunda manual", "Reparación de costuras", "Estabilización de material", "Tratamiento protector final"],
      beforeCondition: "Desgaste generalizado, suciedad incrustada, desprendimiento de material sintético, mediasuelas amarillentas",
      afterResult: "Superficie limpia, mediasuelas aclaradas, zonas dañadas estabilizadas y apariencia revitalizada"
    },
    
    {
      id: 3,
      title: "ASICS Gel-Challenger White/Teal",
      brand: "ASICS",
      category: "Sneakers",
      beforeImage: "/assets/gallery/gelchallenger-before.jpg",
      afterImage: "/assets/gallery/gelchallenger-after.jpg",
      coverImage: "/assets/gallery/gelchallenger-after.jpg",
      description: "Restauración ligera de unos ASICS Gel-Challenger blancos con detalles teal. Llegaron con suciedad moderada de uso (polvo de pista, manchas superficiales y mediasuela algo amarillenta). Se trataron con cuidado para limpiar la malla sin deformarla y devolverles frescura sin alterar materiales ni color.",
      tags: ["asics", "gel-challenger", "tenis", "limpieza", "malla"],
      difficulty: "Medio",
      timeSpent: "2 h 30 min",
      rating: 4.8,
      clientName: "Luis P.",
      completedDate: "2025-08-10",
      techniques: [
        "Limpieza profunda en malla",
        "Desmanchado localizado",
        "Desamarillado suave de mediasuela",
        "Protección hidrofóbica y UV"
      ],
      beforeCondition: "Malla grisácea con polvo, manchas leves en upper, mediasuela y suela con ligera decoloración",
      afterResult: "Blancos recuperados, teal más nítido, mediasuela aclarada y superficie protegida"
    }
    ,
    {
      id: 4,
      title: "Adidas Advantage Clean White/Black",
      brand: "Adidas",
      category: "Lifestyle",
      beforeImage: "/assets/gallery/adidas-advantage-before.png",
      afterImage: "/assets/gallery/adidas-advantage-after.png",
      coverImage: "/assets/gallery/adidas-advantage-after.png",
      description: "Transformación de unos Adidas Advantage en color blanco con franjas negras, originalmente en buen estado pero con necesidad de simular un look más usado. Se añadieron detalles de suciedad controlada, desgaste en suela y ligeras marcas de uso para un estilo vintage y urbano.",
      tags: ["adidas", "custom", "look vintage", "desgaste controlado"],
      difficulty: "Fácil",
      timeSpent: "45 minutos",
      rating: 4.9,
      clientName: "—",
      completedDate: "2025-08-10",
      techniques: ["Aplicación de suciedad simulada", "Desgaste controlado de suela", "Marcado sutil de arrugas", "Ajuste de tonalidad general"],
      beforeCondition: "Zapatillas limpias, blancas y con apariencia nueva",
      afterResult: "Acabado envejecido con suciedad natural simulada y suela desgastada"},
    
  ];

  // Obtener opciones únicas para filtros
  const categories = ['Todas', ...Array.from(new Set(galleryItems.map(item => item.category)))];
  const brands = ['Todas', ...Array.from(new Set(galleryItems.map(item => item.brand)))];
  const difficulties = ['Todas', ...Array.from(new Set(galleryItems.map(item => item.difficulty)))];

  // Función de ordenamiento
  const sortItems = (items: GalleryItem[]) => {
    switch (sortBy) {
      case 'newest':
        return [...items].sort((a, b) => new Date(b.completedDate || '').getTime() - new Date(a.completedDate || '').getTime());
      case 'difficulty':
        const difficultyOrder = { 'Fácil': 1, 'Medio': 2, 'Difícil': 3 };
        return [...items].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
      case 'rating':
        return [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'brand':
        return [...items].sort((a, b) => a.brand.localeCompare(b.brand));
      default:
        return items;
    }
  };

  // Filtrar y ordenar items
  const filteredAndSortedItems = sortItems(
    galleryItems.filter(item => {
      const matchesCategory = filters.category === 'Todas' || item.category === filters.category;
      const matchesBrand = filters.brand === 'Todas' || item.brand === filters.brand;
      const matchesDifficulty = filters.difficulty === 'Todas' || item.difficulty === filters.difficulty;
      const matchesSearch = searchTerm === '' || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesBrand && matchesDifficulty && matchesSearch;
    })
  );

  const openModal = (item: GalleryItem, imageIndex: number = 0) => {
    setSelectedItem(item);
    setCurrentImageIndex(imageIndex);
  };
  
  const closeModal = () => {
    setSelectedItem(null);
    setIsFullscreen(false);
  };

  // Control body scroll when modal is open
  useEffect(() => {
    if (selectedItem) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [selectedItem]);

  const nextImage = () => {
    setCurrentImageIndex(prev => prev === 1 ? 0 : 1);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? 1 : 0);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedItem) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      }
    };

    if (selectedItem) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [selectedItem]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Difícil': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const clearAllFilters = () => {
    setFilters({ category: 'Todas', brand: 'Todas', difficulty: 'Todas' });
    setSearchTerm('');
    setSortBy('newest');
  };

  const shareItem = async (item: GalleryItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VipCleaners - ${item.title}`,
          text: `Mira esta increíble transformación: ${item.title}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback para navegadores sin Web Share API
      navigator.clipboard.writeText(window.location.href);
      // Aquí podrías mostrar una notificación de "Link copiado"
    }
  };

  if (!mounted) return null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-[#f5f9f8]" id="gallery">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#313D52] mb-6">
              Galería de <span className="text-[#78f3d3]">Transformaciones</span>
            </h2>
            <p className="text-xl text-[#6c7a89] max-w-3xl mx-auto">
              Descubre el increíble antes y después de nuestros trabajos. Cada par de tenis tiene una historia única de restauración.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Controls and Filters */}
        <AnimateOnScroll delay={0.1}>
          <div className="mb-8 bg-white rounded-xl p-6 shadow-lg border border-[#e0e6e5]">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c7a89]" />
                <input
                  type="text"
                  placeholder="Buscar por marca, modelo, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3] text-sm"
                >
                  <option value="newest">Más Recientes</option>
                  <option value="rating">Mejor Calificación</option>
                  <option value="difficulty">Dificultad</option>
                  <option value="brand">Marca</option>
                </select>

                {/* View Mode */}
                <div className="flex border border-[#e0e6e5] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-[#78f3d3] text-[#313D52]' : 'text-[#6c7a89] hover:bg-[#f5f9f8]'}`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('masonry')}
                    className={`p-2 ${viewMode === 'masonry' ? 'bg-[#78f3d3] text-[#313D52]' : 'text-[#6c7a89] hover:bg-[#f5f9f8]'}`}
                  >
                    <List size={18} />
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 bg-[#f5f9f8] text-[#313D52] rounded-lg hover:bg-[#e0e6e5] transition-colors"
                >
                  <Filter size={18} className="mr-2" />
                  Filtros
                  {Object.values(filters).some(f => f !== 'Todas') && (
                    <span className="ml-2 w-2 h-2 bg-[#78f3d3] rounded-full"></span>
                  )}
                </button>
              </div>

              {/* Results count */}
              <div className="text-sm text-[#6c7a89] whitespace-nowrap">
                {filteredAndSortedItems.length} resultado{filteredAndSortedItems.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-[#e0e6e5]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#313D52] mb-2">Categoría</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#313D52] mb-2">Marca</label>
                    <select
                      value={filters.brand}
                      onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    >
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#313D52] mb-2">Dificultad</label>
                    <select
                      value={filters.difficulty}
                      onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#e0e6e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#78f3d3]"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={clearAllFilters}
                      className="w-full px-4 py-2 bg-[#313D52] text-white rounded-lg hover:bg-[#3e4a61] transition-colors"
                    >
                      Limpiar Todo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AnimateOnScroll>
        
        {/* Gallery Grid */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {filteredAndSortedItems.map((item, index) => (
            <AnimateOnScroll key={item.id} type="fade-up" delay={0.05 * index}>
              <div className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Featured badge */}
                {item.featured && (
                  <div className="absolute top-3 left-3 z-10 bg-[#78f3d3] text-[#313D52] px-2 py-1 rounded-full text-xs font-bold flex items-center">
                    <Heart size={12} className="mr-1" fill="currentColor" />
                    Featured
                  </div>
                )}

                {/* Rating badge */}
                {item.rating && (
                  <div className="absolute top-3 right-3 z-10 bg-white/90 text-[#313D52] px-2 py-1 rounded-full text-xs font-bold flex items-center">
                    <Star size={12} className="mr-1 text-yellow-500" fill="currentColor" />
                    {item.rating}
                  </div>
                )}

                {/* Image Container */}
                <div className="relative aspect-w-4  aspect-h-3 overflow-hidden">
                    <div 
                      className="relative bg-cover bg-center cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url(${item.coverImage})` }}
                      onClick={() => openModal(item, 0)}
                    > </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-[#313D52]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => openModal(item)}
                      className="px-4 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg font-medium hover:bg-[#4de0c0] transition-colors flex items-center"
                    >
                      <Eye size={16} className="mr-2" />
                      Ver Detalles
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#313D52] text-lg group-hover:text-[#78f3d3] transition-colors mb-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-[#6c7a89]">
                        <span>{item.brand}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(item.difficulty)}`}>
                      {item.difficulty}
                    </span>
                  </div>

                  <p className="text-[#6c7a89] text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Client and Date */}
                  {item.clientName && (
                    <div className="text-xs text-[#6c7a89] mb-3 flex items-center justify-between">
                      <span>Cliente: {item.clientName}</span>
                      <span>{formatDate(item.completedDate || '')}</span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-[#f5f9f8] text-[#6c7a89] text-xs rounded-full flex items-center">
                        <Tag size={10} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="px-2 py-1 bg-[#e0e6e5] text-[#6c7a89] text-xs rounded-full">
                        +{item.tags.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-[#6c7a89]">
                    <div className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      <span>{item.timeSpent}</span>
                    </div>
                    {item.rating && (
                      <div className="flex items-center">
                        <Star size={12} className="mr-1 text-yellow-500" fill="currentColor" />
                        <span>{item.rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedItems.length === 0 && (
          <AnimateOnScroll>
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-[#f5f9f8] rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-[#6c7a89]" />
              </div>
              <h3 className="text-xl font-semibold text-[#313D52] mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-[#6c7a89] mb-4">
                Intenta ajustar tus filtros o término de búsqueda
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg hover:bg-[#4de0c0] transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </AnimateOnScroll>
        )}

        {/* Load More Button (if needed) */}
        {filteredAndSortedItems.length > 0 && (
          <AnimateOnScroll delay={0.3}>
            <div className="text-center mt-12">
              <p className="text-[#6c7a89] mb-6">
                ¿Te gustó lo que viste? ¡Solicita tu servicio ahora!
              </p>
              <button className="px-8 py-3 bg-[#78f3d3] text-[#313D52] font-semibold rounded-full hover:bg-[#4de0c0] transition-colors shadow-lg">
                Reservar Limpieza
              </button>
            </div>
          </AnimateOnScroll>
        )}
      </div>
      
      {/* Modal mejorado con portal */}
      {selectedItem && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div 
            className={`relative bg-white rounded-2xl shadow-2xl w-full max-h-[95vh] overflow-auto ${
              isFullscreen ? 'max-w-none h-screen rounded-none' : 'max-w-6xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <X size={24} />
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-16 z-20 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <Maximize2 size={20} />
            </button>


            
            <div className={` grid gap-0 ${isFullscreen ? 'grid-cols-1 h-screen' : 'grid-cols-1 lg:grid-cols-2'}`}>
              {/* Image Display mejorado */}
              <div className='py-48  bg-gray-100'>
              <div className={`relative ${isFullscreen ? 'h-full' : 'h-96 lg:h-[600px] '} bg-gray-100 flex items-center justify-center`}>
                {/* Navigation buttons dentro del recuadro de imagen */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-lg transition-all backdrop-blur-sm"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-lg transition-all backdrop-blur-sm"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Image toggle buttons */}
                <div className="absolute top-4 left-4 z-30 flex space-x-2">
                  <button
                    onClick={() => setCurrentImageIndex(0)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all backdrop-blur-sm ${
                      currentImageIndex === 0 
                        ? 'bg-red-500 text-white shadow-lg' 
                        : 'bg-white/90 text-[#313D52] hover:bg-white'
                    }`}
                  >
                    Antes
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(1)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all backdrop-blur-sm ${
                      currentImageIndex === 1 
                        ? 'bg-[#78f3d3] text-[#313D52] shadow-lg' 
                        : 'bg-white/90 text-[#313D52] hover:bg-white'
                    }`}
                  >
                    Después
                  </button>
                </div>

                {/* Image quality indicator */}
                <div className="absolute bottom-4 left-4 z-30 px-3 py-2 bg-black/60 text-white text-sm rounded-lg backdrop-blur-sm">
                  {selectedItem.title} - {currentImageIndex === 0 ? 'Estado Original' : 'Resultado Final'}
                </div>
                
                {/* Imagen principal mejorada y centrada */}
                <div className="w-full h-full relative overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <div className="relative max-w-full max-h-full">
                      <img
                        src={currentImageIndex === 0 ? selectedItem.beforeImage : selectedItem.afterImage}
                        alt={`${selectedItem.title} - ${currentImageIndex === 0 ? 'Antes' : 'Después'}`}
                        className="max-w-full max-h-full object-contain cursor-zoom-in hover:scale-105 transition-transform duration-300 rounded-lg shadow-lg"
                        onClick={toggleFullscreen}
                        style={{ 
                          maxHeight: isFullscreen ? 'calc(100vh - 2rem)' : 'calc(600px - 2rem)',
                          width: 'auto',
                          height: 'auto'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Comparison slider overlay for non-fullscreen */}
                {!isFullscreen && (
                  <div className="absolute bottom-4 right-4 z-30 bg-white/90 rounded-lg p-2 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 text-xs text-[#313D52]">
                      <span className="font-medium">Comparar:</span>
                      <div className="flex space-x-1">
                        <div 
                          className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
                            currentImageIndex === 0 ? 'bg-red-500 scale-125' : 'bg-gray-300 hover:bg-red-300'
                          }`}
                          onClick={() => setCurrentImageIndex(0)}
                        />
                        <div 
                          className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
                            currentImageIndex === 1 ? 'bg-[#78f3d3] scale-125' : 'bg-gray-300 hover:bg-[#78f3d3]/50'
                          }`}
                          onClick={() => setCurrentImageIndex(1)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </div>
              {/* Content */}
              {!isFullscreen && (
                <div className="p-8 lg:p-12 overflow-y-auto">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-3xl font-bold text-[#313D52] mb-2">{selectedItem.title}</h3>
                      <div className="flex items-center gap-3 text-lg text-[#6c7a89] mb-2">
                        <span className="font-medium">{selectedItem.brand}</span>
                        <span>•</span>
                        <span>{selectedItem.category}</span>
                      </div>
                      {selectedItem.clientName && (
                        <p className="text-[#6c7a89]">Cliente: {selectedItem.clientName}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(selectedItem.difficulty)}`}>
                        {selectedItem.difficulty}
                      </span>
                      {selectedItem.featured && (
                        <span className="px-3 py-1 bg-[#78f3d3] text-[#313D52] rounded-full text-sm font-medium flex items-center">
                          <Heart size={14} className="mr-1" fill="currentColor" />
                          Featured
                        </span>
                      )}
                      {selectedItem.rating && (
                        <div className="flex items-center px-3 py-1 bg-yellow-50 rounded-full">
                          <Star size={16} className="text-yellow-500 mr-1" fill="currentColor" />
                          <span className="text-sm font-medium">{selectedItem.rating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-[#f5f9f8] rounded-lg">
                    <div>
                      <h4 className="font-semibold text-[#313D52] mb-1">Tiempo Invertido</h4>
                      <div className="flex items-center text-[#6c7a89]">
                        <Clock size={16} className="mr-2" />
                        {selectedItem.timeSpent}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#313D52] mb-1">Fecha Completada</h4>
                      <p className="text-[#6c7a89]">{formatDate(selectedItem.completedDate || '')}</p>
                    </div>
                  </div>
                  
                  {/* Detailed Description */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-[#313D52] mb-3">Descripción del Proceso</h4>
                    <p className="text-[#6c7a89] leading-relaxed">{selectedItem.description}</p>
                  </div>

                  {/* Before/After Conditions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h5 className="font-semibold text-red-800 mb-2 flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        Condición Inicial
                      </h5>
                      <p className="text-red-700 text-sm">{selectedItem.beforeCondition}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        Resultado Final
                      </h5>
                      <p className="text-green-700 text-sm">{selectedItem.afterResult}</p>
                    </div>
                  </div>


                  {/* Tags */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-[#313D52] mb-3">Etiquetas</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-2 bg-[#f5f9f8] text-[#313D52] text-sm rounded-lg border border-[#e0e6e5] flex items-center">
                          <Tag size={12} className="mr-1" />
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="flex-1 px-6 py-3 bg-[#78f3d3] text-[#313D52] font-semibold rounded-lg hover:bg-[#4de0c0] transition-colors flex items-center justify-center">
                      <Heart size={18} className="mr-2" />
                      Solicitar Este Servicio
                    </button>
                    <button 
                      onClick={() => shareItem(selectedItem)}
                      className="px-6 py-3 border border-[#e0e6e5] text-[#313D52] font-medium rounded-lg hover:bg-[#f5f9f8] transition-colors flex items-center justify-center"
                    >
                      <Share2 size={18} className="mr-2" />
                      Compartir
                    </button>
                  </div>

                  {/* Navigation indicators */}
                  <div className="flex justify-center mt-6 space-x-2">
                    <button
                      onClick={() => setCurrentImageIndex(0)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        currentImageIndex === 0 ? 'bg-red-500 scale-125' : 'bg-[#e0e6e5] hover:bg-red-300'
                      }`}
                      title="Ver estado original"
                    />
                    <button
                      onClick={() => setCurrentImageIndex(1)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        currentImageIndex === 1 ? 'bg-[#78f3d3] scale-125' : 'bg-[#e0e6e5] hover:bg-[#78f3d3]/50'
                      }`}
                      title="Ver resultado final"
                    />
                  </div>

                  {/* Keyboard shortcuts hint */}
                  <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 text-center">
                    <p>Atajos: <kbd className="px-1 py-0.5 bg-gray-200 rounded">←</kbd> <kbd className="px-1 py-0.5 bg-gray-200 rounded">→</kbd> Navegar | <kbd className="px-1 py-0.5 bg-gray-200 rounded">F</kbd> Pantalla completa | <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd> Cerrar</p>
                  </div>
                </div>
              )}

              {/* Fullscreen overlay controls */}
              {isFullscreen && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 text-white px-6 py-3 rounded-xl backdrop-blur-sm">
                  <div className="text-center">
                    <p className="font-semibold text-lg mb-1">
                      {selectedItem.title}
                    </p>
                    <p className="text-sm opacity-80">
                      {currentImageIndex === 0 ? 'Estado Original' : 'Resultado Final'} - {selectedItem.brand}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default Gallery;