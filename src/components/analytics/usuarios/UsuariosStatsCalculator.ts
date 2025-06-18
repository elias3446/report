
import type { AdvancedFilters } from '@/hooks/useAdvancedFilters';
import { isDateInRange, calculateUserTypeDistribution, calculateRoleDistribution } from './UsuariosDataProcessor';

export const getFilteredUserStats = (
  stats: any,
  users: any[],
  appliedFilters: AdvancedFilters | null,
  hasValidFilters: boolean,
  userRoles: any[],
  roles: any[],
  currentUser: any
) => {
  // Always return stats from database - no simulation or mock data
  if (!stats || !users) return null;
  
  if (!hasValidFilters) {
    console.log('Sin filtros válidos - mostrando TODOS los datos reales de la base de datos incluyendo usuario actual');
    console.log('Total usuarios encontrados:', users.length);
    
    // Recalcular las estadísticas usando TODOS los usuarios (incluyendo el actual)
    const totalUsuarios = users.length;
    const activosUsuarios = users.filter(u => u.asset === true).length;
    const confirmadosUsuarios = users.filter(u => u.confirmed === true).length;
    
    // Calculate recent users (last 7 days) from all users
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recientesUsuarios = users.filter(u => 
      new Date(u.created_at) >= sevenDaysAgo
    ).length;

    // Recalculate groupings based on ALL users
    const porEstadoActivacion = [
      { estado: 'Activos', count: activosUsuarios, color: '#10B981' },
      { estado: 'Inactivos', count: totalUsuarios - activosUsuarios, color: '#EF4444' }
    ];

    const porConfirmacion = [
      { categoria: 'Confirmados', count: confirmadosUsuarios, color: '#3B82F6' },
      { categoria: 'No confirmados', count: totalUsuarios - confirmadosUsuarios, color: '#F59E0B' }
    ];

    const porRoles = calculateRoleDistribution(users, userRoles, roles);
    const porTipoUsuario = calculateUserTypeDistribution(users);

    return {
      ...stats,
      usuarios: {
        ...stats.usuarios,
        total: totalUsuarios,
        activos: activosUsuarios,
        confirmados: confirmadosUsuarios,
        recientes: recientesUsuarios,
        porEstadoActivacion,
        porConfirmacion,
        porRoles,
        porTipoUsuario,
        datosCompletos: users,
      }
    };
  }

  console.log('Aplicando filtros de comparación sobre datos reales (incluyendo usuario actual):', {
    totalUsuarios: stats.usuarios.total,
    usuariosCompletos: users.length,
    filtros: appliedFilters,
    tabActiva: appliedFilters.activeTab,
    usuarioActual: currentUser?.id
  });

  // Use ALL real database data - filter the complete users array (including current user)
  let filteredUsers = [...users];
  console.log('Usuarios reales iniciales (TODOS incluyendo usuario actual):', filteredUsers.length);

  switch (appliedFilters.activeTab) {
    case 'busqueda':
      if (appliedFilters.searchTerm.length >= 2) {
        const userIds = [...appliedFilters.searchTerm];
        
        filteredUsers = filteredUsers.filter(user => 
          userIds.includes(user.id)
        );
        console.log(`Filtro de búsqueda aplicado: ${filteredUsers.length} usuarios seleccionados`);
      }
      break;

    case 'fechas':
      if (appliedFilters.dateRange) {
        filteredUsers = filteredUsers.filter(user => 
          isDateInRange(user.created_at, appliedFilters.dateRange!)
        );
        console.log(`Filtro de fecha aplicado: ${filteredUsers.length} usuarios en el rango`);
      }
      break;

    case 'prioridad': // roles
      if (appliedFilters.priority.length > 0) {
        const selectedRoleNames = appliedFilters.priority;
        console.log('Roles seleccionados:', selectedRoleNames);
        console.log('UserRoles disponibles:', userRoles);
        console.log('Roles disponibles:', roles);
        console.log('Usuario actual:', currentUser?.id);
        
        // Obtener los IDs de los roles seleccionados
        const selectedRoleIds = roles?.filter(role => 
          selectedRoleNames.includes(role.nombre)
        ).map(role => role.id) || [];
        
        console.log('IDs de roles seleccionados:', selectedRoleIds);
        
        // Obtener los IDs de usuarios que tienen alguno de los roles seleccionados
        const userIdsWithSelectedRoles = userRoles?.filter(userRole => 
          selectedRoleIds.includes(userRole.role_id) && !userRole.deleted_at
        ).map(userRole => userRole.user_id) || [];
        
        console.log('IDs de usuarios con roles seleccionados:', userIdsWithSelectedRoles);
        
        // Filtrar usuarios que tienen alguno de los roles seleccionados
        filteredUsers = filteredUsers.filter(user => {
          // Verificar en user_roles table
          const hasRoleInTable = userIdsWithSelectedRoles.includes(user.id);
          
          // Verificar en el campo role del perfil
          const hasRoleInProfile = user.role && Array.isArray(user.role) && 
            selectedRoleNames.some(roleName => user.role.includes(roleName));
          
          return hasRoleInTable || hasRoleInProfile;
        });
        
        console.log(`Filtro de roles aplicado: ${filteredUsers.length} usuarios con roles seleccionados`);
        console.log('Usuarios encontrados con roles:', filteredUsers.map(u => ({ id: u.id, email: u.email })));
      }
      break;

    case 'estados': // activación
      if (appliedFilters.estados.length > 0) {
        filteredUsers = filteredUsers.filter(user => {
          const isActive = user.asset;
          const userState = isActive ? 'Activo' : 'Inactivo';
          return appliedFilters.estados.includes(userState);
        });
        console.log(`Filtro de activación aplicado: ${filteredUsers.length} usuarios con estados seleccionados`);
      }
      break;

    case 'categorias': // confirmación
      if (appliedFilters.categorias.length > 0) {
        filteredUsers = filteredUsers.filter(user => {
          const isConfirmed = user.confirmed;
          const userConfirmation = isConfirmed ? 'Confirmado' : 'No Confirmado';
          return appliedFilters.categorias.includes(userConfirmation);
        });
        console.log(`Filtro de confirmación aplicado: ${filteredUsers.length} usuarios con confirmaciones seleccionadas`);
      }
      break;
  }

  console.log('Resultado final del filtrado sobre TODOS los datos reales (incluyendo usuario actual):', {
    usuariosOriginales: users.length, // Usar users.length en lugar de stats.usuarios.total
    usuariosFiltrados: filteredUsers.length,
    tabActiva: appliedFilters.activeTab,
    incluyeUsuarioActual: currentUser?.id ? filteredUsers.some(u => u.id === currentUser.id) : false
  });

  // Recalculate statistics based on real filtered data only
  const totalFiltrado = filteredUsers.length;
  const activosFiltrado = filteredUsers.filter(u => u.asset === true).length;
  const confirmadosFiltrado = filteredUsers.filter(u => u.confirmed === true).length;
  
  // Calculate recent users (last 7 days) from real filtered data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recientesFiltrado = filteredUsers.filter(u => 
    new Date(u.created_at) >= sevenDaysAgo
  ).length;

  // Recalculate groupings based on real data only
  const porEstadoActivacion = [
    { estado: 'Activos', count: activosFiltrado, color: '#10B981' },
    { estado: 'Inactivos', count: totalFiltrado - activosFiltrado, color: '#EF4444' }
  ];

  const porConfirmacion = [
    { categoria: 'Confirmados', count: confirmadosFiltrado, color: '#3B82F6' },
    { categoria: 'No confirmados', count: totalFiltrado - confirmadosFiltrado, color: '#F59E0B' }
  ];

  const porRoles = calculateRoleDistribution(filteredUsers, userRoles, roles);
  const porTipoUsuario = calculateUserTypeDistribution(filteredUsers);

  return {
    ...stats,
    usuarios: {
      ...stats.usuarios,
      total: totalFiltrado,
      activos: activosFiltrado,
      confirmados: confirmadosFiltrado,
      recientes: recientesFiltrado,
      porEstadoActivacion,
      porConfirmacion,
      porRoles,
      porTipoUsuario,
      datosCompletos: filteredUsers,
    }
  };
};
