
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Category, CreateCategoryData, UpdateCategoryData } from '@/types/categories';

export const useCategories = () => {
  const queryClient = useQueryClient();

  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('Fetching categories...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      console.log('Categories fetched successfully:', data);
      return data as Category[];
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: CreateCategoryData) => {
      console.log('Creating category:', categoryData);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('User not authenticated');
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...categoryData,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        throw error;
      }
      console.log('Category created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Éxito',
        description: 'Categoría creada correctamente',
      });
    },
    onError: (error: any) => {
      console.error('Create category mutation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al crear la categoría',
        variant: 'destructive',
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...categoryData }: UpdateCategoryData) => {
      console.log('Updating category:', id, categoryData);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('User not authenticated for update');
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }
      console.log('Category updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Éxito',
        description: 'Categoría actualizada correctamente',
      });
    },
    onError: (error: any) => {
      console.error('Update category mutation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar la categoría',
        variant: 'destructive',
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      console.log('Deleting category:', categoryId);
      
      // Verificar autenticación antes de proceder
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('User not authenticated for delete');
        throw new Error('Usuario no autenticado');
      }
      console.log('User authenticated:', userData.user.id);

      const { error } = await supabase
        .from('categories')
        .update({ 
          deleted_at: new Date().toISOString(),
          activo: false 
        })
        .eq('id', categoryId);

      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }
      console.log('Category deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Éxito',
        description: 'Categoría eliminada correctamente',
      });
    },
    onError: (error: any) => {
      console.error('Delete category mutation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar la categoría',
        variant: 'destructive',
      });
    },
  });

  const toggleCategoryStatusMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      console.log('Toggling category status:', id, activo);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('User not authenticated for status toggle');
        throw new Error('Usuario no autenticado');
      }

      const { error } = await supabase
        .from('categories')
        .update({ activo })
        .eq('id', id);

      if (error) {
        console.error('Error toggling category status:', error);
        throw error;
      }
      console.log('Category status toggled successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Éxito',
        description: 'Estado de la categoría actualizado correctamente',
      });
    },
    onError: (error: any) => {
      console.error('Toggle status mutation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al cambiar el estado de la categoría',
        variant: 'destructive',
      });
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    toggleCategoryStatus: toggleCategoryStatusMutation.mutate,
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
    isToggling: toggleCategoryStatusMutation.isPending,
  };
};
