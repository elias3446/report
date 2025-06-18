import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit,
  FileText,
  BarChart3,
  Activity,
  History
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UsuarioLogueadoEdit } from './UsuarioLogueadoEdit';
import { UsuarioPasswordEdit } from './UsuarioPasswordEdit';
import { UserReportesAsignados } from './UserReportesAsignados';
import { UsuarioEstadisticasActividad } from './UsuarioEstadisticasActividad';
import { UsuarioAuditoria } from './UsuarioAuditoria';
import { UsuarioCambiosRecibidos } from './UsuarioCambiosRecibidos';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AvatarPreviewModal } from './AvatarPreviewModal';

interface UsuarioLogueadoDetalleProps {
  onClose?: () => void;
}

export const UsuarioLogueadoDetalle: React.FC<UsuarioLogueadoDetalleProps> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const [editMode, setEditMode] = useState<'none' | 'profile' | 'password'>('none');
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  console.log('UsuarioLogueadoDetalle - Profile data:', profile);
  console.log('UsuarioLogueadoDetalle - Avatar URL:', profile?.avatar);

  if (!user || !profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No hay información del usuario disponible</p>
        </CardContent>
      </Card>
    );
  }

  const userCreatedAt = new Date(profile.created_at);
  const timeAgo = formatDistanceToNow(userCreatedAt, { addSuffix: true, locale: es });

  if (editMode === 'profile') {
    return <UsuarioLogueadoEdit onBack={() => setEditMode('none')} onClose={() => setEditMode('none')} />;
  }

  if (editMode === 'password') {
    return <UsuarioPasswordEdit onBack={() => setEditMode('none')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mi Perfil
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode('profile')}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar Perfil
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Información básica */}
            <div className="flex items-start gap-4">
              <Avatar 
                className="w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowAvatarPreview(true)}
              >
                <AvatarImage 
                  src={profile.avatar || ''} 
                  alt="Avatar del usuario"
                  className="object-cover"
                  onError={(e) => {
                    console.log('Error loading avatar image:', e);
                    console.log('Avatar URL attempted:', profile.avatar);
                  }}
                  onLoad={() => {
                    console.log('Avatar loaded successfully:', profile.avatar);
                  }}
                />
                <AvatarFallback className="text-lg">
                  {profile.first_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  {profile.last_name?.charAt(0)?.toUpperCase() || ''}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                <div>
                  <h2 className="text-xl font-semibold">
                    {profile.first_name && profile.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile.first_name || profile.last_name || 'Usuario'
                    }
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{profile.email || user.email}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-1">
                    {profile.role && profile.role.length > 0 ? (
                      profile.role.map((role: string) => (
                        <Badge key={role} variant="secondary">
                          {role === 'admin' ? 'Administrador' : role === 'user' ? 'Usuario' : role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">Usuario</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Miembro desde {timeAgo}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={profile.asset ? "default" : "secondary"}>
                    {profile.asset ? "Activo" : "Inactivo"}
                  </Badge>
                  {profile.confirmed && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Email confirmado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs con contenido */}
      <Tabs defaultValue="reportes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reportes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reportes</span>
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Estadísticas</span>
          </TabsTrigger>
          <TabsTrigger value="actividad" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Actividad</span>
          </TabsTrigger>
          <TabsTrigger value="cambios" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Cambios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reportes" className="mt-6">
          <UserReportesAsignados userId={profile.id} userName={`${profile.first_name} ${profile.last_name}`} />
        </TabsContent>

        <TabsContent value="estadisticas" className="mt-6">
          <UsuarioEstadisticasActividad usuarioId={profile.id} usuarioEmail={profile.email} />
        </TabsContent>

        <TabsContent value="actividad" className="mt-6">
          <UsuarioAuditoria usuarioId={profile.id} usuarioEmail={profile.email} />
        </TabsContent>

        <TabsContent value="cambios" className="mt-6">
          <UsuarioCambiosRecibidos usuarioId={profile.id} usuarioEmail={profile.email} />
        </TabsContent>
      </Tabs>

      {/* Avatar Preview Modal */}
      <AvatarPreviewModal
        isOpen={showAvatarPreview}
        onClose={() => setShowAvatarPreview(false)}
        avatarUrl={profile.avatar}
        userName={profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile.first_name || profile.last_name || undefined
        }
        userEmail={profile.email || user.email}
      />
    </div>
  );
};
