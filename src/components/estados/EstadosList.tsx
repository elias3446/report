
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTableToolbar, useDataTableFilters, type DataTableColumn } from '@/components/ui/data-table-toolbar';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { BulkEstadoActionsDialog, type BulkEstadoActionType } from './dialogs/BulkEstadoActionsDialog';
import { useEstados } from '@/hooks/useEstados';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Estado } from '@/types/estados';
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Circle,
  Lock,
  Upload
} from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface EstadosListProps {
  onCreateEstado: () => void;
  onEditEstado: (estado: Estado) => void;
  onViewEstado: (estado: Estado) => void;
  onBulkUpload: () => void;
}

// Define system estados that cannot be modified
const SYSTEM_ESTADOS = ['Sin estado'];

const isSystemEstado = (estadoName: string): boolean => {
  return SYSTEM_ESTADOS.includes(estadoName);
};

const ITEMS_PER_PAGE = 5;

export const EstadosList = ({ onCreateEstado, onEditEstado, onViewEstado, onBulkUpload }: EstadosListProps) => {
  const { 
    estados, 
    isLoading, 
    deleteEstado, 
    toggleEstadoStatus, 
    isDeleting, 
    isToggling 
  } = useEstados();
  
  const isMobile = useIsMobile();
  const [filters, setFilters] = useDataTableFilters();
  const [estadoToDelete, setEstadoToDelete] = useState<Estado | null>(null);
  const [estadoToToggle, setEstadoToToggle] = useState<Estado | null>(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    type: BulkEstadoActionType | null;
    estados: Estado[];
  }>({ open: false, type: null, estados: [] });

  // Filter out system estados for bulk selection
  const selectableEstados = useMemo(() => {
    return filteredData.filter(estado => !isSystemEstado(estado.nombre));
  }, [filteredData]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filtered data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length]);

  // Bulk selection hook - NOW USES ALL SELECTABLE FILTERED DATA, NOT JUST PAGINATED
  const {
    selectedItems,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectItem,
    clearSelection,
    getSelectedData,
    selectedCount,
  } = useBulkSelection(selectableEstados); // Use all selectable filtered data for bulk selection
  
  // Debug logs
  console.log('Estados - Total filtrados:', filteredData.length);
  console.log('Estados - Seleccionables:', selectableEstados.length);
  console.log('Estados - Seleccionados:', selectedCount);

  // Check if all visible items on current page are selected
  const visibleSelectableItems = paginatedData.filter(estado => !isSystemEstado(estado.nombre));
  const visibleItemsSelected = visibleSelectableItems.every(item => selectedItems.has(item.id));
  const someVisibleItemsSelected = visibleSelectableItems.some(item => selectedItems.has(item.id));
  const isCurrentPageIndeterminate = someVisibleItemsSelected && !visibleItemsSelected;

  // Handler for selecting/deselecting all items on current page
  const handleSelectAllCurrentPage = () => {
    if (visibleItemsSelected) {
      // Deselect all items on current page
      visibleSelectableItems.forEach(item => {
        if (selectedItems.has(item.id)) {
          handleSelectItem(item.id);
        }
      });
    } else {
      // Select all items on current page
      visibleSelectableItems.forEach(item => {
        if (!selectedItems.has(item.id)) {
          handleSelectItem(item.id);
        }
      });
    }
  };

  const columns: DataTableColumn[] = [
    { key: 'nombre', label: 'Estado', searchable: true, sortable: true, filterable: true },
    { key: 'descripcion', label: 'Descripción', searchable: true, sortable: true, filterable: true },
    { key: 'activo_display', label: 'Estado', type: 'text', searchable: false, sortable: true, filterable: true },
    { key: 'created_at_display', label: 'Fecha de Creación', type: 'date', searchable: false, sortable: true, filterable: true },
  ];

  const sensitiveProperties = ['activo_display'];

  const transformedEstados = estados.map(estado => ({
    ...estado,
    activo_display: estado.activo ? 'Activo' : 'Inactivo',
    created_at_display: new Date(estado.created_at).toLocaleDateString('es-ES'),
  }));

  useEffect(() => {
    setFilteredData(transformedEstados);
  }, [estados]);

  const handleDeleteEstado = () => {
    if (estadoToDelete && !isSystemEstado(estadoToDelete.nombre)) {
      deleteEstado(estadoToDelete.id);
      setEstadoToDelete(null);
    }
  };

  const handleToggleStatus = (estado: Estado) => {
    if (isSystemEstado(estado.nombre)) return;
    setEstadoToToggle(estado);
  };

  const confirmToggleStatus = () => {
    if (estadoToToggle && !isSystemEstado(estadoToToggle.nombre)) {
      toggleEstadoStatus({ id: estadoToToggle.id, activo: !estadoToToggle.activo });
      setEstadoToToggle(null);
    }
  };

  const handleEditEstadoClick = (estado: Estado) => {
    if (isSystemEstado(estado.nombre)) return;
    onEditEstado(estado);
  };

  const handleDeleteClick = (estado: Estado) => {
    if (isSystemEstado(estado.nombre)) return;
    setEstadoToDelete(estado);
  };

  // Bulk actions
  const handleBulkDelete = () => {
    const selectedData = getSelectedData();
    setBulkActionDialog({
      open: true,
      type: 'delete',
      estados: selectedData
    });
  };

  const handleBulkToggleStatus = () => {
    const selectedData = getSelectedData();
    setBulkActionDialog({
      open: true,
      type: 'toggle_status',
      estados: selectedData
    });
  };

  const handleBulkActionConfirm = (data: any) => {
    const { type, estados: estadosToProcess } = bulkActionDialog;
    
    if (type === 'delete') {
      estadosToProcess.forEach(estado => deleteEstado(estado.id));
    } else if (type === 'toggle_status') {
      estadosToProcess.forEach(estado => {
        toggleEstadoStatus({ id: estado.id, activo: !estado.activo });
      });
    }
    
    clearSelection();
    setBulkActionDialog({ open: false, type: null, estados: [] });
  };

  const handleRemoveEstadoFromBulkAction = (estadoId: string) => {
    setBulkActionDialog(prev => ({
      ...prev,
      estados: prev.estados.filter(estado => estado.id !== estadoId)
    }));
    
    // Remove from selection in the main table
    handleSelectItem(estadoId);
  };

  const handleBulkExport = () => {
    const selectedData = getSelectedData();
    handleExport(selectedData);
  };

  const handleExport = (filteredData: any[]) => {
    const exportData = filteredData.map(estado => ({
      Estado: estado.nombre,
      Descripción: estado.descripcion,
      Activo: estado.activo_display,
      'Fecha de Creación': estado.created_at_display,
    }));
    
    const csvContent = generateCSV(exportData);
    downloadCSV(csvContent, 'estados');
  };

  const generateCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item =>
      Object.values(item).map(value => {
        const stringValue = String(value || '');
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Circle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Cargando estados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Circle className="h-5 w-5" />
                Gestión de Estados
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Administra los estados del sistema
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={onBulkUpload} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                <Upload className="h-4 w-4" />
                <span className="sm:inline">Carga Masiva</span>
              </Button>
              <Button onClick={onCreateEstado} className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Crear Estado</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DataTableToolbar
            data={transformedEstados}
            columns={columns}
            sensitiveProperties={sensitiveProperties}
            filters={filters}
            onFiltersChange={setFilters}
            onExport={handleExport}
            exportFileName="estados"
            searchPlaceholder="Buscar estados por nombre, descripción..."
            className="mb-4"
            onDataFilter={setFilteredData}
          />

          {/* Bulk Actions Bar */}
          <BulkActionsBar
            selectedCount={selectedCount}
            onClearSelection={clearSelection}
            onBulkDelete={handleBulkDelete}
            onBulkToggleStatus={handleBulkToggleStatus}
            onBulkExport={handleBulkExport}
            isDeleting={isDeleting}
            isToggling={isToggling}
          />

          {estados.length === 0 ? (
            <div className="text-center py-12">
              <Circle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron estados</h3>
              <p className="text-gray-500 mb-4">
                Comienza creando tu primer estado del sistema.
              </p>
              <Button onClick={onCreateEstado}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Estado
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                       <TableHead className="w-[40px]">
                         <Checkbox
                           checked={visibleItemsSelected}
                           onCheckedChange={handleSelectAllCurrentPage}
                           ref={(el) => {
                             if (el && 'indeterminate' in el) {
                               (el as any).indeterminate = isCurrentPageIndeterminate;
                             }
                           }}
                         />
                       </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden lg:table-cell">Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden xl:table-cell">Fecha de Creación</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((estado) => {
                      const isSystemEstadoItem = isSystemEstado(estado.nombre);
                      
                      return (
                        <TableRow key={estado.id}>
                          <TableCell>
                            {isSystemEstadoItem ? (
                              <Lock className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Checkbox
                                checked={selectedItems.has(estado.id)}
                                onCheckedChange={() => handleSelectItem(estado.id)}
                              />
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                style={{ backgroundColor: estado.color }}
                              >
                                {estado.icono.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onViewEstado(estado)}
                                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                  >
                                    {estado.nombre}
                                  </button>
                                  {isSystemEstadoItem && (
                                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                      <Lock className="h-3 w-3" />
                                      Sistema
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{estado.icono}</p>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="hidden lg:table-cell">
                            <p className="max-w-xs truncate" title={estado.descripcion}>
                              {estado.descripcion}
                            </p>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={estado.activo}
                                onCheckedChange={() => handleToggleStatus(estado)}
                                disabled={isToggling || isSystemEstadoItem}
                              />
                              <Badge variant={estado.activo ? "default" : "secondary"}>
                                {estado.activo ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </TableCell>
                          
                          <TableCell className="hidden xl:table-cell">
                            <p className="text-sm">
                              {new Date(estado.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </TableCell>
                          
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleEditEstadoClick(estado)}
                                  disabled={isSystemEstadoItem}
                                >
                                  {isSystemEstadoItem ? (
                                    <Lock className="h-4 w-4 mr-2" />
                                  ) : (
                                    <Edit className="h-4 w-4 mr-2" />
                                  )}
                                  {isSystemEstadoItem ? 'Protegido' : 'Editar'}
                                </DropdownMenuItem>
                                {!isSystemEstadoItem && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteClick(estado)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
               </div>

              {/* Enhanced selection info */}
              {selectedCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <span className="font-medium">{selectedCount} estados seleccionados</span>
                    {selectedCount !== selectableEstados.length && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-6 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Seleccionar todos ({selectableEstados.length})
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    className="h-6 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Limpiar selección
                  </Button>
                </div>
              )}

              {/* Pagination Info and Controls */}
              {filteredData.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  {/* Info section */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>
                      Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} elementos
                    </span>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                onClick={() => handlePageChange(pageNumber)}
                                isActive={currentPage === pageNumber}
                                className="cursor-pointer"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Individual delete confirmation dialog */}
      <ConfirmationDialog
        open={!!estadoToDelete}
        onOpenChange={(open) => !open && setEstadoToDelete(null)}
        title="¿Estás seguro?"
        description={`Esta acción eliminará el estado "${estadoToDelete?.nombre}" de forma permanente. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDeleteEstado}
        isLoading={isDeleting}
        variant="destructive"
      />

      {/* Individual status change confirmation dialog */}
      <ConfirmationDialog
        open={!!estadoToToggle}
        onOpenChange={(open) => !open && setEstadoToToggle(null)}
        title="¿Estás seguro?"
        description={`Esta acción ${estadoToToggle?.activo ? 'desactivará' : 'activará'} el estado "${estadoToToggle?.nombre}".`}
        confirmText={estadoToToggle?.activo ? 'Desactivar' : 'Activar'}
        onConfirm={confirmToggleStatus}
        isLoading={isToggling}
      />

      {/* Bulk actions dialog */}
      <BulkEstadoActionsDialog
        open={bulkActionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setBulkActionDialog({ open: false, type: null, estados: [] });
          }
        }}
        estados={bulkActionDialog.estados}
        actionType={bulkActionDialog.type || 'toggle_status'}
        onConfirm={handleBulkActionConfirm}
        onRemoveEstado={handleRemoveEstadoFromBulkAction}
        isLoading={isDeleting || isToggling}
      />
    </>
  );
};
