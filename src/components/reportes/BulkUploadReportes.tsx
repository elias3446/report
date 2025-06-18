import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/hooks/useCategories';
import { useEstados } from '@/hooks/useEstados';
import { useReportes } from '@/hooks/useReportes';
import MapaReporteEditable from '@/components/MapaBase/MapaReporteEditable';
import MapaNuevaPosicion from '@/components/MapaBase/MapaNuevaPosicion';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Search,
  X,
  Info,
  Edit,
  Save
} from 'lucide-react';
import Papa from 'papaparse';
import React from 'react';

interface ReporteRow {
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  estado?: string;
  latitud: string;
  longitud: string;
  direccion?: string;
  referencia_direccion?: string;
  priority?: string;
}

interface ProcessedRow extends ReporteRow {
  index: number;
  status: 'pending' | 'processing' | 'success' | 'error' | 'warning';
  error?: string;
  warnings?: string[];
  finalData?: {
    nombre: string;
    descripcion: string;
    categoria: string;
    estado: string;
    latitud: number;
    longitud: number;
    direccion?: string;
    referencia_direccion?: string;
    priority: string;
  };
}

interface BulkUploadReportesProps {
  onBack: () => void;
}

export const BulkUploadReportes = ({ onBack }: BulkUploadReportesProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ProcessedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDifferencesDialog, setShowDifferencesDialog] = useState(false);
  const [editingRow, setEditingRow] = useState<ProcessedRow | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { categories } = useCategories();
  const { estados } = useEstados();
  const { createReporte } = useReportes();

  // Filtrar datos basado en el término de búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const searchLower = searchTerm.toLowerCase();
    return data.filter(row => 
      (row.nombre && row.nombre.toLowerCase().includes(searchLower)) ||
      (row.descripcion && row.descripcion.toLowerCase().includes(searchLower)) ||
      (row.categoria && row.categoria.toLowerCase().includes(searchLower)) ||
      (row.estado && row.estado.toLowerCase().includes(searchLower)) ||
      (row.error && row.error.toLowerCase().includes(searchLower))
    );
  }, [data, searchTerm]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const processedData = results.data.map((row: any, index: number) => ({
          ...row,
          index: index + 1,
          status: 'pending' as const,
          warnings: []
        })) as ProcessedRow[];
        
        setData(processedData);
        validateData(processedData);
      },
      error: (error) => {
        console.error('Error al procesar el archivo:', error.message);
      }
    });
  };

  const getDefaultCategory = () => {
    return categories.find(c => c.nombre.toLowerCase() === 'sin categoría') || categories[0];
  };

  const getDefaultEstado = () => {
    return estados.find(e => e.nombre.toLowerCase() === 'sin estado') || estados[0];
  };

  const validateData = (rows: ProcessedRow[]) => {
    const updatedRows = rows.map(row => {
      let rowError = '';
      const warnings: string[] = [];
      let finalData: ProcessedRow['finalData'] = undefined;
      
      // Validar campos obligatorios: latitud y longitud
      if (!row.latitud || row.latitud.trim() === '') {
        rowError = 'Latitud es obligatoria';
      } else if (!row.longitud || row.longitud.trim() === '') {
        rowError = 'Longitud es obligatoria';
      } else if (isNaN(Number(row.latitud)) || Math.abs(Number(row.latitud)) > 90) {
        rowError = 'Latitud inválida (debe estar entre -90 y 90)';
      } else if (isNaN(Number(row.longitud)) || Math.abs(Number(row.longitud)) > 180) {
        rowError = 'Longitud inválida (debe estar entre -180 y 180)';
      }
      
      // Si no hay errores críticos, procesar los datos opcionales
      if (!rowError) {
        // Procesar nombre (opcional)
        const finalNombre = row.nombre?.trim() || `Reporte ${row.index}`;
        if (!row.nombre?.trim()) {
          warnings.push(`Nombre vacío, se usará: "${finalNombre}"`);
        }

        // Procesar descripción (opcional)
        const finalDescripcion = row.descripcion?.trim() || 'Sin descripción';
        if (!row.descripcion?.trim()) {
          warnings.push(`Descripción vacía, se usará: "${finalDescripcion}"`);
        }

        // Procesar categoría (opcional)
        let finalCategoria = getDefaultCategory();
        if (row.categoria?.trim()) {
          const foundCategory = categories.find(c => 
            c.nombre.toLowerCase() === row.categoria!.toLowerCase()
          );
          if (foundCategory) {
            finalCategoria = foundCategory;
          } else {
            warnings.push(`Categoría "${row.categoria}" no encontrada, se usará: "${finalCategoria?.nombre}"`);
          }
        } else {
          warnings.push(`Categoría vacía, se usará: "${finalCategoria?.nombre}"`);
        }

        // Procesar estado (opcional)
        let finalEstado = getDefaultEstado();
        if (row.estado?.trim()) {
          const foundEstado = estados.find(e => 
            e.nombre.toLowerCase() === row.estado!.toLowerCase()
          );
          if (foundEstado) {
            finalEstado = foundEstado;
          } else {
            warnings.push(`Estado "${row.estado}" no encontrado, se usará: "${finalEstado?.nombre}"`);
          }
        } else {
          warnings.push(`Estado vacío, se usará: "${finalEstado?.nombre}"`);
        }

        // Procesar prioridad (opcional)
        let finalPriority = 'urgente';
        if (row.priority?.trim()) {
          const validPriorities = ['alto', 'medio', 'bajo', 'urgente'];
          if (validPriorities.includes(row.priority.toLowerCase())) {
            finalPriority = row.priority.toLowerCase();
          } else {
            warnings.push(`Prioridad "${row.priority}" no válida, se usará: "urgente"`);
          }
        } else {
          warnings.push('Prioridad vacía, se usará: "urgente"');
        }

        finalData = {
          nombre: finalNombre,
          descripcion: finalDescripcion,
          categoria: finalCategoria?.nombre || 'Sin categoría',
          estado: finalEstado?.nombre || 'Sin estado',
          latitud: Number(row.latitud),
          longitud: Number(row.longitud),
          direccion: row.direccion?.trim(),
          referencia_direccion: row.referencia_direccion?.trim(),
          priority: finalPriority as any
        };
      }
      
      return {
        ...row,
        error: rowError || undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        status: rowError ? 'error' as const : (warnings.length > 0 ? 'warning' as const : 'pending' as const),
        finalData
      };
    });
    
    setData(updatedRows);
  };

  const handleEditRow = (row: ProcessedRow) => {
    setEditingRow(row);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedRow: ProcessedRow) => {
    const updatedData = data.map(row => 
      row.index === updatedRow.index ? updatedRow : row
    );
    setData(updatedData);
    validateData(updatedData);
    setEditDialogOpen(false);
    setEditingRow(null);
  };

  const removeReporte = (index: number) => {
    const updatedData = data.filter(row => row.index !== index);
    setData(updatedData);
    
    // Si no quedan datos después de eliminar, resetear completamente el estado
    if (updatedData.length === 0) {
      console.log('No quedan reportes, reseteando estado completo');
      setFile(null);
      setProgress(0);
      setIsProcessing(false);
      setCompleted(false);
      setSearchTerm('');
      setShowDifferencesDialog(false);
      setEditingRow(null);
      setEditDialogOpen(false);
      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      // Re-validar datos después de eliminar si aún quedan elementos
      validateData(updatedData);
    }
  };

  const hasErrors = () => {
    return data.some(row => row.status === 'error');
  };

  const hasWarnings = () => {
    return data.some(row => row.status === 'warning');
  };

  const canUpload = () => {
    return data.length > 0 && !hasErrors();
  };

  const processUpload = async () => {
    if (!canUpload()) return;
    
    // Si hay advertencias, mostrar diálogo de confirmación
    if (hasWarnings() && !showDifferencesDialog) {
      setShowDifferencesDialog(true);
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setShowDifferencesDialog(false);
    
    const updatedData = [...data];
    let successCount = 0;
    
    for (let i = 0; i < updatedData.length; i++) {
      const row = updatedData[i];
      
      // Skip rows that have errors
      if (row.status === 'error') {
        setProgress(((i + 1) / updatedData.length) * 100);
        continue;
      }
      
      row.status = 'processing';
      setData([...updatedData]);
      
      try {
        const categoria = categories.find(c => 
          c.nombre.toLowerCase() === row.finalData!.categoria.toLowerCase()
        );
        const estado = estados.find(e => 
          e.nombre.toLowerCase() === row.finalData!.estado.toLowerCase()
        );
        
        const reporteData = {
          nombre: row.finalData!.nombre,
          descripcion: row.finalData!.descripcion,
          categoria_id: categoria!.id,
          estado_id: estado!.id,
          latitud: row.finalData!.latitud,
          longitud: row.finalData!.longitud,
          direccion: row.finalData!.direccion || undefined,
          referencia_direccion: row.finalData!.referencia_direccion || undefined,
          priority: row.finalData!.priority as any
        };
        
        await new Promise(resolve => {
          createReporte(reporteData);
          // Simular un pequeño delay para mostrar el progreso
          setTimeout(resolve, 100);
        });
        
        row.status = 'success';
        row.error = undefined;
        successCount++;
      } catch (error: any) {
        row.status = 'error';
        row.error = error.message || 'Error desconocido';
      }
      
      setProgress(((i + 1) / updatedData.length) * 100);
      setData([...updatedData]);
    }
    
    setIsProcessing(false);
    setCompleted(true);
  };

  const downloadTemplate = () => {
    const template = [
      {
        nombre: 'Ejemplo de Reporte',
        descripcion: 'Descripción del reporte de ejemplo',
        categoria: 'Sin categoría',
        estado: 'Sin estado',
        latitud: '-0.2299',
        longitud: '-78.5249',
        direccion: 'Av. Amazonas y Naciones Unidas',
        referencia_direccion: 'Cerca del centro comercial',
        priority: 'urgente'
      }
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_reportes.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setData([]);
    setProgress(0);
    setIsProcessing(false);
    setCompleted(false);
    setSearchTerm('');
    setShowDifferencesDialog(false);
    setEditingRow(null);
    setEditDialogOpen(false);
    // Limpiar el input de archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusStats = () => {
    const success = data.filter(row => row.status === 'success').length;
    const error = data.filter(row => row.status === 'error').length;
    const warning = data.filter(row => row.status === 'warning').length;
    const pending = data.filter(row => row.status === 'pending').length;
    return { success, error, warning, pending };
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2 self-start">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Carga Masiva de Reportes</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Importa múltiples reportes desde un archivo CSV
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-start lg:items-end gap-2">
          <p className="text-sm text-muted-foreground lg:text-right">
            Descarga la plantilla CSV
          </p>
          <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Descargar Plantilla
          </Button>
        </div>
      </div>

      {/* File Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Upload className="h-5 w-5" />
            Cargar Archivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isProcessing}
              />
            </div>
            
            {file && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="break-all">{file.name}</span>
                </div>
                <Badge variant="secondary" className="self-start sm:self-auto">{data.length} filas</Badge>
              </div>
            )}

            {data.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Campos obligatorios:</strong> Latitud y Longitud<br/>
                  <strong>Campos opcionales:</strong> Nombre, Descripción, Categoría, Estado, Dirección, Referencia de dirección, Prioridad<br/>
                  <em>Los campos vacíos se completarán automáticamente con valores por defecto</em>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Card */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileText className="h-5 w-5" />
              Procesar Reportes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {data.length} reportes en el archivo
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {stats.success} exitosos
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    {stats.error} errores
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    {stats.warning} advertencias
                  </span>
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3 text-blue-500" />
                    {stats.pending} pendientes
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                {!completed && (
                  <Button 
                    onClick={processUpload} 
                    disabled={isProcessing || !canUpload()}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4" />
                    {isProcessing ? 'Procesando...' : 'Procesar'}
                  </Button>
                )}
                
                <Button variant="outline" onClick={reset} className="w-full sm:w-auto">
                  Reiniciar
                </Button>
              </div>
            </div>

            {hasErrors() && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Se encontraron {stats.error} errores que deben ser corregidos antes de procesar. 
                  Los campos Latitud y Longitud son obligatorios.
                </AlertDescription>
              </Alert>
            )}

            {hasWarnings() && !hasErrors() && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Se encontraron {stats.warning} advertencias. Los datos faltantes se completarán automáticamente con valores por defecto.
                </AlertDescription>
              </Alert>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {completed && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Proceso completado: {stats.success} reportes creados exitosamente
                  {stats.error > 0 && `, ${stats.error} errores`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Differences Confirmation Dialog */}
      {showDifferencesDialog && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Confirmar cambios automáticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-yellow-700">
              Se detectaron datos faltantes o incorrectos que serán completados automáticamente con valores por defecto. 
              ¿Desea continuar con la carga?
            </p>
            <div className="flex gap-2">
              <Button onClick={processUpload} className="bg-yellow-600 hover:bg-yellow-700">
                Sí, continuar con los cambios
              </Button>
              <Button variant="outline" onClick={() => setShowDifferencesDialog(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">Resultados</CardTitle>
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-auto sm:min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar reportes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredData.length === 0 && searchTerm && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p>No se encontraron reportes que coincidan con "{searchTerm}"</p>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Fila</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Coordenadas</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead className="w-[120px]">Estado</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead className="w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row) => (
                      <TableRow key={row.index}>
                        <TableCell className="font-medium">
                          {row.index}
                        </TableCell>
                        
                        <TableCell className="max-w-[200px]">
                          <div>
                            <p className="font-medium truncate">
                              {row.finalData?.nombre || row.nombre || 'Sin nombre'}
                            </p>
                            {row.finalData?.nombre !== row.nombre && (
                              <p className="text-xs text-muted-foreground">
                                Original: {row.nombre || 'vacío'}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="max-w-[300px]">
                          <div>
                            <p className="text-sm truncate">
                              {row.finalData?.descripcion || row.descripcion || 'Sin descripción'}
                            </p>
                            {row.finalData?.descripcion !== row.descripcion && (
                              <p className="text-xs text-muted-foreground">
                                Original: {row.descripcion || 'vacío'}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <span className="text-sm">
                              {row.finalData?.categoria || row.categoria || 'Sin categoría'}
                            </span>
                            {row.finalData?.categoria !== row.categoria && (
                              <p className="text-xs text-muted-foreground">
                                Original: {row.categoria || 'vacío'}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <span className="text-sm">
                              {row.finalData?.estado || row.estado || 'Sin estado'}
                            </span>
                            {row.finalData?.estado !== row.estado && (
                              <p className="text-xs text-muted-foreground">
                                Original: {row.estado || 'vacío'}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-xs">
                            <div>Lat: {row.latitud}</div>
                            <div>Lng: {row.longitud}</div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="capitalize">
                              {row.finalData?.priority || row.priority || 'urgente'}
                            </Badge>
                            {row.finalData?.priority !== row.priority && (
                              <p className="text-xs text-muted-foreground">
                                Original: {row.priority || 'vacío'}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {row.status === 'pending' && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Pendiente
                              </Badge>
                            )}
                            {row.status === 'processing' && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Procesando
                              </Badge>
                            )}
                            {row.status === 'success' && (
                              <Badge variant="default" className="bg-green-500 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Exitoso
                              </Badge>
                            )}
                            {row.status === 'error' && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Error
                              </Badge>
                            )}
                            {row.status === 'warning' && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Advertencia
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="max-w-[300px]">
                          <div className="space-y-1">
                            {row.error && (
                              <div className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-600 break-words">{row.error}</p>
                              </div>
                            )}
                            {row.warnings && row.warnings.map((warning, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-yellow-600 break-words">{warning}</p>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!completed && row.status !== 'processing' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRow(row)}
                                disabled={isProcessing}
                                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                title="Editar reporte"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {!completed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeReporte(row.index)}
                                disabled={isProcessing}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Eliminar reporte"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <EditReporteDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        row={editingRow}
        categories={categories}
        estados={estados}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

// Componente para el diálogo de edición
interface EditReporteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ProcessedRow | null;
  categories: any[];
  estados: any[];
  onSave: (row: ProcessedRow) => void;
}

const EditReporteDialog: React.FC<EditReporteDialogProps> = ({
  open,
  onOpenChange,
  row,
  categories,
  estados,
  onSave,
}) => {
  const [editedRow, setEditedRow] = useState<ProcessedRow | null>(null);

  React.useEffect(() => {
    if (row) {
      setEditedRow({ ...row });
    }
  }, [row]);

  if (!editedRow) return null;

  const handleSave = () => {
    onSave(editedRow);
  };

  const updateField = (field: keyof ProcessedRow, value: any) => {
    setEditedRow(prev => prev ? { ...prev, [field]: value } : null);
  };

  const activeCategories = categories.filter(cat => cat.activo && !cat.deleted_at);
  const activeEstados = estados.filter(est => est.activo && !est.deleted_at);

  // Verificar si tiene coordenadas válidas
  const hasValidCoordinates = () => {
    const lat = Number(editedRow.latitud);
    const lng = Number(editedRow.longitud);
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && 
           Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  };

  // Manejar actualización de posición desde el mapa
  const handlePosicionActualizada = (nuevaPos: [number, number]) => {
    setEditedRow(prev => prev ? {
      ...prev,
      latitud: nuevaPos[0].toString(),
      longitud: nuevaPos[1].toString()
    } : null);
  };

  // Manejar selección de nueva posición
  const handlePosicionSeleccionada = (pos: [number, number], direccion?: string, referencia?: string) => {
    setEditedRow(prev => prev ? {
      ...prev,
      latitud: pos[0].toString(),
      longitud: pos[1].toString(),
      direccion: direccion || prev.direccion,
      referencia_direccion: referencia || prev.referencia_direccion
    } : null);
  };

  // Crear objeto de reporte mock para MapaReporteEditable
  const mockReporte = {
    id: `temp_${editedRow.index}`,
    nombre: editedRow.nombre || `Reporte ${editedRow.index}`,
    descripcion: editedRow.descripcion || 'Sin descripción',
    titulo: editedRow.nombre || `Reporte ${editedRow.index}`,
    latitud: editedRow.latitud,
    longitud: editedRow.longitud
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Reporte - Fila {editedRow.index}
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del reporte antes de procesarlo. Usa el mapa para establecer la ubicación.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={editedRow.nombre || ''}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  placeholder="Nombre del reporte"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select 
                  value={editedRow.priority || 'urgente'} 
                  onValueChange={(value) => updateField('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={editedRow.descripcion || ''}
                onChange={(e) => updateField('descripcion', e.target.value)}
                placeholder="Descripción del reporte"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select 
                  value={editedRow.categoria || ''} 
                  onValueChange={(value) => updateField('categoria', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCategories.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.nombre}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: categoria.color }}
                          />
                          {categoria.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select 
                  value={editedRow.estado || ''} 
                  onValueChange={(value) => updateField('estado', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEstados.map((estado) => (
                      <SelectItem key={estado.id} value={estado.nombre}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: estado.color }}
                          />
                          {estado.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Ubicación en el mapa</Label>
              <p className="text-sm text-muted-foreground">
                {hasValidCoordinates() 
                  ? "Arrastra el marcador o haz doble clic para actualizar la posición"
                  : "Haz clic en el mapa para seleccionar la ubicación"
                }
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              {hasValidCoordinates() ? (
                <MapaReporteEditable
                  reporte={mockReporte}
                  height="h-[400px]"
                  onPosicionActualizada={handlePosicionActualizada}
                />
              ) : (
                <MapaNuevaPosicion
                  height="h-[400px]"
                  onPosicionSeleccionada={handlePosicionSeleccionada}
                  initialPosition={undefined}
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
