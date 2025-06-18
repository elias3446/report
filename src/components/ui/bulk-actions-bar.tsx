
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Trash2, X, ToggleLeft, Shield, Tag, Circle, UserCheck, UserX, ChevronDown, Ban, Mail } from 'lucide-react';
interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete?: () => void;
  onBulkToggleStatus?: () => void;
  onBulkActivate?: () => void;
  onBulkDeactivate?: () => void;
  onBulkBlock?: () => void;
  onBulkChangeRoles?: () => void;
  onBulkChangeCategory?: () => void;
  onBulkChangeEstado?: () => void;
  onBulkChangeAssignment?: () => void;
  onBulkResendConfirmation?: () => void;
  onBulkExport?: () => void;
  isDeleting?: boolean;
  isToggling?: boolean;
  isActivating?: boolean;
  isDeactivating?: boolean;
  isBlocking?: boolean;
  isChangingRoles?: boolean;
  isChangingCategory?: boolean;
  isChangingEstado?: boolean;
  isChangingAssignment?: boolean;
  isResendingConfirmation?: boolean;
  isExporting?: boolean;
  showStatusToggle?: boolean;
  showUserActions?: boolean;
  showRoleChange?: boolean;
  showCategoryChange?: boolean;
  showEstadoChange?: boolean;
  showAssignmentChange?: boolean;
  showResendConfirmation?: boolean;
  customActions?: React.ReactNode;
}
export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkToggleStatus,
  onBulkActivate,
  onBulkDeactivate,
  onBulkBlock,
  onBulkChangeRoles,
  onBulkChangeCategory,
  onBulkChangeEstado,
  onBulkChangeAssignment,
  onBulkResendConfirmation,
  onBulkExport,
  isDeleting = false,
  isToggling = false,
  isActivating = false,
  isDeactivating = false,
  isBlocking = false,
  isChangingRoles = false,
  isChangingCategory = false,
  isChangingEstado = false,
  isChangingAssignment = false,
  isResendingConfirmation = false,
  isExporting = false,
  showStatusToggle = true,
  showUserActions = false,
  showRoleChange = false,
  showCategoryChange = false,
  showEstadoChange = false,
  showAssignmentChange = false,
  showResendConfirmation = false,
  customActions
}) => {
  if (selectedCount === 0) return null;
  const isAnyStatusActionLoading = isActivating || isDeactivating || isToggling || isBlocking;
  return <Card className="p-3 mb-4 border-blue-200 bg-blue-50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1">
            {selectedCount} elemento{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
          </Badge>
          <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-8 px-2">
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {customActions}

          {showResendConfirmation && onBulkResendConfirmation && <Button variant="outline" size="sm" onClick={onBulkResendConfirmation} disabled={isResendingConfirmation} className="h-8">
              <Mail className="h-4 w-4" />
              {isResendingConfirmation ? 'Enviando...' : 'Reenviar Confirmación'}
            </Button>}

          {showUserActions && (onBulkActivate || onBulkDeactivate || onBulkBlock) && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isAnyStatusActionLoading} className="h-8">
                  <UserCheck className="h-4 w-4" />
                  {isAnyStatusActionLoading ? 'Procesando...' : 'Cambiar Estado'}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onBulkActivate && <DropdownMenuItem onClick={onBulkActivate} disabled={isActivating} className="text-green-600 hover:text-green-700">
                    <UserCheck className="h-4 w-4 mr-2" />
                    {isActivating ? 'Activando...' : 'Activar'}
                  </DropdownMenuItem>}
                
                {onBulkDeactivate && <DropdownMenuItem onClick={onBulkDeactivate} disabled={isDeactivating} className="text-orange-600 hover:text-orange-700">
                    <UserX className="h-4 w-4 mr-2" />
                    {isDeactivating ? 'Desactivando...' : 'Desactivar'}
                  </DropdownMenuItem>}

                {onBulkBlock && <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onBulkBlock} disabled={isBlocking} className="text-red-600 hover:text-red-700">
                      <Ban className="h-4 w-4 mr-2" />
                      {isBlocking ? 'Bloqueando...' : 'Bloquear'}
                    </DropdownMenuItem>
                  </>}
              </DropdownMenuContent>
            </DropdownMenu>}
          
          {showRoleChange && onBulkChangeRoles && <Button variant="outline" size="sm" onClick={onBulkChangeRoles} disabled={isChangingRoles} className="h-8">
              <Shield className="h-4 w-4" />
              {isChangingRoles ? 'Cambiando...' : 'Cambiar Roles'}
            </Button>}

          {showCategoryChange && onBulkChangeCategory && <Button variant="outline" size="sm" onClick={onBulkChangeCategory} disabled={isChangingCategory} className="h-8">
              <Tag className="h-4 w-4" />
              {isChangingCategory ? 'Cambiando...' : 'Cambiar Categoría'}
            </Button>}

          {showEstadoChange && onBulkChangeEstado && <Button variant="outline" size="sm" onClick={onBulkChangeEstado} disabled={isChangingEstado} className="h-8">
              <Circle className="h-4 w-4" />
              {isChangingEstado ? 'Cambiando...' : 'Cambiar Estado'}
            </Button>}

          {showAssignmentChange && onBulkChangeAssignment && <Button variant="outline" size="sm" onClick={onBulkChangeAssignment} disabled={isChangingAssignment} className="h-8">
              <UserCheck className="h-4 w-4" />
              {isChangingAssignment ? 'Cambiando...' : 'Cambiar Asignación'}
            </Button>}
          
          {showStatusToggle && onBulkToggleStatus && <Button variant="outline" size="sm" onClick={onBulkToggleStatus} disabled={isToggling} className="h-8">
              <ToggleLeft className="h-4 w-4" />
              {isToggling ? 'Cambiando...' : 'Cambiar Estado'}
            </Button>}
          
          {onBulkDelete && <Button variant="destructive" size="sm" onClick={onBulkDelete} disabled={isDeleting} className="h-8">
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>}
        </div>
      </div>
    </Card>;
};
