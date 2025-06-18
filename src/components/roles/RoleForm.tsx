
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconPicker } from '@/components/icons/IconPicker';
import { Icons } from '@/components/icons/Icons';
import type { Role, CreateRoleData, UpdateRoleData, PermissionEnum } from '@/types/roles';
import { PERMISSION_LABELS, PERMISSION_GROUPS } from '@/types/roles';
import { Palette, Type } from 'lucide-react';

interface RoleFormProps {
  role?: Role;
  onSubmit: (data: CreateRoleData | UpdateRoleData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const COLOR_OPTIONS = [
  '#DC2626', '#EA580C', '#D97706', '#65A30D', 
  '#059669', '#0891B2', '#2563EB', '#7C3AED', 
  '#C026D3', '#DB2777', '#6B7280', '#374151'
];

export const RoleForm = ({ role, onSubmit, onCancel, isLoading = false }: RoleFormProps) => {
  const [formData, setFormData] = useState<CreateRoleData>({
    nombre: '',
    descripcion: '',
    permisos: [],
    activo: true,
    color: '#2563EB',
    icono: 'Shield',
  });
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData({
        nombre: role.nombre,
        descripcion: role.descripcion,
        permisos: role.permisos,
        activo: role.activo,
        color: role.color,
        icono: role.icono,
      });
    }
  }, [role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) {
      onSubmit({ id: role.id, ...formData } as UpdateRoleData);
    } else {
      onSubmit(formData);
    }
  };

  const handlePermissionChange = (permission: PermissionEnum, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permisos: checked 
        ? [...prev.permisos, permission]
        : prev.permisos.filter(p => p !== permission)
    }));
  };

  const toggleGroupPermissions = (groupPermissions: readonly string[], allSelected: boolean) => {
    setFormData(prev => ({
      ...prev,
      permisos: allSelected
        ? prev.permisos.filter(p => !groupPermissions.includes(p))
        : [...new Set([...prev.permisos, ...groupPermissions as PermissionEnum[]])]
    }));
  };

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icono: iconName }));
  };

  // Obtener el componente del icono seleccionado
  const SelectedIcon = Icons[formData.icono];

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
            style={{ backgroundColor: formData.color }}
          >
            {SelectedIcon && <SelectedIcon className="w-5 h-5" />}
          </div>
          {role ? 'Editar Rol' : 'Crear Nuevo Rol'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información básica */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre del Rol</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Editor, Moderador"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción detallada del rol y sus responsabilidades"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))}
                />
                <Label htmlFor="activo">Rol activo</Label>
              </div>
            </div>

            {/* Personalización visual */}
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4" />
                  Color del Rol
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
                  Icono del Rol
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

          {/* Permisos */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">Permisos del Rol</Label>
            <div className="space-y-4">
              {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => {
                const groupPermissions = permissions as readonly PermissionEnum[];
                const allSelected = groupPermissions.every(p => formData.permisos.includes(p));
                const someSelected = groupPermissions.some(p => formData.permisos.includes(p));

                return (
                  <Card key={group} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">{group}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleGroupPermissions(groupPermissions, allSelected)}
                        >
                          {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupPermissions.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={formData.permisos.includes(permission)}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(permission, checked as boolean)
                              }
                            />
                            <Label 
                              htmlFor={permission}
                              className="text-sm cursor-pointer"
                            >
                              {PERMISSION_LABELS[permission]}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
                <h3 className="font-medium">{formData.nombre || 'Nombre del rol'}</h3>
                <p className="text-sm text-gray-600">{formData.descripcion || 'Descripción del rol'}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.permisos.slice(0, 3).map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {PERMISSION_LABELS[permission]}
                    </Badge>
                  ))}
                  {formData.permisos.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{formData.permisos.length - 3} más
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant={formData.activo ? "default" : "secondary"}>
                {formData.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Guardando...' : (role ? 'Actualizar Rol' : 'Crear Rol')}
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
