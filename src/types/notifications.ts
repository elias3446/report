
export type NotificationType = 
  | 'reporte_asignado'
  | 'reporte_reasignado' 
  | 'reporte_desasignado'
  | 'perfil_actualizado'
  | 'reporte_eliminado'
  | 'usuario_eliminado'
  | 'rol_eliminado'
  | 'categoria_eliminada'
  | 'estado_eliminado';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface UpdateNotificationData {
  id: string;
  read?: boolean;
}
