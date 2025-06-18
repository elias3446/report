import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCategories } from '@/hooks/useCategories';
import { useEstados } from '@/hooks/useEstados';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import type { Reporte } from '@/types/reportes';
import { 
  FileText, 
  ToggleLeft,
  Trash2,
  Tag,
  Circle,
  UserCheck,
  AlertTriangle,
  X
} from 'lucide-react';

export type BulkActionType = 'toggle_status' | 'delete' | 'change_category' | 'change_estado' | 'change_assignment';

interface BulkReportActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportes: Reporte[];
  actionType: BulkActionType;
  isLoading?: boolean;
  onConfirm: (data: any) => void;
  onRemoveReporte?: (reporteId: string) => void;
}

export const BulkReportActionsDialog: React.FC<BulkReportActionsDialogProps> = ({
  open,
  onOpenChange,
  reportes,
  actionType,
  isLoading = false,
  onConfirm,
  onRemoveReporte,
}) => {
  const { categories } = useCategories();
  const { estados } = useEstados();
  const { users } = useUsers();
  const { user } = useAuth();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedEstadoId, setSelectedEstadoId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [comments, setComments] = useState<string>('');

  const activeCategories = categories.filter(cat => cat.activo && !cat.deleted_at);
  const activeEstados = estados.filter(est => est.activo && !est.deleted_at);
  
  // Filtrar solo usuarios activos (asset = true) y no eliminados
  const activeUsers = users.filter(userItem => 
    userItem.asset === true && !userItem.deleted_at
  );

  // Crear lista de usuarios disponibles para asignación incluyendo el usuario autenticado si está activo
  const availableUsersForAssignment = React.useMemo(() => {
    let usersList = [...activeUsers];
    
    // Si hay un usuario autenticado y está activo, agregarlo si no está en la lista
    if (user && user.user_metadata?.asset !== false && !activeUsers.find(u => u.id === user.id)) {
      const currentUser = {
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        asset: true, // Usuario autenticado activo
        deleted_at: null,
        role: [],
        confirmed: true,
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_roles: []
      };
      usersList.push(currentUser);
    }
    
    return usersList;
  }, [activeUsers, user]);

  const handleRemoveReporte = (reporteId: string) => {
    if (onRemoveReporte) {
      onRemoveReporte(reporteId);
    }
  };

  const getActionConfig = () => {
    switch (actionType) {
      case 'toggle_status':
        return {
          title: 'Cambiar estado activo/inactivo',
          icon: <ToggleLeft className="h-6 w-6 text-blue-500" />,
          description: `Cambiar el estado activo/inactivo de ${reportes.length} reporte${reportes.length !== 1 ? 's' : ''}.`,
          confirmText: 'Cambiar Estado',
          variant: 'default' as const
        };
      case 'delete':
        return {
          title: 'Eliminar reportes',
          icon: <Trash2 className="h-6 w-6 text-red-500" />,
          description: `Esta acción eliminará ${reportes.length} reporte${reportes.length !== 1 ? 's' : ''} de forma permanente. Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          variant: 'destructive' as const
        };
      case 'change_category':
        return {
          title: 'Cambiar categoría',
          icon: <Tag className="h-6 w-6 text-green-500" />,
          description: `Asignar una nueva categoría a ${reportes.length} reporte${reportes.length !== 1 ? 's' : ''}.`,
          confirmText: 'Cambiar Categoría',
          variant: 'default' as const
        };
      case 'change_estado':
        return {
          title: 'Cambiar estado del reporte',
          icon: <Circle className="h-6 w-6 text-orange-500" />,
          description: `Asignar un nuevo estado a ${reportes.length} reporte${reportes.length !== 1 ? 's' : ''}.`,
          confirmText: 'Cambiar Estado',
          variant: 'default' as const
        };
      case 'change_assignment':
        return {
          title: 'Cambiar asignación',
          icon: <UserCheck className="h-6 w-6 text-purple-500" />,
          description: `Reasignar ${reportes.length} reporte${reportes.length !== 1 ? 's' : ''} a un nuevo usuario.`,
          confirmText: 'Cambiar Asignación',
          variant: 'default' as const
        };
      default:
        return {
          title: 'Acción masiva',
          icon: <FileText className="h-6 w-6" />,
          description: 'Acción no reconocida',
          confirmText: 'Confirmar',
          variant: 'default' as const
        };
    }
  };

  const config = getActionConfig();

  const handleConfirm = () => {
    let data: any = { comments: comments.trim() || undefined };
    
    switch (actionType) {
      case 'change_category':
        data.categoryId = selectedCategoryId;
        break;
      case 'change_estado':
        data.estadoId = selectedEstadoId;
        break;
      case 'change_assignment':
        // Convert 'unassigned' string back to null for the API
        data.userId = selectedUserId === 'unassigned' ? null : selectedUserId;
        break;
    }
    
    onConfirm(data);
  };

  const isFormValid = () => {
    switch (actionType) {
      case 'change_category':
        return selectedCategoryId !== '';
      case 'change_estado':
        return selectedEstadoId !== '';
      case 'change_assignment':
        return true; // Valid even if no user selected (means unassign)
      default:
        return true;
    }
  };

  const getUserDisplayName = (userItem: any) => {
    return `${userItem.first_name || ''} ${userItem.last_name || ''}`.trim() || userItem.email;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {config.icon}
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Reportes afectados */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reporte{reportes.length !== 1 ? 's' : ''} afectado{reportes.length !== 1 ? 's' : ''} ({reportes.length}):
            </p>
            <ScrollArea className="h-28 border rounded-md p-3 bg-gray-50">
              <div className="space-y-2">
                {reportes.map((reporte) => (
                  <div key={reporte.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {reporte.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium truncate">{reporte.nombre}</span>
                      {reporte.categoria && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {reporte.categoria.nombre}
                        </Badge>
                      )}
                    </div>
                    {onRemoveReporte && reportes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 flex-shrink-0"
                        onClick={() => handleRemoveReporte(reporte.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Formulario específico según la acción */}
          {actionType === 'change_category' && (
            <div className="space-y-2">
              <Label htmlFor="category-select">Nueva categoría:</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                <SelectContent>
                  {activeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {actionType === 'change_estado' && (
            <div className="space-y-2">
              <Label htmlFor="estado-select">Nuevo estado:</Label>
              <Select value={selectedEstadoId} onValueChange={setSelectedEstadoId}>
                <SelectTrigger id="estado-select">
                  <SelectValue placeholder="Seleccionar estado..." />
                </SelectTrigger>
                <SelectContent>
                  {activeEstados.map((estado) => (
                    <SelectItem key={estado.id} value={estado.id}>
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
          )}

          {actionType === 'change_assignment' && (
            <div className="space-y-2">
              <Label htmlFor="user-select">Asignar a:</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Seleccionar usuario activo o dejar sin asignar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <span className="text-gray-500">Sin asignar</span>
                  </SelectItem>
                  {availableUsersForAssignment.map((userItem) => (
                    <SelectItem key={userItem.id} value={userItem.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          userItem.id === user?.id ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {getUserDisplayName(userItem).charAt(0).toUpperCase()}
                        </div>
                        <span>
                          {getUserDisplayName(userItem)}
                          {userItem.id === user?.id && ' (Yo)'}
                        </span>
                        <span className="text-gray-500 text-xs">({userItem.email})</span>
                        <span className="text-green-600 text-xs">(Activo)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Comentarios (opcional para todas las acciones excepto eliminación) */}
          {actionType !== 'delete' && (
            <div className="space-y-2">
              <Label htmlFor="comments">Comentarios (opcional):</Label>
              <Textarea
                id="comments"
                placeholder="Agregar un comentario sobre esta acción..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Advertencia para eliminación */}
          {actionType === 'delete' && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">¡Advertencia!</p>
                <p>Esta acción no se puede deshacer. Los reportes eliminados no se podrán recuperar.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !isFormValid() || reportes.length === 0}
            variant={config.variant}
          >
            {isLoading ? 'Procesando...' : config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
