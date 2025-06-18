import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  History,
  UserCheck,
  Ban,
  RefreshCw,
  BarChart3,
  Users,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { User as UserType } from '@/types/users';
import { UserReportesAsignados } from './UserReportesAsignados';
import { UsuarioAuditoria } from './UsuarioAuditoria';
import { UsuarioCambiosRecibidos } from './UsuarioCambiosRecibidos';
import { UsuarioEstadisticasActividad } from './UsuarioEstadisticasActividad';
import { UserRolesList } from './UserRolesList';
import { UserPermissionsList } from './UserPermissionsList';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface UserDetailProps {
  user: UserType;
  onEdit: (user: UserType) => void;
  onBack: () => void;
}

export const UserDetail = ({ user, onEdit, onBack }: UserDetailProps) => {
  const { toggleUserStatus, isToggling, users } = useUsers();
  const { resendConfirmation } = useAuth();
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);

  // Obtener el usuario actualizado de la lista de usuarios
  const currentUser = users.find(u => u.id === user.id) || user;

  console.log('UserDetail - Current user data:', currentUser);
  console.log('UserDetail - Avatar URL:', currentUser.avatar);

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

  const getFullName = () => {
    const parts = [currentUser.first_name, currentUser.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Sin nombre';
  };

  const handleToggleStatus = () => {
    toggleUserStatus({ id: currentUser.id, asset: !currentUser.asset });
  };

  const handleActivateUser = () => {
    toggleUserStatus({ id: currentUser.id, asset: true });
  };

  const handleBlockUser = () => {
    toggleUserStatus({ id: currentUser.id, asset: null });
  };

  const handleResendConfirmation = async () => {
    setIsResendingConfirmation(true);
    
    try {
      const { error } = await resendConfirmation(currentUser.email);
      
      if (error) {
        toast({
          title: 'Error',
          description: `Error al reenviar confirmación: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Éxito',
          description: `Email de confirmación reenviado correctamente a ${currentUser.email}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Error inesperado al reenviar confirmación`,
        variant: 'destructive',
      });
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  const getStatusBadge = () => {
    if (currentUser.asset === null) {
      return {
        variant: "destructive" as const,
        icon: <XCircle className="h-3 w-3" />,
        text: "Bloqueado"
      };
    } else if (currentUser.asset) {
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
            <h1 className="text-xl sm:text-2xl font-bold">Detalle del Usuario</h1>
            <p className="text-sm text-muted-foreground">Información completa del usuario</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => onEdit(currentUser)} 
            className="flex items-center gap-2 text-sm"
            size="sm"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Editar Usuario</span>
            <span className="sm:hidden">Editar</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Información Principal - Responsive */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-16 w-16 sm:h-24 sm:w-24">
                  <AvatarImage 
                    src={currentUser.avatar || ''} 
                    alt={getFullName()}
                    onError={(e) => {
                      console.log('UserDetail - Error loading avatar:', e);
                      console.log('UserDetail - Avatar URL attempted:', currentUser.avatar);
                    }}
                    onLoad={() => {
                      console.log('UserDetail - Avatar loaded successfully:', currentUser.avatar);
                    }}
                  />
                  <AvatarFallback className="text-lg sm:text-xl">
                    {getInitials(currentUser.first_name, currentUser.last_name, currentUser.email)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-lg sm:text-xl">{getFullName()}</CardTitle>
              <p className="text-sm text-muted-foreground break-all">{currentUser.email}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm break-all">{currentUser.email}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Registrado: {format(new Date(currentUser.created_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Actualizado: {format(new Date(currentUser.updated_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  {currentUser.confirmed ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-sm">
                    {currentUser.confirmed ? 'Email confirmado' : 'Email no confirmado'}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  Tipo de Usuario
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentUser.role && currentUser.role.length > 0 ? (
                    currentUser.role.map((tipo, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tipo === 'admin' ? 'Administrador' : tipo === 'user' ? 'Usuario' : tipo}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin tipo asignado</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Control de Estado del Usuario */}
              <div className="space-y-3">
                <h4 className="font-medium">Estado del Usuario</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={statusBadge.variant} 
                      className="flex items-center gap-1"
                    >
                      {statusBadge.icon}
                      {statusBadge.text}
                    </Badge>
                  </div>
                  
                  {currentUser.asset !== null && (
                    <Switch
                      checked={currentUser.asset}
                      onCheckedChange={handleToggleStatus}
                      disabled={isToggling}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {currentUser.asset === null && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleActivateUser}
                      disabled={isToggling}
                      className="w-full"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {isToggling ? 'Desbloqueando...' : 'Desbloquear Usuario'}
                    </Button>
                  )}
                  
                  {currentUser.asset !== null && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBlockUser}
                      disabled={isToggling}
                      className="w-full"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      {isToggling ? 'Bloqueando...' : 'Bloquear Usuario'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Reenvío de Confirmación */}
              {!currentUser.confirmed && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Email no confirmado</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendConfirmation}
                      disabled={isResendingConfirmation}
                      className="w-full"
                    >
                      {isResendingConfirmation ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      {isResendingConfirmation ? 'Enviando...' : 'Reenviar Confirmación'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información Detallada - Responsive */}
        <div className="xl:col-span-2">
          <Tabs defaultValue="reportes" className="space-y-4">
            {/* Responsive TabsList with scrollable layout */}
            <div className="overflow-x-auto">
              <TabsList className="flex w-full min-w-fit">
                <TabsTrigger value="reportes" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Reportes</span>
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Roles</span>
                </TabsTrigger>
                <TabsTrigger value="permisos" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Permisos</span>
                </TabsTrigger>
                <TabsTrigger value="auditoria" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <History className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Auditoría</span>
                </TabsTrigger>
                <TabsTrigger value="cambios" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Cambios</span>
                </TabsTrigger>
                <TabsTrigger value="actividad" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Actividad</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="reportes">
              <UserReportesAsignados 
                userId={currentUser.id} 
                userName={getFullName()} 
              />
            </TabsContent>

            <TabsContent value="roles">
              <UserRolesList user={currentUser} />
            </TabsContent>

            <TabsContent value="permisos">
              <UserPermissionsList user={currentUser} />
            </TabsContent>

            <TabsContent value="auditoria">
              <UsuarioAuditoria 
                usuarioId={currentUser.id} 
                usuarioEmail={currentUser.email}
              />
            </TabsContent>

            <TabsContent value="cambios">
              <UsuarioCambiosRecibidos 
                usuarioId={currentUser.id} 
                usuarioEmail={currentUser.email}
              />
            </TabsContent>

            <TabsContent value="actividad">
              <UsuarioEstadisticasActividad 
                usuarioId={currentUser.id} 
                usuarioEmail={currentUser.email}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
