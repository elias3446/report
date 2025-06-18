
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ReporteHistorial } from '@/types/reportes';

export const useReporteHistorial = (reporteId: string) => {
  const { data: historial = [], isLoading, error } = useQuery({
    queryKey: ['reporte-historial', reporteId],
    queryFn: async () => {
      console.log('Fetching reporte historial for:', reporteId);
      const { data, error } = await supabase
        .from('reporte_historial')
        .select(`
          *,
          assigned_from_profile:profiles!reporte_historial_assigned_from_fkey(id, first_name, last_name, email),
          assigned_to_profile:profiles!reporte_historial_assigned_to_fkey(id, first_name, last_name, email),
          assigned_by_profile:profiles!reporte_historial_assigned_by_fkey(id, first_name, last_name, email)
        `)
        .eq('reporte_id', reporteId)
        .order('fecha_asignacion', { ascending: false });

      if (error) {
        console.error('Error fetching reporte historial:', error);
        throw error;
      }

      console.log('Reporte historial fetched:', data);
      return data as ReporteHistorial[];
    },
    enabled: !!reporteId,
  });

  return {
    historial,
    isLoading,
    error,
  };
};
