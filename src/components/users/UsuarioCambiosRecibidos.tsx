
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { History, Activity, Clock, User, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CambioDetalleModal } from '../roles/dialogs/CambioDetalleModal';
import { useIsMobile } from '@/hooks/use-mobile';

interface UsuarioCambiosRecibidosProps {
  usuarioId: string;
  usuarioEmail: string;
}

interface CambioRealizado {
  id: string;
  tabla_nombre: string;
  registro_id: string;
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  valores_anteriores: any;
  valores_nuevos: any;
  campos_modificados: string[];
  descripcion_cambio: string;
  created_at: string;
  user_email: string;
}

interface ActividadRealizada {
  id: string;
  activity_type: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SEARCH' | 'EXPORT' | 'IMPORT';
  descripcion: string;
  tabla_afectada: string | null;
  registro_id: string | null;
  metadatos: any;
  created_at: string;
  user_email: string;
}

const getActivityIcon = (type: ActividadRealizada['activity_type']) => {
  switch (type) {
    case 'CREATE': return <Activity className="h-4 w-4 text-green-600" />;
    case 'READ': return <Activity className="h-4 w-4 text-blue-600" />;
    case 'UPDATE': return <Activity className="h-4 w-4 text-orange-600" />;
    case 'DELETE': return <Activity className="h-4 w-4 text-red-600" />;
    case 'LOGIN': return <User className="h-4 w-4 text-purple-600" />;
    case 'LOGOUT': return <User className="h-4 w-4 text-gray-600" />;
    case 'SEARCH': return <Activity className="h-4 w-4 text-indigo-600" />;
    case 'EXPORT': return <Activity className="h-4 w-4 text-teal-600" />;
    case 'IMPORT': return <Activity className="h-4 w-4 text-cyan-600" />;
    default: return <Activity className="h-4 w-4 text-gray-600" />;
  }
};

const getActivityColor = (type: ActividadRealizada['activity_type']) => {
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

const getOperationColor = (operation: CambioRealizado['operation_type']) => {
  switch (operation) {
    case 'INSERT': return 'bg-green-100 text-green-800 border-green-200';
    case 'UPDATE': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
    case 'SELECT': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const UsuarioCambiosRecibidos: React.FC<UsuarioCambiosRecibidosProps> = ({ 
  usuarioId, 
  usuarioEmail 
}) => {
  const [selectedCambio, setSelectedCambio] = useState<CambioRealizado | null>(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Hook para obtener actividades realizadas POR el usuario
  const { data: actividadesRealizadas = [], isLoading: isLoadingActividades } = useQuery({
    queryKey: ['usuario-actividades-realizadas', usuarioId],
    queryFn: async () => {
      console.log('Fetching activities performed BY user:', usuarioId);
      
      const { data, error } = await supabase.rpc('get_user_activities', {
        p_user_id: usuarioId, // Filtrar por quien hizo la actividad
        p_limit: 100,
        p_offset: 0
      });

      if (error) {
        console.error('Error fetching actividades realizadas por usuario:', error);
        throw error;
      }

      console.log('Fetched activities performed BY user:', data);
      
      // Ordenar por fecha descendente
      const actividadesOrdenadas = (data || []).sort((a: ActividadRealizada, b: ActividadRealizada) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return actividadesOrdenadas as ActividadRealizada[];
    },
    enabled: !!usuarioId,
  });

  // Hook para obtener cambios realizados POR el usuario
  const { data: cambiosRealizados = [], isLoading: isLoadingCambios } = useQuery({
    queryKey: ['usuario-cambios-realizados', usuarioId],
    queryFn: async () => {
      console.log('Fetching changes made BY user:', usuarioId);
      
      const { data, error } = await supabase.rpc('get_change_history', {
        p_tabla_nombre: null,
        p_registro_id: null,
        p_user_id: usuarioId, // Filtrar por quien hizo el cambio
        p_limit: 100,
        p_offset: 0
      });

      if (error) {
        console.error('Error fetching cambios realizados por usuario:', error);
        throw error;
      }

      console.log('Fetched changes made BY user:', data);
      
      // Ordenar por fecha descendente
      const cambiosOrdenados = (data || []).sort((a: CambioRealizado, b: CambioRealizado) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return cambiosOrdenados as CambioRealizado[];
    },
    enabled: !!usuarioId,
  });

  const handleVerDetalles = (cambio: CambioRealizado) => {
    setSelectedCambio(cambio);
    setDetalleModalOpen(true);
  };

  // Componente para renderizar actividades en mobile
  const renderActividadMobile = (actividad: ActividadRealizada) => (
    <div key={actividad.id} className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <Badge 
          variant="outline" 
          className={`${getActivityColor(actividad.activity_type)} text-xs font-medium flex-shrink-0`}
        >
          <div className="flex items-center gap-1">
            {getActivityIcon(actividad.activity_type)}
            <span>{actividad.activity_type}</span>
          </div>
        </Badge>
        <div className="text-right">
          <div className="text-xs font-medium">
            {format(new Date(actividad.created_at), 'dd/MM/yyyy', { locale: es })}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(actividad.created_at), 'HH:mm:ss', { locale: es })}
          </div>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 line-clamp-2">
          {actividad.descripcion}
        </p>
      </div>
      {actividad.tabla_afectada && (
        <div>
          <Badge variant="secondary" className="text-xs">
            {actividad.tabla_afectada}
          </Badge>
        </div>
      )}
    </div>
  );

  // Componente para renderizar cambios en mobile
  const renderCambioMobile = (cambio: CambioRealizado) => (
    <div key={cambio.id} className="border rounded-lg p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Badge 
          variant="outline"
          className={`text-xs font-medium flex-shrink-0 ${getOperationColor(cambio.operation_type)}`}
        >
          {cambio.operation_type}
        </Badge>
        <div className="text-right">
          <div className="text-xs font-medium">
            {format(new Date(cambio.created_at), 'dd/MM/yyyy', { locale: es })}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(cambio.created_at), 'HH:mm:ss', { locale: es })}
          </div>
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-900 line-clamp-2">
          {cambio.descripcion_cambio}
        </p>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {cambio.tabla_nombre}
          </Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleVerDetalles(cambio)}
          className="flex-shrink-0"
        >
          <Eye className="h-3 w-3 mr-1" />
          Ver
        </Button>
      </div>
      
      {cambio.campos_modificados && cambio.campos_modificados.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cambio.campos_modificados.slice(0, 3).map((campo, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {campo}
            </Badge>
          ))}
          {cambio.campos_modificados.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{cambio.campos_modificados.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <History className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Historial de {isMobile ? usuarioEmail.split('@')[0] : usuarioEmail}</span>
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Actividades y cambios realizados por este usuario en el sistema
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="actividades" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="actividades" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Actividades</span>
              </TabsTrigger>
              <TabsTrigger value="cambios" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
                <History className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Cambios</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="actividades">
              <div className="border rounded-lg">
                {isLoadingActividades ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : actividadesRealizadas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No se encontraron actividades</p>
                    <p className="text-sm">Este usuario no ha realizado actividades registradas.</p>
                  </div>
                ) : (
                  <>
                    {/* Vista desktop - tabla */}
                    {!isMobile ? (
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead className="w-[120px]">Tipo</TableHead>
                              <TableHead className="min-w-[300px]">Descripción</TableHead>
                              <TableHead className="w-[150px]">Tabla Afectada</TableHead>
                              <TableHead className="w-[150px]">Fecha y Hora</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {actividadesRealizadas.map((actividad) => (
                              <TableRow key={actividad.id} className="hover:bg-muted/50">
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={`${getActivityColor(actividad.activity_type)} text-xs font-medium`}
                                  >
                                    <div className="flex items-center gap-1">
                                      {getActivityIcon(actividad.activity_type)}
                                      <span>{actividad.activity_type}</span>
                                    </div>
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-[300px]">
                                    <p className="text-sm font-medium truncate" title={actividad.descripcion}>
                                      {actividad.descripcion}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="text-xs">
                                    {actividad.tabla_afectada || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <div className="space-y-1">
                                      <div className="font-medium">
                                        {format(new Date(actividad.created_at), 'dd/MM/yyyy', { locale: es })}
                                      </div>
                                      <div className="text-xs">
                                        {format(new Date(actividad.created_at), 'HH:mm:ss', { locale: es })}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      /* Vista mobile - cards */
                      <ScrollArea className="h-[400px]">
                        <div className="p-4 space-y-3">
                          {actividadesRealizadas.map((actividad) => renderActividadMobile(actividad))}
                        </div>
                      </ScrollArea>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cambios">
              <div className="border rounded-lg">
                {isLoadingCambios ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : cambiosRealizados.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No se encontraron cambios</p>
                    <p className="text-sm">Este usuario no ha realizado cambios registrados.</p>
                  </div>
                ) : (
                  <>
                    {/* Vista desktop - tabla */}
                    {!isMobile ? (
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead className="w-[120px]">Operación</TableHead>
                              <TableHead className="min-w-[300px]">Descripción del Cambio</TableHead>
                              <TableHead className="w-[120px]">Tabla</TableHead>
                              <TableHead className="w-[200px]">Campos Modificados</TableHead>
                              <TableHead className="w-[150px]">Fecha y Hora</TableHead>
                              <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cambiosRealizados.map((cambio) => (
                              <TableRow key={cambio.id} className="hover:bg-muted/50">
                                <TableCell>
                                  <Badge 
                                    variant="outline"
                                    className={`text-xs font-medium ${getOperationColor(cambio.operation_type)}`}
                                  >
                                    {cambio.operation_type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-[300px]">
                                    <p className="text-sm font-medium truncate" title={cambio.descripcion_cambio}>
                                      {cambio.descripcion_cambio}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="text-xs">
                                    {cambio.tabla_nombre}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {cambio.campos_modificados && cambio.campos_modificados.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                                      {cambio.campos_modificados.slice(0, 3).map((campo, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {campo}
                                        </Badge>
                                      ))}
                                      {cambio.campos_modificados.length > 3 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{cambio.campos_modificados.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">Sin campos</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <div className="space-y-1">
                                      <div className="font-medium">
                                        {format(new Date(cambio.created_at), 'dd/MM/yyyy', { locale: es })}
                                      </div>
                                      <div className="text-xs">
                                        {format(new Date(cambio.created_at), 'HH:mm:ss', { locale: es })}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleVerDetalles(cambio)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      /* Vista mobile - cards */
                      <ScrollArea className="h-[400px]">
                        <div className="p-4 space-y-3">
                          {cambiosRealizados.map((cambio) => renderCambioMobile(cambio))}
                        </div>
                      </ScrollArea>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de detalles del cambio */}
      <CambioDetalleModal
        cambio={selectedCambio}
        open={detalleModalOpen}
        onOpenChange={setDetalleModalOpen}
      />
    </div>
  );
};
