
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Reporte, CreateReporteData, UpdateReporteData } from '@/types/reportes';

export const useReportes = (onlyPublic: boolean = false) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reportes = [], isLoading, error } = useQuery({
    queryKey: ['reportes', { onlyPublic }],
    queryFn: async () => {
      console.log('Fetching reportes...', { onlyPublic });
      
      let query = supabase
        .from('reportes')
        .select(`
          *,
          categoria:categories!reportes_categoria_id_fkey(id, nombre, color, icono, deleted_at),
          estado:estados!reportes_estado_id_fkey(id, nombre, color, icono, deleted_at),
          created_by_profile:profiles!reportes_created_by_fkey(id, first_name, last_name, email),
          assigned_to_profile:profiles!reportes_assigned_to_fkey(id, first_name, last_name, email)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reportes:', error);
        throw error;
      }

      console.log('Reportes fetched:', data);
      return (data || []) as Reporte[];
    },
  });

  // Function to get report status based on activo and assigned_to fields
  const getReporteStatus = (reporte: Reporte) => {
    if (reporte.activo === null) {
      return {
        status: 'resuelto' as const,
        color: '#10B981',
        label: 'Resuelto'
      };
    }
    
    if (reporte.assigned_to) {
      return {
        status: reporte.activo ? 'en_proceso' : 'en_proceso_privado' as const,
        color: '#3B82F6',
        label: reporte.activo ? 'En Proceso' : 'En Proceso (Privado)'
      };
    }
    
    return {
      status: reporte.activo ? 'pendiente' : 'pendiente_privado' as const,
      color: '#DC2626',
      label: reporte.activo ? 'Pendiente' : 'Pendiente (Privado)'
    };
  };

  const { mutate: createReporte, isPending: isCreating } = useMutation({
    mutationFn: async (reporteData: CreateReporteData) => {
      console.log('Creating reporte:', reporteData);
      
      // Asegurar que assigned_to sea null si está vacío
      const cleanedData = {
        ...reporteData,
        assigned_to: reporteData.assigned_to && reporteData.assigned_to.trim() !== '' 
          ? reporteData.assigned_to 
          : null
      };
      
      const { data, error } = await supabase
        .from('reportes')
        .insert([{
          ...cleanedData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating reporte:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Reporte creado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error creating reporte:', error);
      toast({
        title: "Error",
        description: "Error al crear el reporte",
        variant: "destructive",
      });
    },
  });

  const { mutate: updateReporte, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateReporteData & { id: string }) => {
      console.log('Updating reporte:', id, updateData);
      
      // Asegurar que assigned_to sea null si está vacío
      const cleanedData = {
        ...updateData,
        assigned_to: updateData.assigned_to && updateData.assigned_to.trim() !== '' 
          ? updateData.assigned_to 
          : null
      };
      
      const { data, error } = await supabase
        .from('reportes')
        .update(cleanedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating reporte:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Reporte actualizado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error updating reporte:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el reporte",
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteReporte, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      console.log('Soft deleting reporte:', id);
      const { data, error } = await supabase
        .from('reportes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deleting reporte:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Reporte eliminado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deleting reporte:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el reporte",
        variant: "destructive",
      });
    },
  });

  const { mutate: toggleReporteStatus, isPending: isToggling } = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean | null }) => {
      console.log('Toggling reporte status:', id, activo);
      const newStatus = activo === true ? false : activo === false ? true : true;
      
      const { data, error } = await supabase
        .from('reportes')
        .update({ activo: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling reporte status:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Estado del reporte actualizado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error toggling reporte status:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado del reporte",
        variant: "destructive",
      });
    },
  });

  // Mark as resolved (set activo to null)
  const { mutate: markAsResolved, isPending: isMarkingAsResolved } = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('reportes')
        .update({ activo: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Reporte marcado como resuelto",
      });
    },
  });

  // Mark as pending (set activo to true, assigned_to to null)
  const { mutate: markAsPending, isPending: isMarkingAsPending } = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('reportes')
        .update({ activo: true, assigned_to: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Reporte marcado como pendiente",
      });
    },
  });

  // Activate report (make public)
  const { mutate: activateReporte, isPending: isActivating } = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('reportes')
        .update({ activo: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Reporte hecho público",
      });
    },
  });

  // Deactivate report (make private)
  const { mutate: deactivateReporte, isPending: isDeactivating } = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('reportes')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Reporte hecho privado",
      });
    },
  });

  // Bulk operations
  const { mutate: bulkToggleStatus, isPending: isBulkToggling } = useMutation({
    mutationFn: async (reporteIds: string[]) => {
      const { data, error } = await supabase
        .from('reportes')
        .update({ activo: false })
        .in('id', reporteIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Estados actualizados en lote",
      });
    },
  });

  const { mutate: bulkDelete, isPending: isBulkDeleting } = useMutation({
    mutationFn: async (reporteIds: string[]) => {
      const { data, error } = await supabase
        .from('reportes')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', reporteIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Reportes eliminados en lote",
      });
    },
  });

  const { mutate: bulkChangeCategory, isPending: isBulkChangingCategory } = useMutation({
    mutationFn: async ({ reporteIds, categoryId }: { reporteIds: string[]; categoryId: string }) => {
      const { data, error } = await supabase
        .from('reportes')
        .update({ categoria_id: categoryId })
        .in('id', reporteIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Categorías actualizadas en lote",
      });
    },
  });

  const { mutate: bulkChangeEstado, isPending: isBulkChangingEstado } = useMutation({
    mutationFn: async ({ reporteIds, estadoId }: { reporteIds: string[]; estadoId: string }) => {
      const { data, error } = await supabase
        .from('reportes')
        .update({ estado_id: estadoId })
        .in('id', reporteIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Estados actualizados en lote",
      });
    },
  });

  const { mutate: bulkChangeAssignment, isPending: isBulkChangingAssignment } = useMutation({
    mutationFn: async ({ reporteIds, userId }: { reporteIds: string[]; userId: string }) => {
      const { data, error } = await supabase
        .from('reportes')
        .update({ assigned_to: userId || null })
        .in('id', reporteIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Éxito",
        description: "Asignaciones actualizadas en lote",
      });
    },
  });

  return {
    reportes,
    isLoading,
    error,
    createReporte,
    isCreating,
    updateReporte,
    isUpdating,
    deleteReporte,
    isDeleting,
    toggleReporteStatus,
    isToggling,
    getReporteStatus,
    markAsResolved,
    isMarkingAsResolved,
    markAsPending,
    isMarkingAsPending,
    activateReporte,
    isActivating,
    deactivateReporte,
    isDeactivating,
    bulkToggleStatus,
    isBulkToggling,
    bulkDelete,
    isBulkDeleting,
    bulkChangeCategory,
    isBulkChangingCategory,
    bulkChangeEstado,
    isBulkChangingEstado,
    bulkChangeAssignment,
    isBulkChangingAssignment,
  };
};
