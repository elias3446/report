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
import { useRoles } from '@/hooks/useRoles';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Role } from '@/types/roles';
import { PERMISSION_LABELS } from '@/types/roles';
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield,
  Lock,
  Upload
} from 'lucide-react';
import { BulkRoleActionsDialog, type BulkRoleActionType } from './dialogs/BulkRoleActionsDialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface RolesListProps {
  onCreateRole: () => void;
  onEditRole: (role: Role) => void;
  onViewRole: (role: Role) => void;
  onBulkUpload: () => void;
}

// Define system roles that cannot be modified
const SYSTEM_ROLES = ['Administrador', 'Usuario'];

const isSystemRole = (roleName: string): boolean => {
  return SYSTEM_ROLES.includes(roleName);
};

const ITEMS_PER_PAGE = 5;

export const RolesList = ({ onCreateRole, onEditRole, onViewRole, onBulkUpload }: RolesListProps) => {
  const { 
    roles, 
    isLoading, 
    deleteRole, 
    toggleRoleStatus, 
    isDeleting, 
    isToggling 
  } = useRoles();
  
  const isMobile = useIsMobile();
  const [filters, setFilters] = useDataTableFilters();
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados para diálogos de confirmación
  const [deleteDialog, setDeleteDialog] = useState({ open: false, role: null as Role | null });
  const [statusDialog, setStatusDialog] = useState({ open: false, role: null as Role | null });
  
  // Estados para diálogos de acción masiva
  const [bulkActionDialog, setBulkActionDialog] = useState({
    open: false,
    actionType: 'delete' as BulkRoleActionType,
    roles: [] as Role[]
  });

  // Filter non-system roles for bulk selection
  const selectableRoles = useMemo(() => {
    return filteredData.filter(role => !isSystemRole(role.nombre));
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
  } = useBulkSelection(selectableRoles); // Use all selectable filtered data for bulk selection

  // Check if all visible items on current page are selected
  const visibleSelectableItems = paginatedData.filter(role => !isSystemRole(role.nombre));
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

  // Define columns for the table
  const columns: DataTableColumn[] = [
    { key: 'nombre', label: 'Rol', searchable: true, sortable: true, filterable: true },
    { key: 'descripcion', label: 'Descripción', searchable: true, sortable: true, filterable: true },
    { key: 'permisos_display', label: 'Permisos', type: 'array', searchable: true, sortable: false, filterable: true },
    { key: 'activo_display', label: 'Estado', type: 'text', searchable: false, sortable: true, filterable: true },
    { key: 'created_at_display', label: 'Fecha de Creación', type: 'date', searchable: false, sortable: true, filterable: true },
  ];

  // Sensitive properties for special filters
  const sensitiveProperties = ['activo_display', 'permisos_display'];

  // Transform roles data for the table with consistent field names
  const transformedRoles = roles.map(role => ({
    ...role,
    activo_display: role.activo ? 'Activo' : 'Inactivo',
    permisos_display: role.permisos.map(p => PERMISSION_LABELS[p]),
    created_at_display: new Date(role.created_at).toLocaleDateString('es-ES'),
  }));

  // Initialize filtered data when roles change
  useEffect(() => {
    setFilteredData(transformedRoles);
  }, [roles]);

  // Handlers para acciones individuales
  const handleDeleteClick = (role: Role) => {
    if (isSystemRole(role.nombre)) {
      return; // No allow delete for system roles
    }
    setDeleteDialog({ open: true, role });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.role && !isSystemRole(deleteDialog.role.nombre)) {
      deleteRole(deleteDialog.role.id);
      setDeleteDialog({ open: false, role: null });
    }
  };

  const handleStatusClick = (role: Role) => {
    if (isSystemRole(role.nombre)) {
      return; // No allow status change for system roles
    }
    setStatusDialog({ open: true, role });
  };

  const handleStatusConfirm = () => {
    if (statusDialog.role && !isSystemRole(statusDialog.role.nombre)) {
      toggleRoleStatus({ id: statusDialog.role.id, activo: !statusDialog.role.activo });
      setStatusDialog({ open: false, role: null });
    }
  };

  const handleEditRole = (role: Role) => {
    if (isSystemRole(role.nombre)) {
      return; // No allow edit for system roles
    }
    onEditRole(role);
  };

  // Handle removing a role from bulk selection
  const handleRemoveFromBulkAction = (roleId: string) => {
    handleSelectItem(roleId); // This will deselect the item
    // Update the dialog state to remove the role from the list
    setBulkActionDialog(prev => ({
      ...prev,
      roles: prev.roles.filter(role => role.id !== roleId)
    }));
  };

  // Handlers para acciones masivas
  const handleBulkDelete = () => {
    const selectedData = getSelectedData();
    setBulkActionDialog({
      open: true,
      actionType: 'delete',
      roles: selectedData
    });
  };

  const handleBulkToggleStatus = () => {
    const selectedData = getSelectedData();
    setBulkActionDialog({
      open: true,
      actionType: 'toggle_status',
      roles: selectedData
    });
  };

  const confirmBulkAction = (data: any) => {
    const { roles } = bulkActionDialog;
    
    switch (bulkActionDialog.actionType) {
      case 'delete':
        roles.forEach(role => deleteRole(role.id));
        break;
      case 'toggle_status':
        roles.forEach(role => {
          toggleRoleStatus({ id: role.id, activo: !role.activo });
        });
        break;
    }
    
    clearSelection();
    setBulkActionDialog({ open: false, actionType: 'delete', roles: [] });
  };

  const handleBulkExport = () => {
    const selectedData = getSelectedData();
    handleExport(selectedData);
  };

  const handleExport = (filteredData: any[]) => {
    // Transform data for export
    const exportData = filteredData.map(role => ({
      Rol: role.nombre,
      Descripción: role.descripcion,
      Permisos: Array.isArray(role.permisos_display) ? role.permisos_display.join(', ') : role.permisos_display,
      Estado: role.activo_display,
      'Fecha de Creación': role.created_at_display,
    }));
    
    const csvContent = generateCSV(exportData);
    downloadCSV(csvContent, 'roles');
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
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Cargando roles...</p>
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
                <Shield className="h-5 w-5" />
                Gestión de Roles
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Administra los roles y permisos del sistema
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={onBulkUpload} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                <Upload className="h-4 w-4" />
                <span className="sm:inline">Carga Masiva</span>
              </Button>
              <Button onClick={onCreateRole} className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Crear Rol</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Toolbar with filters and search */}
          <DataTableToolbar
            data={transformedRoles}
            columns={columns}
            sensitiveProperties={sensitiveProperties}
            filters={filters}
            onFiltersChange={setFilters}
            onExport={handleExport}
            exportFileName="roles"
            searchPlaceholder="Buscar roles por nombre, descripción, permisos..."
            className="mb-4"
            onDataFilter={setFilteredData}
          />

          {/* Bulk Actions Bar - only show if there are non-system roles selected */}
          <BulkActionsBar
            selectedCount={selectedCount}
            onClearSelection={clearSelection}
            onBulkDelete={handleBulkDelete}
            onBulkToggleStatus={handleBulkToggleStatus}
            onBulkExport={handleBulkExport}
            isDeleting={isDeleting}
            isToggling={isToggling}
            showStatusToggle={true}
          />

          {/* Roles content */}
          {roles.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron roles</h3>
              <p className="text-gray-500 mb-4">
                Comienza creando tu primer rol del sistema.
              </p>
              <Button onClick={onCreateRole}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Rol
              </Button>
            </div>
          ) : (
            <>
              {/* Table View - Both Desktop and Mobile */}
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
                      <TableHead>Rol</TableHead>
                      <TableHead className="hidden lg:table-cell">Descripción</TableHead>
                      <TableHead>Permisos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden xl:table-cell">Fecha de Creación</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((role) => {
                      const isSystemRoleItem = isSystemRole(role.nombre);
                      
                      return (
                        <TableRow key={role.id}>
                          <TableCell>
                            {isSystemRoleItem ? (
                              <div title="Rol del sistema protegido">
                                <Lock className="h-4 w-4 text-gray-400" />
                              </div>
                            ) : (
                              <Checkbox
                                checked={selectedItems.has(role.id)}
                                onCheckedChange={() => handleSelectItem(role.id)}
                              />
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                style={{ backgroundColor: role.color }}
                              >
                                {role.icono.charAt(0)}
                              </div>
                              <div>
                                <button
                                  onClick={() => onViewRole(role)}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                >
                                  {role.nombre}
                                  {isSystemRoleItem && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Sistema
                                    </Badge>
                                  )}
                                </button>
                                <p className="text-sm text-gray-500">{role.icono}</p>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="hidden lg:table-cell">
                            <p className="max-w-xs truncate" title={role.descripcion}>
                              {role.descripcion}
                            </p>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {role.permisos.slice(0, 2).map((permission) => (
                                <Badge key={permission} variant="secondary" className="text-xs">
                                  {PERMISSION_LABELS[permission]}
                                </Badge>
                              ))}
                              {role.permisos.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{role.permisos.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={role.activo}
                                onCheckedChange={() => handleStatusClick(role)}
                                disabled={isToggling || isSystemRoleItem}
                              />
                              <Badge variant={role.activo ? "default" : "secondary"}>
                                {role.activo ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </TableCell>
                          
                          <TableCell className="hidden xl:table-cell">
                            <p className="text-sm">
                              {new Date(role.created_at).toLocaleDateString('es-ES')}
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
                                {!isSystemRoleItem && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleEditRole(role)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteClick(role)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {isSystemRoleItem && (
                                  <DropdownMenuItem disabled>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Rol protegido del sistema
                                  </DropdownMenuItem>
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
                    <span className="font-medium">{selectedCount} roles seleccionados</span>
                    {selectedCount !== selectableRoles.length && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-6 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Seleccionar todos ({selectableRoles.length})
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

      {/* Diálogo de confirmación para eliminación individual */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, role: null })}
        title="¿Estás seguro?"
        description={`Esta acción eliminará el rol "${deleteDialog.role?.nombre}" de forma permanente. Los usuarios con este rol perderán estos permisos.`}
        confirmText="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        variant="destructive"
      />

      {/* Diálogo de confirmación para cambio de estado individual */}
      <ConfirmationDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog({ open, role: null })}
        title="Cambiar estado del rol"
        description={`¿Estás seguro de que quieres ${statusDialog.role?.activo ? 'desactivar' : 'activar'} el rol "${statusDialog.role?.nombre}"?`}
        confirmText={statusDialog.role?.activo ? 'Desactivar' : 'Activar'}
        onConfirm={handleStatusConfirm}
        isLoading={isToggling}
      />

      {/* Diálogo de acción masiva */}
      <BulkRoleActionsDialog
        open={bulkActionDialog.open}
        onOpenChange={(open) => setBulkActionDialog(prev => ({ ...prev, open }))}
        roles={bulkActionDialog.roles}
        actionType={bulkActionDialog.actionType}
        isLoading={isDeleting || isToggling}
        onConfirm={confirmBulkAction}
        onRemoveRole={handleRemoveFromBulkAction}
      />
    </>
  );
};
