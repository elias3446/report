
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Settings, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ThemeConfig } from '@/components/theme/ThemeConfig';

interface NotificationConfig {
  auto_delete_read: boolean;
  retention_days: number;
  enabled: boolean;
}

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [config, setConfig] = useState<NotificationConfig>({
    auto_delete_read: false,
    retention_days: 30,
    enabled: true,
  });

  // Obtener configuración actual
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });

  // Actualizar estado local cuando se carga la configuración
  useEffect(() => {
    if (currentConfig) {
      setConfig({
        auto_delete_read: currentConfig.auto_delete_read,
        retention_days: currentConfig.retention_days,
        enabled: currentConfig.enabled,
      });
    }
  }, [currentConfig]);

  // Guardar configuración usando UPSERT
  const saveConfigMutation = useMutation({
    mutationFn: async (newConfig: NotificationConfig) => {
      if (!user) throw new Error('Usuario no autenticado');

      const configData = {
        user_id: user.id,
        ...newConfig,
        updated_at: new Date().toISOString(),
      };

      // Usar UPSERT para actualizar si existe, crear si no existe
      const { error } = await supabase
        .from('notification_settings')
        .upsert(configData, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast({
        title: 'Configuración guardada',
        description: 'La configuración de notificaciones se ha actualizado correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar la configuración',
        variant: 'destructive',
      });
    },
  });

  // Limpiar notificaciones antiguas manualmente
  const cleanupNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuario no autenticado');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.retention_days);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Notificaciones eliminadas',
        description: `Se han eliminado las notificaciones anteriores a ${config.retention_days} días`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar notificaciones antiguas',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    saveConfigMutation.mutate(config);
  };

  const handleCleanup = () => {
    cleanupNotificationsMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuración de Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Tema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeConfig />
        </CardContent>
      </Card>

      {/* Configuración de Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones habilitadas</Label>
                <p className="text-sm text-muted-foreground">
                  Recibir notificaciones del sistema
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Eliminar notificaciones leídas automáticamente</Label>
                <p className="text-sm text-muted-foreground">
                  Las notificaciones se eliminan inmediatamente al marcarlas como leídas
                </p>
              </div>
              <Switch
                checked={config.auto_delete_read}
                onCheckedChange={(checked) => setConfig({ ...config, auto_delete_read: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tiempo de retención de notificaciones (días)</Label>
              <Select
                value={config.retention_days.toString()}
                onValueChange={(value) => setConfig({ ...config, retention_days: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="15">15 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                  <SelectItem value="60">60 días</SelectItem>
                  <SelectItem value="90">90 días</SelectItem>
                  <SelectItem value="365">1 año</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Las notificaciones anteriores a este tiempo se eliminarán automáticamente
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saveConfigMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saveConfigMutation.isPending ? 'Guardando...' : 'Guardar configuración'}
            </Button>

            <Button
              variant="outline"
              onClick={handleCleanup}
              disabled={cleanupNotificationsMutation.isPending}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {cleanupNotificationsMutation.isPending ? 'Eliminando...' : 'Limpiar notificaciones antiguas'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
