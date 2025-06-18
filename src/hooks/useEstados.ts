
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { CreateEstadoData, UpdateEstadoData } from '@/types/estados';

export const useEstados = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: estados = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['estados'],
    queryFn: async () => {
      console.log('Fetching estados...');
      const { data, error } = await supabase
        .from('estados')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching estados:', error);
        throw error;
      }

      console.log('Estados fetched:', data);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateEstadoData) => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const estadoData = {
        ...data,
        created_by: user.id
      };

      console.log('Creating estado:', estadoData);
      const { data: result, error } = await supabase
        .from('estados')
        .insert(estadoData)
        .select()
        .single();

      if (error) {
        console.error('Error creating estado:', error);
        throw error;
      }

      console.log('Estado created:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estados'] });
      toast.success('Estado creado exitosamente');
    },
    onError: (error) => {
      console.error('Error creating estado:', error);
      toast.error('Error al crear el estado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: UpdateEstadoData & { id: string }) => {
      console.log('Updating estado:', id, data);
      const { data: result, error } = await supabase
        .from('estados')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating estado:', error);
        throw error;
      }

      console.log('Estado updated:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estados'] });
      toast.success('Estado actualizado exitosamente');
    },
    onError: (error) => {
      console.error('Error updating estado:', error);
      toast.error('Error al actualizar el estado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting estado:', id);
      const { error } = await supabase
        .from('estados')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting estado:', error);
        throw error;
      }

      console.log('Estado deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estados'] });
      toast.success('Estado eliminado exitosamente');
    },
    onError: (error) => {
      console.error('Error deleting estado:', error);
      toast.error('Error al eliminar el estado');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      console.log('Toggling estado status:', id, activo);
      const { data: result, error } = await supabase
        .from('estados')
        .update({ activo })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling estado status:', error);
        throw error;
      }

      console.log('Estado status toggled:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estados'] });
      toast.success('Estado del estado actualizado exitosamente');
    },
    onError: (error) => {
      console.error('Error toggling estado status:', error);
      toast.error('Error al actualizar el estado del estado');
    },
  });

  return {
    estados,
    isLoading,
    error,
    createEstado: createMutation.mutate,
    updateEstado: updateMutation.mutate,
    deleteEstado: deleteMutation.mutate,
    toggleEstadoStatus: toggleStatusMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleStatusMutation.isPending,
  };
};
