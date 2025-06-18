
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/types/notifications';
import { useBulkSelection } from '@/hooks/useBulkSelection';

export const useBulkNotifications = (notifications: Notification[]) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const bulkSelection = useBulkSelection(notifications);

  // Obtener configuración de notificaciones del usuario
  const { data: notificationConfig } = useQuery({
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

      return data || { auto_delete_read: false, retention_days: 30, enabled: true };
    },
    enabled: !!user,
  });

  const deleteBulkNotificationsMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, notificationIds) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      bulkSelection.clearSelection();
      toast({
        title: 'Éxito',
        description: `${notificationIds.length} notificaciones eliminadas`,
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar las notificaciones',
        variant: 'destructive',
      });
    },
  });

  const markBulkAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar si las notificaciones están habilitadas
      if (notificationConfig && !notificationConfig.enabled) {
        throw new Error('Las notificaciones están deshabilitadas');
      }

      // Si está configurado para eliminar automáticamente, eliminar en lugar de marcar como leídas
      if (notificationConfig?.auto_delete_read) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .in('id', notificationIds)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', notificationIds)
          .eq('user_id', user.id)
          .eq('read', false);

        if (error) throw error;
      }
    },
    onSuccess: (_, notificationIds) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      bulkSelection.clearSelection();
      toast({
        title: 'Éxito',
        description: notificationConfig?.auto_delete_read 
          ? `${notificationIds.length} notificaciones eliminadas`
          : `${notificationIds.length} notificaciones marcadas como leídas`,
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al procesar las notificaciones',
        variant: 'destructive',
      });
    },
  });

  const deleteBulkNotifications = useCallback(() => {
    const selectedIds = Array.from(bulkSelection.selectedItems);
    if (selectedIds.length > 0) {
      deleteBulkNotificationsMutation.mutate(selectedIds);
    }
  }, [bulkSelection.selectedItems, deleteBulkNotificationsMutation]);

  const markBulkAsRead = useCallback(() => {
    const selectedIds = Array.from(bulkSelection.selectedItems);
    const unreadIds = selectedIds.filter(id => {
      const notification = notifications.find(n => n.id === id);
      return notification && !notification.read;
    });
    
    if (unreadIds.length > 0) {
      markBulkAsReadMutation.mutate(unreadIds);
    }
  }, [bulkSelection.selectedItems, notifications, markBulkAsReadMutation, notificationConfig]);

  return {
    ...bulkSelection,
    deleteBulkNotifications,
    markBulkAsRead,
    isDeleting: deleteBulkNotificationsMutation.isPending,
    isMarkingAsRead: markBulkAsReadMutation.isPending,
  };
};
