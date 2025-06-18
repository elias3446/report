
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Actividad {
  id: string;
  activity_type: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SEARCH' | 'EXPORT' | 'IMPORT';
  descripcion: string;
  tabla_afectada: string | null;
  registro_id: string | null;
  metadatos: any;
  created_at: string;
  user_email: string;
}

export interface CambioHistorial {
  id: string;
  tabla_nombre: string;
  registro_id: string;
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  valores_anteriores: any;
  valores_nuevos: any;
  campos_modificados: string[];
  descripcion_cambio: string;
  created_at: string;
  user_email: string;
}

export const useAuditoria = () => {
  const { toast } = useToast();
  const [filtros, setFiltros] = useState({
    user_id: null as string | null,
    tabla_nombre: null as string | null,
    registro_id: null as string | null,
    limit: 50,
    offset: 0
  });

  // Hook para obtener actividades de usuarios
  const { 
    data: actividades = [], 
    isLoading: isLoadingActividades,
    error: errorActividades 
  } = useQuery({
    queryKey: ['actividades', filtros.user_id, filtros.limit, filtros.offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_activities', {
        p_user_id: filtros.user_id,
        p_limit: filtros.limit === 0 ? 1000 : filtros.limit, // Si limit es 0, usar 1000 como máximo
        p_offset: filtros.offset
      });

      if (error) {
        console.error('Error fetching actividades:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las actividades",
          variant: "destructive"
        });
        throw error;
      }

      return data as Actividad[];
    }
  });

  // Hook para obtener historial de cambios
  const { 
    data: cambiosHistorial = [], 
    isLoading: isLoadingCambios,
    error: errorCambios 
  } = useQuery({
    queryKey: ['cambios_historial', filtros.tabla_nombre, filtros.registro_id, filtros.user_id, filtros.limit, filtros.offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_change_history', {
        p_tabla_nombre: filtros.tabla_nombre,
        p_registro_id: filtros.registro_id,
        p_user_id: filtros.user_id,
        p_limit: filtros.limit === 0 ? 1000 : filtros.limit, // Si limit es 0, usar 1000 como máximo
        p_offset: filtros.offset
      });

      if (error) {
        console.error('Error fetching cambios historial:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el historial de cambios",
          variant: "destructive"
        });
        throw error;
      }

      return data as CambioHistorial[];
    }
  });

  // Función para registrar actividad manual
  const registrarActividad = async (
    activityType: Actividad['activity_type'],
    descripcion: string,
    tablaAfectada?: string,
    registroId?: string,
    metadatos?: any
  ) => {
    try {
      const { error } = await supabase.rpc('registrar_actividad', {
        p_activity_type: activityType,
        p_descripcion: descripcion,
        p_tabla_afectada: tablaAfectada || null,
        p_registro_id: registroId || null,
        p_metadatos: metadatos || {}
      });

      if (error) {
        console.error('Error registering activity:', error);
        toast({
          title: "Error",
          description: "No se pudo registrar la actividad",
          variant: "destructive"
        });
        throw error;
      }

      toast({
        title: "Actividad registrada",
        description: "La actividad se registró correctamente"
      });
    } catch (error) {
      console.error('Error in registrarActividad:', error);
      throw error;
    }
  };

  return {
    actividades,
    cambiosHistorial,
    isLoadingActividades,
    isLoadingCambios,
    errorActividades,
    errorCambios,
    filtros,
    setFiltros,
    registrarActividad
  };
};
