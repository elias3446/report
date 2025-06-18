
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Settings, Activity } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatsCard } from '@/components/dashboard/StatsCard';

export const RolesAnalytics = () => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Análisis de Roles
        </h2>
        <p className="text-muted-foreground">
          Estadísticas sobre la gestión de roles y permisos
        </p>
      </div>

      {/* Estadísticas de roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Roles"
          value={stats.roles.total}
          subtitle="Roles definidos"
          icon={Shield}
          color="text-blue-600"
        />
        
        <StatsCard
          title="Roles Activos"
          value={stats.roles.activos}
          subtitle={`${Math.round((stats.roles.activos / Math.max(stats.roles.total, 1)) * 100)}% del total`}
          icon={Settings}
          color="text-green-600"
        />
        
        <StatsCard
          title="Asignaciones"
          value={stats.roles.asignaciones}
          subtitle="Roles asignados a usuarios"
          icon={Users}
          color="text-purple-600"
        />
        
        <StatsCard
          title="Promedio"
          value={Math.round(stats.roles.asignaciones / Math.max(stats.usuarios.total, 1) * 10) / 10}
          subtitle="Roles por usuario"
          icon={Activity}
          color="text-orange-600"
        />
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Distribución de Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Roles configurados</span>
                <span className="text-sm font-medium">{stats.roles.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Roles activos</span>
                <span className="text-sm font-medium">{stats.roles.activos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Roles inactivos</span>
                <span className="text-sm font-medium">{stats.roles.total - stats.roles.activos}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Asignaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total asignaciones</span>
                <span className="text-sm font-medium">{stats.roles.asignaciones}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Usuarios con roles</span>
                <span className="text-sm font-medium">
                  {stats.roles.asignaciones > 0 ? Math.min(stats.roles.asignaciones, stats.usuarios.total) : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Promedio por usuario</span>
                <span className="text-sm font-medium">
                  {Math.round(stats.roles.asignaciones / Math.max(stats.usuarios.total, 1) * 10) / 10}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
