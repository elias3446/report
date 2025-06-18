import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Activity, History, Filter, RefreshCw, Download } from 'lucide-react';
import { useAuditoria } from '@/hooks/useAuditoria';
import { useExportAuditoria } from '@/hooks/useExportAuditoria';
import { ActividadesList } from './ActividadesList';
import { CambiosHistorialList } from './CambiosHistorialList';
import { supabase } from '@/integrations/supabase/client';

export const AuditoriaManagement = () => {
  const {
    actividades,
    cambiosHistorial,
    isLoadingActividades,
    isLoadingCambios,
    filtros,
    setFiltros
  } = useAuditoria();

  const { exportActividades, exportCambiosHistorial, isExporting } = useExportAuditoria();

  const [filtrosTemp, setFiltrosTemp] = useState(filtros);
  const [registrosDisponibles, setRegistrosDisponibles] = useState<{id: string, display: string}[]>([]);
  const [isLoadingRegistros, setIsLoadingRegistros] = useState(false);
  const [activeTab, setActiveTab] = useState('actividades');

  // Obtener registros disponibles cuando cambia la tabla seleccionada
  useEffect(() => {
    const obtenerRegistros = async () => {
      if (!filtrosTemp.tabla_nombre) {
        // Si no hay tabla seleccionada, obtener IDs de todas las tablas
        try {
          setIsLoadingRegistros(true);
          const todosRegistros: {id: string, display: string}[] = [];

          // Obtener reportes
          const { data: reportes } = await supabase
            .from('reportes')
            .select('id, nombre')
            .limit(100);
          
          if (reportes) {
            reportes.forEach((registro) => {
              todosRegistros.push({
                id: registro.id,
                display: `reportes: ${registro.nombre}`
              });
            });
          }

          // Obtener categorías
          const { data: categories } = await supabase
            .from('categories')
            .select('id, nombre')
            .limit(100);
          
          if (categories) {
            categories.forEach((registro) => {
              todosRegistros.push({
                id: registro.id,
                display: `categories: ${registro.nombre}`
              });
            });
          }

          // Obtener estados
          const { data: estados } = await supabase
            .from('estados')
            .select('id, nombre')
            .limit(100);
          
          if (estados) {
            estados.forEach((registro) => {
              todosRegistros.push({
                id: registro.id,
                display: `estados: ${registro.nombre}`
              });
            });
          }

          // Obtener perfiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name')
            .limit(100);
          
          if (profiles) {
            profiles.forEach((registro) => {
              const display = registro.email || 
                             `${registro.first_name || ''} ${registro.last_name || ''}`.trim() ||
                             registro.id;
              todosRegistros.push({
                id: registro.id,
                display: `profiles: ${display}`
              });
            });
          }

          // Obtener roles
          const { data: roles } = await supabase
            .from('roles')
            .select('id, nombre')
            .limit(100);
          
          if (roles) {
            roles.forEach((registro) => {
              todosRegistros.push({
                id: registro.id,
                display: `roles: ${registro.nombre}`
              });
            });
          }

          // Obtener user_roles
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('id')
            .limit(100);
          
          if (userRoles) {
            userRoles.forEach((registro) => {
              todosRegistros.push({
                id: registro.id,
                display: `user_roles: ${registro.id}`
              });
            });
          }

          setRegistrosDisponibles(todosRegistros);
        } catch (error) {
          console.error('Error obteniendo todos los registros:', error);
          setRegistrosDisponibles([]);
        } finally {
          setIsLoadingRegistros(false);
        }
      } else {
        // Obtener registros de la tabla específica
        try {
          setIsLoadingRegistros(true);
          let registros: {id: string, display: string}[] = [];
          
          // Usar switch para manejar cada tabla específicamente
          switch (filtrosTemp.tabla_nombre) {
            case 'reportes':
              const { data: reportes } = await supabase
                .from('reportes')
                .select('id, nombre')
                .limit(100);
              
              if (reportes) {
                registros = reportes.map((registro) => ({
                  id: registro.id,
                  display: registro.nombre
                }));
              }
              break;

            case 'categories':
              const { data: categories } = await supabase
                .from('categories')
                .select('id, nombre')
                .limit(100);
              
              if (categories) {
                registros = categories.map((registro) => ({
                  id: registro.id,
                  display: registro.nombre
                }));
              }
              break;

            case 'estados':
              const { data: estados } = await supabase
                .from('estados')
                .select('id, nombre')
                .limit(100);
              
              if (estados) {
                registros = estados.map((registro) => ({
                  id: registro.id,
                  display: registro.nombre
                }));
              }
              break;

            case 'profiles':
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email, first_name, last_name')
                .limit(100);
              
              if (profiles) {
                registros = profiles.map((registro) => {
                  const display = registro.email || 
                                 `${registro.first_name || ''} ${registro.last_name || ''}`.trim() ||
                                 registro.id;
                  return {
                    id: registro.id,
                    display: display
                  };
                });
              }
              break;

            case 'roles':
              const { data: roles } = await supabase
                .from('roles')
                .select('id, nombre')
                .limit(100);
              
              if (roles) {
                registros = roles.map((registro) => ({
                  id: registro.id,
                  display: registro.nombre
                }));
              }
              break;

            case 'user_roles':
              const { data: userRoles } = await supabase
                .from('user_roles')
                .select('id')
                .limit(100);
              
              if (userRoles) {
                registros = userRoles.map((registro) => ({
                  id: registro.id,
                  display: registro.id
                }));
              }
              break;

            default:
              registros = [];
          }

          setRegistrosDisponibles(registros);
        } catch (error) {
          console.error('Error obteniendo registros:', error);
          setRegistrosDisponibles([]);
        } finally {
          setIsLoadingRegistros(false);
        }
      }
    };

    obtenerRegistros();
  }, [filtrosTemp.tabla_nombre]);

  const aplicarFiltros = () => {
    setFiltros(filtrosTemp);
  };

  const limpiarFiltros = () => {
    const filtrosVacios = {
      user_id: null,
      tabla_nombre: null,
      registro_id: null,
      limit: 50,
      offset: 0
    };
    setFiltrosTemp(filtrosVacios);
    setFiltros(filtrosVacios);
  };

  const handleExport = () => {
    if (activeTab === 'actividades') {
      exportActividades(actividades);
    } else {
      exportCambiosHistorial(cambiosHistorial);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Sistema de Auditoría</h1>
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
              <Label htmlFor="tabla_nombre">Tabla</Label>
              <Select
                value={filtrosTemp.tabla_nombre || "all"}
                onValueChange={(value) => {
                  setFiltrosTemp(prev => ({ 
                    ...prev, 
                    tabla_nombre: value === "all" ? null : value,
                    registro_id: null // Limpiar registro_id cuando cambia la tabla
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tabla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tablas</SelectItem>
                  <SelectItem value="reportes">Reportes</SelectItem>
                  <SelectItem value="categories">Categorías</SelectItem>
                  <SelectItem value="estados">Estados</SelectItem>
                  <SelectItem value="profiles">Perfiles</SelectItem>
                  <SelectItem value="roles">Roles</SelectItem>
                  <SelectItem value="user_roles">Roles de Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="registro_id">ID de Registro</Label>
              <Select
                value={filtrosTemp.registro_id || "all"}
                onValueChange={(value) => 
                  setFiltrosTemp(prev => ({ 
                    ...prev, 
                    registro_id: value === "all" ? null : value 
                  }))
                }
                disabled={isLoadingRegistros}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingRegistros ? "Cargando..." : "Seleccionar registro"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los registros</SelectItem>
                  {registrosDisponibles.map((registro) => (
                    <SelectItem key={registro.id} value={registro.id}>
                      {registro.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="limit">Límite de Resultados</Label>
              <Select
                value={filtrosTemp.limit === 0 ? "all" : filtrosTemp.limit.toString()}
                onValueChange={(value) => 
                  setFiltrosTemp(prev => ({ 
                    ...prev, 
                    limit: value === "all" ? 0 : parseInt(value)
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 registros</SelectItem>
                  <SelectItem value="50">50 registros</SelectItem>
                  <SelectItem value="100">100 registros</SelectItem>
                  <SelectItem value="200">200 registros</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={aplicarFiltros} className="flex-1">
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
            onClick={handleExport}
            disabled={isExporting || (activeTab === 'actividades' ? actividades.length === 0 : cambiosHistorial.length === 0)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Exportar Resultados'}
          </Button>
        </div>

        <TabsContent value="actividades">
          <ActividadesList 
            actividades={actividades} 
            isLoading={isLoadingActividades} 
          />
        </TabsContent>

        <TabsContent value="cambios">
          <CambiosHistorialList 
            cambios={cambiosHistorial} 
            isLoading={isLoadingCambios} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
