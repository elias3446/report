
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Activity, Clock, User, Database, FileText } from 'lucide-react';
import { Actividad } from '@/hooks/useAuditoria';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActividadesListProps {
  actividades: Actividad[];
  isLoading: boolean;
}

const getActivityIcon = (type: Actividad['activity_type']) => {
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

const getActivityColor = (type: Actividad['activity_type']) => {
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

export const ActividadesList: React.FC<ActividadesListProps> = ({ 
  actividades, 
  isLoading 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return actividades.slice(startIndex, startIndex + itemsPerPage);
  }, [actividades, currentPage]);

  const totalPages = Math.ceil(actividades.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Registro de Actividades
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Registro de Actividades ({actividades.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Tabla</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((actividad) => (
                <TableRow key={actividad.id}>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getActivityColor(actividad.activity_type)}
                    >
                      <div className="flex items-center gap-1">
                        {getActivityIcon(actividad.activity_type)}
                        <span className="text-xs">{actividad.activity_type}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={actividad.descripcion}>
                      {actividad.descripcion}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{actividad.user_email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {actividad.tabla_afectada && (
                      <Badge variant="secondary">
                        {actividad.tabla_afectada}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(actividad.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {actividades.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron actividades registradas
            </div>
          )}
        </ScrollArea>

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNumber);
                        }}
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
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
