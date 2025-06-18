
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { DataTableToolbar, useDataTableFilters, type DataTableColumn } from '@/components/ui/data-table-toolbar';
import { useReportes } from '@/hooks/useReportes';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Search, 
  Calendar, 
  User, 
  AlertTriangle, 
  FileText,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';

const priorityConfig = {
  urgente: { color: '#DC2626', label: 'Urgente' },
  alto: { color: '#EA580C', label: 'Alto' },
  medio: { color: '#D97706', label: 'Medio' },
  bajo: { color: '#059669', label: 'Bajo' },
};

const ITEMS_PER_PAGE = 5;

export const ReportesPublicos = () => {
  // Usar el hook con onlyPublic: true para filtrar solo reportes activos y no eliminados
  const { reportes, isLoading } = useReportes(true);
  const isMobile = useIsMobile();
  const [filters, setFilters] = useDataTableFilters();
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Define columns for the table
  const columns: DataTableColumn[] = [
    { key: 'nombre', label: 'Nombre', searchable: true, sortable: true, filterable: true },
    { key: 'descripcion', label: 'Descripción', searchable: true, sortable: true, filterable: true },
    { key: 'categoria_display', label: 'Categoría', type: 'text', searchable: false, sortable: true, filterable: true },
    { key: 'estado_display', label: 'Estado', type: 'text', searchable: false, sortable: true, filterable: true },
    { key: 'priority_display', label: 'Prioridad', type: 'text', searchable: false, sortable: true, filterable: true },
    { key: 'created_at_display', label: 'Fecha de Creación', type: 'date', searchable: false, sortable: true, filterable: true },
  ];

  // Sensitive properties for special filters
  const sensitiveProperties = ['categoria_display', 'estado_display', 'priority_display'];

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
      priority_display: priorityConfig[reporte.priority]?.label || 'Urgente',
      created_at_display: new Date(reporte.created_at).toLocaleDateString('es-ES'),
    }));
  }, [reportes]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filtered data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length]);

  // Initialize filtered data when transformedReportes change
  React.useEffect(() => {
    setFilteredData(transformedReportes);
  }, [transformedReportes]);

  const getEstadoColor = (estado: any) => {
    if (!estado) return 'bg-gray-500';
    return estado.color || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReporterName = (profile: any) => {
    if (!profile) return 'Usuario desconocido';
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return fullName || profile.email || 'Usuario desconocido';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExport = (filteredData: any[]) => {
    const exportData = filteredData.map(reporte => ({
      Nombre: reporte.nombre,
      Descripción: reporte.descripcion,
      Categoría: reporte.categoria_display,
      Estado: reporte.estado_display,
      Prioridad: reporte.priority_display,
      'Fecha de Creación': reporte.created_at_display,
    }));
    
    const csvContent = generateCSV(exportData);
    downloadCSV(csvContent, 'reportes-publicos');
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Cargando reportes...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">Reportes Públicos</h1>
            <p className="text-muted-foreground">
              Explora todos los reportes enviados por la comunidad
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reportes Públicos
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Lista de reportes disponibles públicamente
              </p>
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
            exportFileName="reportes-publicos"
            searchPlaceholder="Buscar reportes por nombre, descripción..."
            onDataFilter={setFilteredData}
          />

          {/* Content */}
          {reportes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron reportes</h3>
              <p className="text-gray-500 mb-4">
                Aún no hay reportes disponibles públicamente.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isMobile ? "min-w-[120px]" : "min-w-[200px]"}>Nombre</TableHead>
                      {!isMobile && <TableHead className="min-w-[250px]">Descripción</TableHead>}
                      <TableHead className={isMobile ? "min-w-[80px]" : "min-w-[120px]"}>Categoría</TableHead>
                      <TableHead className={isMobile ? "min-w-[80px]" : "min-w-[120px]"}>Estado</TableHead>
                      <TableHead className={isMobile ? "min-w-[80px]" : "min-w-[100px]"}>Prioridad</TableHead>
                      {!isMobile && <TableHead className="min-w-[120px]">Fecha de Creación</TableHead>}
                      {!isMobile && <TableHead className="min-w-[120px]">Reportado por</TableHead>}
                      <TableHead className="w-[50px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((reporte) => (
                      <TableRow key={reporte.id}>
                        <TableCell>
                          <Link
                            to={`/reporte/${reporte.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            <span className={isMobile ? "line-clamp-2 break-words text-xs" : ""}>
                              {reporte.nombre}
                            </span>
                          </Link>
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
                          <Badge
                            variant="secondary"
                            className={`flex items-center gap-1 ${isMobile ? 'text-xs px-1' : ''}`}
                            style={{ 
                              backgroundColor: `${priorityConfig[reporte.priority]?.color || priorityConfig.urgente.color}20`,
                              color: priorityConfig[reporte.priority]?.color || priorityConfig.urgente.color,
                              borderColor: priorityConfig[reporte.priority]?.color || priorityConfig.urgente.color
                            }}
                          >
                            <AlertTriangle className="h-2 w-2" />
                            {isMobile ? 
                              (priorityConfig[reporte.priority]?.label || 'Urgente').substring(0, 3) :
                              (priorityConfig[reporte.priority]?.label || 'Urgente')
                            }
                          </Badge>
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

                        {!isMobile && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{getReporterName(reporte.created_by_profile)}</span>
                            </div>
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
                              <DropdownMenuItem asChild>
                                <Link to={`/reporte/${reporte.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalles
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

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
    </div>
  );
};

export default ReportesPublicos;
