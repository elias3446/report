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
import { BulkReportActionsDialog, type BulkActionType } from './dialogs/BulkReportActionsDialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useReportes } from '@/hooks/useReportes';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Reporte } from '@/types/reportes';
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Calendar,
  User,
  Eye
} from 'lucide-react';

interface ReportesListProps {
  onCreateReporte: () => void;
  onEditReporte: (reporte: Reporte) => void;
  onViewReporte: (reporte: Reporte) => void;
  onBulkUpload: () => void;
}

const ITEMS_PER_PAGE = 5;

export const ReportesList = ({ onCreateReporte, onEditReporte, onViewReporte, onBulkUpload }: ReportesListProps) => {
  const { 
    reportes, 
    isLoading, 
    deleteReporte, 
    toggleReporteStatus,
    bulkToggleStatus,
    bulkDelete,
    bulkChangeCategory,
    bulkChangeEstado,
    bulkChangeAssignment,
    isDeleting, 
    isToggling,
    isBulkToggling,
    isBulkDeleting,
    isBulkChangingCategory,
    isBulkChangingEstado,
    isBulkChangingAssignment
  } = useReportes();
  
  const isMobile = useIsMobile();
  const [filters, setFilters] = useDataTableFilters();
  const [reporteToDelete, setReporteToDelete] = useState<Reporte | null>(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    type: BulkActionType;
  }>({ open: false, type: 'toggle_status' });

  // Bulk selection hook - NOW USES ALL FILTERED DATA, NOT JUST PAGINATED
  const {
    selectedItems,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectItem,
    clearSelection,
    getSelectedData,
    selectedCount,
  } = useBulkSelection(filteredData); // Use all filtered data for bulk selection

  // Define columns for the table
  const columns: DataTableColumn[] = [
    { key: 'nombre', label: 'Nombre', searchable: true, sortable: true, filterable: true },
    { key: 'descripcion', label: 'Descripción', searchable: true, sortable: true, filterable: true },
    { key: 'categoria_display', label: 'Categoría', type: 'text', searchable: false, sortable: true, filterable: true },
    { key: 'estado_display', label: 'Estado', type: 'text', searchable: false, sortable: true, filterable: true },
    { key: 'activo_display', label: 'Activo', type: 'text', searchable: false, sortable: true, filterable: true },
    { key: 'created_at_display', label: 'Fecha de Creación', type: 'date', searchable: false, sortable: true, filterable: true },
  ];

  // Sensitive properties for special filters
  const sensitiveProperties = ['categoria_display', 'estado_display', 'activo_display'];

  // Transform reportes data for the table using useMemo to prevent infinite re-renders
  const transformedReportes = useMemo(() => {
    return reportes.map(reporte => ({
      ...reporte,
      categoria_display: reporte.categoria?.deleted_at 
        ? `${reporte.categoria.nombre} (Eliminada)` 
        : reporte.categoria?.nombre || 'Sin categoría',
      estado_display: reporte.estado?.deleted_at 
        ? `${reporte.estado.nombre} (Eliminado)` 
        : reporte.estado?.nombre || 'Sin estado',
      activo_display: reporte.activo === null ? 'Resuelto' : reporte.activo ? 'Activo' : 'Inactivo',
      created_at_display: new Date(reporte.created_at).toLocaleDateString('es-ES'),
    }));
  }, [reportes]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filtered data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length]);

  // Initialize filtered data when transformedReportes change
  useEffect(() => {
    setFilteredData(transformedReportes);
  }, [transformedReportes]);

  // Check if all visible items on current page are selected
  const visibleItemsSelected = paginatedData.every(item => selectedItems.has(item.id));
  const someVisibleItemsSelected = paginatedData.some(item => selectedItems.has(item.id));
  const isCurrentPageIndeterminate = someVisibleItemsSelected && !visibleItemsSelected;

  // Handler for selecting/deselecting all items on current page
  const handleSelectAllCurrentPage = () => {
    if (visibleItemsSelected) {
      // Deselect all items on current page
      paginatedData.forEach(item => {
        if (selectedItems.has(item.id)) {
          handleSelectItem(item.id);
        }
      });
    } else {
      // Select all items on current page
      paginatedData.forEach(item => {
        if (!selectedItems.has(item.id)) {
          handleSelectItem(item.id);
        }
      });
    }
  };

  const handleDeleteReporte = () => {
    if (reporteToDelete) {
      console.log('Deleting reporte:', reporteToDelete.id);
      deleteReporte(reporteToDelete.id);
      setReporteToDelete(null);
    }
  };

  // Handle removing a report from bulk selection
  const handleRemoveFromBulkAction = (reporteId: string) => {
    handleSelectItem(reporteId); // This will deselect the item
  };

  const handleToggleStatus = (reporte: Reporte) => {
    console.log('Toggling status for reporte:', reporte.id, 'current activo:', reporte.activo);
    // Fix: usar la función correcta de toggleReporteStatus que espera { id, activo }
    toggleReporteStatus({ id: reporte.id, activo: reporte.activo });
  };

  // Bulk actions
  const handleBulkAction = (actionType: BulkActionType) => {
    setBulkActionDialog({ open: true, type: actionType });
  };

  const confirmBulkAction = (data: any) => {
    const selectedData = getSelectedData();
    const reporteIds = selectedData.map(r => r.id);

    switch (bulkActionDialog.type) {
      case 'toggle_status':
        bulkToggleStatus(reporteIds);
        break;
      case 'delete':
        bulkDelete(reporteIds);
        break;
      case 'change_category':
        bulkChangeCategory({ reporteIds, categoryId: data.categoryId });
        break;
      case 'change_estado':
        bulkChangeEstado({ reporteIds, estadoId: data.estadoId });
        break;
      case 'change_assignment':
        bulkChangeAssignment({ reporteIds, userId: data.userId });
        break;
    }

    clearSelection();
    setBulkActionDialog({ open: false, type: 'toggle_status' });
  };

  const handleBulkExport = () => {
    const selectedData = getSelectedData();
    handleExport(selectedData);
  };

  const handleExport = (filteredData: any[]) => {
    const exportData = filteredData.map(reporte => ({
      Nombre: reporte.nombre,
      Descripción: reporte.descripcion,
      Categoría: reporte.categoria_display,
      Estado: reporte.estado_display,
      Activo: reporte.activo_display,
      'Fecha de Creación': reporte.created_at_display,
    }));
    
    const csvContent = generateCSV(exportData);
    downloadCSV(csvContent, 'reportes');
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
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Cargando reportes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gestión de Reportes
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Administra los reportes del sistema
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={onBulkUpload} 
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                <span className="sm:inline">Carga Masiva</span>
              </Button>
              <Button onClick={onCreateReporte} className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Crear Reporte</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Toolbar with filters and search */}
          <DataTableToolbar
            data={transformedReportes}
            columns={columns}
            sensitiveProperties={sensitiveProperties}
            filters={filters}
            onFiltersChange={setFilters}
            onExport={handleExport}
            exportFileName="reportes"
            searchPlaceholder="Buscar reportes por nombre, descripción..."
            onDataFilter={setFilteredData}
          />

          {/* Bulk Actions Bar */}
          <BulkActionsBar
            selectedCount={selectedCount}
            onClearSelection={clearSelection}
            onBulkDelete={() => handleBulkAction('delete')}
            onBulkToggleStatus={() => handleBulkAction('toggle_status')}
            onBulkChangeCategory={() => handleBulkAction('change_category')}
            onBulkChangeEstado={() => handleBulkAction('change_estado')}
            onBulkChangeAssignment={() => handleBulkAction('change_assignment')}
            onBulkExport={handleBulkExport}
            isDeleting={isBulkDeleting}
            isToggling={isBulkToggling}
            isChangingCategory={isBulkChangingCategory}
            isChangingEstado={isBulkChangingEstado}
            isChangingAssignment={isBulkChangingAssignment}
            showCategoryChange={true}
            showEstadoChange={true}
            showAssignmentChange={true}
          />

          {/* Content */}
          {reportes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron reportes</h3>
              <p className="text-gray-500 mb-4">
                Comienza creando tu primer reporte del sistema.
              </p>
              <Button onClick={onCreateReporte}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Reporte
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
                      <TableHead className={isMobile ? "min-w-[120px]" : "min-w-[200px]"}>Nombre</TableHead>
                      {!isMobile && <TableHead className="min-w-[250px]">Descripción</TableHead>}
                      <TableHead className={isMobile ? "min-w-[80px]" : "min-w-[120px]"}>Categoría</TableHead>
                      <TableHead className={isMobile ? "min-w-[80px]" : "min-w-[120px]"}>Estado</TableHead>
                      <TableHead className={isMobile ? "min-w-[60px]" : "min-w-[100px]"}>Activo</TableHead>
                      {!isMobile && <TableHead className="min-w-[120px]">Fecha de Creación</TableHead>}
                      <TableHead className="w-[50px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((reporte) => (
                      <TableRow key={reporte.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.has(reporte.id)}
                            onCheckedChange={() => handleSelectItem(reporte.id)}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <button
                            onClick={() => onViewReporte(reporte)}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                          >
                            <span className={isMobile ? "line-clamp-2 break-words text-xs" : ""}>
                              {reporte.nombre}
                            </span>
                          </button>
                          {isMobile && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {reporte.descripcion}
                            </p>
                          )}
                        </TableCell>
                        
                        {!isMobile && (
                          <TableCell className="max-w-xs">
                            <p className="text-sm truncate" title={reporte.descripcion}>
                              {reporte.descripcion}
                            </p>
                          </TableCell>
                        )}
                        
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {reporte.categoria?.deleted_at ? (
                              <Badge variant="destructive" className={`flex items-center gap-1 ${isMobile ? 'text-xs px-1' : ''}`}>
                                <AlertTriangle className="h-2 w-2" />
                                {isMobile ? 'Elim.' : `${reporte.categoria.nombre} (Eliminada)`}
                              </Badge>
                            ) : reporte.categoria ? (
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-2 h-2 rounded-full shrink-0" 
                                  style={{ backgroundColor: reporte.categoria.color }}
                                />
                                <span className={isMobile ? "text-xs truncate max-w-[60px]" : "text-sm"}>
                                  {reporte.categoria.nombre}
                                </span>
                              </div>
                            ) : (
                              <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Sin categoría</span>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {reporte.estado?.deleted_at ? (
                              <Badge variant="destructive" className={`flex items-center gap-1 ${isMobile ? 'text-xs px-1' : ''}`}>
                                <AlertTriangle className="h-2 w-2" />
                                {isMobile ? 'Elim.' : `${reporte.estado.nombre} (Eliminado)`}
                              </Badge>
                            ) : reporte.estado ? (
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-2 h-2 rounded-full shrink-0" 
                                  style={{ backgroundColor: reporte.estado.color }}
                                />
                                <span className={isMobile ? "text-xs truncate max-w-[60px]" : "text-sm"}>
                                  {reporte.estado.nombre}
                                </span>
                              </div>
                            ) : (
                              <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Sin estado</span>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className={`flex items-center gap-1 ${isMobile ? 'flex-col' : ''}`}>
                            <Switch
                              checked={reporte.activo === true}
                              onCheckedChange={() => handleToggleStatus(reporte)}
                              disabled={isToggling || reporte.activo === null}
                              className={isMobile ? "scale-75" : ""}
                            />
                            {!isMobile && (
                              <Badge 
                                variant={
                                  reporte.activo === null ? "outline" : 
                                  reporte.activo ? "default" : "secondary"
                                } 
                                className="flex items-center gap-1"
                              >
                                {reporte.activo === null ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : reporte.activo ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {reporte.activo === null ? 'Resuelto' : reporte.activo ? 'Activo' : 'Inactivo'}
                              </Badge>
                            )}
                          </div>
                          {isMobile && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="h-2 w-2" />
                              {new Date(reporte.created_at).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </TableCell>
                        
                        {!isMobile && (
                          <TableCell>
                            <p className="text-sm">
                              {new Date(reporte.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </TableCell>
                        )}
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className={isMobile ? "h-6 w-6 p-0" : ""}>
                                <MoreHorizontal className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditReporte(reporte)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setReporteToDelete(reporte)}
                                className="text-red-600"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Enhanced selection info */}
              {selectedCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <span className="font-medium">{selectedCount} reportes seleccionados</span>
                    {selectedCount !== filteredData.length && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-6 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Seleccionar todos ({filteredData.length})
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

      {/* Bulk actions dialog */}
      <BulkReportActionsDialog
        open={bulkActionDialog.open}
        onOpenChange={(open) => setBulkActionDialog(prev => ({ ...prev, open }))}
        reportes={getSelectedData()}
        actionType={bulkActionDialog.type}
        onConfirm={confirmBulkAction}
        onRemoveReporte={handleRemoveFromBulkAction}
        isLoading={isBulkToggling || isBulkDeleting || isBulkChangingCategory || isBulkChangingEstado || isBulkChangingAssignment}
      />

      {/* Individual delete confirmation - using the new dialog for consistency */}
      {reporteToDelete && (
        <BulkReportActionsDialog
          open={!!reporteToDelete}
          onOpenChange={(open) => !open && setReporteToDelete(null)}
          reportes={[reporteToDelete]}
          actionType="delete"
          onConfirm={() => {
            handleDeleteReporte();
            setReporteToDelete(null);
          }}
          isLoading={isDeleting}
        />
      )}
    </>
  );
};

export default ReportesList;
