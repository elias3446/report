
import type { AdvancedFilters } from '@/hooks/useAdvancedFilters';

export const isDateInRange = (dateString: string, dateRange: { from: Date; to: Date }) => {
  const userDate = new Date(dateString);
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);
  
  return userDate >= fromDate && userDate <= toDate;
};

export const isValidForComparison = (filters: AdvancedFilters) => {
  switch (filters.activeTab) {
    case 'busqueda':
      return filters.searchTerm.length >= 2;
    case 'fechas':
      return filters.dateRange !== null;
    case 'prioridad': // roles
      return filters.priority.length > 0;
    case 'estados': // activación
      return filters.estados.length > 0;
    case 'categorias': // confirmación
      return filters.categorias.length > 0;
    default:
      return false;
  }
};

export const calculateUserTypeDistribution = (filteredUsers: any[]) => {
  const tipoUsuarioCounts = { soloAdmin: 0, soloUser: 0, ambas: 0 };

  filteredUsers.forEach(user => {
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

  return [
    { name: 'Solo Admin', value: tipoUsuarioCounts.soloAdmin, color: '#DC2626' },
    { name: 'Solo Usuario', value: tipoUsuarioCounts.soloUser, color: '#059669' },
    { name: 'Admin y Usuario', value: tipoUsuarioCounts.ambas, color: '#7C3AED' }
  ].filter(item => item.value > 0);
};

export const calculateRoleDistribution = (filteredUsers: any[], userRoles: any[], roles: any[]) => {
  const userRoleAssignments: { [userId: string]: string[] } = {};
  
  // Obtener todos los roles asignados por usuario desde user_roles SOLO para usuarios filtrados
  filteredUsers.forEach(user => {
    const userRolesList = userRoles?.filter(ur => 
      ur.user_id === user.id && !ur.deleted_at
    ) || [];
    
    const userRoleNames = userRolesList.map(ur => {
      const role = roles?.find(r => r.id === ur.role_id);
      return role ? role.nombre : null;
    }).filter(Boolean);

    // También considerar roles del campo role en profiles
    const profileRoles = user.role || [];
    const allUserRoles = [...new Set([...userRoleNames, ...profileRoles])];

    if (allUserRoles.length > 0) {
      userRoleAssignments[user.id] = allUserRoles;
    }
  });

  // Contar usuarios por combinaciones específicas de roles SOLO de usuarios filtrados
  const rolesCombinations: { [combination: string]: number } = {};
  
  Object.values(userRoleAssignments).forEach(userRoles => {
    if (userRoles.length > 0) {
      // Ordenar roles alfabéticamente para crear combinaciones consistentes
      const sortedRoles = userRoles.sort();
      const combination = sortedRoles.join(' y ');
      rolesCombinations[combination] = (rolesCombinations[combination] || 0) + 1;
    }
  });

  // Agregar usuarios filtrados sin roles asignados
  const filteredUsersWithoutRoles = filteredUsers.filter(user => !userRoleAssignments[user.id]).length;
  if (filteredUsersWithoutRoles > 0) {
    rolesCombinations['Sin Roles'] = filteredUsersWithoutRoles;
  }

  // Convertir combinaciones a formato de gráfico
  return Object.entries(rolesCombinations).map(([combination, count], index) => {
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
};
