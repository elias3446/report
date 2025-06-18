import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon, 
  RotateCcw,
  Search,
  Shield,
  CheckCircle,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdvancedFilters, useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useReportes } from '@/hooks/useReportes';
import { useRoles } from '@/hooks/useRoles';
import { useUsers } from '@/hooks/useUsers';
import { SearchCombobox } from './SearchCombobox';

const priorityOptions = [
  { value: 'urgente', label: 'Urgente', color: '#DC2626' },
  { value: 'alto', label: 'Alto', color: '#EA580C' },
  { value: 'medio', label: 'Medio', color: '#D97706' },
  { value: 'bajo', label: 'Bajo', color: '#059669' },
];

const confirmacionOptions = [
  { value: 'confirmado', label: 'Confirmado', color: '#10B981' },
  { value: 'no_confirmado', label: 'No Confirmado', color: '#EF4444' },
];

const activacionOptions = [
  { value: 'activo', label: 'Activo', color: '#10B981' },
  { value: 'inactivo', label: 'Inactivo', color: '#EF4444' },
];

// Nuevas opciones para el estado del reporte
const estadoReporteOptions = [
  { value: 'pendiente', label: 'Pendiente', color: '#F59E0B', icon: Clock },
  { value: 'en_proceso', label: 'En Proceso', color: '#3B82F6', icon: TrendingUp },
  { value: 'resuelto', label: 'Resuelto', color: '#10B981', icon: CheckCircle },
];

interface AdvancedFiltersPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onMultipleReportSelection?: (reportIds: string[]) => void;
  selectedReportIds?: string[];
  context?: 'reportes' | 'usuarios';
}

export const AdvancedFiltersPanel: React.FC<AdvancedFiltersPanelProps> = ({
  isOpen,
  onToggle,
  onFiltersChange,
  onMultipleReportSelection,
  selectedReportIds = [],
  context = 'reportes',
}) => {
  const { filters, updateFilter, resetFilters, hasActiveFilters, isValidForComparison } = useAdvancedFilters();
  const { data: stats } = useDashboardStats();
  const { reportes } = useReportes();
  const { roles } = useRoles();
  // CRÍTICO: Para el contexto de usuarios, SIEMPRE incluir al usuario actual
  const { users } = useUsers(context === 'usuarios' ? true : false);

  console.log('AdvancedFiltersPanel - VERIFICACIÓN CRÍTICA:', {
    context,
    totalUsers: users?.length || 0,
    includeCurrentUser: context === 'usuarios' ? true : false,
    userEmails: users?.map(u => u.email),
  });

  React.useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handlePriorityToggle = (priority: string) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    updateFilter('priority', newPriorities);
  };

  const handleEstadoToggle = (estado: string) => {
    const newEstados = filters.estados.includes(estado)
      ? filters.estados.filter(e => e !== estado)
      : [...filters.estados, estado];
    updateFilter('estados', newEstados);
  };

  const handleCategoriaToggle = (categoria: string) => {
    const newCategorias = filters.categorias.includes(categoria)
      ? filters.categorias.filter(c => c !== categoria)
      : [...filters.categorias, categoria];
    updateFilter('categorias', newCategorias);
  };

  // Transform data for the SearchCombobox based on context
  const searchData = React.useMemo(() => {
    if (context === 'usuarios') {
      console.log('AdvancedFiltersPanel - Transformando datos de usuarios para búsqueda:', {
        totalUsers: users?.length || 0,
        usersList: users?.map(u => ({ id: u.id, email: u.email }))
      });
      
      return users?.map(user => ({
        id: user.id,
        titulo: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        descripcion: user.email,
        estado: user.asset ? 'Activo' : 'Inactivo',
        categoria: user.confirmed ? 'Confirmado' : 'No Confirmado',
        prioridad: user.role?.includes('admin') ? 'admin' : 'user'
      })) || [];
    } else {
      return reportes?.map(reporte => ({
        id: reporte.id,
        titulo: reporte.nombre,
        descripcion: reporte.descripcion || '',
        estado: reporte.estado?.nombre || 'Sin estado',
        categoria: reporte.categoria?.nombre || 'Sin categoría',
        prioridad: reporte.priority || 'medio'
      })) || [];
    }
  }, [context, users, reportes]);

  console.log('AdvancedFiltersPanel - Datos de búsqueda finales:', {
    context,
    searchDataLength: searchData.length,
    searchDataItems: searchData.slice(0, 3) // Mostrar solo los primeros 3 para debugging
  });

  const getTabsForContext = () => {
    if (context === 'usuarios') {
      return [
        { value: 'busqueda', label: 'Búsqueda', icon: Search },
        { value: 'fechas', label: 'Fechas', icon: CalendarIcon },
        { value: 'prioridad', label: 'Roles', icon: Shield },
        { value: 'estados', label: 'Activación', icon: Users },
        { value: 'categorias', label: 'Confirmación', icon: CheckCircle },
      ];
    } else {
      return [
        { value: 'busqueda', label: 'Búsqueda', icon: Search },
        { value: 'fechas', label: 'Fechas', icon: CalendarIcon },
        { value: 'prioridad', label: 'Prioridad', icon: Shield },
        { value: 'estados', label: 'Estados DB', icon: CheckCircle },
        { value: 'categorias', label: 'Categorías', icon: Users },
        { value: 'estado_reporte', label: 'Estado Reporte', icon: TrendingUp },
      ];
    }
  };

  const tabs = getTabsForContext();

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros de Comparación
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {filters.priority.length + filters.estados.length + filters.categorias.length + (filters.searchTerm.length > 0 ? 1 : 0) + (filters.dateRange ? 1 : 0)}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Limpiar
          </Button>
        )}
        {!isValidForComparison && hasActiveFilters && (
          <Badge variant="destructive" className="text-xs">
            Selecciona criterios válidos para comparar
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Comparación
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Limpiar
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {!isValidForComparison && hasActiveFilters && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-amber-800">
              <Shield className="h-4 w-4 inline mr-1" />
              Para realizar comparaciones, selecciona al menos 2 {context === 'usuarios' ? 'usuarios' : 'reportes'} en Búsqueda, o selecciona criterios en las otras pestañas.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs 
          value={filters.activeTab} 
          onValueChange={(value) => updateFilter('activeTab', value as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-2 overflow-x-auto">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1 min-w-0 text-xs sm:text-sm">
                <tab.icon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ... keep existing code (TabsContent for busqueda, fechas, prioridad) the same ... */}
          <TabsContent value="busqueda" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Selecciona {context === 'usuarios' ? 'Usuarios' : 'Reportes'} para Comparar (mínimo 2)
              </label>
              <div className="text-xs text-muted-foreground mb-2">
                {context === 'usuarios' ? 'Usuarios disponibles:' : 'Reportes disponibles:'} {searchData.length}
              </div>
              <SearchCombobox
                reportes={searchData}
                value={filters.searchTerm}
                onValueChange={(value) => {
                  updateFilter('searchTerm', value);
                  if (onMultipleReportSelection) {
                    onMultipleReportSelection(value);
                  }
                }}
                placeholder={`Buscar ${context === 'usuarios' ? 'usuarios' : 'reportes'} para comparar...`}
              />
              {filters.searchTerm.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={filters.searchTerm.length >= 2 ? "default" : "secondary"}>
                    {filters.searchTerm.length} {context === 'usuarios' ? 'usuario(s)' : 'reporte(s)'} seleccionado(s)
                  </Badge>
                  {filters.searchTerm.length >= 2 && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ Listo para comparar
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="fechas" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Selecciona Rango de Fechas para Comparar
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {filters.dateRange ? (
                        `${format(filters.dateRange.from, 'dd/MM/yyyy', { locale: es })} - ${format(filters.dateRange.to, 'dd/MM/yyyy', { locale: es })}`
                      ) : (
                        'Seleccionar rango de fechas'
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={filters.dateRange ? {
                      from: filters.dateRange.from,
                      to: filters.dateRange.to
                    } : undefined}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        updateFilter('dateRange', { from: range.from, to: range.to });
                      } else if (range?.from && !range?.to) {
                        updateFilter('dateRange', { from: range.from, to: range.from });
                      } else if (!range) {
                        updateFilter('dateRange', null);
                      }
                    }}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              {filters.dateRange && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✓ Rango de fechas seleccionado
                </Badge>
              )}
            </div>
          </TabsContent>

          <TabsContent value="prioridad" className="space-y-4">
            {context === 'usuarios' ? (
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Selecciona Roles para Comparar
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roles?.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={filters.priority.includes(role.nombre)}
                        onCheckedChange={() => handlePriorityToggle(role.nombre)}
                      />
                      <label
                        htmlFor={`role-${role.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="truncate">{role.nombre}</span>
                      </label>
                    </div>
                  )) || []}
                </div>
                {filters.priority.length > 0 && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    ✓ {filters.priority.length} rol(es) seleccionado(s)
                  </Badge>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Selecciona Prioridades para Comparar
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {priorityOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${option.value}`}
                        checked={filters.priority.includes(option.value)}
                        onCheckedChange={() => handlePriorityToggle(option.value)}
                      />
                      <label
                        htmlFor={`priority-${option.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: option.color }}
                        />
                        <span className="truncate">{option.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
                {filters.priority.length > 0 && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    ✓ {filters.priority.length} prioridad(es) seleccionada(s)
                  </Badge>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="estados" className="space-y-4">
            {context === 'usuarios' ? (
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Selecciona Estados de Activación para Comparar
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {activacionOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`activacion-${option.value}`}
                        checked={filters.estados.includes(option.label)}
                        onCheckedChange={() => handleEstadoToggle(option.label)}
                      />
                      <label
                        htmlFor={`activacion-${option.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 min-w-0 flex-1"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: option.color }}
                        />
                        <span className="truncate">{option.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
                {filters.estados.length > 0 && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    ✓ {filters.estados.length} estado(s) seleccionado(s)
                  </Badge>
                )}
              </div>
            ) : (
              stats && stats.reportes.porEstado.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Selecciona Estados de Base de Datos para Comparar
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {stats.reportes.porEstado.map((estado) => (
                      <div key={estado.estado} className="flex items-center space-x-2">
                        <Checkbox
                          id={`estado-${estado.estado}`}
                          checked={filters.estados.includes(estado.estado)}
                          onCheckedChange={() => handleEstadoToggle(estado.estado)}
                        />
                        <label
                          htmlFor={`estado-${estado.estado}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 min-w-0 flex-1"
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: estado.color }}
                          />
                          <span className="truncate">{estado.estado} ({estado.count})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  {filters.estados.length > 0 && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ {filters.estados.length} estado(s) seleccionado(s)
                    </Badge>
                  )}
                </div>
              )
            )}
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4">
            {context === 'usuarios' ? (
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Selecciona Estados de Confirmación para Comparar
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {confirmacionOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`confirmacion-${option.value}`}
                        checked={filters.categorias.includes(option.label)}
                        onCheckedChange={() => handleCategoriaToggle(option.label)}
                      />
                      <label
                        htmlFor={`confirmacion-${option.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 min-w-0 flex-1"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: option.color }}
                        />
                        <span className="truncate">{option.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
                {filters.categorias.length > 0 && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    ✓ {filters.categorias.length} estado(s) seleccionado(s)
                  </Badge>
                )}
              </div>
            ) : (
              stats && stats.reportes.porCategoria.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Selecciona Categorías para Comparar
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {stats.reportes.porCategoria.map((categoria) => (
                      <div key={categoria.categoria} className="flex items-center space-x-2">
                        <Checkbox
                          id={`categoria-${categoria.categoria}`}
                          checked={filters.categorias.includes(categoria.categoria)}
                          onCheckedChange={() => handleCategoriaToggle(categoria.categoria)}
                        />
                        <label
                          htmlFor={`categoria-${categoria.categoria}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 min-w-0 flex-1"
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: categoria.color }}
                          />
                          <span className="truncate">{categoria.categoria} ({categoria.count})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  {filters.categorias.length > 0 && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ {filters.categorias.length} categoría(s) seleccionada(s)
                    </Badge>
                  )}
                </div>
              )
            )}
          </TabsContent>

          {/* Nueva pestaña para Estado del Reporte */}
          {context === 'reportes' && (
            <TabsContent value="estado_reporte" className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Selecciona Estados del Reporte para Comparar
                </label>
                <div className="text-xs text-muted-foreground mb-3">
                  Estados basados en la lógica de negocio: Pendiente (sin asignar), En Proceso (asignado), Resuelto (completado)
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {estadoReporteOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          id={`estado-reporte-${option.value}`}
                          checked={filters.estados.includes(option.label)}
                          onCheckedChange={() => handleEstadoToggle(option.label)}
                        />
                        <label
                          htmlFor={`estado-reporte-${option.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <IconComponent 
                              className="h-4 w-4 flex-shrink-0" 
                              style={{ color: option.color }}
                            />
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: option.color }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.value === 'pendiente' && 'Reportes sin usuario asignado'}
                              {option.value === 'en_proceso' && 'Reportes con usuario asignado'}
                              {option.value === 'resuelto' && 'Reportes completados (activo = null)'}
                            </span>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
                {filters.estados.length > 0 && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    ✓ {filters.estados.length} estado(s) del reporte seleccionado(s)
                  </Badge>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};
