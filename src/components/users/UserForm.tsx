
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useRoles } from '@/hooks/useRoles';
import type { User, CreateUserData, UpdateUserData } from '@/hooks/useUsers';
import { ArrowLeft, User as UserIcon, Save, X } from 'lucide-react';
import { isValidEmail } from '@/utils/validations';

// Esquema de validación actualizado para incluir el tipo de usuario básico
const createUserSchema = z.object({
  email: z.string()
    .min(1, 'El email es requerido')
    .refine((email) => isValidEmail(email), {
      message: 'Debe ser un email válido según RFC 5322'
    }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  user_type: z.enum(['user', 'admin', 'both'], {
    required_error: 'Debe seleccionar un tipo de usuario'
  }),
  role_ids: z.array(z.string()).min(1, 'Debe seleccionar al menos un rol'),
});

const updateUserSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  user_type: z.enum(['user', 'admin', 'both'], {
    required_error: 'Debe seleccionar un tipo de usuario'
  }),
  role_ids: z.array(z.string()).min(1, 'Debe seleccionar al menos un rol'),
  asset: z.boolean().optional(),
});

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

interface UserFormProps {
  user?: User;
  onSubmit: (data: CreateUserData | UpdateUserData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const UserForm = ({ user, onSubmit, onCancel, isLoading }: UserFormProps) => {
  const { roles } = useRoles();
  const isEditing = !!user;
  
  // Determinar el tipo de usuario desde el array role
  const getUserType = (userRoles: string[]) => {
    const hasAdmin = userRoles.includes('admin');
    const hasUser = userRoles.includes('user');
    
    if (hasAdmin && hasUser) return 'both';
    if (hasAdmin) return 'admin';
    return 'user';
  };
  
  const form = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: isEditing ? {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      user_type: getUserType(user?.role || []),
      role_ids: user?.user_roles?.map(ur => ur.role_id) || [],
      asset: user?.asset || false,
    } : {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      user_type: 'user',
      role_ids: [],
    },
  });

  const activeRoles = roles.filter(role => role.activo && !role.deleted_at);

  const handleSubmit = (data: CreateFormData | UpdateFormData) => {
    // Transformar user_type al formato esperado por el backend
    let roleArray: string[];
    
    switch (data.user_type) {
      case 'admin':
        roleArray = ['admin'];
        break;
      case 'both':
        roleArray = ['admin', 'user'];
        break;
      case 'user':
      default:
        roleArray = ['user'];
        break;
    }
    
    const transformedData = {
      ...data,
      role: roleArray // Agregar el campo role para profiles
    };
    
    // Remover user_type del objeto final ya que no existe en la BD
    const { user_type, ...finalData } = transformedData;
    
    if (isEditing) {
      onSubmit({ id: user!.id, ...finalData } as UpdateUserData);
    } else {
      onSubmit(finalData as CreateUserData);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Usuarios
        </Button>
        
        <div className="flex items-center gap-3">
          <UserIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h1>
            <p className="text-gray-600">
              {isEditing 
                ? 'Modifica la información del usuario y sus roles asignados'
                : 'Completa los datos para crear un nuevo usuario en el sistema'
              }
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Información del Usuario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ingresa el nombre" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ingresa el apellido" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {!isEditing && (
                    <>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="usuario@ejemplo.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña *</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Mínimo 6 caracteres" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="user_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Usuario *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo de usuario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <div>
                                  <div className="font-medium">Usuario</div>
                                  <div className="text-xs text-gray-600">Usuario estándar del sistema</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div>
                                  <div className="font-medium">Administrador</div>
                                  <div className="text-xs text-gray-600">Usuario con privilegios administrativos</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="both">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                </div>
                                <div>
                                  <div className="font-medium">Usuario y Administrador</div>
                                  <div className="text-xs text-gray-600">Ambos permisos: usuario y admin</div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isEditing && (
                    <FormField
                      control={form.control}
                      name="asset"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Usuario Activo</FormLabel>
                            <p className="text-sm text-gray-600">
                              El usuario puede acceder al sistema cuando está activo
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Roles del Usuario</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="role_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seleccionar Roles *</FormLabel>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {activeRoles.map((role) => (
                          <div key={role.id} className="flex items-start space-x-3">
                            <Checkbox
                              checked={field.value?.includes(role.id)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, role.id]);
                                } else {
                                  field.onChange(current.filter(id => id !== role.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: role.color }}
                                />
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  {role.nombre}
                                </label>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {role.descripcion}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {role.permisos.length} permisos asignados
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="flex items-center gap-2"
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
