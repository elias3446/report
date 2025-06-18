
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  color: string;
  trend?: number;
}

interface InteractiveChartsProps {
  title: string;
  description?: string;
  data: ChartData[];
  type?: 'pie' | 'bar' | 'line' | 'area';
  showTrends?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{data.name || label}</p>
        <p className="text-sm text-muted-foreground">
          Valor: <span className="font-medium">{data.value}</span>
        </p>
        {data.payload.trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {data.payload.trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs ${data.payload.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(data.payload.trend)}%
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ name, value, percent }: any) => {
  if (percent > 5) {
    return `${(percent * 100).toFixed(0)}%`;
  }
  return '';
};

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  title,
  description,
  data,
  type = 'pie',
  showTrends = false,
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line' | 'area'>(type);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <div className="text-center">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p>No hay datos para mostrar</p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onClick={(entry) => setSelectedSegment(
                  selectedSegment === entry.name ? null : entry.name
                )}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={selectedSegment && selectedSegment !== entry.name ? 0.3 : 1}
                    className="cursor-pointer transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="#8884d8"
                onClick={(entry) => setSelectedSegment(
                  selectedSegment === entry.name ? null : entry.name
                )}
                className="cursor-pointer"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={selectedSegment && selectedSegment !== entry.name ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={chartType === 'pie' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('pie')}
              className="p-2"
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="p-2"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
        
        {/* Información adicional */}
        {selectedSegment && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">{selectedSegment}</span>
              <Badge variant="secondary">
                {data.find(d => d.name === selectedSegment)?.value} reportes
              </Badge>
            </div>
            {showTrends && data.find(d => d.name === selectedSegment)?.trend !== undefined && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                {data.find(d => d.name === selectedSegment)!.trend! > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={
                  data.find(d => d.name === selectedSegment)!.trend! > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }>
                  {Math.abs(data.find(d => d.name === selectedSegment)!.trend!)}% vs período anterior
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
