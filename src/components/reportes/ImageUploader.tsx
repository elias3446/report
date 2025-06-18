
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  pendingFiles: File[];
  onImagesChange: (images: string[]) => void;
  onPendingFilesChange: (files: File[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export const ImageUploader = ({ 
  images, 
  pendingFiles, 
  onImagesChange, 
  onPendingFilesChange, 
  maxImages = 10,
  disabled = false 
}: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validar límite de imágenes (existentes + pendientes + nuevas)
    const totalImages = images.length + pendingFiles.length + files.length;
    if (totalImages > maxImages) {
      alert(`Solo puedes subir un máximo de ${maxImages} imágenes en total`);
      return;
    }

    // Validar tipos de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      alert('Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validar tamaño de archivo (máximo 10MB por imagen)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      alert('Las imágenes no pueden ser mayores a 10MB');
      return;
    }

    // Agregar archivos a pendientes
    onPendingFilesChange([...pendingFiles, ...files]);

    // Limpiar el input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Usar cámara trasera por defecto
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File([blob], `foto-reporte-${timestamp}.jpg`, { type: 'image/jpeg' });
      
      // Validar límite de imágenes
      const totalImages = images.length + pendingFiles.length + 1;
      if (totalImages > maxImages) {
        alert(`Solo puedes subir un máximo de ${maxImages} imágenes en total`);
        return;
      }
      
      // Agregar foto capturada a archivos pendientes
      onPendingFilesChange([...pendingFiles, file]);
      
      // Detener cámara después de capturar
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const removePendingFile = (index: number) => {
    const newPendingFiles = pendingFiles.filter((_, i) => i !== index);
    onPendingFilesChange(newPendingFiles);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const totalImages = images.length + pendingFiles.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Imágenes ({totalImages}/{maxImages})
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileSelect}
            disabled={disabled || totalImages >= maxImages}
            className="flex items-center gap-2 text-sm"
            size="sm"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Subir Archivos</span>
            <span className="sm:hidden">Subir</span>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={startCamera}
            disabled={disabled || totalImages >= maxImages || isCapturing}
            className="flex items-center gap-2 text-sm"
            size="sm"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Tomar Foto</span>
            <span className="sm:hidden">Cámara</span>
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Cámara en vivo */}
      {isCapturing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-medium text-blue-800">Capturar Foto</h4>
                <p className="text-sm text-blue-600">Posiciona la cámara y presiona capturar</p>
              </div>
              
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full max-h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>
              
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  onClick={capturePhoto}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Camera className="h-4 w-4" />
                  Capturar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={stopCamera}
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {totalImages > 0 ? (
        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
          {/* Imágenes ya subidas */}
          {images.map((imageUrl, index) => (
            <Card key={`uploaded-${index}`} className="relative">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="text-xs">
                      Imagen subida
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(index)}
                    disabled={disabled}
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Archivos pendientes de subir */}
          {pendingFiles.map((file, index) => (
            <Card key={`pending-${index}`} className="relative border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                      <span className="truncate">{file.name}</span>
                    </Badge>
                    <p className="text-xs text-blue-600 mt-1">Pendiente</p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removePendingFile(index)}
                    disabled={disabled}
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card 
          className="border-dashed border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
          onClick={triggerFileSelect}
        >
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                <ImageIcon className="h-8 w-8 text-gray-400" />
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm mb-1">No hay imágenes seleccionadas</p>
              <p className="text-xs text-gray-500">Haz clic aquí para subir archivos o usa el botón de cámara para tomar fotos</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
