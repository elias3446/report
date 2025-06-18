
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
import type { Category, CreateCategoryData, UpdateCategoryData } from '@/types/categories';
import { Palette, Type, Lock } from 'lucide-react';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CreateCategoryData | UpdateCategoryData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const COLOR_OPTIONS = [
  '#DC2626', '#EA580C', '#D97706', '#65A30D', 
  '#059669', '#0891B2', '#2563EB', '#7C3AED', 
  '#C026D3', '#DB2777', '#6B7280', '#374151'
];

// Define system categories that cannot be modified
const SYSTEM_CATEGORIES = ['Sin categoría'];

const isSystemCategory = (categoryName: string): boolean => {
  return SYSTEM_CATEGORIES.includes(categoryName);
};

export const CategoryForm = ({ category, onSubmit, onCancel, isLoading = false }: CategoryFormProps) => {
  const [formData, setFormData] = useState<CreateCategoryData>({
    nombre: '',
    descripcion: '',
    activo: true,
    color: '#2563EB',
    icono: 'Folder',
  });
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const isSystemCategoryItem = category ? isSystemCategory(category.nombre) : false;

  useEffect(() => {
    if (category) {
      setFormData({
        nombre: category.nombre,
        descripcion: category.descripcion,
        activo: category.activo,
        color: category.color,
        icono: category.icono,
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSystemCategoryItem) {
      return; // Prevent form submission for system categories
    }
    
    if (category) {
      onSubmit({ id: category.id, ...formData } as UpdateCategoryData);
    } else {
      onSubmit(formData);
    }
  };

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icono: iconName }));
  };

  // Obtener el componente del icono seleccionado
  const SelectedIcon = Icons[formData.icono];

  if (isSystemCategoryItem) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-500" />
            Categoría Protegida del Sistema
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <Lock className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Esta categoría no puede ser editada</p>
              <p>"{category?.nombre}" es una categoría del sistema protegida y no puede ser modificada o eliminada.</p>
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
          {category ? 'Editar Categoría' : 'Crear Nueva Categoría'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información básica */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Categoría</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Infraestructura, Servicios"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción detallada de la categoría"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))}
                />
                <Label htmlFor="activo">Categoría activa</Label>
              </div>
            </div>

            {/* Personalización visual */}
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4" />
                  Color de la Categoría
                </Label>
                <div className="grid grid-cols-6 gap-2">
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
                  Icono de la Categoría
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
                <h3 className="font-medium">{formData.nombre || 'Nombre de la categoría'}</h3>
                <p className="text-sm text-gray-600">{formData.descripcion || 'Descripción de la categoría'}</p>
              </div>
              <Badge variant={formData.activo ? "default" : "secondary"}>
                {formData.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Guardando...' : (category ? 'Actualizar Categoría' : 'Crear Categoría')}
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
