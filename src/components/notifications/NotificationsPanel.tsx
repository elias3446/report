
import React from 'react';
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotifications } from '@/hooks/useNotifications';
import { useBulkNotifications } from '@/hooks/useBulkNotifications';
import type { Notification, NotificationType } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'reporte_asignado':
    case 'reporte_reasignado':
      return '📋';
    case 'reporte_desasignado':
      return '❌';
    case 'perfil_actualizado':
      return '👤';
    case 'reporte_eliminado':
      return '🗑️';
    case 'usuario_eliminado':
      return '👥';
    case 'rol_eliminado':
      return '🛡️';
    case 'categoria_eliminada':
      return '📁';
    case 'estado_eliminado':
      return '⚡';
    default:
      return '📢';
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'reporte_asignado':
    case 'reporte_reasignado':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'reporte_desasignado':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'perfil_actualizado':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'reporte_eliminado':
    case 'usuario_eliminado':
    case 'rol_eliminado':
    case 'categoria_eliminada':
    case 'estado_eliminado':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigateToReporte: (notification: Notification) => void;
  isMarkingAsRead: boolean;
  isDeleting: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  showCheckbox: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigateToReporte,
  isMarkingAsRead,
  isDeleting,
  isSelected,
  onSelect,
  showCheckbox,
}) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: es,
  });

  const isReporteRelated = ['reporte_asignado', 'reporte_reasignado', 'reporte_desasignado'].includes(notification.type);
  const hasReporteId = notification.data?.reporte_id;

  return (
    <div className={`p-3 rounded-lg border transition-colors ${
      notification.read 
        ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700' 
        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm'
    } ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-start gap-3">
        {showCheckbox && (
          <div className="flex-shrink-0 pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(notification.id)}
            />
          </div>
        )}
        
        <div className="flex-shrink-0 text-lg">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium truncate ${
                notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-xs mt-1 ${
                notification.read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {notification.message}
              </p>
            </div>
            
            <Badge variant="outline" className={`text-xs ${getNotificationColor(notification.type)}`}>
              {notification.type.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{timeAgo}</span>
            
            <div className="flex items-center gap-1">
              {isReporteRelated && hasReporteId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                  onClick={() => onNavigateToReporte(notification)}
                  title="Ver detalle del reporte"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onMarkAsRead(notification.id)}
                  disabled={isMarkingAsRead}
                  title="Marcar como leída"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                onClick={() => onDelete(notification.id)}
                disabled={isDeleting}
                title="Eliminar notificación"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationsPanel: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    navigateToReporte,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeleting,
  } = useNotifications();

  const bulkNotifications = useBulkNotifications(notifications);

  if (isLoading) {
    return (
      <Card className="h-full max-h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Cargando notificaciones...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasNotifications = notifications.length > 0;
  const hasSelectedItems = bulkNotifications.selectedCount > 0;

  return (
    <Card className="h-full max-h-[600px] flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg">
      <CardHeader className="flex-shrink-0 pb-3 space-y-3">
        {/* Header principal - responsive */}
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 flex-shrink-0">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Notificaciones</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          
          {/* Botón marcar todas - responsive */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
              className="flex items-center gap-1 text-xs px-2 py-1 h-8 flex-shrink-0"
            >
              <CheckCheck className="h-3 w-3" />
              <span className="hidden sm:inline">Marcar todas</span>
              <span className="sm:hidden">Todas</span>
            </Button>
          )}
        </div>

        {/* Controles de selección masiva - responsive */}
        {hasNotifications && (
          <>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Checkbox
                  checked={bulkNotifications.isAllSelected}
                  onCheckedChange={bulkNotifications.handleSelectAll}
                />
                <span className="text-xs sm:text-sm text-muted-foreground truncate">
                  {hasSelectedItems 
                    ? `${bulkNotifications.selectedCount} seleccionadas`
                    : 'Seleccionar todas'
                  }
                </span>
              </div>

              {hasSelectedItems && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={bulkNotifications.deleteBulkNotifications}
                  disabled={bulkNotifications.isDeleting}
                  className="flex items-center gap-1 text-xs px-2 py-1 h-8 flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Eliminar</span>
                </Button>
              )}
            </div>
          </>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        {!hasNotifications ? (
          <div className="text-center py-8 px-6">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No tienes notificaciones</p>
          </div>
        ) : (
          <ScrollArea className="h-full px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-3 pt-3">
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onNavigateToReporte={navigateToReporte}
                    isMarkingAsRead={isMarkingAsRead}
                    isDeleting={isDeleting}
                    isSelected={bulkNotifications.selectedItems.has(notification.id)}
                    onSelect={bulkNotifications.handleSelectItem}
                    showCheckbox={hasNotifications}
                  />
                  {index < notifications.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
