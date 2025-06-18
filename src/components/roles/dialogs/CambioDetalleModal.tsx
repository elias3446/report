
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Database, 
  User, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  History, 
  Activity, 
  CheckCircle, 
  Info 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CambioRol {
  id: string;
  tabla_nombre: string;
  registro_id: string;
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  valores_anteriores: any;
  valores_nuevos: any;
  campos_modificados: string[];
  descripcion_cambio: string;
  created_at: string;
  user_email: string;
}

interface CambioDetalleModalProps {
  cambio: CambioRol | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getOperationColor = (operation: CambioRol['operation_type']) => {
  switch (operation) {
    case 'INSERT': return 'bg-green-100 text-green-800 border-green-200';
    case 'UPDATE': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
    case 'SELECT': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const CambioDetalleModal: React.FC<CambioDetalleModalProps> = ({
  cambio,
  open,
  onOpenChange,
}) => {
  if (!cambio) return null;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] bg-slate-900 text-white border-slate-700 flex flex-col">
        <DialogHeader className="border-b border-slate-700 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-white">
            <History className="h-5 w-5" />
            Detalles del Cambio
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Información General */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                Información General
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-300">Operación:</span>
                    <Badge className={`${getOperationColor(cambio.operation_type)} font-medium`}>
                      {cambio.operation_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-300">Tabla:</span>
                    <span className="text-sm text-white font-mono">{cambio.tabla_nombre}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-slate-300">Descripción del Cambio:</span>
                    <span className="text-sm text-white break-words">{cambio.descripcion_cambio}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-300">Usuario:</span>
                    <span className="text-sm text-blue-400">{cambio.user_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-300">Fecha y Hora:</span>
                    <span className="text-sm text-white">
                      {format(new Date(cambio.created_at), 'dd/MM/yyyy', { locale: es })} a las{' '}
                      {format(new Date(cambio.created_at), 'HH:mm:ss', { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-slate-300">Registro actualizado en categorías:</span>
                    <span className="text-sm text-white font-mono">{cambio.registro_id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campos Modificados */}
            {cambio.campos_modificados && cambio.campos_modificados.length > 0 && (
              <div className="bg-slate-800 rounded-lg border border-slate-700">
                <div className="bg-blue-900/50 px-4 py-3 border-b border-slate-600 rounded-t-lg">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-blue-400" />
                    Campos Modificados ({cambio.campos_modificados.length})
                  </h4>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {cambio.campos_modificados.map((campo, index) => (
                      <Badge key={index} variant="outline" className="bg-slate-700 border-slate-600 text-blue-400">
                        {campo}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Comparación de Valores */}
            {(cambio.valores_anteriores || cambio.valores_nuevos) && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-400" />
                  Comparación de Valores
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Valores anteriores */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg">
                    <div className="bg-red-900/30 px-4 py-3 border-b border-slate-600 rounded-t-lg">
                      <h5 className="font-medium text-white flex items-center gap-2">
                        <span className="text-red-400">ESTADO ANTERIOR</span>
                      </h5>
                    </div>
                    <div className="p-4">
                      {cambio.valores_anteriores ? (
                        <ScrollArea className="h-48">
                          <pre className="text-xs font-mono text-red-300 whitespace-pre-wrap break-all">
                            {formatValue(cambio.valores_anteriores)}
                          </pre>
                        </ScrollArea>
                      ) : (
                        <div className="flex items-center justify-center h-20 text-slate-400">
                          <span className="text-sm italic">Sin valores anteriores</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Valores nuevos */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg">
                    <div className="bg-green-900/30 px-4 py-3 border-b border-slate-600 rounded-t-lg">
                      <h5 className="font-medium text-white flex items-center gap-2">
                        <span className="text-green-400">ESTADO ACTUAL</span>
                      </h5>
                    </div>
                    <div className="p-4">
                      {cambio.valores_nuevos ? (
                        <ScrollArea className="h-48">
                          <pre className="text-xs font-mono text-green-300 whitespace-pre-wrap break-all">
                            {formatValue(cambio.valores_nuevos)}
                          </pre>
                        </ScrollArea>
                      ) : (
                        <div className="flex items-center justify-center h-20 text-slate-400">
                          <span className="text-sm italic">Sin valores nuevos</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información Técnica */}
                <div className="bg-slate-800 rounded-lg border border-slate-700">
                  <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600 rounded-t-lg">
                    <h5 className="font-medium text-white flex items-center gap-2">
                      <Database className="h-4 w-4 text-slate-400" />
                      Información Técnica
                    </h5>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-slate-300">ID DEL REGISTRO:</span>
                      <p className="text-sm text-white font-mono break-all">{cambio.registro_id}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-300">NOMBRE DE LA TABLA:</span>
                      <p className="text-sm text-white font-mono">{cambio.tabla_nombre}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
