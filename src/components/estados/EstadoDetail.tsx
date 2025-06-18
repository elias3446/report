
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useEstados } from '@/hooks/useEstados';
import { useReportes } from '@/hooks/useReportes';
import type { Estado } from '@/types/estados';
import { EstadoAuditoria } from './EstadoAuditoria';
import { EstadoReportesList } from './EstadoReportesList';
import { ReporteDetail } from '@/components/reportes/ReporteDetail';
import { 
  ArrowLeft, 
  Edit, 
  Circle, 
  Calendar,
  CheckCircle,
  XCircle,
  Lock,
  Clock,
  FileText,
  History,
  Settings,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect } from 'react';

interface EstadoDetailProps {
  estado: Estado;
  onEdit: (estado: Estado) => void;
  onBack: () => void;
}

// Define system estados that cannot be modified
const SYSTEM_ESTADOS = ['Sin estado'];

const isSystemEstado = (estadoName: string): boolean => {
  return SYSTEM_ESTADOS.includes(estadoName);
};

export const EstadoDetail = ({ estado: initialEstado, onEdit, onBack }: EstadoDetailProps) => {
  const { toggleEstadoStatus, isToggling, estados } = useEstados();
  const { reportes } = useReportes();
  const [currentEstado, setCurrentEstado] = useState(initialEstado);
  const [selectedReporteId, setSelectedReporteId] = useState<string | null>(null);

  // Update currentEstado when estados data changes
  useEffect(() => {
    const updatedEstado = estados.find(e => e.id === initialEstado.id);
    if (updatedEstado) {
      setCurrentEstado(updatedEstado);
    }
  }, [estados, initialEstado.id]);

  const handleToggleStatus = () => {
    if (isSystemEstado(currentEstado.nombre)) {
      return; // No allow status change for system estados
    }
    toggleEstadoStatus({ id: currentEstado.id, activo: !currentEstado.activo });
  };

  const handleEdit = () => {
    if (isSystemEstado(currentEstado.nombre)) {
      return; // No allow edit for system estados
    }
    onEdit(currentEstado);
  };

  const handleViewReporte = (reporteId: string) => {
    setSelectedReporteId(reporteId);
  };

  const handleBackFromReporteDetail = () => {
    setSelectedReporteId(null);
  };

  const handleEditReporte = (reporte: any) => {
    // This could be extended to handle reporte editing if needed
    console.log('Edit reporte:', reporte);
  };

  // If viewing reporte detail, show ReporteDetail component
  if (selectedReporteId) {
    const selectedReporte = reportes.find(r => r.id === selectedReporteId);
    if (selectedReporte) {
      return (
        <ReporteDetail
          reporte={selectedReporte}
          onEdit={handleEditReporte}
          onBack={handleBackFromReporteDetail}
        />
      );
    }
  }

  const isSystemEstadoItem = isSystemEstado(currentEstado.nombre);

  const getStatusBadge = () => {
    if (currentEstado.activo) {
      return {
        variant: "default" as const,
        icon: <CheckCircle className="h-3 w-3" />,
        text: "Activo"
      };
    } else {
      return {
        variant: "secondary" as const,
        icon: <XCircle className="h-3 w-3" />,
        text: "Inactivo"
      };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Detalle del Estado</h1>
            <p className="text-sm text-muted-foreground">Información completa del estado</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isSystemEstadoItem ? (
            <Button 
              onClick={handleEdit} 
              className="flex items-center gap-2 text-sm"
              size="sm"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Editar Estado</span>
              <span className="sm:hidden">Editar</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Lock className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Estado protegido del sistema</span>
              <span className="text-sm sm:hidden">Protegido</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Información Principal - Responsive */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-16 w-16 sm:h-24 sm:w-24">
                  <AvatarFallback 
                    className="text-lg sm:text-xl text-white"
                    style={{ backgroundColor: currentEstado.color }}
                  >
                    {currentEstado.icono.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-lg sm:text-xl">{currentEstado.nombre}</CardTitle>
              <p className="text-sm text-muted-foreground break-all">{currentEstado.descripcion}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm break-words">{currentEstado.descripcion}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Creado: {format(new Date(currentEstado.created_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Actualizado: {format(new Date(currentEstado.updated_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Estado del sistema
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Circle className="h-4 w-4 flex-shrink-0" />
                  Apariencia
                </h4>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: currentEstado.color }}
                    />
                    <span className="text-sm font-mono">{currentEstado.color}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Control de Estado del Estado */}
              <div className="space-y-3">
                <h4 className="font-medium">Estado del Estado</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={statusBadge.variant} 
                      className="flex items-center gap-1"
                    >
                      {statusBadge.icon}
                      {statusBadge.text}
                    </Badge>
                    {isSystemEstadoItem && (
                      <Badge variant="secondary" className="text-xs">
                        Sistema
                      </Badge>
                    )}
                  </div>
                  
                  {!isSystemEstadoItem && (
                    <Switch
                      checked={currentEstado.activo}
                      onCheckedChange={handleToggleStatus}
                      disabled={isToggling}
                    />
                  )}
                </div>
              </div>

              {isSystemEstadoItem && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Estado del Sistema</h4>
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <Lock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Protegido</p>
                        <p>Este estado no puede ser modificado.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información Detallada - Responsive */}
        <div className="xl:col-span-2">
          <Tabs defaultValue="reportes" className="space-y-4">
            {/* Responsive TabsList with scrollable layout */}
            <div className="overflow-x-auto">
              <TabsList className="flex w-full min-w-fit">
                <TabsTrigger value="reportes" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Reportes</span>
                </TabsTrigger>
                <TabsTrigger value="auditoria" className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 whitespace-nowrap">
                  <History className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Auditoría</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="reportes">
              <EstadoReportesList estado={currentEstado} onViewReporte={handleViewReporte} />
            </TabsContent>

            <TabsContent value="auditoria">
              <EstadoAuditoria estadoId={currentEstado.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
