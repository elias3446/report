
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Category } from '@/types/categories';
import { 
  FolderOpen,
  ToggleLeft,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export type BulkCategoryActionType = 'toggle_status' | 'delete';

interface BulkCategoryActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  actionType: BulkCategoryActionType;
  isLoading?: boolean;
  onConfirm: (data: any) => void;
  onRemoveCategory?: (categoryId: string) => void;
}

export const BulkCategoryActionsDialog: React.FC<BulkCategoryActionsDialogProps> = ({
  open,
  onOpenChange,
  categories,
  actionType,
  isLoading = false,
  onConfirm,
  onRemoveCategory,
}) => {
  const [comments, setComments] = useState<string>('');

  const handleRemoveCategory = (categoryId: string) => {
    if (onRemoveCategory) {
      onRemoveCategory(categoryId);
    }
  };

  const getActionConfig = () => {
    switch (actionType) {
      case 'toggle_status':
        return {
          title: 'Cambiar estado activo/inactivo',
          icon: <ToggleLeft className="h-6 w-6 text-blue-500" />,
          description: `Cambiar el estado activo/inactivo de ${categories.length} categoría${categories.length !== 1 ? 's' : ''}.`,
          confirmText: 'Cambiar Estado',
          variant: 'default' as const
        };
      case 'delete':
        return {
          title: 'Eliminar categorías',
          icon: <Trash2 className="h-6 w-6 text-red-500" />,
          description: `Esta acción eliminará ${categories.length} categoría${categories.length !== 1 ? 's' : ''} de forma permanente. Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          variant: 'destructive' as const
        };
      default:
        return {
          title: 'Acción masiva',
          icon: <FolderOpen className="h-6 w-6" />,
          description: 'Acción no reconocida',
          confirmText: 'Confirmar',
          variant: 'default' as const
        };
    }
  };

  const config = getActionConfig();

  const handleConfirm = () => {
    let data: any = { comments: comments.trim() || undefined };
    onConfirm(data);
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
          {/* Categorías afectadas */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Categoría{categories.length !== 1 ? 's' : ''} afectada{categories.length !== 1 ? 's' : ''} ({categories.length}):
            </p>
            <ScrollArea className="h-28 border rounded-md p-3 bg-gray-50">
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icono.charAt(0)}
                      </div>
                      <span className="font-medium truncate">{category.nombre}</span>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {category.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    {onRemoveCategory && categories.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 flex-shrink-0"
                        onClick={() => handleRemoveCategory(category.id)}
                        title="Eliminar de la selección"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

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
                <p>Esta acción no se puede deshacer. Las categorías eliminadas no se podrán recuperar.</p>
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
            disabled={isLoading || categories.length === 0}
            variant={config.variant}
          >
            {isLoading ? 'Procesando...' : config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
