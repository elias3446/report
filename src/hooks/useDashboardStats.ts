import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ReporteWithDates {
  id: string;
  activo: boolean | null;
  assigned_to: string | null;
  created_at: string;
  priority: string;
  categoria: { nombre: string; color: string } | null;
  estado: { nombre: string; color: string } | null;
  estado_reporte: 'Pendiente' | 'En Proceso' | 'Resuelto';
}

interface UserWithDates {
  id: string;
  asset: boolean;
  confirmed: boolean;
  created_at: string;
  role: string[];
}

interface DashboardStats {
  reportes: {
    total: number;
    activos: number;
    pendientes: number; // Nuevo
    enProceso: number; // Nuevo
    resueltos: number; // Nuevo
    porEstado: { estado: string; count: number; color: string }[];
    porCategoria: { categoria: string; count: number; color: string }[];
    porPrioridad: { priority: string; count: number }[];
    porEstadoReporte: { estado: string; count: number; color: string }[]; // Nuevo
    recientes: number;
    datosCompletos: ReporteWithDates[];
  };
  usuarios: {
    total: number;
    activos: number;
    confirmados: number;
    recientes: number;
    porEstadoActivacion: { estado: string; count: number; color: string }[];
    porConfirmacion: { categoria: string; count: number; color: string }[];
    porRoles: { name: string; value: number; color: string }[];
    porTipoUsuario: { name: string; value: number; color: string }[];
    datosCompletos: UserWithDates[];
  };
  roles: {
    total: number;
    activos: number;
    asignaciones: number;
  };
  categorias: {
    total: number;
    activas: number;
  };
  estados: {
    total: number;
    activos: number;
  };
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      console.log('Fetching dashboard statistics...');

      // Obtener estadísticas de reportes con datos completos - FIXED QUERY
      const { data: reportes, error: reportesError } = await supabase
        .from('reportes')
        .select(`
          id,
          activo,
          assigned_to,
          created_at,
          priority,
          categoria:categories!inner(nombre, color),
          estado:estados!inner(nombre, color)
        `)
        .is('deleted_at', null);

      if (reportesError) {
        console.error('Error fetching reportes stats:', reportesError);
        throw reportesError;
      }

      // CRÍTICO: Obtener TODOS los usuarios incluyendo el actual (sin filtrar)
      const { data: usuarios, error: usuariosError } = await supabase
        .from('profiles')
        .select('id, asset, confirmed, created_at, role')
        .is('deleted_at', null);

      if (usuariosError) {
        console.error('Error fetching usuarios stats:', usuariosError);
        throw usuariosError;
      }

      console.log('DashboardStats - Usuarios obtenidos (TODOS incluyendo actual):', usuarios?.length || 0);

      // Obtener asignaciones de roles desde user_roles table
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role_id,
          deleted_at,
          roles!inner(id, nombre, color)
        `)
        .is('deleted_at', null);

      if (userRolesError) {
        console.error('Error fetching user roles stats:', userRolesError);
        throw userRolesError;
      }

      // Obtener todos los roles para referencia
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('id, nombre, color, activo')
        .is('deleted_at', null);

      if (rolesError) {
        console.error('Error fetching roles stats:', rolesError);
        throw rolesError;
      }

      // Obtener estadísticas de categorías
      const { data: categorias, error: categoriasError } = await supabase
        .from('categories')
        .select('id, activo')
        .is('deleted_at', null);

      if (categoriasError) {
        console.error('Error fetching categorias stats:', categoriasError);
        throw categoriasError;
      }

      // Obtener estadísticas de estados
      const { data: estados, error: estadosError } = await supabase
        .from('estados')
        .select('id, activo')
        .is('deleted_at', null);

      if (estadosError) {
        console.error('Error fetching estados stats:', estadosError);
        throw estadosError;
      }

      // Calcular estadísticas usando datos reales
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Función actualizada para determinar el estado del reporte según las nuevas reglas
      const determinarEstadoReporte = (activo: boolean | null, assigned_to: string | null): 'Pendiente' | 'En Proceso' | 'Resuelto' => {
        // Resuelto: cuando activo es null
        if (activo === null) return 'Resuelto';
        
        // En Proceso: cuando tiene usuario asignado (assigned_to no es null)
        if (assigned_to !== null) return 'En Proceso';
        
        // Pendiente: cuando no tiene usuario asignado (assigned_to es null)
        return 'Pendiente';
      };

      // Estadísticas de reportes con nuevo estado basado en asignación
      const reportesPendientes = reportes?.filter(r => r.assigned_to === null && r.activo !== null) || [];
      const reportesEnProceso = reportes?.filter(r => r.assigned_to !== null && r.activo !== null) || [];
      const reportesResueltos = reportes?.filter(r => r.activo === null) || [];
      const reportesRecientes = reportes?.filter(r => 
        new Date(r.created_at) >= sevenDaysAgo
      ) || [];

      // Guardar datos completos con estado del reporte actualizado
      const datosCompletos: ReporteWithDates[] = reportes?.map(r => ({
        id: r.id,
        activo: r.activo,
        assigned_to: r.assigned_to,
        created_at: r.created_at,
        priority: r.priority || 'medio',
        categoria: Array.isArray(r.categoria) ? r.categoria[0] || null : r.categoria,
        estado: Array.isArray(r.estado) ? r.estado[0] || null : r.estado,
        estado_reporte: determinarEstadoReporte(r.activo, r.assigned_to)
      })) || [];

      // Distribución por estado del reporte actualizada
      const porEstadoReporte = [
        { estado: 'Pendiente', count: reportesPendientes.length, color: '#F59E0B' },
        { estado: 'En Proceso', count: reportesEnProceso.length, color: '#3B82F6' },
        { estado: 'Resuelto', count: reportesResueltos.length, color: '#10B981' }
      ].filter(item => item.count > 0);

      // Agrupar por estado - FIXED ACCESS TO NESTED PROPERTIES
      const porEstado = reportes?.reduce((acc, reporte) => {
        const estadoData = Array.isArray(reporte.estado) ? reporte.estado[0] : reporte.estado;
        const estadoNombre = estadoData?.nombre || 'Sin estado';
        const estadoColor = estadoData?.color || '#6B7280';
        const existing = acc.find(item => item.estado === estadoNombre);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ estado: estadoNombre, count: 1, color: estadoColor });
        }
        return acc;
      }, [] as { estado: string; count: number; color: string }[]) || [];

      // Agrupar por categoría - FIXED ACCESS TO NESTED PROPERTIES
      const porCategoria = reportes?.reduce((acc, reporte) => {
        const categoriaData = Array.isArray(reporte.categoria) ? reporte.categoria[0] : reporte.categoria;
        const categoriaNombre = categoriaData?.nombre || 'Sin categoría';
        const categoriaColor = categoriaData?.color || '#6B7280';
        const existing = acc.find(item => item.categoria === categoriaNombre);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ categoria: categoriaNombre, count: 1, color: categoriaColor });
        }
        return acc;
      }, [] as { categoria: string; count: number; color: string }[]) || [];

      // Agrupar por prioridad
      const porPrioridad = reportes?.reduce((acc, reporte) => {
        const prioridad = reporte.priority || 'medio';
        const existing = acc.find(item => item.priority === prioridad);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ priority: prioridad, count: 1 });
        }
        return acc;
      }, [] as { priority: string; count: number }[]) || [];

      // Estadísticas de usuarios - USAR TODOS LOS USUARIOS
      const usuariosActivos = usuarios?.filter(u => u.asset) || [];
      const usuariosConfirmados = usuarios?.filter(u => u.confirmed) || [];
      const usuariosRecientes = usuarios?.filter(u => 
        new Date(u.created_at) >= sevenDaysAgo
      ) || [];

      console.log('DashboardStats - Estadísticas calculadas con TODOS los usuarios:', {
        total: usuarios?.length || 0,
        activos: usuariosActivos.length,
        confirmados: usuariosConfirmados.length,
        recientes: usuariosRecientes.length
      });

      // Guardar datos completos de usuarios para filtrado posterior
      const usuariosCompletos: UserWithDates[] = usuarios?.map(u => ({
        id: u.id,
        asset: u.asset || false,
        confirmed: u.confirmed || false,
        created_at: u.created_at,
        role: u.role || []
      })) || [];

      // Agrupar usuarios por estado de activación
      const usuariosPorEstadoActivacion = [
        { estado: 'Activos', count: usuariosActivos.length, color: '#10B981' },
        { estado: 'Inactivos', count: (usuarios?.length || 0) - usuariosActivos.length, color: '#EF4444' }
      ];

      // Agrupar usuarios por confirmación
      const usuariosPorConfirmacion = [
        { categoria: 'Confirmados', count: usuariosConfirmados.length, color: '#3B82F6' },
        { categoria: 'No confirmados', count: (usuarios?.length || 0) - usuariosConfirmados.length, color: '#F59E0B' }
      ];

      // Calcular distribución por COMBINACIONES ESPECÍFICAS DE ROLES REALES
      const userRoleAssignments: { [userId: string]: string[] } = {};
      
      // Obtener todos los roles asignados por usuario desde user_roles - FIXED ACCESS TO NESTED PROPERTIES
      userRoles?.forEach(userRole => {
        const roleData = Array.isArray(userRole.roles) ? userRole.roles[0] : userRole.roles;
        const roleName = roleData?.nombre;
        if (roleName) {
          if (!userRoleAssignments[userRole.user_id]) {
            userRoleAssignments[userRole.user_id] = [];
          }
          userRoleAssignments[userRole.user_id].push(roleName);
        }
      });

      // Contar usuarios por combinaciones específicas de roles
      const rolesCombinations: { [combination: string]: number } = {};
      
      Object.values(userRoleAssignments).forEach(userRoles => {
        if (userRoles.length > 0) {
          // Ordenar roles alfabéticamente para crear combinaciones consistentes
          const sortedRoles = userRoles.sort();
          const combination = sortedRoles.join(' y '); // Usar " y " como separador
          rolesCombinations[combination] = (rolesCombinations[combination] || 0) + 1;
        }
      });

      // Agregar usuarios sin roles asignados
      const usersWithoutRoles = (usuarios?.length || 0) - Object.keys(userRoleAssignments).length;
      if (usersWithoutRoles > 0) {
        rolesCombinations['Sin Roles'] = usersWithoutRoles;
      }

      // Convertir combinaciones a formato de gráfico
      const porRoles = Object.entries(rolesCombinations).map(([combination, count], index) => {
        let color: string;
        
        if (combination === 'Sin Roles') {
          color = '#6B7280';
        } else {
          // Para combinaciones de roles, usar el color del primer rol o un color generado
          const firstRoleName = combination.split(' y ')[0];
          const firstRole = roles?.find(r => r.nombre === firstRoleName);
          color = firstRole?.color || `hsl(${index * 45}, 70%, 60%)`;
        }
        
        return {
          name: combination,
          value: count as number,
          color
        };
      }).filter(item => item.value > 0);

      // Calcular distribución por TIPO DE USUARIO (desde profiles.role)
      const tipoUsuarioCounts = { soloAdmin: 0, soloUser: 0, ambas: 0 };

      usuarios?.forEach(user => {
        const userRoles = user.role || [];
        
        const hasAdmin = userRoles.includes('admin');
        const hasUser = userRoles.includes('user');

        if (hasAdmin && hasUser) {
          tipoUsuarioCounts.ambas++;
        } else if (hasAdmin) {
          tipoUsuarioCounts.soloAdmin++;
        } else if (hasUser) {
          tipoUsuarioCounts.soloUser++;
        }
      });

      // Convertir tipos de usuario a formato de gráfico
      const porTipoUsuario = [
        { name: 'Solo Admin', value: tipoUsuarioCounts.soloAdmin, color: '#DC2626' },
        { name: 'Solo Usuario', value: tipoUsuarioCounts.soloUser, color: '#059669' },
        { name: 'Admin y Usuario', value: tipoUsuarioCounts.ambas, color: '#7C3AED' }
      ].filter(item => item.value > 0);

      // Estadísticas de roles
      const rolesActivos = roles?.filter(r => r.activo) || [];

      // Estadísticas de categorías
      const categoriasActivas = categorias?.filter(c => c.activo) || [];

      // Estadísticas de estados
      const estadosActivos = estados?.filter(e => e.activo) || [];

      const stats: DashboardStats = {
        reportes: {
          total: reportes?.length || 0,
          activos: reportesEnProceso.length + reportesPendientes.length, // Activos = En Proceso + Pendientes
          pendientes: reportesPendientes.length,
          enProceso: reportesEnProceso.length,
          resueltos: reportesResueltos.length,
          porEstado,
          porCategoria,
          porPrioridad,
          porEstadoReporte,
          recientes: reportesRecientes.length,
          datosCompletos,
        },
        usuarios: {
          total: usuarios?.length || 0, // TODOS los usuarios incluyendo el actual
          activos: usuariosActivos.length,
          confirmados: usuariosConfirmados.length,
          recientes: usuariosRecientes.length,
          porEstadoActivacion: usuariosPorEstadoActivacion,
          porConfirmacion: usuariosPorConfirmacion,
          porRoles, // Combinaciones específicas de roles reales de la BD
          porTipoUsuario, // Tipos de usuario desde profiles.role
          datosCompletos: usuariosCompletos,
        },
        roles: {
          total: roles?.length || 0,
          activos: rolesActivos.length,
          asignaciones: userRoles?.length || 0,
        },
        categorias: {
          total: categorias?.length || 0,
          activas: categoriasActivas.length,
        },
        estados: {
          total: estados?.length || 0,
          activos: estadosActivos.length,
        },
      };

      console.log('Dashboard stats calculated with updated report status logic:', {
        totalReportes: stats.reportes.total,
        reportesPendientes: stats.reportes.pendientes,
        reportesEnProceso: stats.reportes.enProceso,
        reportesResueltos: stats.reportes.resueltos
      });
      return stats;
    },
  });
};
