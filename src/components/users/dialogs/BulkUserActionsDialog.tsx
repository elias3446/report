
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRoles } from '@/hooks/useRoles';
import type { User } from '@/hooks/useUsers';
import { 
  Trash2,
  ToggleLeft,
  Shield,
  Users,
  AlertTriangle,
  X,
  Search,
  UserCheck,
  UserX,
  Ban,
  Crown,
  User as UserIcon
} from 'lucide-react';

export type BulkUserActionType = 'delete' | 'activate' | 'deactivate' | 'block' | 'change_roles' | 'change_user_type';

interface BulkUserActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  actionType: BulkUserActionType;
  isLoading?: boolean;
  onConfirm: (data: any) => void;
  onRemoveUser?: (userId: string) => void;
}

export const BulkUserActionsDialog: React.FC<BulkUserActionsDialogProps> = ({
  open,
  onOpenChange,
  users,
  actionType,
  isLoading = false,
  onConfirm,
  onRemoveUser,
}) => {
  const { roles } = useRoles();
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar roles activos
  const activeRoles = roles.filter(role => role.activo);
  
  // Aplicar filtro de búsqueda
  const filteredRoles = activeRoles.filter(role => {
    if (!searchTerm.trim()) return true;
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    const nameMatch = role.nombre.toLowerCase().includes(searchTermLower);
    const descriptionMatch = role.descripcion.toLowerCase().includes(searchTermLower);
    
    return nameMatch || descriptionMatch;
  });

  // Opciones de tipo de usuario
  const userTypeOptions = [
    { value: 'admin', label: 'Administrador', icon: <Crown className="h-4 w-4" />, color: 'text-red-600' },
    { value: 'user', label: 'Usuario', icon: <UserIcon className="h-4 w-4" />, color: 'text-blue-600' },
  ];

  const handleRemoveUser = (userId: string) => {
    if (onRemoveUser) {
      onRemoveUser(userId);
    }
  };

  const getUserDisplayName = (user: User) => {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleUserTypeToggle = (userType: string) => {
    setSelectedUserTypes(prev => 
      prev.includes(userType) 
        ? prev.filter(type => type !== userType)
        : [...prev, userType]
    );
  };

  const getActionConfig = () => {
    switch (actionType) {
      case 'activate':
        return {
          title: 'Activar usuarios',
          icon: <UserCheck className="h-6 w-6 text-green-500" />,
          description: `Activar ${users.length} usuario${users.length !== 1 ? 's' : ''}. Los usuarios podrán acceder al sistema.`,
          confirmText: 'Activar',
          variant: 'default' as const
        };
      case 'deactivate':
        return {
          title: 'Desactivar usuarios',
          icon: <UserX className="h-6 w-6 text-orange-500" />,
          description: `Desactivar ${users.length} usuario${users.length !== 1 ? 's' : ''}. Los usuarios no podrán acceder al sistema pero seguirán siendo visibles.`,
          confirmText: 'Desactivar',
          variant: 'default' as const
        };
      case 'block':
        return {
          title: 'Bloquear usuarios',
          icon: <Ban className="h-6 w-6 text-red-500" />,
          description: `Bloquear ${users.length} usuario${users.length !== 1 ? 's' : ''}. Los usuarios quedarán completamente bloqueados del sistema.`,
          confirmText: 'Bloquear',
          variant: 'destructive' as const
        };
      case 'delete':
        return {
          title: 'Eliminar usuarios',
          icon: <Trash2 className="h-6 w-6 text-red-500" />,
          description: `Esta acción eliminará ${users.length} usuario${users.length !== 1 ? 's' : ''} de forma permanente. Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          variant: 'destructive' as const
        };
      case 'change_roles':
        return {
          title: 'Cambiar roles',
          icon: <Shield className="h-6 w-6 text-purple-500" />,
          description: `Asignar nuevos roles a ${users.length} usuario${users.length !== 1 ? 's' : ''}.`,
          confirmText: 'Cambiar Roles',
          variant: 'default' as const
        };
      case 'change_user_type':
        return {
          title: 'Cambiar tipo de usuario',
          icon: <Crown className="h-6 w-6 text-indigo-500" />,
          description: `Cambiar el tipo de usuario de ${users.length} usuario${users.length !== 1 ? 's' : ''}.`,
          confirmText: 'Cambiar Tipo',
          variant: 'default' as const
        };
      default:
        return {
          title: 'Acción masiva',
          icon: <Users className="h-6 w-6" />,
          description: 'Acción no reconocida',
          confirmText: 'Confirmar',
          variant: 'default' as const
        };
    }
  };

  const config = getActionConfig();

  const handleConfirm = () => {
    let data: any = {};
    
    switch (actionType) {
      case 'activate':
        data.asset = true;
        break;
      case 'deactivate':
        data.asset = false;
        break;
      case 'block':
        data.asset = null;
        break;
      case 'change_roles':
        data.roleIds = selectedRoleIds;
        break;
      case 'change_user_type':
        data.userTypes = selectedUserTypes;
        break;
    }
    
    onConfirm(data);
  };

  const isFormValid = () => {
    switch (actionType) {
      case 'change_roles':
        return selectedRoleIds.length > 0;
      case 'change_user_type':
        return selectedUserTypes.length > 0;
      default:
        return true;
    }
  };

  // Helper function to get user status display
  const getUserStatusDisplay = (user: User) => {
    if (user.asset === null) return { text: 'Bloqueado', color: 'text-red-600' };
    if (user.asset === true) return { text: 'Activo', color: 'text-green-600' };
    return { text: 'Inactivo', color: 'text-gray-600' };
  };

  // Helper function to get user type display
  const getUserTypeDisplay = (user: User) => {
    const userRoles = user.role || ['user'];
    const hasAdmin = userRoles.includes('admin');
    const hasUser = userRoles.includes('user');
    
    if (hasAdmin && hasUser) {
      return { text: 'Admin + Usuario', color: 'text-red-600', icon: <Crown className="h-3 w-3" /> };
    } else if (hasAdmin) {
      return { text: 'Administrador', color: 'text-red-600', icon: <Crown className="h-3 w-3" /> };
    } else {
      return { text: 'Usuario', color: 'text-blue-600', icon: <UserIcon className="h-3 w-3" /> };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {config.icon}
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Usuarios afectados */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuario{users.length !== 1 ? 's' : ''} afectado{users.length !== 1 ? 's' : ''} ({users.length}):
            </p>
            <ScrollArea className="h-28 border rounded-md p-3 bg-gray-50">
              <div className="space-y-2">
                {users.map((user) => {
                  const statusDisplay = getUserStatusDisplay(user);
                  const typeDisplay = getUserTypeDisplay(user);
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {getUserDisplayName(user).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium truncate">{getUserDisplayName(user)}</span>
                        <span className="text-gray-500 text-xs truncate">({user.email})</span>
                        <span className={`text-xs flex-shrink-0 ${statusDisplay.color}`}>
                          {statusDisplay.text}
                        </span>
                        <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${typeDisplay.color}`}>
                          {typeDisplay.icon}
                          <span>{typeDisplay.text}</span>
                        </div>
                      </div>
                      {onRemoveUser && users.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 flex-shrink-0"
                          onClick={() => handleRemoveUser(user.id)}
                          title="Eliminar de la selección"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Formulario específico según la acción */}
          {actionType === 'change_user_type' && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium mb-3">
                Seleccionar tipos de usuario:
              </p>
              
              <div className="space-y-3">
                {userTypeOptions.map((option) => (
                  <div key={option.value} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id={`user-type-${option.value}`}
                      checked={selectedUserTypes.includes(option.value)}
                      onCheckedChange={() => handleUserTypeToggle(option.value)}
                    />
                    <label 
                      htmlFor={`user-type-${option.value}`}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <div className={`flex items-center gap-2 ${option.color}`}>
                        {option.icon}
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Tipos seleccionados */}
              {selectedUserTypes.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    Tipos seleccionados ({selectedUserTypes.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUserTypes.map((userType) => {
                      const option = userTypeOptions.find(opt => opt.value === userType);
                      return option ? (
                        <Badge 
                          key={userType} 
                          variant="secondary"
                          className="flex items-center gap-1 text-xs"
                        >
                          {option.icon}
                          {option.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Información sobre tipos de usuario */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-2">Información sobre tipos de usuario:</p>
                  <ul className="space-y-1 text-xs">
                    <li><strong>Administrador:</strong> Acceso completo al sistema</li>
                    <li><strong>Usuario:</strong> Acceso básico al sistema</li>
                    <li><strong>Ambos:</strong> El usuario tendrá privilegios de administrador y usuario</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Formulario para cambio de roles (código existente) */}
          {actionType === 'change_roles' && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium mb-3">
                Seleccionar nuevos roles:
              </p>
              
              {/* Barra de búsqueda */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar roles por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-56 border rounded-md p-3 bg-white">
                <div className="space-y-4">
                  {filteredRoles.length > 0 ? (
                    filteredRoles.map((role) => (
                      <div key={role.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={selectedRoleIds.includes(role.id)}
                          onCheckedChange={() => handleRoleToggle(role.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <label 
                            htmlFor={`role-${role.id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
                              style={{ backgroundColor: role.color }}
                            >
                              {role.icono.charAt(0)}
                            </div>
                            <span className="font-medium text-sm">{role.nombre}</span>
                          </label>
                          <p className="text-xs text-gray-600 leading-relaxed">{role.descripcion}</p>
                          <div className="flex flex-wrap gap-1">
                            {role.permisos.slice(0, 3).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs h-5">
                                {permission.replace('_', ' ')}
                              </Badge>
                            ))}
                            {role.permisos.length > 3 && (
                              <Badge variant="outline" className="text-xs h-5">
                                +{role.permisos.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">
                        {searchTerm.trim() 
                          ? `No se encontraron roles con "${searchTerm}"`
                          : 'No hay roles disponibles'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Roles seleccionados */}
              {selectedRoleIds.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">
                    Roles seleccionados ({selectedRoleIds.length}):
                  </p>
                  <ScrollArea className="max-h-20">
                    <div className="flex flex-wrap gap-2">
                      {selectedRoleIds.map((roleId) => {
                        const role = activeRoles.find(r => r.id === roleId);
                        return role ? (
                          <Badge 
                            key={roleId} 
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: role.color + '20', color: role.color }}
                          >
                            {role.nombre}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* Advertencia para eliminación */}
          {actionType === 'delete' && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">¡Advertencia!</p>
                <p>Esta acción no se puede deshacer. Los usuarios eliminados no se podrán recuperar.</p>
              </div>
            </div>
          )}

          {/* Información sobre acciones de estado */}
          {(actionType === 'activate' || actionType === 'deactivate' || actionType === 'block') && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              {actionType === 'activate' && <UserCheck className="h-5 w-5 text-green-500 mt-0.5" />}
              {actionType === 'deactivate' && <UserX className="h-5 w-5 text-orange-500 mt-0.5" />}
              {actionType === 'block' && <Ban className="h-5 w-5 text-red-500 mt-0.5" />}
              <div className="text-sm text-blue-700">
                {actionType === 'activate' && (
                  <>
                    <p className="font-medium">Activar usuarios:</p>
                    <p>Los usuarios podrán acceder al sistema y aparecerán en todas las asignaciones.</p>
                  </>
                )}
                {actionType === 'deactivate' && (
                  <>
                    <p className="font-medium">Desactivar usuarios:</p>
                    <p>Los usuarios no podrán acceder al sistema pero seguirán siendo visibles para asignaciones.</p>
                  </>
                )}
                {actionType === 'block' && (
                  <>
                    <p className="font-medium">Bloquear usuarios:</p>
                    <p>Los usuarios quedarán completamente bloqueados del sistema y no aparecerán en asignaciones.</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !isFormValid() || users.length === 0}
            variant={config.variant}
          >
            {isLoading ? 'Procesando...' : config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
