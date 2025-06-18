
import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUsers } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { toast } from '@/hooks/use-toast';
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
  Save,
  Users
} from 'lucide-react';
import React from 'react';

interface UserRow {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role_type?: string; // 'admin', 'user', o 'admin,user'
  system_roles?: string; // Nombres de roles del sistema separados por comas
}

interface ProcessedRow extends UserRow {
  index: number;
  status: 'pending' | 'processing' | 'success' | 'error' | 'warning';
  error?: string;
  warnings?: string[];
  finalData?: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string[]; // Tipo de roles para profiles
    role_ids: string[]; // IDs de roles del sistema
  };
}

interface BulkUploadUsersProps {
  onBack: () => void;
}

// Función para generar contraseña aleatoria
const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const BulkUploadUsers = ({ onBack }: BulkUploadUsersProps) => {
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

  const { createUser } = useUsers();
  const { roles } = useRoles();

  // Filtrar datos basado en el término de búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const searchLower = searchTerm.toLowerCase();
    return data.filter(row => 
      (row.email && row.email.toLowerCase().includes(searchLower)) ||
      (row.first_name && row.first_name.toLowerCase().includes(searchLower)) ||
      (row.last_name && row.last_name.toLowerCase().includes(searchLower)) ||
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
        toast({
          title: 'Error',
          description: `Error al procesar el archivo: ${error.message}`,
          variant: 'destructive',
        });
      }
    });
  };

  const validateData = (rows: ProcessedRow[]) => {
    const updatedRows = rows.map(row => {
      const warnings: string[] = [];
      let error: string | undefined;
      let finalData: {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
        role: string[];
        role_ids: string[];
      } | undefined;
      
      // Validar email (requerido)
      const finalEmail = row.email?.trim() || '';
      if (!finalEmail) {
        error = 'Email es requerido';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
        error = 'Email no tiene formato válido';
      }

      if (!error) {
        // Procesar password (opcional - generar si no se proporciona)
        let finalPassword = row.password?.trim() || '';
        if (!finalPassword) {
          finalPassword = generateRandomPassword();
          warnings.push('Se generó una contraseña aleatoria automáticamente');
        } else if (finalPassword.length < 6) {
          error = 'Password debe tener al menos 6 caracteres';
        }

        if (!error) {
          // Procesar nombres (opcionales)
          const finalFirstName = row.first_name?.trim() || 'Sin nombre';
          if (!row.first_name?.trim()) {
            warnings.push('Nombre vacío, se usará: "Sin nombre"');
          }

          const finalLastName = row.last_name?.trim() || 'Sin apellido';
          if (!row.last_name?.trim()) {
            warnings.push('Apellido vacío, se usará: "Sin apellido"');
          }

          // Procesar tipo de roles (admin/user) para el perfil
          let finalRoleType: string[] = ['user'];
          if (row.role_type?.trim()) {
            const roleTypes = row.role_type.split(',').map(r => r.trim().toLowerCase());
            const validRoleTypes = roleTypes.filter(r => ['admin', 'user'].includes(r));
            
            if (validRoleTypes.length > 0) {
              finalRoleType = validRoleTypes;
            } else {
              warnings.push(`Tipo de rol "${row.role_type}" no válido, se usará: "user"`);
            }
          } else {
            warnings.push('Tipo de rol vacío, se usará: "user"');
          }

          // Procesar roles del sistema
          let finalSystemRoleIds: string[] = [];
          if (row.system_roles?.trim()) {
            const systemRoleNames = row.system_roles.split(',').map(r => r.trim());
            
            systemRoleNames.forEach(roleName => {
              const foundRole = roles.find(r => r.nombre.toLowerCase() === roleName.toLowerCase());
              if (foundRole) {
                finalSystemRoleIds.push(foundRole.id);
              } else {
                warnings.push(`Rol del sistema "${roleName}" no encontrado en la base de datos`);
              }
            });

            if (finalSystemRoleIds.length === 0 && systemRoleNames.length > 0) {
              // Buscar rol por defecto del sistema
              const defaultRole = roles.find(r => r.nombre.toLowerCase() === 'usuario');
              if (defaultRole) {
                finalSystemRoleIds.push(defaultRole.id);
                warnings.push('No se encontraron roles válidos, se asignará rol por defecto del sistema');
              }
            }
          }

          finalData = {
            email: finalEmail,
            password: finalPassword,
            first_name: finalFirstName,
            last_name: finalLastName,
            role: finalRoleType,
            role_ids: finalSystemRoleIds
          };
        }
      }
      
      return {
        ...row,
        error,
        warnings: warnings.length > 0 ? warnings : undefined,
        status: error ? 'error' as const : (warnings.length > 0 ? 'warning' as const : 'pending' as const),
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

  const removeUser = (index: number) => {
    const updatedData = data.filter(row => row.index !== index);
    setData(updatedData);
    
    // Si no quedan datos después de eliminar, resetear completamente el estado
    if (updatedData.length === 0) {
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
        await new Promise(resolve => {
          createUser({
            email: row.finalData!.email,
            password: row.finalData!.password,
            first_name: row.finalData!.first_name,
            last_name: row.finalData!.last_name,
            role: row.finalData!.role,
            role_ids: row.finalData!.role_ids
          });
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
    
    toast({
      title: 'Carga completada',
      description: `${successCount} usuarios creados exitosamente.`,
    });
  };

  const downloadTemplate = () => {
    const template = [
      {
        email: 'usuario1@example.com',
        password: 'password123',
        first_name: 'Juan',
        last_name: 'Pérez',
        role_type: 'user',
        system_roles: roles.length > 0 ? roles.slice(0, 2).map(r => r.nombre).join(',') : 'Usuario'
      },
      {
        email: 'admin@example.com',
        password: 'admin123',
        first_name: 'María',
        last_name: 'García',
        role_type: 'admin,user',
        system_roles: roles.length > 0 ? roles[0]?.nombre || 'Usuario' : 'Usuario'
      }
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_usuarios.csv';
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
  const activeRoles = roles.filter(role => role.activo && !role.deleted_at);

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
            <h1 className="text-xl sm:text-2xl font-bold">Carga Masiva de Usuarios</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Importa múltiples usuarios desde un archivo CSV
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
                  <strong>Campos requeridos:</strong> Email<br/>
                  <strong>Campos opcionales:</strong> Password, Nombre, Apellido, Tipo de rol (admin/user/admin,user), Roles del sistema<br/>
                  <em>Los campos vacíos se completarán automáticamente con valores por defecto. Si no se proporciona contraseña, se generará una automáticamente.</em>
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
              Procesar Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {data.length} usuarios en el archivo
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
                  Proceso completado: {stats.success} usuarios creados exitosamente
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
                  placeholder="Buscar usuarios..."
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
                  <p>No se encontraron usuarios que coincidan con "{searchTerm}"</p>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Fila</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Apellido</TableHead>
                      <TableHead>Tipo de Rol</TableHead>
                      <TableHead>Roles del Sistema</TableHead>
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
                              {row.finalData?.email || row.email || 'Sin email'}
                            </p>
                            {row.finalData?.email !== row.email && (
                              <p className="text-xs text-muted-foreground">
                                Original: {row.email || 'vacío'}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="max-w-[150px]">
                          <div>
                            <p className="truncate">
                              {row.finalData?.first_name || row.first_name || 'Sin nombre'}
                            </p>
                            {row.finalData?.first_name !== row.first_name && (
                              <p className="text-xs text-muted-foreground">
                                Original: {row.first_name || 'vacío'}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="max-w-[150px]">
                          <div>
                            <p className="truncate">
                              {row.finalData?.last_name || row.last_name || 'Sin apellido'}
                            </p>
                            {row.finalData?.last_name !== row.last_name && (
                              <p className="text-xs text-muted-foreground">
                                Original: {row.last_name || 'vacío'}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="max-w-[120px]">
                          <div>
                            {row.finalData?.role && row.finalData.role.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {row.finalData.role.map((roleType) => (
                                  <Badge 
                                    key={roleType} 
                                    variant={roleType === 'admin' ? 'destructive' : 'secondary'} 
                                    className="text-xs"
                                  >
                                    {roleType}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-xs">user</Badge>
                            )}
                            {row.finalData && row.finalData.role.join(',') !== row.role_type && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Original: {row.role_type || 'vacío'}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="max-w-[200px]">
                          <div>
                            {row.finalData?.role_ids && row.finalData.role_ids.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {row.finalData.role_ids.slice(0, 2).map((roleId) => {
                                  const role = roles.find(r => r.id === roleId);
                                  return role ? (
                                    <Badge key={roleId} variant="outline" className="text-xs">
                                      {role.nombre}
                                    </Badge>
                                  ) : null;
                                })}
                                {row.finalData.role_ids.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{row.finalData.role_ids.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Sin roles del sistema</p>
                            )}
                            {row.system_roles && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Original: {row.system_roles}
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
                                title="Editar usuario"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {!completed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeUser(row.index)}
                                disabled={isProcessing}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Eliminar usuario"
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
      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        row={editingRow}
        onSave={handleSaveEdit}
        roles={roles}
      />
    </div>
  );
};

// Componente para el diálogo de edición
interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ProcessedRow | null;
  onSave: (row: ProcessedRow) => void;
  roles: any[];
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onOpenChange,
  row,
  onSave,
  roles,
}) => {
  const [editedRow, setEditedRow] = useState<ProcessedRow | null>(null);
  const [selectedRoleTypes, setSelectedRoleTypes] = useState<string[]>([]);
  const [selectedSystemRoles, setSelectedSystemRoles] = useState<string[]>([]);

  React.useEffect(() => {
    if (row) {
      setEditedRow({ ...row });
      
      // Inicializar tipos de roles seleccionados
      const currentRoleTypes = row.role_type ? 
        row.role_type.split(',').map(r => r.trim().toLowerCase()).filter(r => ['admin', 'user'].includes(r)) :
        ['user'];
      setSelectedRoleTypes(currentRoleTypes);
      
      // Inicializar roles del sistema seleccionados
      const currentSystemRoles = row.system_roles ? 
        row.system_roles.split(',').map(r => r.trim()) :
        [];
      setSelectedSystemRoles(currentSystemRoles);
    }
  }, [row]);

  if (!editedRow) return null;

  const handleSave = () => {
    const updatedRow = {
      ...editedRow,
      role_type: selectedRoleTypes.join(','),
      system_roles: selectedSystemRoles.join(',')
    };
    onSave(updatedRow);
  };

  const updateField = (field: keyof ProcessedRow, value: any) => {
    setEditedRow(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleRoleTypeChange = (roleType: string, checked: boolean) => {
    setSelectedRoleTypes(prev => 
      checked 
        ? [...prev, roleType]
        : prev.filter(r => r !== roleType)
    );
  };

  const handleSystemRoleChange = (roleName: string, checked: boolean) => {
    setSelectedSystemRoles(prev => 
      checked 
        ? [...prev, roleName]
        : prev.filter(r => r !== roleName)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Usuario - Fila {editedRow.index}
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del usuario antes de procesarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                value={editedRow.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="usuario@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={editedRow.password || ''}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                value={editedRow.first_name || ''}
                onChange={(e) => updateField('first_name', e.target.value)}
                placeholder="Nombre del usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                value={editedRow.last_name || ''}
                onChange={(e) => updateField('last_name', e.target.value)}
                placeholder="Apellido del usuario"
              />
            </div>
          </div>

          {/* Tipo de roles (admin/user) */}
          <div>
            <Label className="text-base font-semibold mb-4 block">Tipo de Rol (Profile)</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-admin"
                  checked={selectedRoleTypes.includes('admin')}
                  onCheckedChange={(checked) => 
                    handleRoleTypeChange('admin', checked as boolean)
                  }
                />
                <Label htmlFor="role-admin" className="cursor-pointer">
                  Administrador
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-user"
                  checked={selectedRoleTypes.includes('user')}
                  onCheckedChange={(checked) => 
                    handleRoleTypeChange('user', checked as boolean)
                  }
                />
                <Label htmlFor="role-user" className="cursor-pointer">
                  Usuario
                </Label>
              </div>
            </div>
          </div>

          {/* Roles del sistema */}
          <div>
            <Label className="text-base font-semibold mb-4 block">Roles del Sistema</Label>
            {roles.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`system-role-${role.id}`}
                      checked={selectedSystemRoles.includes(role.nombre)}
                      onCheckedChange={(checked) => 
                        handleSystemRoleChange(role.nombre, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`system-role-${role.id}`}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: role.color }}
                      />
                      {role.nombre}
                      <span className="text-xs text-muted-foreground">
                        ({role.descripcion})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay roles del sistema disponibles
              </p>
            )}
          </div>

          {/* Vista previa de selecciones */}
          {(selectedRoleTypes.length > 0 || selectedSystemRoles.length > 0) && (
            <div className="p-3 border rounded-md bg-gray-50">
              <Label className="text-sm font-medium mb-2 block">Vista previa:</Label>
              <div className="space-y-2">
                {selectedRoleTypes.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Tipo de rol: </span>
                    {selectedRoleTypes.map((roleType) => (
                      <Badge 
                        key={roleType} 
                        variant={roleType === 'admin' ? 'destructive' : 'secondary'} 
                        className="text-xs mr-1"
                      >
                        {roleType}
                      </Badge>
                    ))}
                  </div>
                )}
                {selectedSystemRoles.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Roles del sistema: </span>
                    {selectedSystemRoles.map((roleName) => (
                      <Badge key={roleName} variant="outline" className="text-xs mr-1">
                        {roleName}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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

export default BulkUploadUsers;
