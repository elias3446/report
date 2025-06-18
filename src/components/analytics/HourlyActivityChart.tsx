
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HourlyData {
  hour: string;
  count: number;
  hourNumber: number;
}

interface HourlyActivityChartProps {
  data: any[];
  title: string;
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

export const HourlyActivityChart: React.FC<HourlyActivityChartProps> = ({
  data,
  title,
  subtitle,
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

  if (data.length === 0) {
    return (
      <Card className="h-64">
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-64">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 10 }}
              interval={3}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              width={25}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              fill={color}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Pico de actividad: {hourlyData.find(h => h.count === maxCount)?.hour || 'N/A'} ({maxCount} reportes)
        </div>
      </CardContent>
    </Card>
  );
};
