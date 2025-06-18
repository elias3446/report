
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
import type { Estado } from '@/types/estados';
import { 
  Circle,
  ToggleLeft,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export type BulkEstadoActionType = 'toggle_status' | 'delete';

interface BulkEstadoActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estados: Estado[];
  actionType: BulkEstadoActionType;
  isLoading?: boolean;
  onConfirm: (data: any) => void;
  onRemoveEstado?: (estadoId: string) => void;
}

export const BulkEstadoActionsDialog: React.FC<BulkEstadoActionsDialogProps> = ({
  open,
  onOpenChange,
  estados,
  actionType,
  isLoading = false,
  onConfirm,
  onRemoveEstado,
}) => {
  const [comments, setComments] = useState<string>('');

  const handleRemoveEstado = (estadoId: string) => {
    if (onRemoveEstado) {
      onRemoveEstado(estadoId);
    }
  };

  const getActionConfig = () => {
    switch (actionType) {
      case 'toggle_status':
        return {
          title: 'Cambiar estado activo/inactivo',
          icon: <ToggleLeft className="h-6 w-6 text-blue-500" />,
          description: `Cambiar el estado activo/inactivo de ${estados.length} estado${estados.length !== 1 ? 's' : ''}.`,
          confirmText: 'Cambiar Estado',
          variant: 'default' as const
        };
      case 'delete':
        return {
          title: 'Eliminar estados',
          icon: <Trash2 className="h-6 w-6 text-red-500" />,
          description: `Esta acción eliminará ${estados.length} estado${estados.length !== 1 ? 's' : ''} de forma permanente. Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          variant: 'destructive' as const
        };
      default:
        return {
          title: 'Acción masiva',
          icon: <Circle className="h-6 w-6" />,
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
          {/* Estados afectados */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Circle className="h-4 w-4" />
              Estado{estados.length !== 1 ? 's' : ''} afectado{estados.length !== 1 ? 's' : ''} ({estados.length}):
            </p>
            <ScrollArea className="h-28 border rounded-md p-3 bg-gray-50">
              <div className="space-y-2">
                {estados.map((estado) => (
                  <div key={estado.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                        style={{ backgroundColor: estado.color }}
                      >
                        {estado.icono.charAt(0)}
                      </div>
                      <span className="font-medium truncate">{estado.nombre}</span>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {estado.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    {onRemoveEstado && estados.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 flex-shrink-0"
                        onClick={() => handleRemoveEstado(estado.id)}
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
                <p>Esta acción no se puede deshacer. Los estados eliminados no se podrán recuperar.</p>
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
            disabled={isLoading || estados.length === 0}
            variant={config.variant}
          >
            {isLoading ? 'Procesando...' : config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
