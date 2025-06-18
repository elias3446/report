
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserRoleData {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string;
  assigned_at: string;
  deleted_at: string | null;
  roles: {
    id: string;
    nombre: string;
    descripcion: string;
    color: string;
    icono: string;
    activo: boolean;
    deleted_at: string | null;
  } | null;
  user_profile: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  assigned_by_profile: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export const useUserRoles = () => {
  const queryClient = useQueryClient();

  // Obtener todos los roles de usuarios con información detallada, filtrando eliminados
  const {
    data: userRoles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles!inner(id, nombre, descripcion, color, icono, activo, deleted_at),
          user_profile:profiles!user_roles_user_id_fkey(id, email, first_name, last_name),
          assigned_by_profile:profiles!user_roles_assigned_by_fkey(id, email, first_name, last_name)
        `)
        .is('deleted_at', null)
        .is('roles.deleted_at', null);

      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }
      
      return (data || []) as UserRoleData[];
    },
  });

  // Obtener roles de un usuario específico
  const getUserRoles = (userId: string) => {
    return useQuery({
      queryKey: ['user-roles', userId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('user_roles')
          .select(`
            *,
            roles(*)
          `)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .is('roles.deleted_at', null);

        if (error) throw error;
        return data || [];
      },
    });
  };

  // Asignar rol a usuario
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: userData.user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({
        title: 'Éxito',
        description: 'Rol asignado correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al asignar el rol',
        variant: 'destructive',
      });
    },
  });

  // Remover rol de usuario (marcar como eliminado)
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .is('deleted_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({
        title: 'Éxito',
        description: 'Rol removido correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al remover el rol',
        variant: 'destructive',
      });
    },
  });

  return {
    userRoles,
    isLoading,
    error,
    getUserRoles,
    assignRole: assignRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    isAssigning: assignRoleMutation.isPending,
    isRemoving: removeRoleMutation.isPending,
  };
};
