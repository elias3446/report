
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MapaReporteEditable from '@/components/MapaBase/MapaReporteEditable';
import MapaNuevaPosicion from '@/components/MapaBase/MapaNuevaPosicion';
import { ImageUploader } from './ImageUploader';
import { useCategories } from '@/hooks/useCategories';
import { useEstados } from '@/hooks/useEstados';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Save, X, FileText, MapPin, AlertTriangle, Users } from 'lucide-react';
import type { Reporte } from '@/types/reportes';

const PRIORITY_OPTIONS = [
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
  { value: 'urgente', label: 'Urgente' },
];

const reporteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  categoria_id: z.string().min(1, 'La categoría es requerida'),
  estado_id: z.string().min(1, 'El estado es requerido'),
  assigned_to: z.string().optional(),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
  imagenes: z.array(z.string()).optional(),
  activo: z.boolean().optional(),
  priority: z.enum(['bajo', 'medio', 'alto', 'urgente']),
});

type ReporteFormData = z.infer<typeof reporteSchema>;

interface ReporteFormProps {
  reporte?: Reporte;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const priorityConfig = {
  urgente: { color: '#DC2626', label: 'Urgente' },
  alto: { color: '#EA580C', label: 'Alto' },
  medio: { color: '#D97706', label: 'Medio' },
  bajo: { color: '#059669', label: 'Bajo' },
};

export const ReporteForm: React.FC<ReporteFormProps> = ({
  reporte,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { categories } = useCategories();
  const { estados } = useEstados();
  const { user, profile } = useAuth();
  const { users: adminUsers } = useUsers(true, true);
  const [pendingImages, setPendingImages] = useState<File[]>([]);

  const form = useForm<ReporteFormData>({
    resolver: zodResolver(reporteSchema),
    defaultValues: {
      nombre: reporte?.nombre || '',
      descripcion: reporte?.descripcion || '',
      categoria_id: reporte?.categoria_id || '',
      estado_id: reporte?.estado_id || '',
      assigned_to: reporte?.assigned_to || '',
      latitud: reporte?.latitud ? Number(reporte.latitud) : undefined,
      longitud: reporte?.longitud ? Number(reporte.longitud) : undefined,
      imagenes: reporte?.imagenes || [],
      activo: reporte?.activo ?? true,
      priority: reporte?.priority || 'urgente',
    },
  });

  useEffect(() => {
    if (reporte) {
      form.reset({
        nombre: reporte.nombre || '',
        descripcion: reporte.descripcion || '',
        categoria_id: reporte.categoria_id || '',
        estado_id: reporte.estado_id || '',
        assigned_to: reporte.assigned_to || '',
        latitud: reporte.latitud ? Number(reporte.latitud) : undefined,
        longitud: reporte.longitud ? Number(reporte.longitud) : undefined,
        imagenes: reporte.imagenes || [],
        activo: reporte.activo ?? true,
        priority: reporte.priority || 'urgente',
      });
    }
  }, [reporte, form]);

  const handleMapClick = useCallback(
    ([lat, lng]: [number, number]) => {
      form.setValue('latitud', lat);
      form.setValue('longitud', lng);
    },
    [form]
  );

  const handleNewPositionSelected = useCallback(
    (pos: [number, number], direccion?: string, referencia?: string) => {
      form.setValue('latitud', pos[0]);
      form.setValue('longitud', pos[1]);
    },
    [form]
  );

  const handleImageUpload = (images: File[]) => {
    setPendingImages(images);
  };

  const handleSubmit = (data: ReporteFormData) => {
    const cleanedData = {
      ...data,
      assigned_to: data.assigned_to && data.assigned_to.trim() !== '' && data.assigned_to !== 'unassigned' ? data.assigned_to : '',
      pendingImages,
    };
    
    onSubmit(cleanedData);
  };

  const mapReporte = reporte ? {
    latitud: form.watch('latitud') || reporte.latitud || 0,
    longitud: form.watch('longitud') || reporte.longitud || 0,
    titulo: form.watch('nombre') || reporte.nombre || 'Reporte',
    descripcion: form.watch('descripcion') || reporte.descripcion || '',
  } : undefined;

  const currentPriority = form.watch('priority');
  const currentImages = form.watch('imagenes') || [];
  const currentLatitud = form.watch('latitud');
  const currentLongitud = form.watch('longitud');

  const hasValidLocation = currentLatitud && currentLongitud;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {reporte ? 'Editar Reporte' : 'Nuevo Reporte'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {reporte ? 'Modifica los datos del reporte' : 'Completa la información para crear un nuevo reporte'}
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información Principal */}
              <div className="space-y-6">
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-white/20 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Información del Reporte
                    </CardTitle>
                    <CardDescription>
                      Proporciona los detalles básicos del reporte
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Reporte *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Bache en calle principal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe detalladamente el problema..."
                              className="min-h-24"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="categoria_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((categoria) => (
                                  <SelectItem key={categoria.id} value={categoria.id}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: categoria.color }}
                                      />
                                      {categoria.nombre}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estado_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {estados.map((estado) => (
                                  <SelectItem key={estado.id} value={estado.id}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: estado.color }}
                                      />
                                      {estado.nombre}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Prioridad *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar prioridad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRIORITY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      style={{ 
                                        backgroundColor: `${priorityConfig[option.value as keyof typeof priorityConfig].color}20`,
                                        color: priorityConfig[option.value as keyof typeof priorityConfig].color,
                                        borderColor: priorityConfig[option.value as keyof typeof priorityConfig].color
                                      }}
                                    >
                                      {option.label}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                          {currentPriority && (
                            <div className="mt-2">
                              <Badge
                                variant="secondary"
                                style={{ 
                                  backgroundColor: `${priorityConfig[currentPriority].color}20`,
                                  color: priorityConfig[currentPriority].color,
                                  borderColor: priorityConfig[currentPriority].color
                                }}
                              >
                                Prioridad: {priorityConfig[currentPriority].label}
                              </Badge>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assigned_to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Asignado a (Solo Administradores)
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un administrador" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unassigned">Sin asignar</SelectItem>
                              {adminUsers.map((adminUser) => {
                                const isCurrentUser = user?.id === adminUser.id;
                                
                                let displayName;
                                if (isCurrentUser) {
                                  const currentUserName = profile?.first_name && profile?.last_name 
                                    ? `${profile.first_name} ${profile.last_name}` 
                                    : user?.email;
                                  displayName = `${currentUserName} (Yo)`;
                                } else {
                                  const userName = adminUser.first_name && adminUser.last_name 
                                    ? `${adminUser.first_name} ${adminUser.last_name}` 
                                    : adminUser.email;
                                  displayName = `${userName}`;
                                }
                                
                                return (
                                  <SelectItem key={adminUser.id} value={adminUser.id}>
                                    {displayName}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Imágenes */}
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-white/20 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Evidencia Fotográfica
                    </CardTitle>
                    <CardDescription>
                      Sube imágenes que ayuden a documentar el reporte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUploader
                      images={currentImages}
                      pendingFiles={pendingImages}
                      onImagesChange={(images: string[]) => form.setValue('imagenes', images)}
                      onPendingFilesChange={handleImageUpload}
                      maxImages={10}
                      disabled={isLoading}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Ubicación */}
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-white/20 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MapPin className="h-5 w-5 text-red-600 dark:text-red-400" />
                    Ubicación del Reporte *
                  </CardTitle>
                  <CardDescription>
                    {reporte 
                      ? 'Puedes modificar la ubicación arrastrando el marcador o haciendo doble clic en el mapa.'
                      : 'Selecciona la ubicación exacta del reporte en el mapa.'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!reporte && !hasValidLocation && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-700">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Debes seleccionar una ubicación en el mapa para continuar
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="rounded-lg overflow-hidden border border-border shadow-sm">
                      {reporte ? (
                        <MapaReporteEditable
                          reporte={mapReporte}
                          onPosicionActualizada={handleMapClick}
                          height="h-[400px]"
                        />
                      ) : (
                        <MapaNuevaPosicion
                          height="h-[400px]"
                          onPosicionSeleccionada={handleNewPositionSelected}
                          initialPosition={currentLatitud && currentLongitud 
                            ? [currentLatitud, currentLongitud] 
                            : undefined}
                        />
                      )}
                    </div>
                    
                    {/* Campos ocultos para errores de ubicación */}
                    {!reporte && (
                      <div className="hidden">
                        <FormField
                          control={form.control}
                          name="latitud"
                          render={() => (
                            <FormItem>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="longitud"
                          render={() => (
                            <FormItem>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-white/20 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    type="submit" 
                    disabled={isLoading || (!reporte && !hasValidLocation)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? 'Guardando...' : reporte ? 'Actualizar Reporte' : 'Crear Reporte'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
};
