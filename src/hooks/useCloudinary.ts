
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export const useCloudinary = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    
    try {
      console.log('Uploading image to Cloudinary:', file.name);
      
      // Call our edge function to handle the upload securely
      const { data, error } = await supabase.functions.invoke('upload-to-cloudinary', {
        body: {
          fileData: await fileToBase64(file),
          fileName: file.name,
          fileType: file.type
        }
      });

      if (error) {
        throw new Error(error.message || 'Error uploading to Cloudinary');
      }

      if (!data?.secure_url) {
        throw new Error('No URL returned from upload');
      }

      console.log('Image uploaded successfully:', data.secure_url);
      toast.success('Imagen subida exitosamente');
      return data.secure_url;
    } catch (error: any) {
      console.error('Error uploading image to Cloudinary:', error);
      toast.error(error.message || 'Error al subir la imagen');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImagesFromCloudinary = async (imageUrls: string[]): Promise<void> => {
    try {
      console.log('Deleting images from Cloudinary:', imageUrls);
      
      // Extract public IDs from URLs
      const publicIds = imageUrls.map(url => {
        // Extract public_id from Cloudinary URL
        // Example: https://res.cloudinary.com/cloud/image/upload/v1234/folder/image.jpg
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
          // Get everything after version number, remove file extension
          const pathAfterVersion = parts.slice(uploadIndex + 2).join('/');
          return pathAfterVersion.replace(/\.[^/.]+$/, ''); // Remove extension
        }
        return null;
      }).filter(Boolean);

      if (publicIds.length === 0) {
        console.log('No valid public IDs found for deletion');
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-from-cloudinary', {
        body: {
          publicIds
        }
      });

      if (error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Don't throw error here, just log it as it's not critical
      } else {
        console.log('Images deleted successfully from Cloudinary');
      }
    } catch (error: any) {
      console.error('Error in deleteImagesFromCloudinary:', error);
      // Don't throw error here, just log it as it's not critical for the main flow
    }
  };

  const uploadImagesForReporte = async (
    files: File[], 
    reporteData: { 
      nombre: string; 
      latitud?: number; 
      longitud?: number;
      id?: string;
    },
    existingImages: string[] = []
  ): Promise<string[]> => {
    setIsUploading(true);
    
    try {
      console.log('Uploading images for reporte to Cloudinary:', files.length, 'reporteData:', reporteData);
      
      let folderName: string;
      
      // Si es una actualización (tiene id), usar carpeta basada en el ID y eliminar imágenes anteriores
      if (reporteData.id) {
        folderName = `reportes/${reporteData.id}`;
        console.log('Updating existing reporte, using folder:', folderName);
        
        // Eliminar imágenes anteriores si existen
        if (existingImages.length > 0) {
          console.log('Deleting previous images:', existingImages);
          await deleteImagesFromCloudinary(existingImages);
        }
      } else {
        // Si es creación nueva, usar formato con timestamp
        const timestamp = new Date();
        const year = timestamp.getFullYear();
        const month = String(timestamp.getMonth() + 1).padStart(2, '0');
        const day = String(timestamp.getDate()).padStart(2, '0');
        const hours = String(timestamp.getHours()).padStart(2, '0');
        const minutes = String(timestamp.getMinutes()).padStart(2, '0');
        const seconds = String(timestamp.getSeconds()).padStart(2, '0');
        
        // Limpiar el nombre del reporte para usarlo en la carpeta
        const cleanReporteName = reporteData.nombre
          .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiales
          .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
          .toLowerCase();
        
        // Formatear coordenadas
        const lat = reporteData.latitud ? reporteData.latitud.toFixed(6) : 'no-coord';
        const lng = reporteData.longitud ? reporteData.longitud.toFixed(6) : 'no-coord';
        
        // Crear nombre de carpeta: reportes/nombre_lat_lng_YYYYMMDD_HHMMSS
        folderName = `reportes/${cleanReporteName}_${lat}_${lng}_${year}${month}${day}_${hours}${minutes}${seconds}`;
        console.log('Creating new reporte, using folder:', folderName);
      }
      
      const uploadPromises = files.map(async (file) => {
        const { data, error } = await supabase.functions.invoke('upload-to-cloudinary', {
          body: {
            fileData: await fileToBase64(file),
            fileName: file.name,
            fileType: file.type,
            folder: folderName
          }
        });

        if (error) {
          console.error('Error uploading file:', file.name, error);
          return null;
        }

        return data?.secure_url || null;
      });
      
      const results = await Promise.all(uploadPromises);
      
      // Filtrar resultados nulos (errores de subida)
      const successfulUploads = results.filter((url): url is string => url !== null);
      
      if (successfulUploads.length !== files.length) {
        toast.warning(`${successfulUploads.length} de ${files.length} imágenes subidas exitosamente`);
      } else {
        toast.success('Todas las imágenes subidas exitosamente');
      }
      
      return successfulUploads;
    } catch (error: any) {
      console.error('Error uploading images for reporte:', error);
      toast.error('Error al subir las imágenes');
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    setIsUploading(true);
    
    try {
      console.log('Uploading multiple images to Cloudinary:', files.length);
      
      const uploadPromises = files.map(file => uploadImage(file));
      const results = await Promise.all(uploadPromises);
      
      // Filtrar resultados nulos (errores de subida)
      const successfulUploads = results.filter((url): url is string => url !== null);
      
      if (successfulUploads.length !== files.length) {
        toast.warning(`${successfulUploads.length} de ${files.length} imágenes subidas exitosamente`);
      }
      
      return successfulUploads;
    } catch (error: any) {
      console.error('Error uploading multiple images:', error);
      toast.error('Error al subir las imágenes');
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  return {
    uploadImage,
    uploadImagesForReporte,
    uploadMultipleImages,
    deleteImagesFromCloudinary,
    isUploading,
  };
};
