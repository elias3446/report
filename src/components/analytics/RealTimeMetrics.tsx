
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { HourlyActivityChart } from './HourlyActivityChart';

interface MetricValue {
  current: number;
  previous: number;
  timestamp: Date;
}

interface RealTimeMetricsProps {
  title: string;
  value: number;
  previousValue?: number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  formatValue?: (value: number) => string;
  refreshInterval?: number;
  onRefresh?: () => void;
  // Nuevas props para gráficos de actividad
  showHourlyChart?: boolean;
  hourlyData?: any[];
  chartColor?: string;
  showSparkline?: boolean; // Nueva prop para controlar la visualización del sparkline
}

export const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  title,
  value,
  previousValue,
  subtitle,
  icon: Icon,
  color = 'text-primary',
  formatValue = (val) => val.toLocaleString(),
  refreshInterval = 30000, // 30 seconds
  onRefresh,
  showHourlyChart = false,
  hourlyData = [],
  chartColor = '#3b82f6',
  showSparkline = false // Por defecto no mostrar sparkline
}) => {
  const [metricHistory, setMetricHistory] = useState<MetricValue[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Calculate trend
  const trend = previousValue !== undefined ? ((value - previousValue) / previousValue) * 100 : 0;
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable';

  // Auto refresh
  useEffect(() => {
    if (!refreshInterval || !onRefresh) return;

    const interval = setInterval(async () => {
      setIsRefreshing(true);
      try {
        await onRefresh();
        // Simulate data change detection
        if (metricHistory.length > 0) {
          const lastValue = metricHistory[metricHistory.length - 1].current;
          if (lastValue !== value) {
            toast({
              title: "Actualización de Datos",
              description: `${title}: ${formatValue(lastValue)} → ${formatValue(value)}`,
              variant: "default",
            });
          }
        }
      } finally {
        setIsRefreshing(false);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh, value, title, formatValue, metricHistory, toast]);

  // Update history when value changes (solo si showSparkline está habilitado)
  useEffect(() => {
    if (!showSparkline) return;
    
    if (metricHistory.length === 0 || metricHistory[metricHistory.length - 1].current !== value) {
      setMetricHistory(prev => [
        ...prev.slice(-9), // Keep last 10 values
        {
          current: value,
          previous: previousValue || 0,
          timestamp: new Date(),
        }
      ]);
    }
  }, [value, previousValue, metricHistory, showSparkline]);

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Si showHourlyChart es true, renderizar el gráfico en lugar de la tarjeta normal
  if (showHourlyChart) {
    return (
      <HourlyActivityChart
        data={hourlyData}
        title={`Actividad por Hora - ${title}`}
        subtitle={`${value} reportes total - ${subtitle || ''}`}
        color={chartColor}
      />
    );
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200 relative overflow-hidden">
      {/* Pulse animation for live updates */}
      {isRefreshing && (
        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
      )}
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          {previousValue !== undefined && trend !== 0 && (
            <Badge
              variant="secondary"
              className={`flex items-center gap-1 text-xs ${getTrendColor()}`}
            >
              {getTrendIcon()}
              {Math.abs(trend).toFixed(1)}%
            </Badge>
          )}
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
        
        {/* Mini sparkline - solo mostrar si showSparkline está habilitado */}
        {showSparkline && metricHistory.length > 1 && (
          <div className="mt-2">
            <div className="h-8 flex items-end gap-1">
              {metricHistory.slice(-8).map((metric, index) => {
                const height = metricHistory.length > 1 
                  ? ((metric.current - Math.min(...metricHistory.map(m => m.current))) /
                     (Math.max(...metricHistory.map(m => m.current)) - Math.min(...metricHistory.map(m => m.current)))) * 100
                  : 50;
                
                return (
                  <div
                    key={index}
                    className="flex-1 bg-primary/20 rounded-sm min-h-[2px] transition-all duration-300"
                    style={{ height: `${Math.max(height, 10)}%` }}
                    title={`${formatValue(metric.current)} - ${metric.timestamp.toLocaleTimeString()}`}
                  />
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimas actualizaciones
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
