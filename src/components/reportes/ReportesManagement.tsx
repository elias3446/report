
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportesList } from './ReportesList';
import { ReporteForm } from './ReporteForm';
import { ReporteDetail } from './ReporteDetail';
import { BulkUploadReportes } from './BulkUploadReportes';
import { useReportes } from '@/hooks/useReportes';
import { useCloudinary } from '@/hooks/useCloudinary';
import type { Reporte } from '@/types/reportes';

type ViewMode = 'list' | 'create' | 'edit' | 'detail' | 'bulk-upload';

export const ReportesManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  
  const { createReporte, updateReporte, isCreating, isUpdating, reportes } = useReportes();
  const { uploadImagesForReporte } = useCloudinary();

  // Handle URL parameter for viewing specific reporte
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && reportes.length > 0) {
      const reporte = reportes.find(r => r.id === viewParam);
      if (reporte) {
        setSelectedReporte(reporte);
        setViewMode('detail');
      } else {
        // If reporte not found, clear the view param and go to list
        setSearchParams({});
        setViewMode('list');
      }
    }
  }, [searchParams, reportes, setSearchParams]);

  const handleCreateReporte = () => {
    setSelectedReporte(null);
    setViewMode('create');
    setSearchParams({});
  };

  const handleBulkUpload = () => {
    setSelectedReporte(null);
    setViewMode('bulk-upload');
    setSearchParams({});
  };

  const handleEditReporte = (reporte: Reporte) => {
    setSelectedReporte(reporte);
    setViewMode('edit');
    setSearchParams({});
  };

  const handleViewReporte = (reporte: Reporte) => {
    setSelectedReporte(reporte);
    setViewMode('detail');
    setSearchParams({ view: reporte.id });
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const { pendingImages, ...reporteData } = data;
      
      // Si hay imágenes pendientes, subirlas primero
      let imageUrls: string[] = [];
      if (pendingImages && pendingImages.length > 0) {
        // Pasar las imágenes existentes para eliminarlas en caso de actualización
        const existingImages = viewMode === 'edit' && selectedReporte ? selectedReporte.imagenes || [] : [];
        
        imageUrls = await uploadImagesForReporte(pendingImages, {
          nombre: reporteData.nombre,
          latitud: reporteData.latitud,
          longitud: reporteData.longitud,
          id: viewMode === 'edit' && selectedReporte ? selectedReporte.id : undefined
        }, existingImages);
      }
      
      // Para actualizaciones, si hay nuevas imágenes, usar solo las nuevas
      // Para creaciones, combinar imágenes existentes con nuevas
      let allImageUrls: string[];
      if (viewMode === 'edit' && imageUrls.length > 0) {
        // En actualizaciones con nuevas imágenes, usar solo las nuevas (las anteriores ya fueron eliminadas)
        allImageUrls = imageUrls;
      } else if (viewMode === 'edit') {
        // En actualizaciones sin nuevas imágenes, mantener las existentes
        allImageUrls = reporteData.imagenes || [];
      } else {
        // En creaciones, combinar existentes con nuevas
        allImageUrls = [...(reporteData.imagenes || []), ...imageUrls];
      }
      
      // Crear/actualizar el reporte con todas las URLs de imágenes
      const finalReporteData = {
        ...reporteData,
        imagenes: allImageUrls
      };
      
      if (viewMode === 'edit' && selectedReporte) {
        updateReporte({ id: selectedReporte.id, ...finalReporteData });
      } else {
        createReporte(finalReporteData);
      }
      
      setViewMode('list');
      setSelectedReporte(null);
      setSearchParams({});
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedReporte(null);
    setSearchParams({});
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedReporte(null);
    setSearchParams({});
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <ReporteForm
        reporte={selectedReporte || undefined}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isLoading={isCreating || isUpdating}
      />
    );
  }

  if (viewMode === 'detail' && selectedReporte) {
    return (
      <ReporteDetail
        reporte={selectedReporte}
        onEdit={handleEditReporte}
        onBack={handleBackToList}
      />
    );
  }

  if (viewMode === 'bulk-upload') {
    return (
      <BulkUploadReportes onBack={handleBackToList} />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <ReportesList
        onCreateReporte={handleCreateReporte}
        onEditReporte={handleEditReporte}
        onViewReporte={handleViewReporte}
        onBulkUpload={handleBulkUpload}
      />
    </div>
  );
};
