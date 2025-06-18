
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface HourlyData {
  hour: string;
  count: number;
  hourNumber: number;
}

interface ActivityPeakChartProps {
  data: any[];
  title?: string;
  subtitle?: string;
  color?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          Reportes: <span className="font-medium">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const ActivityPeakChart: React.FC<ActivityPeakChartProps> = ({
  data,
  title = "Pico de Actividad por Horas",
  subtitle = "Distribución de reportes durante el día",
  color = '#3b82f6'
}) => {
  // Procesar datos para crear distribución por horas
  const processHourlyData = (): HourlyData[] => {
    // Crear array de 24 horas (0-23)
    const hourlyData: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      count: 0,
      hourNumber: i
    }));

    // Contar reportes por hora
    data.forEach(reporte => {
      if (reporte.created_at) {
        const date = new Date(reporte.created_at);
        const hour = date.getHours();
        hourlyData[hour].count++;
      }
    });

    return hourlyData;
  };

  const hourlyData = processHourlyData();
  const maxCount = Math.max(...hourlyData.map(h => h.count));
  const peakHour = hourlyData.find(h => h.count === maxCount);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 12 }}
              interval={2}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pico de actividad:</span>
            <span className="font-medium">
              {peakHour?.hour || 'N/A'} ({maxCount} reportes)
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Total de reportes:</span>
            <span className="font-medium">{data.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
