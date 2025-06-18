import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Activity, AlertTriangle, Users, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { RealTimeMetrics } from './RealTimeMetrics';
import { InteractiveCharts } from './InteractiveCharts';
import { AdvancedFiltersPanel } from './AdvancedFiltersPanel';
import { ActivityPeakChart } from './ActivityPeakChart';
import { AdvancedFilters } from '@/hooks/useAdvancedFilters';
import { useQueryClient } from '@tanstack/react-query';
import { useReportes } from '@/hooks/useReportes';
import { useToast } from '@/hooks/use-toast';

const priorityConfig = {
  urgente: { color: '#DC2626', label: 'Urgente' },
  alto: { color: '#EA580C', label: 'Alto' },
  medio: { color: '#D97706', label: 'Medio' },
  bajo: { color: '#059669', label: 'Bajo' },
};

const ReportesAnalyticsContent = () => {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const { reportes } = useReportes();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters | null>(null);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      setSelectedReportIds(filters.searchTerm);
    } else if (filters.searchTerm.length === 0 && selectedReportIds.length > 0) {
      setSelectedReportIds([]);
    }
    
    console.log('Filtros aplicados:', filters);
  }, [selectedReportIds]);

  const handleReportSelection = useCallback((reportIds: string[]) => {
    setSelectedReportIds(reportIds);
    
    if (appliedFilters) {
      setAppliedFilters({
        ...appliedFilters,
        searchTerm: reportIds
      });
    }
  }, [appliedFilters]);

  const isDateInRange = (dateString: string, dateRange: { from: Date; to: Date }) => {
    const reportDate = new Date(dateString);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    
    return reportDate >= fromDate && reportDate <= toDate;
  };

  const isValidForComparison = (filters: AdvancedFilters) => {
    switch (filters.activeTab) {
      case 'busqueda':
        return filters.searchTerm.length >= 2;
      case 'fechas':
        return filters.dateRange !== null;
      case 'prioridad':
        return filters.priority.length > 0;
      case 'estados':
        return filters.estados.length > 0;
      case 'categorias':
        return filters.categorias.length > 0;
      case 'estado_reporte':
        return filters.estados.length > 0;
      default:
        return false;
    }
  };

  const hasValidFilters = appliedFilters && isValidForComparison(appliedFilters);

  const getFilteredStats = () => {
    if (!stats) return stats;
    
    if (!hasValidFilters) {
      console.log('Sin filtros válidos - mostrando datos en tiempo real');
      return stats;
    }

    console.log('Aplicando filtros de comparación:', {
      totalReportes: stats.reportes.total,
      datosCompletos: stats.reportes.datosCompletos.length,
      filtros: appliedFilters,
      tabActiva: appliedFilters.activeTab
    });

    let filteredReportes = [...stats.reportes.datosCompletos];
    console.log('Reportes iniciales:', filteredReportes.length);

    switch (appliedFilters.activeTab) {
      case 'busqueda':
        if (appliedFilters.searchTerm.length >= 2) {
          const reportIds = appliedFilters.searchTerm;
          filteredReportes = filteredReportes.filter(reporte => 
            reportIds.includes(reporte.id)
          );
          console.log(`Filtro de búsqueda aplicado: ${filteredReportes.length} reportes seleccionados`);
        }
        break;

      case 'fechas':
        if (appliedFilters.dateRange) {
          filteredReportes = filteredReportes.filter(reporte => 
            isDateInRange(reporte.created_at, appliedFilters.dateRange!)
          );
          console.log(`Filtro de fecha aplicado: ${filteredReportes.length} reportes en el rango`);
        }
        break;

      case 'prioridad':
        if (appliedFilters.priority.length > 0) {
          filteredReportes = filteredReportes.filter(reporte => 
            appliedFilters.priority.includes(reporte.priority)
          );
          console.log(`Filtro de prioridad aplicado: ${filteredReportes.length} reportes`);
        }
        break;

      case 'estados':
        if (appliedFilters.estados.length > 0) {
          filteredReportes = filteredReportes.filter(reporte => 
            reporte.estado && appliedFilters.estados.includes(reporte.estado.nombre)
          );
          console.log(`Filtro de estado aplicado: ${filteredReportes.length} reportes`);
        }
        break;

      case 'categorias':
        if (appliedFilters.categorias.length > 0) {
          filteredReportes = filteredReportes.filter(reporte => 
            reporte.categoria && appliedFilters.categorias.includes(reporte.categoria.nombre)
          );
          console.log(`Filtro de categoría aplicado: ${filteredReportes.length} reportes`);
        }
        break;

      case 'estado_reporte':
        if (appliedFilters.estados.length > 0) {
          filteredReportes = filteredReportes.filter(reporte => {
            const estadoReporte = getEstadoReporte(reporte);
            return appliedFilters.estados.includes(estadoReporte);
          });
          console.log(`Filtro de estado del reporte aplicado: ${filteredReportes.length} reportes`);
        }
        break;
    }

    console.log('Resultado final del filtrado:', {
      reportesOriginales: stats.reportes.total,
      reportesFiltrados: filteredReportes.length,
      tabActiva: appliedFilters.activeTab
    });

    // Recalcular estadísticas basadas en datos filtrados reales
    const totalFiltrado = filteredReportes.length;
    const pendientesFiltrado = filteredReportes.filter(r => r.assigned_to === null && r.activo !== null).length;
    const enProcesoFiltrado = filteredReportes.filter(r => r.assigned_to !== null && r.activo !== null).length;
    const resueltosFiltrado = filteredReportes.filter(r => r.activo === null).length;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recientesFiltrado = filteredReportes.filter(r => 
      new Date(r.created_at) >= sevenDaysAgo
    ).length;

    // Re-agrupar por estado del reporte (Pendiente/En Proceso/Resuelto)
    const porEstadoReporteFiltrado = [
      { estado: 'Pendiente', count: pendientesFiltrado, color: '#F59E0B' },
      { estado: 'En Proceso', count: enProcesoFiltrado, color: '#3B82F6' },
      { estado: 'Resuelto', count: resueltosFiltrado, color: '#10B981' }
    ].filter(item => item.count > 0);

    // Re-agrupar por estado basado en datos filtrados
    const porEstadoFiltrado = filteredReportes.reduce((acc, reporte) => {
      const estadoNombre = reporte.estado?.nombre || 'Sin estado';
      const estadoColor = reporte.estado?.color || '#6B7280';
      const existing = acc.find(item => item.estado === estadoNombre);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ estado: estadoNombre, count: 1, color: estadoColor });
      }
      return acc;
    }, [] as { estado: string; count: number; color: string }[]);

    // Re-agrupar por categoría basado en datos filtrados
    const porCategoriaFiltrado = filteredReportes.reduce((acc, reporte) => {
      const categoriaNombre = reporte.categoria?.nombre || 'Sin categoría';
      const categoriaColor = reporte.categoria?.color || '#6B7280';
      const existing = acc.find(item => item.categoria === categoriaNombre);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ categoria: categoriaNombre, count: 1, color: categoriaColor });
      }
      return acc;
    }, [] as { categoria: string; count: number; color: string }[]);

    // Re-agrupar por prioridad basado en datos filtrados
    const porPrioridadFiltrado = filteredReportes.reduce((acc, reporte) => {
      const prioridad = reporte.priority;
      const existing = acc.find(item => item.priority === prioridad);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ priority: prioridad, count: 1 });
      }
      return acc;
    }, [] as { priority: string; count: number }[]);

    return {
      ...stats,
      reportes: {
        ...stats.reportes,
        total: totalFiltrado,
        activos: enProcesoFiltrado + pendientesFiltrado,
        pendientes: pendientesFiltrado,
        enProceso: enProcesoFiltrado,
        resueltos: resueltosFiltrado,
        recientes: recientesFiltrado,
        porEstado: porEstadoFiltrado,
        porCategoria: porCategoriaFiltrado,
        porPrioridad: porPrioridadFiltrado,
        porEstadoReporte: porEstadoReporteFiltrado,
        datosCompletos: filteredReportes,
      }
    };
  };

  const getEstadoReporte = (reporte: any) => {
    if (reporte.activo === null) {
      return 'Resuelto';
    } else if (reporte.assigned_to !== null) {
      return 'En Proceso';
    } else {
      return 'Pendiente';
    }
  };

  const filteredStats = getFilteredStats();

  // Preparar datos para comparación múltiple de reportes - solo datos reales
  const reportesParaComparacion = selectedReportIds.length > 0 && reportes ? 
    reportes
      .filter(r => selectedReportIds.includes(r.id))
      .map(r => ({
        id: r.id,
        titulo: r.nombre,
        estado: r.estado?.nombre || 'Sin estado',
        categoria: r.categoria?.nombre || 'Sin categoría',
        prioridad: r.priority,
        fechaCreacion: r.created_at,
        activo: r.activo
      })) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error || !filteredStats) {
    return (
      <div className="text-center">
        <p className="text-destructive">Error al cargar las estadísticas</p>
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
            {hasValidFilters ? 'Análisis Comparativo de Reportes' : 'Análisis de Reportes'}
          </h2>
          <p className="text-muted-foreground">
            {hasValidFilters 
              ? 'Dashboard interactivo con filtros de comparación aplicados'
              : 'Estadísticas sobre la gestión de reportes'
            }
          </p>
        </div>
        <Button onClick={handleRefreshData} variant="outline" className="w-fit">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar Datos
        </Button>
      </div>

      {/* Filtros de Comparación */}
      <AdvancedFiltersPanel
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
        onFiltersChange={handleFiltersChange}
        onMultipleReportSelection={handleReportSelection}
        selectedReportIds={selectedReportIds}
      />

      {/* Indicador de filtros aplicados */}
      {hasValidFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Comparación activa:</h3>
          <div className="flex flex-wrap gap-2 text-sm text-blue-700">
            {appliedFilters.activeTab === 'busqueda' && appliedFilters.searchTerm.length >= 2 && (
              <span className="bg-blue-100 px-2 py-1 rounded">
                Reportes seleccionados: {appliedFilters.searchTerm.length}
              </span>
            )}
            {appliedFilters.activeTab === 'fechas' && appliedFilters.dateRange && (
              <span className="bg-blue-100 px-2 py-1 rounded">
                Fechas: {appliedFilters.dateRange.from.toLocaleDateString('es-ES')} - {appliedFilters.dateRange.to.toLocaleDateString('es-ES')}
              </span>
            )}
            {appliedFilters.activeTab === 'prioridad' && appliedFilters.priority.length > 0 && (
              <span className="bg-blue-100 px-2 py-1 rounded">Prioridades: {appliedFilters.priority.join(', ')}</span>
            )}
            {appliedFilters.activeTab === 'estados' && appliedFilters.estados.length > 0 && (
              <span className="bg-blue-100 px-2 py-1 rounded">Estados DB: {appliedFilters.estados.join(', ')}</span>
            )}
            {appliedFilters.activeTab === 'categorias' && appliedFilters.categorias.length > 0 && (
              <span className="bg-blue-100 px-2 py-1 rounded">Categorías: {appliedFilters.categorias.join(', ')}</span>
            )}
            {appliedFilters.activeTab === 'estado_reporte' && appliedFilters.estados.length > 0 && (
              <span className="bg-blue-100 px-2 py-1 rounded">Estado Reporte: {appliedFilters.estados.join(', ')}</span>
            )}
          </div>
          <div className="mt-2 text-xs text-blue-600">
            Comparando {filteredStats.reportes.total} de {stats?.reportes.total} reportes
          </div>
        </div>
      )}

      {/* Indicador de vista en tiempo real */}
      {!hasValidFilters && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2">Vista en Tiempo Real:</h3>
          <div className="text-sm text-green-700">
            Mostrando todos los reportes del sistema ({stats?.reportes.total} reportes)
          </div>
        </div>
      )}

      {/* Métricas actualizadas con estados de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <RealTimeMetrics
          title="Total Reportes"
          value={filteredStats.reportes.total}
          subtitle="En el sistema"
          icon={FileText}
          color="text-blue-600"
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })}
          showHourlyChart={false}
        />
        
        <RealTimeMetrics
          title="Pendientes"
          value={filteredStats.reportes.pendientes}
          subtitle="Por procesar"
          icon={Clock}
          color="text-yellow-600"
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })}
          showHourlyChart={false}
        />
        
        <RealTimeMetrics
          title="En Proceso"
          value={filteredStats.reportes.enProceso}
          subtitle="Siendo atendidos"
          icon={TrendingUp}
          color="text-blue-600"
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })}
          showHourlyChart={false}
        />
        
        <RealTimeMetrics
          title="Resueltos"
          value={filteredStats.reportes.resueltos}
          subtitle="Completados"
          icon={CheckCircle}
          color="text-green-600"
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })}
          showHourlyChart={false}
        />
        
        <RealTimeMetrics
          title="Recientes"
          value={filteredStats.reportes.recientes}
          subtitle="Últimos 7 días"
          icon={Activity}
          color="text-orange-600"
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })}
          showHourlyChart={false}
        />
      </div>

      {/* Gráfico de Pico de Actividad - Componente separado */}
      <ActivityPeakChart
        data={filteredStats.reportes.datosCompletos}
        title={hasValidFilters ? "Pico de Actividad - Reportes Filtrados" : "Pico de Actividad - Todos los Reportes"}
        subtitle={hasValidFilters 
          ? `Distribución horaria de ${filteredStats.reportes.total} reportes filtrados`
          : `Distribución horaria de todos los reportes (${filteredStats.reportes.total} total)`
        }
        color="#3b82f6"
      />

      {/* Gráficos Interactivos - SOLO DATOS REALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nuevo gráfico: Distribución por Estado del Reporte */}
        <InteractiveCharts
          title="Estado de los Reportes"
          description="Distribución de reportes por su estado actual: Pendiente, En Proceso o Resuelto"
          data={filteredStats.reportes.porEstadoReporte.map(item => ({
            name: item.estado,
            value: item.count,
            color: item.color,
          }))}
        />
        
        <InteractiveCharts
          title="Distribución por Estado"
          description={hasValidFilters ? "Reportes filtrados clasificados según su estado" : "Todos los reportes clasificados según su estado actual"}
          data={filteredStats.reportes.porEstado.map(item => ({
            name: item.estado,
            value: item.count,
            color: item.color,
          }))}
        />
        
        <InteractiveCharts
          title="Distribución por Categoría"
          description={hasValidFilters ? "Reportes filtrados clasificados según su categoría" : "Todos los reportes clasificados según su categoría"}
          data={filteredStats.reportes.porCategoria.map(item => ({
            name: item.categoria,
            value: item.count,
            color: item.color,
          }))}
        />

        {filteredStats.reportes.porPrioridad && filteredStats.reportes.porPrioridad.length > 0 && (
          <InteractiveCharts
            title="Distribución por Prioridad"
            description={hasValidFilters ? "Reportes filtrados clasificados según su prioridad" : "Todos los reportes clasificados según su nivel de prioridad"}
            data={filteredStats.reportes.porPrioridad.map(item => ({
              name: priorityConfig[item.priority as keyof typeof priorityConfig]?.label || item.priority,
              value: item.count,
              color: priorityConfig[item.priority as keyof typeof priorityConfig]?.color || '#6B7280',
            }))}
          />
        )}
      </div>

      {/* Análisis de Prioridades mejorado */}
      {filteredStats.reportes.porPrioridad && filteredStats.reportes.porPrioridad.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Análisis de Prioridades por Estado
            </CardTitle>
            <CardDescription>
              {hasValidFilters 
                ? "Distribución de prioridades según el estado de los reportes filtrados" 
                : "Análisis detallado de prioridades basado en el estado actual de todos los reportes"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStats.reportes.porPrioridad.map((item) => {
                const config = priorityConfig[item.priority as keyof typeof priorityConfig];
                const percentage = Math.round((item.count / Math.max(filteredStats.reportes.total, 1)) * 100);
                
                // Calcular distribución por estado para esta prioridad usando la nueva lógica
                const reportesConEstaPrioridad = filteredStats.reportes.datosCompletos.filter(r => r.priority === item.priority);
                const pendientesCount = reportesConEstaPrioridad.filter(r => r.assigned_to === null && r.activo !== null).length;
                const enProcesoCount = reportesConEstaPrioridad.filter(r => r.assigned_to !== null && r.activo !== null).length;
                const resueltosCount = reportesConEstaPrioridad.filter(r => r.activo === null).length;
                
                return (
                  <div key={item.priority} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: config?.color || '#6B7280' }}
                        />
                        <div>
                          <span className="font-medium">
                            {config?.label || item.priority}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {percentage}% del total
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{item.count}</div>
                        <div className="text-xs text-muted-foreground">reportes</div>
                      </div>
                    </div>
                    
                    {/* Distribución por estado para esta prioridad */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-yellow-50 p-2 rounded text-center">
                        <div className="font-medium text-yellow-700">{pendientesCount}</div>
                        <div className="text-yellow-600">Pendientes</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <div className="font-medium text-blue-700">{enProcesoCount}</div>
                        <div className="text-blue-600">En Proceso</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded text-center">
                        <div className="font-medium text-green-700">{resueltosCount}</div>
                        <div className="text-green-600">Resueltos</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas adicionales - BASADAS EN DATOS REALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Resumen de Estados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pendientes</span>
                <span className="text-sm font-medium text-yellow-600">
                  {filteredStats.reportes.pendientes} ({Math.round((filteredStats.reportes.pendientes / Math.max(filteredStats.reportes.total, 1)) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">En proceso</span>
                <span className="text-sm font-medium text-blue-600">
                  {filteredStats.reportes.enProceso} ({Math.round((filteredStats.reportes.enProceso / Math.max(filteredStats.reportes.total, 1)) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Resueltos</span>
                <span className="text-sm font-medium text-green-600">
                  {filteredStats.reportes.resueltos} ({Math.round((filteredStats.reportes.resueltos / Math.max(filteredStats.reportes.total, 1)) * 100)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              Distribución Temporal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Esta semana</span>
                <span className="text-sm font-medium">{filteredStats.reportes.recientes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Promedio diario (últimos 7 días)</span>
                <span className="text-sm font-medium">
                  {(filteredStats.reportes.recientes / 7).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{hasValidFilters ? 'Total filtrado' : 'Total histórico'}</span>
                <span className="text-sm font-medium">{filteredStats.reportes.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Eficiencia del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tasa de resolución</span>
                <span className="text-sm font-medium">
                  {Math.round((filteredStats.reportes.resueltos / Math.max(filteredStats.reportes.total, 1)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Reportes por categoría</span>
                <span className="text-sm font-medium">
                  {(filteredStats.reportes.total / Math.max(filteredStats.categorias.total, 1)).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Reportes por estado</span>
                <span className="text-sm font-medium">
                  {(filteredStats.reportes.total / Math.max(filteredStats.estados.total, 1)).toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const ReportesAnalytics = () => {
  return <ReportesAnalyticsContent />;
};
