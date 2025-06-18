import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { AdvancedFilters } from '@/hooks/useAdvancedFilters';
import { useUsers } from '@/hooks/useUsers';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRoles } from '@/hooks/useRoles';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UsuariosFilters } from './usuarios/UsuariosFilters';
import { UsuariosMetrics } from './usuarios/UsuariosMetrics';
import { UsuariosCharts } from './usuarios/UsuariosCharts';
import { UsuariosAnalysisCards } from './usuarios/UsuariosAnalysisCards';
import { getFilteredUserStats } from './usuarios/UsuariosStatsCalculator';
import { isValidForComparison } from './usuarios/UsuariosDataProcessor';

const UsuariosAnalyticsContent = () => {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  // CRÍTICO: Asegurar que SIEMPRE incluimos al usuario actual en analytics
  const { users } = useUsers(true);
  const { userRoles } = useUserRoles();
  const { roles } = useRoles();
  const { user: currentUser } = useAuth();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { toast } = useToast();

  console.log('UsuariosAnalytics - VERIFICACIÓN CRÍTICA:', {
    totalUsers: users?.length || 0,
    currentUserId: currentUser?.id,
    usersIncludesCurrent: users?.some(u => u.id === currentUser?.id),
    allUserEmails: users?.map(u => u.email),
    statsTotal: stats?.usuarios?.total,
    includeCurrentUserParam: true
  });

  const handleRefreshData = useCallback(async () => {
    try {
      await refetch();
      toast({
        title: "Éxito",
        description: "Datos actualizados correctamente",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar los datos",
        variant: "destructive",
      });
    }
  }, [refetch, toast]);

  const handleFiltersChange = useCallback((filters: AdvancedFilters) => {
    setAppliedFilters(filters);
    
    if (filters.searchTerm && filters.searchTerm.length > 0) {
      setSelectedUserIds(filters.searchTerm);
    } else if (filters.searchTerm.length === 0 && selectedUserIds.length > 0) {
      setSelectedUserIds([]);
    }
    
    console.log('Filtros aplicados:', filters);
  }, [selectedUserIds]);

  const handleUserSelection = useCallback((userIds: string[]) => {
    setSelectedUserIds(userIds);
    
    if (appliedFilters) {
      setAppliedFilters({
        ...appliedFilters,
        searchTerm: userIds
      });
    }
  }, [appliedFilters]);

  const hasValidFilters = appliedFilters && isValidForComparison(appliedFilters);

  const filteredStats = getFilteredUserStats(
    stats,
    users,
    appliedFilters,
    hasValidFilters,
    userRoles,
    roles,
    currentUser
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando estadísticas desde la base de datos...</p>
        </div>
      </div>
    );
  }

  if (error || !filteredStats) {
    return (
      <div className="text-center">
        <p className="text-destructive">Error al cargar las estadísticas de la base de datos</p>
        <Button onClick={handleRefreshData} className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {hasValidFilters ? 'Análisis Comparativo de Usuarios' : 'Análisis de Usuarios'}
          </h2>
          <p className="text-muted-foreground">
            Estadísticas sobre la gestión de usuarios
          </p>
        </div>
        <Button onClick={handleRefreshData} variant="outline" className="w-fit">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar Datos
        </Button>
      </div>

      {/* Filtros de Comparación */}
      <UsuariosFilters
        filtersOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
        onFiltersChange={handleFiltersChange}
        onUserSelection={handleUserSelection}
        selectedUserIds={selectedUserIds}
      />

      {/* Indicador de filtros aplicados */}
      {hasValidFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Comparación activa sobre datos reales (incluyendo usuario actual):</h3>
          <div className="flex flex-wrap gap-2 text-sm text-blue-700">
            {appliedFilters.activeTab === 'busqueda' && appliedFilters.searchTerm.length >= 2 && (
              <span className="bg-blue-100 px-2 py-1 rounded">
                Usuarios seleccionados: {appliedFilters.searchTerm.length}
              </span>
            )}
            {appliedFilters.activeTab === 'fechas' && appliedFilters.dateRange && (
              <span className="bg-blue-100 px-2 py-1 rounded">
                Fechas: {appliedFilters.dateRange.from.toLocaleDateString('es-ES')} - {appliedFilters.dateRange.to.toLocaleDateString('es-ES')}
              </span>
            )}
            {appliedFilters.activeTab === 'prioridad' && appliedFilters.priority.length > 0 && (
              <span className="bg-blue-100 px-2 py-1 rounded">
                Roles: {appliedFilters.priority.join(', ')}
              </span>
            )}
            {appliedFilters.activeTab === 'estados' && appliedFilters.estados.length > 0 && (
              <span className="bg-blue-100 px-2 py-1 rounded">
                Activación: {appliedFilters.estados.join(', ')}
              </span>
            )}
            {appliedFilters.activeTab === 'categorias' && appliedFilters.categorias.length > 0 && (
              <span className="bg-blue-100 px-2 py-1 rounded">
                Confirmación: {appliedFilters.categorias.join(', ')}
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-blue-600">
            Datos reales: {filteredStats.usuarios.total} de {users?.length || 0} usuarios (incluyendo usuario actual)
          </div>
        </div>
      )}

      {/* Indicador de vista en tiempo real */}
      {!hasValidFilters && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2">Vista en Tiempo Real:</h3>
          <div className="text-sm text-green-700">
            Mostrando todos los usuarios de la base de datos ({users?.length || 0} usuarios totales)
          </div>
        </div>
      )}

      {/* Métricas en Tiempo Real */}
      <UsuariosMetrics filteredStats={filteredStats} />

      {/* Gráficos Interactivos */}
      <UsuariosCharts filteredStats={filteredStats} hasValidFilters={hasValidFilters} />

      {/* Análisis detallado */}
      <UsuariosAnalysisCards 
        filteredStats={filteredStats} 
        stats={stats} 
        hasValidFilters={hasValidFilters} 
      />
    </div>
  );
};

export const UsuariosAnalytics = () => {
  return <UsuariosAnalyticsContent />;
};
