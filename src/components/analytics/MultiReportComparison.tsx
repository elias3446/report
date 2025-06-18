
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from 'lucide-react';

interface ReporteComparativo {
  id: string;
  titulo: string;
  estado: string;
  categoria: string;
  prioridad: string;
  fechaCreacion: string;
  activo: boolean;
}

interface MultiReportComparisonProps {
  reportesSeleccionados: ReporteComparativo[];
}

export const MultiReportComparison: React.FC<MultiReportComparisonProps> = ({
  reportesSeleccionados
}) => {
  if (reportesSeleccionados.length === 0) {
    return null;
  }

  const reportesActivos = reportesSeleccionados.filter(r => r.activo).length;
  const porcentajeActivos = Math.round((reportesActivos / reportesSeleccionados.length) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Reportes Seleccionados para Comparación
        </CardTitle>
        <CardDescription>
          Listado de {reportesSeleccionados.length} reportes seleccionados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{reportesSeleccionados.length}</div>
            <div className="text-sm text-muted-foreground">Total Reportes</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{reportesActivos}</div>
            <div className="text-sm text-muted-foreground">Reportes Activos</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{porcentajeActivos}%</div>
            <div className="text-sm text-muted-foreground">Tasa de Actividad</div>
          </div>
        </div>

        {/* Lista de reportes seleccionados */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground mb-3">Reportes seleccionados:</h4>
          {reportesSeleccionados.map((reporte, index) => (
            <div key={reporte.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-sm">{reporte.titulo}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(reporte.fechaCreacion).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {reporte.categoria}
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {reporte.estado}
                </span>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  {reporte.prioridad}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
