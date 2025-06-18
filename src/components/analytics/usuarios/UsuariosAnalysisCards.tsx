
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Shield, Users, Activity } from 'lucide-react';

interface UsuariosAnalysisCardsProps {
  filteredStats: any;
  stats: any;
  hasValidFilters: boolean;
}

export const UsuariosAnalysisCards: React.FC<UsuariosAnalysisCardsProps> = ({ 
  filteredStats, 
  stats, 
  hasValidFilters 
}) => {
  return (
    <>
      {/* Análisis detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Análisis de Activación
            </CardTitle>
            <CardDescription>
              {hasValidFilters ? "Métricas de activación en usuarios filtrados" : "Métricas detalladas de activación"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <div>
                    <span className="font-medium">Usuarios Activos</span>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((filteredStats.usuarios.activos / Math.max(filteredStats.usuarios.total, 1)) * 100)}% del total
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{filteredStats.usuarios.activos}</div>
                  <div className="text-xs text-muted-foreground">usuarios</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <div>
                    <span className="font-medium">Usuarios Inactivos</span>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(((filteredStats.usuarios.total - filteredStats.usuarios.activos) / Math.max(filteredStats.usuarios.total, 1)) * 100)}% del total
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{filteredStats.usuarios.total - filteredStats.usuarios.activos}</div>
                  <div className="text-xs text-muted-foreground">usuarios</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Análisis de Confirmación
            </CardTitle>
            <CardDescription>
              {hasValidFilters ? "Métricas de confirmación en usuarios filtrados" : "Métricas detalladas de confirmación"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <div>
                    <span className="font-medium">Email Confirmado</span>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((filteredStats.usuarios.confirmados / Math.max(filteredStats.usuarios.total, 1)) * 100)}% del total
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{filteredStats.usuarios.confirmados}</div>
                  <div className="text-xs text-muted-foreground">usuarios</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500" />
                  <div>
                    <span className="font-medium">Email Pendiente</span>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(((filteredStats.usuarios.total - filteredStats.usuarios.confirmados) / Math.max(filteredStats.usuarios.total, 1)) * 100)}% del total
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{filteredStats.usuarios.total - filteredStats.usuarios.confirmados}</div>
                  <div className="text-xs text-muted-foreground">usuarios</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Resumen de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tasa de activación</span>
                <span className="text-sm font-medium">
                  {Math.round((filteredStats.usuarios.activos / Math.max(filteredStats.usuarios.total, 1)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tasa de confirmación</span>
                <span className="text-sm font-medium">
                  {Math.round((filteredStats.usuarios.confirmados / Math.max(filteredStats.usuarios.total, 1)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Usuarios recientes</span>
                <span className="text-sm font-medium text-green-600">
                  {filteredStats.usuarios.recientes}
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
                <span className="text-sm font-medium">{filteredStats.usuarios.recientes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Promedio diario</span>
                <span className="text-sm font-medium">
                  {Math.round(filteredStats.usuarios.recientes / 7)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{hasValidFilters ? 'Total filtrado' : 'Total histórico'}</span>
                <span className="text-sm font-medium">{filteredStats.usuarios.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              Eficiencia del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Usuarios por rol</span>
                <span className="text-sm font-medium">
                  {(filteredStats.usuarios.total / Math.max(stats?.roles.total || 1, 1)).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Asignaciones activas</span>
                <span className="text-sm font-medium">
                  {stats?.roles.asignaciones || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Roles activos</span>
                <span className="text-sm font-medium">
                  {Math.round(((stats?.roles.activos || 0) / Math.max(stats?.roles.total || 1, 1)) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
