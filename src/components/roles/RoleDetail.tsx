import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useRoles } from '@/hooks/useRoles';
import { useUsers } from '@/hooks/useUsers';
import type { Role } from '@/types/roles';
import { PERMISSION_LABELS, PERMISSION_GROUPS } from '@/types/roles';
import { RolAuditoria } from './RolAuditoria';
import { RoleUsersList } from './RoleUsersList';
import { UserDetail } from '@/components/users/UserDetail';
import { 
  ArrowLeft, 
  Edit, 
  Shield, 
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Lock,
  Clock,
  FileText,
  History,
  Users,
  Settings,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect } from 'react';

interface RoleDetailProps {
  role: Role;
  onEdit: (role: Role) => void;
  onBack: () => void;
}

// Define system roles that cannot be modified
const SYSTEM_ROLES = ['Administrador', 'Usuario'];

const isSystemRole = (roleName: string): boolean => {
  return SYSTEM_ROLES.includes(roleName);
};

export const RoleDetail = ({ role: initialRole, onEdit, onBack }: RoleDetailProps) => {
  const { toggleRoleStatus, isToggling, roles } = useRoles();
  const { users } = useUsers();
  const [currentRole, setCurrentRole] = useState(initialRole);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Update currentRole when roles data changes
  useEffect(() => {
    const updatedRole = roles.find(r => r.id === initialRole.id);
    if (updatedRole) {
      setCurrentRole(updatedRole);
    }
  }, [roles, initialRole.id]);

  const handleToggleStatus = () => {
    if (isSystemRole(currentRole.nombre)) {
      return; // No allow status change for system roles
    }
    toggleRoleStatus({ id: currentRole.id, activo: !currentRole.activo });
  };

  const handleEdit = () => {
    if (isSystemRole(currentRole.nombre)) {
      return; // No allow edit for system roles
    }
    onEdit(currentRole);
  };

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleBackFromUserDetail = () => {
    setSelectedUserId(null);
  };

  const handleEditUser = (user: any) => {
    // This could be extended to handle user editing if needed
    console.log('Edit user:', user);
  };

  // If viewing user detail, show UserDetail component
  if (selectedUserId) {
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (selectedUser) {
      return (
        <UserDetail
          user={selectedUser}
          onEdit={handleEditUser}
          onBack={handleBackFromUserDetail}
        />
      );
    }
  }

  const getPermissionsByGroup = () => {
    const permissionsByGroup: Record<string, string[]> = {};
    
    Object.entries(PERMISSION_GROUPS).forEach(([groupName, permissions]) => {
      const rolePermissions = permissions.filter(permission => 
        currentRole.permisos.includes(permission)
      );
      
      if (rolePermissions.length > 0) {
        permissionsByGroup[groupName] = rolePermissions.map(p => PERMISSION_LABELS[p]);
      }
    });
    
    return permissionsByGroup;
  };

  const permissionsByGroup = getPermissionsByGroup();
  const isSystemRoleItem = isSystemRole(currentRole.nombre);

  const getStatusBadge = () => {
    if (currentRole.activo) {
      return {
        variant: "default" as const,
        icon: <CheckCircle className="h-3 w-3" />,
        text: "Activo"
      };
    } else {
      return {
        variant: "secondary" as const,
        icon: <XCircle className="h-3 w-3" />,
        text: "Inactivo"
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
            onClick={onBack}
            className="flex items-center gap-2 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Detalle del Rol</h1>
            <p className="text-sm text-muted-foreground">Información completa del rol</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isSystemRoleItem ? (
            <Button 
              onClick={handleEdit} 
              className="flex items-center gap-2 text-sm"
              size="sm"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Editar Rol</span>
              <span className="sm:hidden">Editar</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Lock className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Rol protegido del sistema</span>
              <span className="text-sm sm:hidden">Protegido</span>
            </div>
          )}
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
                    style={{ backgroundColor: currentRole.color }}
                  >
                    {currentRole.icono.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-lg sm:text-xl">{currentRole.nombre}</CardTitle>
              <p className="text-sm text-muted-foreground break-all">{currentRole.descripcion}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm break-words">{currentRole.descripcion}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Creado: {format(new Date(currentRole.created_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Actualizado: {format(new Date(currentRole.updated_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Permisos: {currentRole.permisos.length}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  Apariencia
                </h4>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: currentRole.color }}
                    />
                    <span className="text-sm font-mono">{currentRole.color}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Control de Estado del Rol */}
              <div className="space-y-3">
                <h4 className="font-medium">Estado del Rol</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={statusBadge.variant} 
                      className="flex items-center gap-1"
                    >
                      {statusBadge.icon}
                      {statusBadge.text}
                    </Badge>
                    {isSystemRoleItem && (
                      <Badge variant="secondary" className="text-xs">
                        Sistema
                      </Badge>
                    )}
                  </div>
                  
                  {!isSystemRoleItem && (
                    <Switch
                      checked={currentRole.activo}
                      onCheckedChange={handleToggleStatus}
                      disabled={isToggling}
                    />
                  )}
                </div>
              </div>

              {isSystemRoleItem && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Rol del Sistema</h4>
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <Lock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Protegido</p>
                        <p>Este rol no puede ser modificado.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información Detallada - Responsive */}
        <div className="xl:col-span-2">
          <Tabs defaultValue="permisos" className="space-y-4">
            {/* Responsive TabsList with scrollable layout */}
            <div className="overflow-x-auto">
              <TabsList className="flex w-full min-w-fit">
                <TabsTrigger value="permisos" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Permisos</span>
                </TabsTrigger>
                <TabsTrigger value="usuarios" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Usuarios</span>
                </TabsTrigger>
                <TabsTrigger value="auditoria" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <History className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Auditoría</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="permisos">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Permisos Asignados ({currentRole.permisos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(permissionsByGroup).length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Este rol no tiene permisos asignados</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(permissionsByGroup).map(([groupName, permissions]) => (
                        <div key={groupName}>
                          <h4 className="font-medium text-gray-900 mb-3">{groupName}</h4>
                          <div className="flex flex-wrap gap-2">
                            {permissions.map((permission) => (
                              <Badge key={permission} variant="secondary">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usuarios">
              <RoleUsersList role={currentRole} onViewUser={handleViewUser} />
            </TabsContent>

            <TabsContent value="auditoria">
              <RolAuditoria rolId={currentRole.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
