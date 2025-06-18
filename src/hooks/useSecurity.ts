
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Permission types matching the database enum
export type Permission = 
  | 'ver_reporte' | 'crear_reporte' | 'editar_reporte' | 'eliminar_reporte'
  | 'ver_usuario' | 'crear_usuario' | 'editar_usuario' | 'eliminar_usuario'
  | 'ver_categoria' | 'crear_categoria' | 'editar_categoria' | 'eliminar_categoria'
  | 'ver_estado' | 'crear_estado' | 'editar_estado' | 'eliminar_estado'
  | 'ver_rol' | 'crear_rol' | 'editar_rol' | 'eliminar_rol';

export const useSecurity = () => {
  const { user } = useAuth();

  // Get user permissions
  const { data: userPermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          roles!inner(
            permisos
          )
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .is('roles.deleted_at', null)
        .eq('roles.activo', true);

      if (error) {
        console.error('Error fetching user permissions:', error);
        return [];
      }

      // Flatten permissions from all roles
      const allPermissions = data.flatMap(item => item.roles?.permisos || []);
      return [...new Set(allPermissions)]; // Remove duplicates
    },
    enabled: !!user?.id,
  });

  // Check if user has a specific permission
  const hasPermission = (permission: Permission): boolean => {
    if (!user || permissionsLoading) return false;
    return userPermissions.includes(permission);
  };

  // Check multiple permissions (user must have ALL)
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Check multiple permissions (user must have ANY)
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  // Security logging function using direct RPC call - only for critical events
  const logSecurityEvent = async (eventType: string, description: string, metadata?: any) => {
    // Skip logging for routine view operations
    if (eventType.includes('VIEW_ATTEMPT') || eventType.includes('REPORT_VIEW') || eventType.includes('DATA_VIEW')) {
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_description: description,
        p_user_id: user?.id || null,
        p_metadata: metadata || {}
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }

      return data;
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  // Function to log data import operations
  const logDataImport = async (tableName: string, recordsCount: number, metadata?: any) => {
    try {
      const { data, error } = await supabase.rpc('log_data_import', {
        p_table_name: tableName,
        p_records_count: recordsCount,
        p_metadata: metadata || {}
      });

      if (error) {
        console.error('Failed to log data import:', error);
      }

      return data;
    } catch (error) {
      console.error('Failed to log data import:', error);
    }
  };

  // Function to log data export operations
  const logDataExport = async (tableName: string, recordsCount: number, exportFormat: string = 'CSV', metadata?: any) => {
    try {
      const { data, error } = await supabase.rpc('log_data_export', {
        p_table_name: tableName,
        p_records_count: recordsCount,
        p_export_format: exportFormat,
        p_metadata: metadata || {}
      });

      if (error) {
        console.error('Failed to log data export:', error);
      }

      return data;
    } catch (error) {
      console.error('Failed to log data export:', error);
    }
  };

  // File upload validation using direct RPC call
  const validateFileUpload = async (file: File): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('validate_file_upload', {
        p_filename: file.name,
        p_file_size: file.size,
        p_content_type: file.type
      });

      if (error) {
        console.error('File validation error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('File validation failed:', error);
      return false;
    }
  };

  // Input sanitization helper
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim()
      .substring(0, 1000); // Limit length
  };

  // Check if user is admin (helper function)
  const isAdmin = (): boolean => {
    return hasAnyPermission([
      'crear_usuario', 
      'editar_usuario', 
      'eliminar_usuario', 
      'crear_rol', 
      'editar_rol', 
      'eliminar_rol'
    ]);
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    userPermissions,
    permissionsLoading,
    logSecurityEvent,
    logDataImport,
    logDataExport,
    validateFileUpload,
    sanitizeInput,
    isAdmin
  };
};
