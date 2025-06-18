
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { 
  FileText, 
  User,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Eye,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useReportes } from '@/hooks/useReportes';
import type { Estado } from '@/types/estados';

interface EstadoReportesListProps {
  estado: Estado;
  onViewReporte?: (reporteId: string) => void;
}

export const EstadoReportesList: React.FC<EstadoReportesListProps> = ({ estado, onViewReporte }) => {
  const { reportes, isLoading, deleteReporte, isDeleting } = useReportes();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reporteToDelete, setReporteToDelete] = useState<string | null>(null);

  // Filtrar reportes que tienen este estado específico
  const reportesWithEstado = reportes.filter(reporte => reporte.estado_id === estado.id);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-500';
      case 'alto':
        return 'bg-orange-500';
      case 'medio':
        return 'bg-yellow-500';
      case 'bajo':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      urgente: 'Urgente',
      alto: 'Alto',
      medio: 'Medio',
      bajo: 'Bajo'
    };
    return labels[priority] || priority;
  };

  const getCreatorName = (reporte: any) => {
    const profile = reporte.created_by_profile;
    if (!profile) return 'Usuario desconocido';
    
    const parts = [profile.first_name, profile.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : profile.email;
  };

  const getAssignedToName = (reporte: any) => {
    const profile = reporte.assigned_to_profile;
    if (!profile) return null;
    
    const parts = [profile.first_name, profile.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : profile.email;
  };

  const handleViewReporte = (reporteId: string) => {
    if (onViewReporte) {
      onViewReporte(reporteId);
    }
  };

  const handleDeleteClick = (reporteId: string) => {
    setReporteToDelete(reporteId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (reporteToDelete) {
      deleteReporte(reporteToDelete);
      setDeleteDialogOpen(false);
      setReporteToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setReporteToDelete(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reportes con este Estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reportes con este Estado ({reportesWithEstado.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportesWithEstado.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No hay reportes con este estado
              </p>
              <p className="text-sm text-muted-foreground">
                Este estado no está asignado a ningún reporte actualmente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportesWithEstado.map((reporte) => (
                <div 
                  key={reporte.id} 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                      style={{ backgroundColor: estado.color }}
                    >
                      {estado.icono.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h4 className="font-medium truncate">
                          {reporte.nombre}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs text-white ${getPriorityColor(reporte.priority)}`}
                          >
                            {getPriorityLabel(reporte.priority)}
                          </Badge>
                          <Badge variant={reporte.activo ? "default" : "secondary"} className="text-xs">
                            {reporte.activo ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {reporte.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {reporte.descripcion}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Creado por: {getCreatorName(reporte)}</span>
                        </div>
                        
                        {getAssignedToName(reporte) && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Asignado a: {getAssignedToName(reporte)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Creado: {format(new Date(reporte.created_at), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>
                        
                        {reporte.direccion && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{reporte.direccion}</span>
                          </div>
                        )}
                      </div>

                      {reporte.categoria && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: reporte.categoria.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              Categoría: {reporte.categoria.nombre}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReporte(reporte.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(reporte.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar Reporte"
        description="¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </>
  );
};
