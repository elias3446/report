
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/hooks/useCategories';
import { useEstados } from '@/hooks/useEstados';
import { ImageUploader } from './ImageUploader';
import MapaNuevaPosicion from '@/components/MapaBase/MapaNuevaPosicion';
import { ArrowLeft, Save, X, FileText, MapPin, AlertTriangle } from 'lucide-react';

const reporteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  categoria_id: z.string().min(1, 'La categoría es requerida'),
  estado_id: z.string().min(1, 'El estado es requerido'),
  longitud: z.number({ required_error: 'La ubicación es requerida' }),
  latitud: z.number({ required_error: 'La ubicación es requerida' }),
  direccion: z.string().min(1, 'La dirección es requerida'),
  referencia_direccion: z.string().optional(),
  imagenes: z.array(z.string()).optional(),
  priority: z.enum(['alto', 'medio', 'bajo', 'urgente']).optional(),
});

type NuevoReporteFormData = z.infer<typeof reporteSchema>;

interface NuevoReporteScreenProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const priorityConfig = {
  urgente: { color: '#DC2626', label: 'Urgente' },
  alto: { color: '#EA580C', label: 'Alto' },
  medio: { color: '#D97706', label: 'Medio' },
  bajo: { color: '#059669', label: 'Bajo' },
};

export const NuevoReporteScreen = ({ onSubmit, onCancel, isLoading }: NuevoReporteScreenProps) => {
  const { categories } = useCategories();
  const { estados } = useEstados();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const form = useForm<NuevoReporteFormData>({
    resolver: zodResolver(reporteSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      categoria_id: '',
      estado_id: '',
      longitud: undefined,
      latitud: undefined,
      direccion: '',
      referencia_direccion: '',
      imagenes: [],
      priority: 'urgente',
    },
  });

  const handleSubmit = async (data: NuevoReporteFormData) => {
    try {
      const submitData = { 
        ...data,
        pendingImages: pendingFiles,
        priority: data.priority || 'urgente',
      };
      
      onSubmit(submitData);
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  const handlePosicionSeleccionada = (pos: [number, number], direccion?: string, referencia?: string) => {
    form.setValue('latitud', pos[0]);
    form.setValue('longitud', pos[1]);
    if (direccion) {
      form.setValue('direccion', direccion);
    }
    if (referencia) {
      form.setValue('referencia_direccion', referencia);
    }
  };

  const handleImagesChange = (newImages: string[]) => {
    form.setValue('imagenes', newImages);
  };

  const currentImages = form.watch('imagenes') || [];
  const currentPriority = form.watch('priority');
  const currentLatitud = form.watch('latitud');
  const currentLongitud = form.watch('longitud');
  const currentDireccion = form.watch('direccion');

  const hasValidLocation = currentLatitud && currentLongitud && currentDireccion;

  return (
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
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Nuevo Reporte</h1>
            <p className="text-gray-600">
              Completa la información para crear un nuevo reporte
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información Principal */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Reporte</CardTitle>
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
                          {Object.entries(priorityConfig).map(([value, config]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  style={{ 
                                    backgroundColor: `${config.color}20`,
                                    color: config.color,
                                    borderColor: config.color
                                  }}
                                >
                                  {config.label}
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

                <ImageUploader
                  images={currentImages}
                  pendingFiles={pendingFiles}
                  onImagesChange={handleImagesChange}
                  onPendingFilesChange={setPendingFiles}
                  maxImages={10}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>

            {/* Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación del Reporte *
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Selecciona la ubicación exacta del reporte en el mapa.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!hasValidLocation && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Debes seleccionar una ubicación en el mapa para continuar
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <MapaNuevaPosicion
                    height="h-[400px]"
                    onPosicionSeleccionada={handlePosicionSeleccionada}
                  />
                  
                  {/* Mostrar errores de ubicación ocultos */}
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
                    <FormField
                      control={form.control}
                      name="direccion"
                      render={() => (
                        <FormItem>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              disabled={isLoading || !hasValidLocation}
              className="flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Creando...' : 'Crear Reporte'}
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
        </form>
      </Form>
    </div>
  );
};
