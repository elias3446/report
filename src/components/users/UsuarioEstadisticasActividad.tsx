import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  FileText, 
  User as UserIcon, 
  Database, 
  TrendingUp,
  Calendar,
  Clock,
  BarChart3
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UsuarioEstadisticasActividadProps {
  usuarioId: string;
  usuarioEmail: string;
}

interface EstadisticasActividad {
  totalActividades: number;
  actividadesHoy: number;
  actividadesEstaSemana: number;
  actividadesEsteMes: number;
  tiposActividad: Record<string, number>;
  actividadesPorDia: { fecha: string; cantidad: number }[];
  fechaCreacionUsuario: string;
  diasDesdeCreacion: number;
}

export const UsuarioEstadisticasActividad: React.FC<UsuarioEstadisticasActividadProps> = ({ 
  usuarioId, 
  usuarioEmail 
}) => {
  // Hook para obtener estadísticas de actividad del usuario
  const { data: estadisticas, isLoading } = useQuery({
    queryKey: ['usuario-estadisticas-actividad', usuarioId],
    queryFn: async (): Promise<EstadisticasActividad> => {
      console.log('Fetching activity statistics for user:', usuarioId);
      
      const ahora = new Date();
      const inicioHoy = startOfDay(ahora);
      const hace7Dias = subDays(ahora, 7);
      const hace30Dias = subDays(ahora, 30);

      // Obtener la fecha de creación del usuario
      const { data: usuario, error: errorUsuario } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', usuarioId)
        .single();

      if (errorUsuario) {
        console.error('Error fetching user creation date:', errorUsuario);
        throw errorUsuario;
      }

      const fechaCreacionUsuario = usuario?.created_at || new Date().toISOString();
      const diasDesdeCreacion = Math.max(1, differenceInDays(ahora, new Date(fechaCreacionUsuario)));

      // Obtener todas las actividades del usuario
      const { data: todasActividades, error: errorTotal } = await supabase.rpc('get_user_activities', {
        p_user_id: usuarioId,
        p_limit: 1000,
        p_offset: 0
      });

      if (errorTotal) {
        console.error('Error fetching total activities:', errorTotal);
        throw errorTotal;
      }

      const actividades = todasActividades || [];

      // Calcular estadísticas
      const totalActividades = actividades.length;
      
      const actividadesHoy = actividades.filter(a => 
        new Date(a.created_at) >= inicioHoy
      ).length;

      const actividadesEstaSemana = actividades.filter(a => 
        new Date(a.created_at) >= hace7Dias
      ).length;

      const actividadesEsteMes = actividades.filter(a => 
        new Date(a.created_at) >= hace30Dias
      ).length;

      // Contar actividades por tipo
      const tiposActividad: Record<string, number> = {};
      actividades.forEach(actividad => {
        const tipo = actividad.activity_type;
        tiposActividad[tipo] = (tiposActividad[tipo] || 0) + 1;
      });

      // Actividades por día (últimos 7 días)
      const actividadesPorDia: { fecha: string; cantidad: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const fecha = subDays(ahora, i);
        const inicioDelDia = startOfDay(fecha);
        const finDelDia = endOfDay(fecha);
        
        const cantidad = actividades.filter(a => {
          const fechaActividad = new Date(a.created_at);
          return fechaActividad >= inicioDelDia && fechaActividad <= finDelDia;
        }).length;

        actividadesPorDia.push({
          fecha: format(fecha, 'dd/MM', { locale: es }),
          cantidad
        });
      }

      return {
        totalActividades,
        actividadesHoy,
        actividadesEstaSemana,
        actividadesEsteMes,
        tiposActividad,
        actividadesPorDia,
        fechaCreacionUsuario,
        diasDesdeCreacion
      };
    },
    enabled: !!usuarioId,
  });

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'CREATE': return <Activity className="h-4 w-4 text-green-600" />;
      case 'READ': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'UPDATE': return <Activity className="h-4 w-4 text-orange-600" />;
      case 'DELETE': return <Activity className="h-4 w-4 text-red-600" />;
      case 'LOGIN': return <UserIcon className="h-4 w-4 text-purple-600" />;
      case 'LOGOUT': return <UserIcon className="h-4 w-4 text-gray-600" />;
      case 'SEARCH': return <FileText className="h-4 w-4 text-indigo-600" />;
      case 'EXPORT': return <Database className="h-4 w-4 text-teal-600" />;
      case 'IMPORT': return <Database className="h-4 w-4 text-cyan-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-200';
      case 'READ': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UPDATE': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      case 'LOGIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'SEARCH': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'EXPORT': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'IMPORT': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas de Actividad
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

  if (!estadisticas) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No se pudieron cargar las estadísticas de actividad
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular el promedio diario real basado en los días desde la creación del usuario
  const promedioDiario = estadisticas.diasDesdeCreacion > 0 
    ? Math.round((estadisticas.totalActividades / estadisticas.diasDesdeCreacion) * 10) / 10 
    : 0;

  return (
    <div className="space-y-6">
      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Actividades"
          value={estadisticas.totalActividades}
          icon={Activity}
          color="text-blue-600"
        />
        <StatsCard
          title="Hoy"
          value={estadisticas.actividadesHoy}
          icon={Calendar}
          color="text-green-600"
        />
        <StatsCard
          title="Esta Semana"
          value={estadisticas.actividadesEstaSemana}
          icon={TrendingUp}
          color="text-orange-600"
        />
        <StatsCard
          title="Este Mes"
          value={estadisticas.actividadesEsteMes}
          icon={Clock}
          color="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de actividades por día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Actividades por Día (Últimos 7 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={estadisticas.actividadesPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `Fecha: ${label}`}
                    formatter={(value) => [value, 'Actividades']}
                  />
                  <Bar dataKey="cantidad" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de actividad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Tipos de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(estadisticas.tiposActividad)
                .sort(([, a], [, b]) => b - a)
                .map(([tipo, cantidad]) => (
                  <div key={tipo} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActivityTypeIcon(tipo)}
                      <Badge 
                        variant="outline" 
                        className={getActivityTypeColor(tipo)}
                      >
                        {tipo}
                      </Badge>
                    </div>
                    <span className="font-semibold">{cantidad}</span>
                  </div>
                ))}
              {Object.keys(estadisticas.tiposActividad).length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No hay actividades registradas
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Email: {usuarioEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Usuario desde: {format(new Date(estadisticas.fechaCreacionUsuario), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Promedio diario: {promedioDiario} actividades ({estadisticas.diasDesdeCreacion} días activo)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
