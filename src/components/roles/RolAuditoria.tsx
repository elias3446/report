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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, History, Clock, User, Database, FileText, Search, Filter, RefreshCw, Download, Shield, Eye, Calendar, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CambioDetalleModal } from './dialogs/CambioDetalleModal';

interface RolAuditoriaProps {
  rolId: string;
}

interface ActividadRol {
  id: string;
  activity_type: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SEARCH' | 'EXPORT' | 'IMPORT';
  descripcion: string;
  tabla_afectada: string | null;
  registro_id: string | null;
  metadatos: any;
  created_at: string;
  user_email: string;
}

interface CambioRol {
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

const getActivityIcon = (type: ActividadRol['activity_type']) => {
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

const getActivityColor = (type: ActividadRol['activity_type']) => {
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

const getOperationColor = (operation: CambioRol['operation_type']) => {
  switch (operation) {
    case 'INSERT': return 'bg-green-100 text-green-800 border-green-200';
    case 'UPDATE': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
    case 'SELECT': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const DetallesCambio: React.FC<{ cambio: CambioRol }> = ({ cambio }) => {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const compareValues = (oldValue: any, newValue: any) => {
    const oldStr = formatValue(oldValue);
    const newStr = formatValue(newValue);
    return { oldStr, newStr, changed: oldStr !== newStr };
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header con información general */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Información del Cambio
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Tabla:</span>
                <Badge variant="outline" className="font-mono">
                  {cambio.tabla_nombre}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Registro ID:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {cambio.registro_id}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Operación:</span>
                <Badge className={`${getOperationColor(cambio.operation_type)} font-medium`}>
                  {cambio.operation_type}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Información del Usuario
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Usuario:</span>
                <span className="text-sm font-medium text-blue-600">{cambio.user_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {format(new Date(cambio.created_at), 'dd/MM/yyyy', { locale: es })} a las{' '}
                  {format(new Date(cambio.created_at), 'HH:mm:ss', { locale: es })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción del cambio */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-600" />
          Descripción del Cambio
        </h4>
        <p className="text-sm text-gray-700 leading-relaxed">{cambio.descripcion_cambio}</p>
      </div>

      {/* Campos modificados */}
      {cambio.campos_modificados && cambio.campos_modificados.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Campos Modificados ({cambio.campos_modificados.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {cambio.campos_modificados.map((campo, index) => (
              <Badge key={index} variant="outline" className="bg-white border-yellow-300 text-yellow-800">
                {campo}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Comparación de valores */}
      {(cambio.valores_anteriores || cambio.valores_nuevos) && (
        <div className="space-y-4">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-purple-600" />
            Comparación de Valores
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Valores anteriores */}
            <div className="bg-red-50 border border-red-200 rounded-lg">
              <div className="bg-red-100 px-4 py-3 border-b border-red-200 rounded-t-lg">
                <h5 className="font-medium text-red-800 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Valores Anteriores
                </h5>
              </div>
              <div className="p-4">
                {cambio.valores_anteriores ? (
                  <ScrollArea className="h-64">
                    <pre className="text-xs font-mono text-red-700 whitespace-pre-wrap break-all">
                      {formatValue(cambio.valores_anteriores)}
                    </pre>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-20 text-red-500">
                    <span className="text-sm italic">Sin valores anteriores</span>
                  </div>
                )}
              </div>
            </div>

            {/* Valores nuevos */}
            <div className="bg-green-50 border border-green-200 rounded-lg">
              <div className="bg-green-100 px-4 py-3 border-b border-green-200 rounded-t-lg">
                <h5 className="font-medium text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Valores Nuevos
                </h5>
              </div>
              <div className="p-4">
                {cambio.valores_nuevos ? (
                  <ScrollArea className="h-64">
                    <pre className="text-xs font-mono text-green-700 whitespace-pre-wrap break-all">
                      {formatValue(cambio.valores_nuevos)}
                    </pre>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-20 text-green-500">
                    <span className="text-sm italic">Sin valores nuevos</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Análisis detallado de cambios por campo */}
          {cambio.valores_anteriores && cambio.valores_nuevos && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Análisis Detallado de Cambios
              </h5>
              <div className="space-y-2">
                {Object.keys({ ...cambio.valores_anteriores, ...cambio.valores_nuevos }).map((key) => {
                  const comparison = compareValues(
                    cambio.valores_anteriores?.[key],
                    cambio.valores_nuevos?.[key]
                  );
                  return (
                    <div key={key} className="bg-white p-3 rounded border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">{key}:</span>
                        {comparison.changed && (
                          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                            Modificado
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="bg-red-50 p-2 rounded border border-red-200">
                          <span className="font-medium text-red-700">Anterior: </span>
                          <span className="font-mono text-red-600">{comparison.oldStr}</span>
                        </div>
                        <div className="bg-green-50 p-2 rounded border border-green-200">
                          <span className="font-medium text-green-700">Nuevo: </span>
                          <span className="font-mono text-green-600">{comparison.newStr}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const RolAuditoria: React.FC<RolAuditoriaProps> = ({ rolId }) => {
  const [filtroTipo, setFiltroTipo] = useState<string>('all');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [activeTab, setActiveTab] = useState('actividades');
  const [selectedCambio, setSelectedCambio] = useState<CambioRol | null>(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);

  // Hook para obtener actividades relacionadas con el rol
  const { data: actividades = [], isLoading: isLoadingActividades } = useQuery({
    queryKey: ['rol-actividades', rolId, filtroTipo, busqueda],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_activities', {
        p_user_id: null,
        p_limit: 100,
        p_offset: 0
      });

      if (error) {
        console.error('Error fetching rol actividades:', error);
        throw error;
      }

      // Filtrar actividades relacionadas con este rol específico
      let actividadesFiltradas = (data as ActividadRol[]).filter(actividad => 
        (actividad.tabla_afectada === 'roles' && actividad.registro_id === rolId) ||
        (actividad.tabla_afectada === 'user_roles' && actividad.metadatos && actividad.metadatos.role_id === rolId)
      );

      // Aplicar filtros
      if (filtroTipo && filtroTipo !== 'all') {
        actividadesFiltradas = actividadesFiltradas.filter(a => a.activity_type === filtroTipo);
      }
      if (busqueda) {
        actividadesFiltradas = actividadesFiltradas.filter(a => 
          a.descripcion.toLowerCase().includes(busqueda.toLowerCase())
        );
      }

      return actividadesFiltradas;
    }
  });

  // Hook para obtener historial de cambios del rol
  const { data: cambios = [], isLoading: isLoadingCambios } = useQuery({
    queryKey: ['rol-cambios', rolId, filtroTipo, busqueda],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_change_history', {
        p_tabla_nombre: 'roles',
        p_registro_id: rolId,
        p_user_id: null,
        p_limit: 100,
        p_offset: 0
      });

      if (error) {
        console.error('Error fetching rol cambios:', error);
        throw error;
      }

      let filteredData = (data || []) as CambioRol[];

      // Aplicar filtros
      if (filtroTipo && filtroTipo !== 'all') {
        filteredData = filteredData.filter(c => c.operation_type === filtroTipo);
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
    setBusqueda('');
  };

  const exportarDatos = () => {
    console.log('Exportar datos de auditoría del rol');
  };

  const handleVerDetalles = (cambio: CambioRol) => {
    setSelectedCambio(cambio);
    setDetalleModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Auditoría del Rol</h1>
        </div>
        <p className="text-muted-foreground">
          Monitoreo completo de actividades y cambios para este rol
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
                      <p className="text-sm">No hay actividades registradas para este rol con los filtros aplicados.</p>
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
                      <p className="text-sm">No hay cambios registrados para este rol con los filtros aplicados.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="w-[120px]">Operación</TableHead>
                          <TableHead className="min-w-[300px]">Descripción del Cambio</TableHead>
                          <TableHead className="w-[200px]">Campos Modificados</TableHead>
                          <TableHead className="w-[180px]">Usuario</TableHead>
                          <TableHead className="w-[150px]">Fecha y Hora</TableHead>
                          <TableHead className="w-[100px]">Acciones</TableHead>
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
                              <div className="max-w-[300px]">
                                <p className="text-sm font-medium truncate" title={cambio.descripcion_cambio}>
                                  {cambio.descripcion_cambio}
                                </p>
                              </div>
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
                                onClick={() => handleVerDetalles(cambio)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver Detalles
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

      {/* Modal de detalles del cambio */}
      <CambioDetalleModal
        cambio={selectedCambio}
        open={detalleModalOpen}
        onOpenChange={setDetalleModalOpen}
      />
    </div>
  );
};
