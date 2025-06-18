import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string[];
  confirmed: boolean | null;
  asset: boolean | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user_roles?: {
    id: string;
    role_id: string;
    assigned_at: string;
    assigned_by: string;
    roles: {
      id: string;
      nombre: string;
      descripcion: string;
      permisos: string[];
      activo: boolean;
      color: string;
      icono: string;
    };
  }[];
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string[];
  role_ids?: string[];
}

export interface UpdateUserData {
  id: string;
  first_name?: string;
  last_name?: string;
  asset?: boolean | null;
  role?: string[];
  role_ids?: string[];
}

export const useUsers = (includeCurrentUser: boolean = false, onlyAdminUsers: boolean = false) => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for profile changes
  useEffect(() => {
    const channelName = `profiles-changes-${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile updated:', payload);
          // Invalidate users query to refresh the data
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users', includeCurrentUser, onlyAdminUsers],
    queryFn: async () => {
      console.log('Fetching users with includeCurrentUser:', includeCurrentUser, 'onlyAdminUsers:', onlyAdminUsers);
      
      const { data: usersWithRoles, error: rolesError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!user_roles_user_id_fkey(
            id,
            role_id,
            assigned_at,
            assigned_by,
            roles(
              id,
              nombre,
              descripcion,
              permisos,
              activo,
              color,
              icono
            )
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (rolesError) {
        console.log('Error fetching users with roles, trying without roles:', rolesError);
        
        const { data: simpleUsers, error: simpleError } = await supabase
          .from('profiles')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (simpleError) {
          console.error('Error fetching users:', simpleError);
          throw simpleError;
        }
        
        let transformedUsers = (simpleUsers || []).map(user => ({
          ...user,
          user_roles: []
        }));
        
        console.log('ALL users fetched without roles (before any filtering):', transformedUsers.length, 'users');
        console.log('User IDs:', transformedUsers.map(u => u.id));
        
        // Apply admin filter if requested - must be active, have admin role, and not deleted
        if (onlyAdminUsers) {
          transformedUsers = transformedUsers.filter(user => 
            user.asset === true && 
            user.role && 
            Array.isArray(user.role) && 
            user.role.includes('admin') &&
            user.deleted_at === null
          );
          console.log('Filtered admin users (without roles):', transformedUsers.length, 'users');
          console.log('Admin users found (without roles):', transformedUsers.map(u => ({ 
            id: u.id, 
            email: u.email, 
            role: u.role, 
            asset: u.asset,
            deleted_at: u.deleted_at 
          })));
        }
        
        // Only filter current user if includeCurrentUser is false
        if (!includeCurrentUser) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const filteredUsers = currentUser 
            ? transformedUsers.filter(user => user.id !== currentUser.id)
            : transformedUsers;
          
          console.log('Current user ID:', currentUser?.id);
          console.log('Filtered users (without current):', filteredUsers.length, 'users');
          return filteredUsers as User[];
        }
        
        console.log('Returning ALL users (including current user):', transformedUsers.length, 'users');
        return transformedUsers as User[];
      }

      let allUsers = (usersWithRoles || []) as User[];
      console.log('ALL users fetched with roles (before any filtering):', allUsers.length, 'users');
      console.log('User IDs:', allUsers.map(u => u.id));

      // Apply admin filter if requested - must be active, have admin role, and not deleted
      if (onlyAdminUsers) {
        allUsers = allUsers.filter(user => 
          user.asset === true && 
          user.role && 
          Array.isArray(user.role) && 
          user.role.includes('admin') &&
          user.deleted_at === null
        );
        console.log('Filtered admin users (with roles):', allUsers.length, 'users');
        console.log('Admin users found (with roles):', allUsers.map(u => ({ 
          id: u.id, 
          email: u.email, 
          role: u.role, 
          asset: u.asset,
          deleted_at: u.deleted_at 
        })));
      }

      // Only filter current user if includeCurrentUser is false
      if (!includeCurrentUser) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const filteredUsers = currentUser 
          ? allUsers.filter(user => user.id !== currentUser.id)
          : allUsers;

        console.log('Current user ID:', currentUser?.id);
        console.log('Filtered users (without current):', filteredUsers.length, 'users');
        return filteredUsers;
      }

      console.log('Returning ALL users (including current user):', allUsers.length, 'users');
      return allUsers;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      console.log('Creating user with data:', userData);
      
      // Primero verificar si es el primer usuario
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const isFirstUser = !existingUsers || existingUsers.length === 0;

      // Crear el usuario usando signUp estándar
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            // Enviar el role array al metadata del usuario
            role: userData.role || ['user'],
            skip_auto_role: true, // Indicador para que el trigger no asigne roles automáticamente
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // Esperar un poco para que el trigger cree el perfil
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Actualizar el perfil con el role correcto si no se estableció por el trigger
      if (userData.role) {
        console.log('Updating profile with role:', userData.role);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: userData.role })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Error updating profile role:', updateError);
          throw updateError;
        }
      }

      // Obtener el usuario actual para usar como assigned_by
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Usuario no autenticado');

      // Asignar roles específicos basados en si es el primer usuario o los roles seleccionados
      let rolesToAssign: string[] = [];

      if (isFirstUser) {
        // Para el primer usuario, buscar o crear roles admin y user
        const { data: adminRole } = await supabase
          .from('roles')
          .select('id')
          .eq('nombre', 'Administrador')
          .is('deleted_at', null)
          .single();

        const { data: userRole } = await supabase
          .from('roles')
          .select('id')
          .eq('nombre', 'Usuario')
          .is('deleted_at', null)
          .single();

        if (adminRole) rolesToAssign.push(adminRole.id);
        if (userRole) rolesToAssign.push(userRole.id);
      } else if (userData.role_ids && userData.role_ids.length > 0) {
        // Para usuarios posteriores, usar los roles seleccionados
        rolesToAssign = userData.role_ids;
      }

      // Asignar los roles
      if (rolesToAssign.length > 0) {
        const roleAssignments = rolesToAssign.map(roleId => ({
          user_id: authData.user.id,
          role_id: roleId,
          assigned_by: currentUser.user.id,
        }));

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert(roleAssignments);

        if (roleError) {
          console.error('Error asignando roles:', roleError);
          throw roleError;
        }
      }

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Éxito',
        description: 'Usuario creado correctamente. El usuario recibirá un email de confirmación.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el usuario',
        variant: 'destructive',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: UpdateUserData) => {
      console.log('Updating user:', userData);
      const { id, role_ids, role, ...profileData } = userData;

      // Actualizar perfil del usuario, incluyendo el campo role si está presente
      const updateData = {
        ...profileData,
        ...(role && { role })
      };

      console.log('Updating profile with data:', updateData);

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Si se especificaron roles, actualizar asignaciones
      if (role_ids !== undefined) {
        const { data: currentUser } = await supabase.auth.getUser();
        if (!currentUser.user) throw new Error('Usuario no autenticado');

        // Eliminar roles actuales
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', id);

        if (deleteError) {
          console.error('Error deleting user roles:', deleteError);
          throw deleteError;
        }

        // Asignar nuevos roles
        if (role_ids.length > 0) {
          const roleAssignments = role_ids.map(roleId => ({
            user_id: id,
            role_id: roleId,
            assigned_by: currentUser.user.id,
          }));

          const { error: roleError } = await supabase
            .from('user_roles')
            .insert(roleAssignments);

          if (roleError) {
            console.error('Error inserting user roles:', roleError);
            throw roleError;
          }
        }
      }

      console.log('User updated successfully');
      return userData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Éxito',
        description: 'Usuario actualizado correctamente',
      });
    },
    onError: (error: any) => {
      console.error('Update user error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el usuario',
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Starting delete operation for user ID:', userId);
      
      try {
        const currentTimestamp = new Date().toISOString();
        
        // Primero, marcar los roles del usuario como eliminados
        const { error: rolesError } = await supabase
          .from('user_roles')
          .update({ deleted_at: currentTimestamp })
          .eq('user_id', userId)
          .is('deleted_at', null); // Solo actualizar roles que no estén ya eliminados

        if (rolesError) {
          console.error('Error marking user roles as deleted:', rolesError);
          throw new Error(`Error al eliminar roles del usuario: ${rolesError.message}`);
        }

        // Luego, marcar el perfil del usuario como eliminado
        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            deleted_at: currentTimestamp,
            asset: false 
          })
          .eq('id', userId)
          .select();

        if (error) {
          console.error('Supabase error during delete:', error);
          throw new Error(`Error al eliminar usuario: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
          console.error('No data returned from delete operation');
          throw new Error('No se pudo encontrar el usuario para eliminar');
        }
        
        console.log('User and user roles deleted successfully:', data);
        return data[0];
      } catch (error) {
        console.error('Delete operation failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Delete mutation onSuccess called with:', data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Invalidar también la caché de reportes para reflejar las desasignaciones
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      toast({
        title: 'Éxito',
        description: 'Usuario eliminado correctamente. Los reportes asignados han sido desasignados automáticamente.',
      });
    },
    onError: (error: any) => {
      console.error('Delete user error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar el usuario',
        variant: 'destructive',
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, asset }: { id: string; asset: boolean | null }) => {
      console.log('Starting toggle status operation:', { id, asset });
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ asset })
          .eq('id', id)
          .select();

        if (error) {
          console.error('Supabase error during status toggle:', error);
          throw new Error(`Error al cambiar estado: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
          console.error('No data returned from status toggle operation');
          throw new Error('No se pudo encontrar el usuario para actualizar');
        }
        
        console.log('User status toggled successfully:', data);
        return data[0];
      } catch (error) {
        console.error('Toggle status operation failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Toggle status mutation onSuccess called with:', data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Éxito',
        description: 'Estado del usuario actualizado correctamente',
      });
    },
    onError: (error: any) => {
      console.error('Toggle user status error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al cambiar el estado del usuario',
        variant: 'destructive',
      });
    },
  });

  const bulkChangeUserTypeMutation = useMutation({
    mutationFn: async ({ userIds, userTypes }: { userIds: string[], userTypes: string[] }) => {
      console.log('Changing user types for users:', userIds, 'to types:', userTypes);
      
      const promises = userIds.map(async (userId) => {
        const { error } = await supabase
          .from('profiles')
          .update({ role: userTypes })
          .eq('id', userId);

        if (error) {
          throw new Error(`Error updating user ${userId}: ${error.message}`);
        }
        
        return userId;
      });

      const results = await Promise.all(promises);
      console.log('Bulk user type change completed for users:', results);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Éxito',
        description: 'Tipos de usuario actualizados correctamente',
      });
    },
    onError: (error: any) => {
      console.error('Bulk change user type error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al cambiar los tipos de usuario',
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    toggleUserStatus: toggleUserStatusMutation.mutate,
    bulkChangeUserType: bulkChangeUserTypeMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isToggling: toggleUserStatusMutation.isPending,
    isBulkChangingUserType: bulkChangeUserTypeMutation.isPending,
  };
};
