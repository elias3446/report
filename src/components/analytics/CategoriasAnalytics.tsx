
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Settings, Activity, FileText } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatsCard } from '@/components/dashboard/StatsCard';

export const CategoriasAnalytics = () => {
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
  const totalCategorias = stats.categorias.total;
  const categoriasActivas = stats.categorias.activas;
  const porcentajeActivas = totalCategorias > 0 ? Math.round((categoriasActivas / totalCategorias) * 100) : 0;
  
  // Obtener la categoría más usada basándose en datos reales
  const categoriaMasUsada = stats.reportes.porCategoria.length > 0 
    ? Math.max(...stats.reportes.porCategoria.map(c => c.count)) 
    : 0;
  
  // Calcular promedio de reportes por categoría usando datos reales
  const promedioReportesPorCategoria = totalCategorias > 0 
    ? Math.round(stats.reportes.total / totalCategorias * 10) / 10 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Análisis de Categorías
        </h2>
        <p className="text-muted-foreground">
          Estadísticas sobre las categorías de reportes basadas en datos reales
        </p>
      </div>

      {/* Estadísticas de categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Categorías"
          value={totalCategorias}
          subtitle="Categorías en la base de datos"
          icon={FolderOpen}
          color="text-blue-600"
        />
        
        <StatsCard
          title="Categorías Activas"
          value={categoriasActivas}
          subtitle={`${porcentajeActivas}% del total`}
          icon={Settings}
          color="text-green-600"
        />
        
        <StatsCard
          title="Más Usada"
          value={categoriaMasUsada}
          subtitle="Reportes en categoría principal"
          icon={FileText}
          color="text-purple-600"
        />
        
        <StatsCard
          title="Promedio"
          value={promedioReportesPorCategoria}
          subtitle="Reportes por categoría"
          icon={Activity}
          color="text-orange-600"
        />
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-blue-600" />
              Estado de Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Categorías totales</span>
                <span className="text-sm font-medium">{totalCategorias}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Categorías activas</span>
                <span className="text-sm font-medium">{categoriasActivas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Categorías inactivas</span>
                <span className="text-sm font-medium">{totalCategorias - categoriasActivas}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              Uso de Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Categorías con reportes</span>
                <span className="text-sm font-medium">{stats.reportes.porCategoria.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total reportes</span>
                <span className="text-sm font-medium">{stats.reportes.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Promedio por categoría</span>
                <span className="text-sm font-medium">{promedioReportesPorCategoria}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
