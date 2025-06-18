
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Reporte } from '@/types/reportes';

export const useUserReportes = (userId: string) => {
  return useQuery({
    queryKey: ['user-reportes', userId],
    queryFn: async () => {
      console.log('Fetching reportes for user:', userId);
      
      const { data, error } = await supabase
        .from('reportes')
        .select(`
          *,
          categoria:categories!reportes_categoria_id_fkey(id, nombre, color, icono, deleted_at),
          estado:estados!reportes_estado_id_fkey(id, nombre, color, icono, deleted_at),
          created_by_profile:profiles!reportes_created_by_fkey(id, first_name, last_name, email)
        `)
        .eq('assigned_to', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user reportes:', error);
        throw error;
      }

      console.log('User reportes fetched:', data);
      return (data || []) as Reporte[];
    },
    enabled: !!userId,
  });
};
