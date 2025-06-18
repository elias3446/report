import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUserReportes } from '@/hooks/useUserReportes';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  ExternalLink,
  AlertCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface UserReportesAsignadosProps {
  userId: string;
  userName: string;
}

export const UserReportesAsignados = ({ userId, userName }: UserReportesAsignadosProps) => {
  const { data: reportes = [], isLoading, error } = useUserReportes(userId);
  const navigate = useNavigate();

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return { variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" /> };
      case 'alto':
        return { variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" /> };
      case 'medio':
        return { variant: 'default' as const, icon: <Clock className="h-3 w-3" /> };
      case 'bajo':
        return { variant: 'secondary' as const, icon: <Clock className="h-3 w-3" /> };
      default:
        return { variant: 'secondary' as const, icon: <Clock className="h-3 w-3" /> };
    }
  };

  const handleNavigateToReporte = (reporteId: string) => {
    // Navigate to admin reportes with the specific report in view mode
    navigate(`/admin/reportes?view=${reporteId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reportes Asignados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Cargando reportes...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reportes Asignados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive">Error al cargar los reportes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Reportes Asignados ({reportes.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Reportes actualmente asignados a {userName}
        </p>
      </CardHeader>
      <CardContent>
        {reportes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Este usuario no tiene reportes asignados</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {reportes.map((reporte, index) => {
                const priorityBadge = getPriorityBadge(reporte.priority);
                
                return (
                  <div key={reporte.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-2"
                            style={{ backgroundColor: reporte.categoria?.color || '#6B7280' }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1 line-clamp-1">
                              {reporte.nombre}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {reporte.descripcion}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {reporte.categoria?.nombre || 'Sin categoría'}
                              </Badge>
                              
                              {reporte.estado && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs"
                                  style={{ 
                                    backgroundColor: `${reporte.estado.color}20`,
                                    color: reporte.estado.color,
                                    borderColor: `${reporte.estado.color}40`
                                  }}
                                >
                                  {reporte.estado.nombre}
                                </Badge>
                              )}
                              
                              <Badge variant={priorityBadge.variant} className="text-xs flex items-center gap-1">
                                {priorityBadge.icon}
                                {reporte.priority}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(reporte.created_at), 'dd/MM/yyyy', { locale: es })}
                              </div>
                              
                              {reporte.direccion && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-32">{reporte.direccion}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-shrink-0"
                        onClick={() => handleNavigateToReporte(reporte.id)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                    </div>
                    
                    {index < reportes.length - 1 && <Separator className="mt-4" />}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
