
import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useEstados } from '@/hooks/useEstados';
import { IconPicker } from '@/components/icons/IconPicker';
import { Icons } from '@/components/icons/Icons';
import { toast } from 'sonner';
import Papa from 'papaparse';
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
import type { CreateEstadoData } from '@/types/estados';
import React from 'react';

interface EstadoRow {
  nombre?: string;
  descripcion?: string;
  color?: string;
  icono?: string;
}

interface ProcessedRow extends EstadoRow {
  index: number;
  status: 'pending' | 'processing' | 'success' | 'error' | 'warning';
  error?: string;
  warnings?: string[];
  finalData?: {
    nombre: string;
    descripcion: string;
    color: string;
    icono: string;
  };
}

interface BulkUploadEstadosProps {
  onBack: () => void;
}

export const BulkUploadEstados = ({ onBack }: BulkUploadEstadosProps) => {
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

  const { createEstado } = useEstados();

  // Filtrar datos basado en el término de búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const searchLower = searchTerm.toLowerCase();
    return data.filter(row => 
      (row.nombre && row.nombre.toLowerCase().includes(searchLower)) ||
      (row.descripcion && row.descripcion.toLowerCase().includes(searchLower)) ||
      (row.color && row.color.toLowerCase().includes(searchLower)) ||
      (row.icono && row.icono.toLowerCase().includes(searchLower)) ||
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

  const validateData = (rows: ProcessedRow[]) => {
    const updatedRows = rows.map(row => {
      const warnings: string[] = [];
      let finalData: ProcessedRow['finalData'];
      
      // Todos los campos son opcionales ahora
      
      // Procesar nombre (opcional)
      const finalNombre = row.nombre?.trim() || 'Estado sin nombre';
      if (!row.nombre?.trim()) {
        warnings.push(`Nombre vacío, se usará: "${finalNombre}"`);
      }

      // Procesar descripción (opcional)
      const finalDescripcion = row.descripcion?.trim() || 'Sin descripción';
      if (!row.descripcion?.trim()) {
        warnings.push(`Descripción vacía, se usará: "${finalDescripcion}"`);
      }

      // Procesar color (opcional)
      let finalColor = '#3B82F6';
      if (row.color?.trim()) {
        if (/^#[0-9A-F]{6}$/i.test(row.color.trim())) {
          finalColor = row.color.trim();
        } else {
          warnings.push(`Color "${row.color}" no válido, se usará: "#3B82F6"`);
        }
      } else {
        warnings.push('Color vacío, se usará: "#3B82F6"');
      }

      // Procesar icono (opcional)
      const finalIcono = row.icono?.trim() || '🔹';
      if (!row.icono?.trim()) {
        warnings.push(`Icono vacío, se usará: "${finalIcono}"`);
      }

      finalData = {
        nombre: finalNombre,
        descripcion: finalDescripcion,
        color: finalColor,
        icono: finalIcono
      };
      
      return {
        ...row,
        error: undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        status: warnings.length > 0 ? 'warning' as const : 'pending' as const,
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

  const removeEstado = (index: number) => {
    const updatedData = data.filter(row => row.index !== index);
    setData(updatedData);
    
    // Si no quedan datos después de eliminar, resetear completamente el estado
    if (updatedData.length === 0) {
      console.log('No quedan estados, reseteando estado completo');
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
        const estadoData: CreateEstadoData = {
          nombre: row.finalData!.nombre,
          descripcion: row.finalData!.descripcion,
          color: row.finalData!.color,
          icono: row.finalData!.icono,
          activo: true, // Siempre activo por defecto
          created_by: '' // Será asignado por el hook
        };
        
        await new Promise(resolve => {
          createEstado(estadoData);
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
        nombre: 'Nuevo',
        descripcion: 'Estado para elementos nuevos',
        color: '#10B981',
        icono: 'Plus'
      },
      {
        nombre: 'En Proceso',
        descripcion: 'Estado para elementos en proceso',
        color: '#F59E0B',
        icono: 'Clock'
      }
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_estados.csv';
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
            <h1 className="text-xl sm:text-2xl font-bold">Carga Masiva de Estados</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Importa múltiples estados desde un archivo CSV
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
                  <strong>Campos opcionales:</strong> Nombre, Descripción, Color, Icono<br/>
                  <em>Los campos vacíos se completarán automáticamente con valores por defecto. Todos los estados se crearán como activos.</em>
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
              Procesar Estados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {data.length} estados en el archivo
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
                  Proceso completado: {stats.success} estados creados exitosamente
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
                  placeholder="Buscar estados..."
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
                  <p>No se encontraron estados que coincidan con "{searchTerm}"</p>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Fila</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Icono</TableHead>
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
                              {row.finalData?.nombre || row.nombre || 'Estado sin nombre'}
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
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: row.finalData?.color || row.color || '#3B82F6' }}
                            />
                            <span className="text-xs">
                              {row.finalData?.color || row.color || '#3B82F6'}
                            </span>
                          </div>
                          {row.finalData?.color !== row.color && (
                            <p className="text-xs text-muted-foreground">
                              Original: {row.color || 'vacío'}
                            </p>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <span className="text-lg">
                              {row.finalData?.icono || row.icono || '🔹'}
                            </span>
                            {row.finalData?.icono !== row.icono && (
                              <p className="text-xs text-muted-foreground">
                                Original: {row.icono || 'vacío'}
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
                                title="Editar estado"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {!completed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEstado(row.index)}
                                disabled={isProcessing}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Eliminar estado"
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
      <EditEstadoDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        row={editingRow}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

// Componente para el diálogo de edición
interface EditEstadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ProcessedRow | null;
  onSave: (row: ProcessedRow) => void;
}

const EditEstadoDialog: React.FC<EditEstadoDialogProps> = ({
  open,
  onOpenChange,
  row,
  onSave,
}) => {
  const [editedRow, setEditedRow] = useState<ProcessedRow | null>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

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

  const handleIconSelect = (iconName: string) => {
    updateField('icono', iconName);
    setIconPickerOpen(false);
  };

  // Obtener el componente del icono seleccionado
  const SelectedIcon = editedRow.icono ? Icons[editedRow.icono] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Estado - Fila {editedRow.index}
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del estado antes de procesarlo. El estado se creará como activo automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={editedRow.nombre || ''}
                onChange={(e) => updateField('nombre', e.target.value)}
                placeholder="Nombre del estado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={editedRow.descripcion || ''}
                onChange={(e) => updateField('descripcion', e.target.value)}
                placeholder="Descripción del estado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="color"
                  type="color"
                  value={editedRow.color || '#3B82F6'}
                  onChange={(e) => updateField('color', e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  value={editedRow.color || '#3B82F6'}
                  onChange={(e) => updateField('color', e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icono del Estado</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIconPickerOpen(true)}
                className="w-full justify-start"
              >
                <div className="flex items-center gap-2">
                  {SelectedIcon && <SelectedIcon className="w-4 h-4" />}
                  <span>{editedRow.icono || 'Seleccionar icono'}</span>
                </div>
              </Button>
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

        {/* IconPicker Dialog */}
        <IconPicker
          open={iconPickerOpen}
          onOpenChange={setIconPickerOpen}
          onSelect={handleIconSelect}
        />
      </DialogContent>
    </Dialog>
  );
};
