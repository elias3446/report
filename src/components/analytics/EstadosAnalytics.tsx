
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle, Settings, Activity, FileText } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatsCard } from '@/components/dashboard/StatsCard';

export const EstadosAnalytics = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

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

  if (error || !stats) {
    return (
      <div className="text-center">
        <p className="text-destructive">Error al cargar las estadísticas</p>
      </div>
    );
  }

  // Calcular métricas basadas únicamente en datos reales de la base de datos
  const totalEstados = stats.estados.total;
  const estadosActivos = stats.estados.activos;
  const porcentajeActivos = totalEstados > 0 ? Math.round((estadosActivos / totalEstados) * 100) : 0;
  
  // Obtener el estado más usado basándose en datos reales
  const estadoMasUsado = stats.reportes.porEstado.length > 0 
    ? Math.max(...stats.reportes.porEstado.map(e => e.count)) 
    : 0;
  
  // Calcular promedio de reportes por estado usando datos reales
  const promedioReportesPorEstado = totalEstados > 0 
    ? Math.round(stats.reportes.total / totalEstados * 10) / 10 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Análisis de Estados
        </h2>
        <p className="text-muted-foreground">
          Estadísticas sobre los estados de los reportes basadas en datos reales
        </p>
      </div>

      {/* Estadísticas de estados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Estados"
          value={totalEstados}
          subtitle="Estados en la base de datos"
          icon={Circle}
          color="text-blue-600"
        />
        
        <StatsCard
          title="Estados Activos"
          value={estadosActivos}
          subtitle={`${porcentajeActivos}% del total`}
          icon={Settings}
          color="text-green-600"
        />
        
        <StatsCard
          title="Más Usado"
          value={estadoMasUsado}
          subtitle="Reportes en estado principal"
          icon={FileText}
          color="text-purple-600"
        />
        
        <StatsCard
          title="Promedio"
          value={promedioReportesPorEstado}
          subtitle="Reportes por estado"
          icon={Activity}
          color="text-orange-600"
        />
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Circle className="h-4 w-4 text-blue-600" />
              Estado de Configuración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estados totales</span>
                <span className="text-sm font-medium">{totalEstados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estados activos</span>
                <span className="text-sm font-medium">{estadosActivos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estados inactivos</span>
                <span className="text-sm font-medium">{totalEstados - estadosActivos}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              Uso en Reportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estados con reportes</span>
                <span className="text-sm font-medium">{stats.reportes.porEstado.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total reportes</span>
                <span className="text-sm font-medium">{stats.reportes.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Promedio por estado</span>
                <span className="text-sm font-medium">{promedioReportesPorEstado}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
