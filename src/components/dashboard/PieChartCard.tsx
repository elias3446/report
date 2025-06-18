
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartCardProps {
  title: string;
  description?: string;
  data: PieChartData[];
}

export const PieChartCard = ({ title, description, data }: PieChartCardProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} reportes
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ name, value, percent }: any) => {
    if (percent > 5) { // Solo mostrar etiqueta si el segmento es mayor al 5%
      return `${(percent * 100).toFixed(0)}%`;
    }
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No hay datos para mostrar
          </div>
        )}
      </CardContent>
    </Card>
  );
};
