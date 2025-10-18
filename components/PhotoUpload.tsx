'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface PhotoUploadProps {
  entityType: 'orden' | 'cliente' | 'empleado' | 'producto' | 'servicio' | 'marca';
  entityId: number;
  photoType?: 'calzado_entrada' | 'calzado_salida' | 'identificacion' | 'otro';
  onPhotosUploaded?: (urls: string[]) => void;
  maxPhotos?: number;
  existingPhotos?: string[];
}

interface UploadedPhoto {
  id: string;
  url: string;
  file?: File;
  uploading?: boolean;
}

export default function PhotoUpload({
  entityType,
  entityId,
  photoType = 'calzado_entrada',
  onPhotosUploaded,
  maxPhotos = 5,
  existingPhotos = []
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  // Cargar fotos existentes al montar el componente
  useEffect(() => {
    const loadExistingPhotos = async () => {
      if (entityId && entityId > 0) {
        try {
          const response = await fetch(
            `/api/admin/media?entidadTipo=${entityType}&entidadId=${entityId}&tipo=${photoType}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const existingPhotos = data.files.map((file: any) => ({
                id: `existing-${file.id}`,
                url: file.url
              }));
              setPhotos(existingPhotos);
            }
          }
        } catch (error) {
          console.error('Error loading existing photos:', error);
        }
      } else if (existingPhotos.length > 0) {
        // Usar fotos proporcionadas como prop
        const photosFromProps = existingPhotos.map((url, index) => ({
          id: `prop-${index}`,
          url
        }));
        setPhotos(photosFromProps);
      }
      setLoading(false);
    };

    loadExistingPhotos();
  }, [entityType, entityId, photoType, existingPhotos]);

  // Funciones de Drag and Drop simples
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploading || photos.length >= maxPhotos) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (uploading || photos.length >= maxPhotos) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      processFiles(imageFiles);
    }
  };

  const processFiles = async (files: File[]) => {
    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      alert(`Máximo ${maxPhotos} fotos permitidas`);
      return;
    }

    setUploading(true);

    for (const file of filesToProcess) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempUrl = URL.createObjectURL(file);

      // Añadir foto temporal con estado de carga
      setPhotos(prev => [...prev, {
        id: tempId,
        url: tempUrl,
        file,
        uploading: true
      }]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tipo', photoType);
        formData.append('entidadTipo', entityType);
        formData.append('entidadId', entityId.toString());
        formData.append('descripcion', `Foto de ${photoType} - ${file.name}`);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Error al subir la foto');
        }

        const result = await response.json();

        // Actualizar la foto con la URL real de S3
        setPhotos(prev => prev.map(photo =>
          photo.id === tempId
            ? { ...photo, url: result.url, uploading: false }
            : photo
        ));

      } catch (error) {
        console.error('Error uploading photo:', error);
        // Remover la foto que falló
        setPhotos(prev => prev.filter(photo => photo.id !== tempId));
        alert('Error al subir la foto. Intenta de nuevo.');
      }
    }

    setUploading(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    await processFiles(fileArray);

    // Limpiar el input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = async (photoId: string) => {
    const photoToRemove = photos.find(photo => photo.id === photoId);

    // Si es una foto existente en el servidor, intentar eliminarla
    if (photoToRemove && photoId.startsWith('existing-')) {
      try {
        const fileId = photoId.replace('existing-', '');
        const response = await fetch(`/api/admin/media/${fileId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          console.error('Error al eliminar foto del servidor');
          // Aún así continuar con la eliminación local
        }
      } catch (error) {
        console.error('Error deleting photo from server:', error);
      }
    }

    setPhotos(prev => prev.filter(photo => photo.id !== photoId));

    // Notificar cambio
    const updatedUrls = photos
      .filter(photo => photo.id !== photoId && !photo.uploading)
      .map(photo => photo.url);
    onPhotosUploaded?.(updatedUrls);
  };

  // Notificar cuando se complete una subida
  React.useEffect(() => {
    const completedUrls = photos
      .filter(photo => !photo.uploading)
      .map(photo => photo.url);
    onPhotosUploaded?.(completedUrls);
  }, [photos, onPhotosUploaded]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-[#78f3d3] animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Cargando fotos existentes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Área de subida con drag and drop */}
      <div
        ref={dropAreaRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#78f3d3] transition-colors cursor-pointer ${
          isDragOver ? 'border-[#78f3d3] bg-[#f0fdf4]' : ''
        } ${uploading || photos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => {
          if (!uploading && photos.length < maxPhotos) {
            fileInputRef.current?.click();
          }
        }}
      >
        <div className="text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || photos.length >= maxPhotos}
          />

          <div className="flex flex-col items-center space-y-2">
            <Upload className="h-12 w-12 text-gray-400" />
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || photos.length >= maxPhotos}
                className="text-[#78f3d3] hover:text-[#5ac5a8] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Subiendo...' : 'Seleccionar fotos'}
              </button>
              <p className="text-sm text-gray-500 mt-1">
                o arrastra las fotos aquí
              </p>
            </div>
            <p className="text-xs text-gray-400">
              {photos.length}/{maxPhotos} fotos subidas
            </p>
          </div>
        </div>
      </div>

      {/* Grid de fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                {photo.uploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#78f3d3]" />
                  </div>
                ) : (
                  <img
                    src={photo.url}
                    alt="Foto del calzado"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Overlay con botón de eliminar */}
                {!photo.uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensaje de estado */}
      {uploading && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Subiendo fotos...</span>
        </div>
      )}
    </div>
  );
}