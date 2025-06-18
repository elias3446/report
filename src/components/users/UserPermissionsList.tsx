
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserRoles } from '@/hooks/useUserRoles';
import { 
  Shield, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PERMISSION_LABELS, PERMISSION_GROUPS, type PermissionEnum } from '@/types/roles';
import type { User } from '@/types/users';

interface UserPermissionsListProps {
  user: User;
}

export const UserPermissionsList: React.FC<UserPermissionsListProps> = ({ user }) => {
  const { getUserRoles } = useUserRoles();
  const { data: userRoles = [], isLoading } = getUserRoles(user.id);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permisos del Usuario
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

  // Consolidar todos los permisos únicos del usuario
  const allPermissions = new Set<PermissionEnum>();
  userRoles.forEach(userRole => {
    if (userRole.roles?.permisos) {
      userRole.roles.permisos.forEach(permiso => {
        allPermissions.add(permiso as PermissionEnum);
      });
    }
  });

  const permissionsArray = Array.from(allPermissions);

  const getPermissionColor = (permission: PermissionEnum) => {
    if (permission.includes('ver')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (permission.includes('crear')) return 'bg-green-100 text-green-800 border-green-200';
    if (permission.includes('editar')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (permission.includes('eliminar')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permisos Consolidados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {permissionsArray.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(PERMISSION_GROUPS).map(([grupo, permisos]) => {
              const permisosDelGrupo = permisos.filter(p => allPermissions.has(p as PermissionEnum));
              
              if (permisosDelGrupo.length === 0) return null;

              return (
                <div key={grupo} className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {grupo}
                  </h4>
                  <div className="flex flex-wrap gap-2 ml-6">
                    {permisosDelGrupo.map((permiso) => (
                      <Badge 
                        key={permiso} 
                        variant="outline" 
                        className={`${getPermissionColor(permiso as PermissionEnum)} text-xs`}
                      >
                        {PERMISSION_LABELS[permiso as PermissionEnum] || permiso}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>No tiene permisos asignados</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
