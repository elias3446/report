import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useReportes } from '@/hooks/useReportes';
import { useReporteHistorial } from '@/hooks/useReporteHistorial';
import { useSecurity } from '@/hooks/useSecurity';
import { PermissionWrapper } from '@/components/security/PermissionWrapper';
import { MapaReporteEspecifico } from '@/components/MapaBase';
import { GoogleMapsButton } from '@/components/ui/google-maps-button';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText,
  AlertTriangle,
  Eye,
  MapPin,
  Clock,
  History,
  X,
  ExternalLink,
  Shield,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  BarChart3,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const priorityConfig = {
  urgente: { color: '#DC2626', label: 'Urgente' },
  alto: { color: '#EA580C', label: 'Alto' },
  medio: { color: '#D97706', label: 'Medio' },
  bajo: { color: '#059669', label: 'Bajo' },
};

export const ReporteDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const { reportes, isLoading, getReporteStatus } = useReportes();
  const { historial, isLoading: isLoadingHistorial } = useReporteHistorial(id || '');
  const { hasPermission, logSecurityEvent } = useSecurity();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  const reporte = reportes.find(r => r.id === id);

  // Log access attempt
  React.useEffect(() => {
    if (id) {
      logSecurityEvent(
        'REPORT_VIEW_ATTEMPT',
        `User attempted to view report details`,
        { reportId: id }
      );
    }
  }, [id, logSecurityEvent]);

  const getProfileName = (profile: any) => {
    if (!profile) return 'N/A';
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email;
  };

  const openImageCarousel = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageCarousel = () => {
    setSelectedImageIndex(null);
  };

  // Check permissions early
  if (!hasPermission('ver_reporte')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-3 text-foreground">Acceso Denegado</h1>
            <p className="text-muted-foreground mb-4">
              No tienes permisos para ver los detalles de reportes.
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Inicio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Cargando reporte...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h1 className="text-xl font-bold mb-3 text-foreground">Reporte no encontrado</h1>
            <p className="text-muted-foreground mb-4">
              El reporte que buscas no existe o ha sido eliminado.
            </p>
            <Button asChild>
              <Link to="/reportes-publicos">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Reportes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Obtener el estado actual del reporte usando la nueva lógica
  const reporteStatus = getReporteStatus(reporte);

  const getStatusBadge = () => {
    switch (reporteStatus.status) {
      case 'resuelto':
        return {
          variant: "secondary" as const,
          icon: <CheckCircle className="h-3 w-3" />,
          text: "Resuelto",
          color: reporteStatus.color
        };
      case 'en_proceso':
        return {
          variant: "default" as const,
          icon: <PlayCircle className="h-3 w-3" />,
          text: "En Proceso",
          color: reporteStatus.color
        };
      case 'pendiente':
        return {
          variant: "destructive" as const,
          icon: <PauseCircle className="h-3 w-3" />,
          text: "Pendiente",
          color: reporteStatus.color
        };
      default:
        return {
          variant: "secondary" as const,
          icon: <PauseCircle className="h-3 w-3" />,
          text: "Desconocido",
          color: '#6B7280'
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="flex items-center gap-2 w-fit"
          >
            <Link to="/reportes-publicos">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Detalle del Reporte</h1>
            <p className="text-sm text-muted-foreground truncate">Información completa del reporte</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Información Principal - Responsive */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-16 w-16 sm:h-24 sm:w-24">
                  <AvatarFallback 
                    className="text-lg sm:text-xl text-white"
                    style={{ backgroundColor: reporte.categoria?.color || '#3B82F6' }}
                  >
                    {reporte.categoria?.icono?.charAt(0) || 'R'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-lg sm:text-xl break-words">{reporte.nombre}</CardTitle>
              <p className="text-sm text-muted-foreground break-words">{reporte.categoria?.nombre || 'Sin categoría'}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm break-words overflow-hidden">{reporte.descripcion}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm break-words">
                    Creado: {format(new Date(reporte.created_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm break-words">
                    Actualizado: {format(new Date(reporte.updated_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>

                <PermissionWrapper permission="ver_usuario">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-words">
                      Creado por: {getProfileName(reporte.created_by_profile)}
                    </span>
                  </div>
                </PermissionWrapper>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  Prioridad
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                    style={{ 
                      backgroundColor: `${priorityConfig[reporte.priority]?.color || priorityConfig.urgente.color}20`,
                      color: priorityConfig[reporte.priority]?.color || priorityConfig.urgente.color,
                      borderColor: priorityConfig[reporte.priority]?.color || priorityConfig.urgente.color
                    }}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {priorityConfig[reporte.priority]?.label || 'Urgente'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Estado del Reporte (basado en lógica activo/assigned_to) */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 flex-shrink-0" />
                  Estado del Reporte
                </h4>
                <p className="text-xs text-muted-foreground">Estado basado en el flujo de trabajo</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={statusBadge.variant} 
                      className="flex items-center gap-1"
                      style={{ 
                        backgroundColor: `${statusBadge.color}20`,
                        color: statusBadge.color,
                        borderColor: statusBadge.color
                      }}
                    >
                      {statusBadge.icon}
                      {statusBadge.text}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Estado Asignado (desde tabla estados) */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 flex-shrink-0" />
                  Estado Asignado
                </h4>
                <p className="text-xs text-muted-foreground">Estado específico desde la configuración</p>
                
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                    style={{ backgroundColor: reporte.estado?.color || '#10B981' }}
                  >
                    {reporte.estado?.icono?.charAt(0) || 'E'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 break-words">
                      {reporte.estado?.nombre || 'Sin estado asignado'}
                    </p>
                    {reporte.estado?.descripcion && (
                      <p className="text-sm text-muted-foreground break-words">
                        {reporte.estado.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <PermissionWrapper permission="ver_usuario">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 flex-shrink-0" />
                    Asignación
                  </h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Asignado a: </span>
                      <span className="break-words">{reporte.assigned_to_profile ? getProfileName(reporte.assigned_to_profile) : 'Sin asignar'}</span>
                    </div>
                  </div>
                </div>
              </PermissionWrapper>

              <Separator />
              
              {/* Información de categoría */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  Categoría
                </h4>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                    style={{ backgroundColor: reporte.categoria?.color || '#3B82F6' }}
                  >
                    {reporte.categoria?.icono?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 break-words">
                      {reporte.categoria?.nombre || 'Sin categoría'}
                    </p>
                    {reporte.categoria?.descripcion && (
                      <p className="text-sm text-muted-foreground break-words">
                        {reporte.categoria.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {reporte.latitud && reporte.longitud && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      Ubicación
                    </h4>
                    <div className="text-sm text-muted-foreground break-all">
                      Lat: {reporte.latitud}, Lng: {reporte.longitud}
                    </div>
                    <GoogleMapsButton
                      location={{
                        latitud: reporte.latitud,
                        longitud: reporte.longitud,
                        direccion: reporte.direccion,
                        referencia: reporte.referencia_direccion
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información Detallada - Responsive */}
        <div className="xl:col-span-2">
          <Tabs defaultValue="evidencia" className="space-y-4">
            {/* Responsive TabsList with scrollable layout */}
            <div className="overflow-x-auto">
              <TabsList className="flex w-full min-w-fit">
                {reporte.imagenes && reporte.imagenes.length > 0 && (
                  <TabsTrigger value="evidencia" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline">Evidencia</span>
                  </TabsTrigger>
                )}
                {reporte.latitud && reporte.longitud && (
                  <TabsTrigger value="ubicacion" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline">Ubicación</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="historial" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <History className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Historial</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {reporte.imagenes && reporte.imagenes.length > 0 && (
              <TabsContent value="evidencia">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>Evidencia Fotográfica</span>
                      </div>
                      <span className="text-sm font-normal text-muted-foreground flex-shrink-0">
                        {reporte.imagenes.length} imagen{reporte.imagenes.length !== 1 ? 'es' : ''}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {reporte.imagenes.map((imagen, index) => (
                        <div key={index} className="relative group cursor-pointer">
                          <div 
                            className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                            onClick={() => openImageCarousel(index)}
                          >
                            <img
                              src={imagen}
                              alt={`Imagen ${index + 1} del reporte ${reporte.nombre}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg" />
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageCarousel(index);
                              }}
                              className="h-8 px-2"
                            >
                              Ver
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {reporte.latitud && reporte.longitud && (
              <TabsContent value="ubicacion">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <span>Ubicación del Reporte</span>
                      </CardTitle>
                      <GoogleMapsButton
                        location={{
                          latitud: reporte.latitud,
                          longitud: reporte.longitud,
                          direccion: reporte.direccion,
                          referencia: reporte.referencia_direccion
                        }}
                        variant="outline"
                        size="sm"
                        showIcon={false}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg overflow-hidden border-border border">
                      <MapaReporteEspecifico
                        reporte={reporte}
                        height="h-[400px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="historial">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Historial de Asignaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PermissionWrapper 
                    permission="ver_usuario"
                    fallback={
                      <div className="text-center py-6">
                        <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No tienes permisos para ver el historial de asignaciones</p>
                      </div>
                    }
                  >
                    {isLoadingHistorial ? (
                      <p className="text-gray-500 text-sm">Cargando historial...</p>
                    ) : historial.length === 0 ? (
                      <div className="text-center py-6">
                        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Sin historial de asignaciones</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {historial.map((entry) => (
                          <div key={entry.id} className="border-l-2 border-gray-200 pl-4 pb-4 last:pb-0">
                            <div className="text-sm font-medium text-gray-900 break-words overflow-hidden">
                              {entry.comentario}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 space-y-1">
                              <div className="break-words overflow-hidden">Por: {getProfileName(entry.assigned_by_profile)}</div>
                              {entry.assigned_from_profile && (
                                <div className="break-words overflow-hidden">De: {getProfileName(entry.assigned_from_profile)}</div>
                              )}
                              {entry.assigned_to_profile && (
                                <div className="break-words overflow-hidden">A: {getProfileName(entry.assigned_to_profile)}</div>
                              )}
                              <div className="text-gray-500 break-words">
                                {new Date(entry.fecha_asignacion).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </PermissionWrapper>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal del Carrusel de Imágenes */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={() => closeImageCarousel()}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0" hideCloseButton>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span className="break-words overflow-hidden flex-1 min-w-0">Imágenes del Reporte - {reporte.nombre}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={closeImageCarousel}
                className="h-8 w-8 p-0 flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedImageIndex !== null && reporte.imagenes && (
            <div className="p-6 pt-0">
              <Carousel className="w-full max-w-3xl mx-auto">
                <CarouselContent>
                  {reporte.imagenes.map((imagen, index) => (
                    <CarouselItem key={index}>
                      <div className="flex justify-center">
                        <div className="max-h-[60vh] w-full flex items-center justify-center">
                          <img
                            src={imagen}
                            alt={`Imagen ${index + 1} del reporte ${reporte.nombre}`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                          Imagen {index + 1} de {reporte.imagenes.length}
                        </p>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReporteDetalle;
