
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRoles } from '@/hooks/useRoles';
import { 
  Shield, 
  Users, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { PERMISSION_LABELS, PERMISSION_GROUPS } from '@/types/roles';
import type { User } from '@/types/users';

interface UserRolesListProps {
  user: User;
}

export const UserRolesList: React.FC<UserRolesListProps> = ({ user }) => {
  const { getUserRoles } = useUserRoles();
  const { roles: availableRoles } = useRoles();
  const { assignRole, removeRole, isAssigning, isRemoving } = useUserRoles();

  const { data: userRoles = [], isLoading } = getUserRoles(user.id);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles del Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAssignRole = (roleId: string) => {
    assignRole({ userId: user.id, roleId });
  };

  const handleRemoveRole = (roleId: string) => {
    removeRole({ userId: user.id, roleId });
  };

  const assignedRoleIds = userRoles.map(ur => ur.role_id);
  const unassignedRoles = availableRoles.filter(
    role => !assignedRoleIds.includes(role.id) && role.activo
  );

  return (
    <div className="space-y-6">
      {/* Roles asignados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles Asignados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userRoles.length > 0 ? (
            <div className="space-y-4">
              {userRoles.map((userRole) => (
                <div key={userRole.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: userRole.roles?.color || '#6B7280' }}
                      />
                      <div>
                        <h4 className="font-semibold">{userRole.roles?.nombre}</h4>
                        <p className="text-sm text-muted-foreground">
                          {userRole.roles?.descripcion}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveRole(userRole.role_id)}
                      disabled={isRemoving}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {userRole.roles?.permisos && userRole.roles.permisos.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Permisos:</h5>
                      <div className="flex flex-wrap gap-1">
                        {userRole.roles.permisos.map((permiso) => (
                          <Badge key={permiso} variant="secondary" className="text-xs">
                            {PERMISSION_LABELS[permiso] || permiso}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No tiene roles asignados</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles disponibles para asignar */}
      {unassignedRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Roles Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unassignedRoles.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <div>
                      <h4 className="font-medium">{role.nombre}</h4>
                      <p className="text-sm text-muted-foreground">{role.descripcion}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssignRole(role.id)}
                    disabled={isAssigning}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Asignar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
