
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, History, Clock, User, Database, FileText, Search, Filter, Download, Calendar, RefreshCw, Shield, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReporteAuditoriaProps {
  reporteId: string;
}

interface ActividadReporte {
  id: string;
  activity_type: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SEARCH' | 'EXPORT' | 'IMPORT';
  descripcion: string;
  tabla_afectada: string | null;
  registro_id: string | null;
  metadatos: any;
  created_at: string;
  user_email: string;
}

interface CambioReporte {
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

const getActivityIcon = (type: ActividadReporte['activity_type']) => {
  switch (type) {
    case 'CREATE': return <Activity className="h-4 w-4 text-green-600" />;
    case 'READ': return <FileText className="h-4 w-4 text-blue-600" />;
    case 'UPDATE': return <Activity className="h-4 w-4 text-orange-600" />;
    case 'DELETE': return <Activity className="h-4 w-4 text-red-600" />;
    case 'LOGIN': return <User className="h-4 w-4 text-purple-600" />;
    case 'LOGOUT': return <User className="h-4 w-4 text-gray-600" />;
    case 'SEARCH': return <FileText className="h-4 w-4 text-indigo-600" />;
    case 'EXPORT': return <Database className="h-4 w-4 text-teal-600" />;
    case 'IMPORT': return <Database className="h-4 w-4 text-cyan-600" />;
    default: return <Activity className="h-4 w-4 text-gray-600" />;
  }
};

const getActivityColor = (type: ActividadReporte['activity_type']) => {
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

const getOperationColor = (operation: CambioReporte['operation_type']) => {
  switch (operation) {
    case 'INSERT': return 'bg-green-100 text-green-800 border-green-200';
    case 'UPDATE': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
    case 'SELECT': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatearValor = (valor: any): string => {
  if (valor === null || valor === undefined) return 'N/A';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'object') return JSON.stringify(valor, null, 2);
  return String(valor);
};

export const ReporteAuditoria: React.FC<ReporteAuditoriaProps> = ({ reporteId }) => {
  const [filtroTipo, setFiltroTipo] = useState<string>('all');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [activeTab, setActiveTab] = useState('actividades');
  const [selectedCambio, setSelectedCambio] = useState<CambioReporte | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Hook para obtener actividades relacionadas al reporte
  const { data: actividades = [], isLoading: isLoadingActividades } = useQuery({
    queryKey: ['reporte-actividades', reporteId, filtroTipo, filtroUsuario, filtroFecha, busqueda],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_activities', {
        p_user_id: null,
        p_limit: 100,
        p_offset: 0
      });

      if (error) {
        console.error('Error fetching reporte actividades:', error);
        throw error;
      }

      // Filtrar actividades relacionadas al reporte específico
      let filteredData = (data as ActividadReporte[]).filter(actividad => 
        actividad.tabla_afectada === 'reportes' && 
        actividad.registro_id === reporteId
      );

      // Aplicar filtros
      if (filtroTipo && filtroTipo !== 'all') {
        filteredData = filteredData.filter(a => a.activity_type === filtroTipo);
      }
      if (filtroUsuario) {
        filteredData = filteredData.filter(a => a.user_email.toLowerCase().includes(filtroUsuario.toLowerCase()));
      }
      if (busqueda) {
        filteredData = filteredData.filter(a => 
          a.descripcion.toLowerCase().includes(busqueda.toLowerCase())
        );
      }

      return filteredData;
    }
  });

  // Hook para obtener historial de cambios del reporte
  const { data: cambios = [], isLoading: isLoadingCambios } = useQuery({
    queryKey: ['reporte-cambios', reporteId, filtroTipo, filtroUsuario, filtroFecha, busqueda],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_change_history', {
        p_tabla_nombre: 'reportes',
        p_registro_id: reporteId,
        p_user_id: null,
        p_limit: 100,
        p_offset: 0
      });

      if (error) {
        console.error('Error fetching reporte cambios:', error);
        throw error;
      }

      let filteredData = data as CambioReporte[];

      // Aplicar filtros
      if (filtroTipo && filtroTipo !== 'all') {
        filteredData = filteredData.filter(c => c.operation_type === filtroTipo);
      }
      if (filtroUsuario) {
        filteredData = filteredData.filter(c => c.user_email.toLowerCase().includes(filtroUsuario.toLowerCase()));
      }
      if (busqueda) {
        filteredData = filteredData.filter(c => 
          c.descripcion_cambio.toLowerCase().includes(busqueda.toLowerCase())
        );
      }

      return filteredData;
    }
  });

  const limpiarFiltros = () => {
    setFiltroTipo('all');
    setFiltroUsuario('');
    setFiltroFecha('');
    setBusqueda('');
  };

  const exportarDatos = () => {
    console.log('Exportar datos de auditoría del reporte');
  };

  const verDetallesCambio = (cambio: CambioReporte) => {
    setSelectedCambio(cambio);
    setShowDetailsDialog(true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Auditoría del Reporte</h1>
        </div>
        <p className="text-muted-foreground">
          Monitoreo completo de actividades y cambios en el sistema
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="busqueda">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busqueda"
                  placeholder="Buscar en descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filtro_tipo">Tipo de Actividad</Label>
              <Select
                value={filtroTipo}
                onValueChange={setFiltroTipo}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="CREATE">Crear</SelectItem>
                  <SelectItem value="READ">Leer</SelectItem>
                  <SelectItem value="UPDATE">Actualizar</SelectItem>
                  <SelectItem value="DELETE">Eliminar</SelectItem>
                  <SelectItem value="LOGIN">Inicio de sesión</SelectItem>
                  <SelectItem value="LOGOUT">Cierre de sesión</SelectItem>
                  <SelectItem value="SEARCH">Búsqueda</SelectItem>
                  <SelectItem value="EXPORT">Exportar</SelectItem>
                  <SelectItem value="IMPORT">Importar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filtro_usuario">Usuario</Label>
              <Input
                id="filtro_usuario"
                placeholder="Filtrar por email..."
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={limpiarFiltros} className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                Aplicar
              </Button>
              <Button variant="outline" onClick={limpiarFiltros}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs con contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="actividades" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actividades
            </TabsTrigger>
            <TabsTrigger value="cambios" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial de Cambios
            </TabsTrigger>
          </TabsList>

          <Button 
            onClick={exportarDatos}
            disabled={activeTab === 'actividades' ? actividades.length === 0 : cambios.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Resultados
          </Button>
        </div>

        <TabsContent value="actividades">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Registro de Actividades
                </div>
                <div className="text-sm text-muted-foreground">
                  {isLoadingActividades ? 'Cargando...' : `${actividades.length} registros encontrados`}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <ScrollArea className="h-[400px]">
                  {isLoadingActividades ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : actividades.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No se encontraron actividades</p>
                      <p className="text-sm">No hay actividades registradas para este reporte con los filtros aplicados.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="w-[120px]">Tipo</TableHead>
                          <TableHead className="min-w-[300px]">Descripción</TableHead>
                          <TableHead className="w-[180px]">Usuario</TableHead>
                          <TableHead className="w-[150px]">Fecha y Hora</TableHead>
                          <TableHead className="w-[100px]">Tabla</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {actividades.map((actividad) => (
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
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium truncate" title={actividad.user_email}>
                                  {actividad.user_email}
                                </span>
                              </div>
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
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {actividad.tabla_afectada || 'N/A'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cambios">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Cambios
                </div>
                <div className="text-sm text-muted-foreground">
                  {isLoadingCambios ? 'Cargando...' : `${cambios.length} registros encontrados`}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <ScrollArea className="h-[400px]">
                  {isLoadingCambios ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : cambios.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No se encontraron cambios</p>
                      <p className="text-sm">No hay cambios registrados para este reporte con los filtros aplicados.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="w-[120px]">Operación</TableHead>
                          <TableHead className="min-w-[250px]">Descripción del Cambio</TableHead>
                          <TableHead className="w-[180px]">Campos Modificados</TableHead>
                          <TableHead className="w-[160px]">Usuario</TableHead>
                          <TableHead className="w-[140px]">Fecha y Hora</TableHead>
                          <TableHead className="w-[120px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cambios.map((cambio) => (
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
                              <div className="max-w-[250px]">
                                <p className="text-sm font-medium truncate" title={cambio.descripcion_cambio}>
                                  {cambio.descripcion_cambio}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {cambio.campos_modificados && cambio.campos_modificados.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-[160px]">
                                  {cambio.campos_modificados.slice(0, 2).map((campo, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {campo}
                                    </Badge>
                                  ))}
                                  {cambio.campos_modificados.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{cambio.campos_modificados.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">Sin campos</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium truncate" title={cambio.user_email}>
                                  {cambio.user_email}
                                </span>
                              </div>
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
                                onClick={() => verDetallesCambio(cambio)}
                                className="flex items-center gap-2 text-xs"
                              >
                                <Eye className="h-3 w-3" />
                                Ver detalles
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalles del Cambio */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <History className="h-6 w-6 text-primary" />
              Detalles del Cambio
            </DialogTitle>
          </DialogHeader>
          
          {selectedCambio && (
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="p-6 space-y-6">
                {/* Información General */}
                <div className="bg-muted/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Información General
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Operación</Label>
                      <Badge 
                        variant="outline" 
                        className={`${getOperationColor(selectedCambio.operation_type)} text-sm font-medium px-3 py-1`}
                      >
                        {selectedCambio.operation_type}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Usuario</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedCambio.user_email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Fecha y Hora</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(selectedCambio.created_at), 'dd/MM/yyyy', { locale: es })}
                          </div>
                          <div className="text-muted-foreground">
                            {format(new Date(selectedCambio.created_at), 'HH:mm:ss', { locale: es })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Tabla</Label>
                      <Badge variant="secondary" className="text-sm">
                        <Database className="h-3 w-3 mr-1" />
                        {selectedCambio.tabla_nombre}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Descripción del Cambio</Label>
                    <div className="bg-background border rounded-lg p-3">
                      <p className="text-sm">{selectedCambio.descripcion_cambio}</p>
                    </div>
                  </div>
                </div>

                {/* Campos Modificados */}
                {selectedCambio.campos_modificados && selectedCambio.campos_modificados.length > 0 && (
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200/50">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Activity className="h-5 w-5" />
                      Campos Modificados ({selectedCambio.campos_modificados.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCambio.campos_modificados.map((campo, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
                        >
                          {campo}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comparación de Valores */}
                {(selectedCambio.valores_anteriores || selectedCambio.valores_nuevos) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Comparación de Valores
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Valores Anteriores */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <Label className="text-sm font-semibold text-red-700 dark:text-red-300">
                            Valores Anteriores
                          </Label>
                        </div>
                        <div className="bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
                          <div className="bg-red-100/80 dark:bg-red-900/50 px-4 py-2 border-b border-red-200 dark:border-red-800">
                            <span className="text-xs font-medium text-red-800 dark:text-red-200 uppercase tracking-wide">
                              Estado Anterior
                            </span>
                          </div>
                          <div className="p-4 max-h-96 overflow-y-auto">
                            {selectedCambio.valores_anteriores ? (
                              <div className="space-y-3">
                                {Object.entries(selectedCambio.valores_anteriores).map(([key, value]) => (
                                  <div key={key} className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">
                                      {key}
                                    </span>
                                    <div className="bg-white dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded p-2">
                                      <code className="text-sm text-red-700 dark:text-red-200 break-all whitespace-pre-wrap">
                                        {formatearValor(value)}
                                      </code>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <p className="text-sm text-red-600 dark:text-red-400 italic">
                                  Sin valores anteriores registrados
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Valores Nuevos */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <Label className="text-sm font-semibold text-green-700 dark:text-green-300">
                            Valores Nuevos
                          </Label>
                        </div>
                        <div className="bg-green-50/80 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
                          <div className="bg-green-100/80 dark:bg-green-900/50 px-4 py-2 border-b border-green-200 dark:border-green-800">
                            <span className="text-xs font-medium text-green-800 dark:text-green-200 uppercase tracking-wide">
                              Estado Actual
                            </span>
                          </div>
                          <div className="p-4 max-h-96 overflow-y-auto">
                            {selectedCambio.valores_nuevos ? (
                              <div className="space-y-3">
                                {Object.entries(selectedCambio.valores_nuevos).map(([key, value]) => (
                                  <div key={key} className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
                                      {key}
                                    </span>
                                    <div className="bg-white dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded p-2">
                                      <code className="text-sm text-green-700 dark:text-green-200 break-all whitespace-pre-wrap">
                                        {formatearValor(value)}
                                      </code>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <p className="text-sm text-green-600 dark:text-green-400 italic">
                                  Sin valores nuevos registrados
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadatos Adicionales */}
                <div className="bg-gray-50/50 dark:bg-gray-900/20 rounded-lg p-6 border border-gray-200/50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Database className="h-5 w-5" />
                    Información Técnica
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        ID del Registro
                      </Label>
                      <code className="block bg-background border rounded px-2 py-1 text-xs">
                        {selectedCambio.registro_id}
                      </code>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        ID del Cambio
                      </Label>
                      <code className="block bg-background border rounded px-2 py-1 text-xs">
                        {selectedCambio.id}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
