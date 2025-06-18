
import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useCategories } from '@/hooks/useCategories';
import { IconPicker } from '@/components/icons/IconPicker';
import { Icons } from '@/components/icons/Icons';
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
import type { CreateCategoryData } from '@/types/categories';

interface CategoryRow {
  nombre?: string;
  descripcion?: string;
  color?: string;
  icono?: string;
}

interface ProcessedRow extends CategoryRow {
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

interface BulkUploadCategoriesProps {
  onBack: () => void;
}

export const BulkUploadCategories = ({ onBack }: BulkUploadCategoriesProps) => {
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

  const { createCategory } = useCategories();

  // Filtrar datos basado en el término de búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const searchLower = searchTerm.toLowerCase();
    return data.filter(row => 
      (row.nombre && row.nombre.toLowerCase().includes(searchLower)) ||
      (row.descripcion && row.descripcion.toLowerCase().includes(searchLower)) ||
      (row.color && row.color.toLowerCase().includes(searchLower)) ||
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
      const finalNombre = row.nombre?.trim() || 'Categoría sin nombre';
      if (!row.nombre?.trim()) {
        warnings.push(`Nombre vacío, se usará: "${finalNombre}"`);
      }

      // Procesar descripción (opcional)
      const finalDescripcion = row.descripcion?.trim() || 'Sin descripción';
      if (!row.descripcion?.trim()) {
        warnings.push(`Descripción vacía, se usará: "${finalDescripcion}"`);
      }

      // Procesar color (opcional)
      let finalColor = '#10B981';
      if (row.color?.trim()) {
        if (/^#[0-9A-F]{6}$/i.test(row.color.trim())) {
          finalColor = row.color.trim();
        } else {
          warnings.push(`Color "${row.color}" no válido, se usará: "#10B981"`);
        }
      } else {
        warnings.push('Color vacío, se usará: "#10B981"');
      }

      // Procesar icono (opcional) - usar nombre de icono de Lucide
      const finalIcono = row.icono?.trim() || 'Folder';
      if (!row.icono?.trim()) {
        warnings.push(`Icono vacío, se usará: "Folder"`);
      } else if (!Icons[row.icono.trim()]) {
        warnings.push(`Icono "${row.icono}" no encontrado, se usará: "Folder"`);
      }

      finalData = {
        nombre: finalNombre,
        descripcion: finalDescripcion,
        color: finalColor,
        icono: Icons[finalIcono] ? finalIcono : 'Folder'
      };
      
      return {
        ...row,
        error: undefined, // No hay errores ahora, todos los campos son opcionales
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

  const removeCategory = (index: number) => {
    const updatedData = data.filter(row => row.index !== index);
    setData(updatedData);
    
    // Si no quedan datos después de eliminar, resetear completamente el estado
    if (updatedData.length === 0) {
      console.log('No quedan categorías, reseteando estado completo');
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
        const categoryData: CreateCategoryData = {
          nombre: row.finalData!.nombre,
          descripcion: row.finalData!.descripcion,
          activo: true, // Siempre activo por defecto
          color: row.finalData!.color,
          icono: row.finalData!.icono
        };
        
        await new Promise(resolve => {
          createCategory(categoryData);
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
        nombre: 'Infraestructura',
        descripcion: 'Problemas relacionados con infraestructura urbana',
        color: '#DC2626',
        icono: 'Building2'
      },
      {
        nombre: 'Servicios Públicos',
        descripcion: 'Reportes sobre servicios públicos',
        color: '#2563EB',
        icono: 'Droplets'
      }
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_categorias.csv';
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
            <h1 className="text-xl sm:text-2xl font-bold">Carga Masiva de Categorías</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Importa múltiples categorías desde un archivo CSV
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
                  <em>Los campos vacíos se completarán automáticamente con valores por defecto. Para iconos, usa nombres de Lucide React (ej: Building2, Droplets, etc.)</em>
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
              Procesar Categorías
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {data.length} categorías en el archivo
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
                  Proceso completado: {stats.success} categorías creadas exitosamente
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
                  placeholder="Buscar categorías..."
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
                  <p>No se encontraron categorías que coincidan con "{searchTerm}"</p>
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
                    {filteredData.map((row) => {
                      const RowIcon = Icons[row.finalData?.icono || row.icono || 'Folder'];
                      
                      return (
                        <TableRow key={row.index}>
                          <TableCell className="font-medium">
                            {row.index}
                          </TableCell>
                          
                          <TableCell className="max-w-[200px]">
                            <div>
                              <p className="font-medium truncate">
                                {row.finalData?.nombre || row.nombre || 'Categoría sin nombre'}
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
                                style={{ backgroundColor: row.finalData?.color || row.color || '#10B981' }}
                              />
                              <span className="text-xs">
                                {row.finalData?.color || row.color || '#10B981'}
                              </span>
                            </div>
                            {row.finalData?.color !== row.color && (
                              <p className="text-xs text-muted-foreground">
                                Original: {row.color || 'vacío'}
                              </p>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {RowIcon && <RowIcon className="w-5 h-5" />}
                              <span className="text-sm">
                                {row.finalData?.icono || row.icono || 'Folder'}
                              </span>
                            </div>
                            {row.finalData?.icono !== row.icono && (
                              <p className="text-xs text-muted-foreground">
                                Original: {row.icono || 'vacío'}
                              </p>
                            )}
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
                                  title="Editar categoría"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {!completed && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCategory(row.index)}
                                  disabled={isProcessing}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Eliminar categoría"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <EditCategoryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        row={editingRow}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

// Componente para el diálogo de edición
interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ProcessedRow | null;
  onSave: (row: ProcessedRow) => void;
}

const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
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
  };

  const SelectedIcon = Icons[editedRow.icono || 'Folder'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Categoría - Fila {editedRow.index}
          </DialogTitle>
          <DialogDescription>
            Modifica los datos de la categoría antes de procesarla.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={editedRow.nombre || ''}
                onChange={(e) => updateField('nombre', e.target.value)}
                placeholder="Nombre de la categoría"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={editedRow.descripcion || ''}
                onChange={(e) => updateField('descripcion', e.target.value)}
                placeholder="Descripción de la categoría"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color (hexadecimal)</Label>
              <Input
                id="color"
                value={editedRow.color || ''}
                onChange={(e) => updateField('color', e.target.value)}
                placeholder="#10B981"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icono">Icono</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIconPickerOpen(true)}
                className="w-full justify-start"
              >
                <div className="flex items-center gap-2">
                  {SelectedIcon && <SelectedIcon className="w-4 h-4" />}
                  <span>{editedRow.icono || 'Folder'}</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Vista previa */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <Label className="text-sm font-medium mb-2 block">Vista previa:</Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: editedRow.color || '#10B981' }}
              >
                {SelectedIcon && <SelectedIcon className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-medium">{editedRow.nombre || 'Categoría sin nombre'}</p>
                <p className="text-sm text-gray-600">{editedRow.descripcion || 'Sin descripción'}</p>
              </div>
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

export default BulkUploadCategories;
