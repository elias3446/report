
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, MapPin } from 'lucide-react';
import { useReportes } from '@/hooks/useReportes';
import { useCategories } from '@/hooks/useCategories';
import { useEstados } from '@/hooks/useEstados';
import { toast } from '@/hooks/use-toast';
import type { CreateReporteData } from '@/types/reportes';

const quickReporteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  categoria_id: z.string().min(1, 'Selecciona una categoría'),
  estado_id: z.string().min(1, 'Selecciona un estado'),
  direccion: z.string().optional(),
  priority: z.enum(['alto', 'medio', 'bajo', 'urgente']).default('medio'),
});

type QuickReporteFormData = z.infer<typeof quickReporteSchema>;

export const QuickReporteForm = () => {
  const [open, setOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const { createReporte, isCreating } = useReportes();
  const { categories } = useCategories();
  const { estados } = useEstados();

  const form = useForm<QuickReporteFormData>({
    resolver: zodResolver(quickReporteSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      categoria_id: '',
      estado_id: '',
      direccion: '',
      priority: 'medio',
    },
  });

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalización no disponible",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding para obtener la dirección
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.display_name) {
            form.setValue('direccion', data.display_name);
            toast({
              title: "Ubicación obtenida",
              description: "Se ha establecido tu ubicación actual",
            });
          }
        } catch (error) {
          console.error('Error getting address:', error);
          form.setValue('direccion', `${latitude}, ${longitude}`);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
        toast({
          title: "Error de ubicación",
          description: "No se pudo obtener tu ubicación actual",
          variant: "destructive",
        });
      }
    );
  };

  const onSubmit = async (data: QuickReporteFormData) => {
    try {
      // Convert form data to CreateReporteData format
      const reporteData: CreateReporteData = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria_id: data.categoria_id,
        estado_id: data.estado_id,
        direccion: data.direccion || undefined,
        priority: data.priority,
      };

      await createReporte(reporteData);
      toast({
        title: "Reporte creado",
        description: "El reporte se ha creado exitosamente",
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error creating reporte:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el reporte",
        variant: "destructive",
      });
    }
  };

  const activeCategories = categories?.filter(cat => !cat.deleted_at) || [];
  const activeEstados = estados?.filter(estado => !estado.deleted_at) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Reporte</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Reporte</DialogTitle>
          <DialogDescription>
            Crea un reporte rápido con la información básica necesaria.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Reporte *</Label>
              <Input
                id="nombre"
                {...form.register('nombre')}
                placeholder="Ej: Bache en la calle principal"
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={form.watch('priority')}
                onValueChange={(value) => form.setValue('priority', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="bajo">Bajo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              {...form.register('descripcion')}
              placeholder="Describe el problema o situación a reportar..."
              rows={3}
            />
            {form.formState.errors.descripcion && (
              <p className="text-sm text-destructive">
                {form.formState.errors.descripcion.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select
                value={form.watch('categoria_id')}
                onValueChange={(value) => form.setValue('categoria_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {activeCategories.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoria_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.categoria_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select
                value={form.watch('estado_id')}
                onValueChange={(value) => form.setValue('estado_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  {activeEstados.map((estado) => (
                    <SelectItem key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.estado_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.estado_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <div className="flex space-x-2">
              <Input
                id="direccion"
                {...form.register('direccion')}
                placeholder="Dirección del incidente (opcional)"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Reporte'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
