
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  User,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Trash2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserRoles } from '@/hooks/useUserRoles';
import type { Role } from '@/types/roles';

interface RoleUsersListProps {
  role: Role;
  onViewUser?: (userId: string) => void;
}

export const RoleUsersList: React.FC<RoleUsersListProps> = ({ role, onViewUser }) => {
  const { userRoles, isLoading, removeRole, isRemoving } = useUserRoles();

  // Filtrar usuarios que tienen este rol específico
  const usersWithRole = userRoles.filter(userRole => userRole.role_id === role.id);

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getFullName = (userRole: any) => {
    const profile = userRole.user_profile;
    if (!profile) return 'Usuario sin perfil';
    
    const parts = [profile.first_name, profile.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Sin nombre';
  };

  const handleRemoveRole = (userId: string) => {
    removeRole({ userId, roleId: role.id });
  };

  const handleViewUser = (userId: string) => {
    if (onViewUser) {
      onViewUser(userId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios con este Rol
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usuarios con este Rol ({usersWithRole.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {usersWithRole.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No hay usuarios asignados
            </p>
            <p className="text-sm text-muted-foreground">
              Este rol no está asignado a ningún usuario actualmente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {usersWithRole.map((userRole) => {
              const profile = userRole.user_profile;
              const assignedBy = userRole.assigned_by_profile;
              
              return (
                <div 
                  key={userRole.id} 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={getFullName(userRole)} />
                      <AvatarFallback>
                        {getInitials(profile?.first_name, profile?.last_name, profile?.email)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h4 className="font-medium truncate">
                          {getFullName(userRole)}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            Usuario
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{profile?.email || 'Sin email'}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Asignado: {format(new Date(userRole.assigned_at), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>
                        
                        {assignedBy && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>
                              Por: {assignedBy.first_name && assignedBy.last_name 
                                ? `${assignedBy.first_name} ${assignedBy.last_name}` 
                                : assignedBy.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewUser(userRole.user_id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveRole(userRole.user_id)}
                      disabled={isRemoving}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {isRemoving ? 'Removiendo...' : 'Remover'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
