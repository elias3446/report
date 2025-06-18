
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconPicker } from '@/components/icons/IconPicker';
import { Icons } from '@/components/icons/Icons';
import type { Estado } from '@/types/estados';
import { Palette, Type, Lock } from 'lucide-react';

interface EstadoFormProps {
  estado?: Estado;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const COLOR_OPTIONS = [
  '#10B981', '#059669', '#047857', '#065F46', 
  '#6366F1', '#4F46E5', '#4338CA', '#3730A3', 
  '#F59E0B', '#D97706', '#B45309', '#92400E',
  '#EF4444', '#DC2626', '#B91C1C', '#991B1B'
];

// Define system estados that cannot be modified
const SYSTEM_ESTADOS = ['Sin estado'];

const isSystemEstado = (estadoName: string): boolean => {
  return SYSTEM_ESTADOS.includes(estadoName);
};

export const EstadoForm = ({ estado, onSubmit, onCancel, isLoading = false }: EstadoFormProps) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
    color: '#10B981',
    icono: 'Circle',
  });
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const isSystemEstadoItem = estado ? isSystemEstado(estado.nombre) : false;

  useEffect(() => {
    if (estado) {
      setFormData({
        nombre: estado.nombre,
        descripcion: estado.descripcion,
        activo: estado.activo,
        color: estado.color,
        icono: estado.icono,
      });
    }
  }, [estado]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSystemEstadoItem) {
      return; // Prevent form submission for system estados
    }
    onSubmit(formData);
  };

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icono: iconName }));
  };

  // Obtener el componente del icono seleccionado
  const SelectedIcon = Icons[formData.icono];

  if (isSystemEstadoItem) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-500" />
            Estado Protegido del Sistema
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <Lock className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Este estado no puede ser editado</p>
              <p>"{estado?.nombre}" es un estado del sistema protegido y no puede ser modificado o eliminado.</p>
            </div>
          </div>
          
          <div className="mt-6">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full">
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
            style={{ backgroundColor: formData.color }}
          >
            {SelectedIcon && <SelectedIcon className="w-5 h-5" />}
          </div>
          {estado ? 'Editar Estado' : 'Crear Nuevo Estado'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información básica */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre del Estado</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Pendiente, En proceso, Completado"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción detallada del estado y su propósito"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))}
                />
                <Label htmlFor="activo">Estado activo</Label>
              </div>
            </div>

            {/* Personalización visual */}
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4" />
                  Color del Estado
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Type className="w-4 h-4" />
                  Icono del Estado
                </Label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIconPickerOpen(true)}
                    className="w-full justify-start"
                  >
                    <div className="flex items-center gap-2">
                      {SelectedIcon && <SelectedIcon className="w-4 h-4" />}
                      <span>{formData.icono}</span>
                    </div>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Haz clic para seleccionar un icono
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vista previa */}
          <div>
            <Label className="text-base font-medium mb-2 block">Vista Previa</Label>
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: formData.color }}
              >
                {SelectedIcon && <SelectedIcon className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{formData.nombre || 'Nombre del estado'}</h3>
                <p className="text-sm text-gray-600">{formData.descripcion || 'Descripción del estado'}</p>
              </div>
              <Badge variant={formData.activo ? "default" : "secondary"}>
                {formData.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Guardando...' : (estado ? 'Actualizar Estado' : 'Crear Estado')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>

        {/* IconPicker Dialog */}
        <IconPicker
          open={iconPickerOpen}
          onOpenChange={setIconPickerOpen}
          onSelect={handleIconSelect}
        />
      </CardContent>
    </Card>
  );
};
