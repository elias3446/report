
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Role, CreateRoleData, UpdateRoleData } from '@/types/roles';

export const useRoles = () => {
  const queryClient = useQueryClient();

  const {
    data: roles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Role[];
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: CreateRoleData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('roles')
        .insert({
          ...roleData,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: 'Éxito',
        description: 'Rol creado correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el rol',
        variant: 'destructive',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...roleData }: UpdateRoleData) => {
      const { data, error } = await supabase
        .from('roles')
        .update(roleData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({
        title: 'Éxito',
        description: 'Rol actualizado correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el rol',
        variant: 'destructive',
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('roles')
        .update({ 
          deleted_at: new Date().toISOString(),
          activo: false 
        })
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({
        title: 'Éxito',
        description: 'Rol eliminado correctamente. Los usuarios asignados han perdido este rol.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar el rol',
        variant: 'destructive',
      });
    },
  });

  const toggleRoleStatusMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase
        .from('roles')
        .update({ activo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: 'Éxito',
        description: 'Estado del rol actualizado correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al cambiar el estado del rol',
        variant: 'destructive',
      });
    },
  });

  return {
    roles,
    isLoading,
    error,
    createRole: createRoleMutation.mutate,
    updateRole: updateRoleMutation.mutate,
    deleteRole: deleteRoleMutation.mutate,
    toggleRoleStatus: toggleRoleStatusMutation.mutate,
    isCreating: createRoleMutation.isPending,
    isUpdating: updateRoleMutation.isPending,
    isDeleting: deleteRoleMutation.isPending,
    isToggling: toggleRoleStatusMutation.isPending,
  };
};

export const useUserRoles = () => {
  const queryClient = useQueryClient();

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
    assignRole: assignRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    isAssigning: assignRoleMutation.isPending,
    isRemoving: removeRoleMutation.isPending,
  };
};
