
import React from 'react';
import { Users, UserCheck, Shield, UserPlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { RealTimeMetrics } from '../RealTimeMetrics';

interface UsuariosMetricsProps {
  filteredStats: any;
}

export const UsuariosMetrics: React.FC<UsuariosMetricsProps> = ({ filteredStats }) => {
  const queryClient = useQueryClient();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <RealTimeMetrics
        title="Total Usuarios"
        value={filteredStats.usuarios.total}
        subtitle={`${filteredStats.usuarios.activos} activos`}
        icon={Users}
        color="text-blue-600"
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })}
        showHourlyChart={false}
        showSparkline={false}
      />
      
      <RealTimeMetrics
        title="Usuarios Activos"
        value={filteredStats.usuarios.activos}
        subtitle={`${Math.round((filteredStats.usuarios.activos / Math.max(filteredStats.usuarios.total, 1)) * 100)}% del total`}
        icon={UserCheck}
        color="text-green-600"
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })}
        showHourlyChart={false}
        showSparkline={false}
      />
      
      <RealTimeMetrics
        title="Usuarios Confirmados"
        value={filteredStats.usuarios.confirmados}
        subtitle="Con email verificado"
        icon={Shield}
        color="text-purple-600"
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })}
        showHourlyChart={false}
        showSparkline={false}
      />
      
      <RealTimeMetrics
        title="Nuevos Usuarios"
        value={filteredStats.usuarios.recientes}
        subtitle="Últimos 7 días"
        icon={UserPlus}
        color="text-orange-600"
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })}
        showHourlyChart={false}
        showSparkline={false}
      />
    </div>
  );
};
