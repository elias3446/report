
import React from 'react';
import { NuevoReporteScreen } from '@/components/reportes/NuevoReporteScreen';
import { useReportes } from '@/hooks/useReportes';
import { useCloudinary } from '@/hooks/useCloudinary';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import type { CreateReporteData } from '@/types/reportes';

export const NuevoReporte = () => {
  const navigate = useNavigate();
  const { createReporte, isCreating } = useReportes();
  const { uploadImagesForReporte } = useCloudinary();

  const handleFormSubmit = async (data: any) => {
    try {
      const { pendingImages, ...reporteData } = data;
      
      // Si hay imágenes pendientes, subirlas primero
      let imageUrls: string[] = [];
      if (pendingImages && pendingImages.length > 0) {
        imageUrls = await uploadImagesForReporte(pendingImages, {
          nombre: reporteData.nombre,
          latitud: reporteData.latitud,
          longitud: reporteData.longitud,
        });
      }
      
      // Crear el reporte con todas las URLs de imágenes
      const finalReporteData: CreateReporteData = {
        ...reporteData,
        imagenes: [...(reporteData.imagenes || []), ...imageUrls]
      };
      
      await createReporte(finalReporteData);
      toast({
        title: "Reporte creado",
        description: "El reporte se ha creado exitosamente",
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating reporte:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el reporte",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <NuevoReporteScreen
      onSubmit={handleFormSubmit}
      onCancel={handleCancel}
      isLoading={isCreating}
    />
  );
};

export default NuevoReporte;
