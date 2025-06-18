
-- Crear enum para los tipos de notificación
CREATE TYPE notification_type AS ENUM (
  'reporte_asignado',
  'reporte_reasignado', 
  'reporte_desasignado',
  'perfil_actualizado',
  'reporte_eliminado',
  'usuario_eliminado',
  'rol_eliminado',
  'categoria_eliminada',
  'estado_eliminado'
);

-- Crear tabla de notificaciones
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias notificaciones
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus notificaciones (marcar como leídas)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Función para crear notificaciones
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger para notificaciones de asignación de reportes
CREATE OR REPLACE FUNCTION public.notify_reporte_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reporte_nombre TEXT;
  assigned_user_name TEXT;
  assigner_name TEXT;
BEGIN
  -- Obtener nombre del reporte
  SELECT nombre INTO reporte_nombre FROM public.reportes WHERE id = NEW.id;
  
  -- Notificar cuando se asigna por primera vez
  IF OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN
    -- Obtener nombre del usuario asignado
    SELECT CONCAT(first_name, ' ', last_name) INTO assigned_user_name 
    FROM public.profiles WHERE id = NEW.assigned_to;
    
    -- Obtener nombre del usuario que asigna
    SELECT CONCAT(first_name, ' ', last_name) INTO assigner_name 
    FROM public.profiles WHERE id = auth.uid();
    
    PERFORM public.create_notification(
      NEW.assigned_to,
      'reporte_asignado',
      'Nuevo reporte asignado',
      format('Se te ha asignado el reporte "%s" por %s', reporte_nombre, COALESCE(assigner_name, 'el sistema')),
      jsonb_build_object(
        'reporte_id', NEW.id,
        'reporte_nombre', reporte_nombre,
        'assigned_by', auth.uid()
      )
    );
    
  -- Notificar cuando se reasigna
  ELSIF OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NOT NULL AND OLD.assigned_to != NEW.assigned_to THEN
    -- Notificar al usuario anterior
    PERFORM public.create_notification(
      OLD.assigned_to,
      'reporte_desasignado',
      'Reporte desasignado',
      format('El reporte "%s" ya no está asignado a ti', reporte_nombre),
      jsonb_build_object(
        'reporte_id', NEW.id,
        'reporte_nombre', reporte_nombre
      )
    );
    
    -- Notificar al nuevo usuario
    SELECT CONCAT(first_name, ' ', last_name) INTO assigner_name 
    FROM public.profiles WHERE id = auth.uid();
    
    PERFORM public.create_notification(
      NEW.assigned_to,
      'reporte_reasignado',
      'Reporte reasignado',
      format('Se te ha reasignado el reporte "%s" por %s', reporte_nombre, COALESCE(assigner_name, 'el sistema')),
      jsonb_build_object(
        'reporte_id', NEW.id,
        'reporte_nombre', reporte_nombre,
        'assigned_by', auth.uid(),
        'previous_assignee', OLD.assigned_to
      )
    );
    
  -- Notificar cuando se desasigna
  ELSIF OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN
    PERFORM public.create_notification(
      OLD.assigned_to,
      'reporte_desasignado',
      'Reporte desasignado',
      format('El reporte "%s" ya no está asignado a ti', reporte_nombre),
      jsonb_build_object(
        'reporte_id', NEW.id,
        'reporte_nombre', reporte_nombre
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para asignaciones de reportes
CREATE TRIGGER notify_reporte_assignment_trigger
  AFTER UPDATE OF assigned_to ON public.reportes
  FOR EACH ROW
  WHEN (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to)
  EXECUTE FUNCTION public.notify_reporte_assignment();

-- Trigger para notificaciones de cambios en perfil
CREATE OR REPLACE FUNCTION public.notify_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo notificar si hay cambios significativos (no en updated_at)
  IF (OLD.first_name IS DISTINCT FROM NEW.first_name) OR 
     (OLD.last_name IS DISTINCT FROM NEW.last_name) OR 
     (OLD.email IS DISTINCT FROM NEW.email) OR 
     (OLD.role IS DISTINCT FROM NEW.role) OR 
     (OLD.asset IS DISTINCT FROM NEW.asset) THEN
    
    PERFORM public.create_notification(
      NEW.id,
      'perfil_actualizado',
      'Perfil actualizado',
      'Tu perfil ha sido actualizado',
      jsonb_build_object(
        'updated_by', auth.uid(),
        'changes', jsonb_build_object(
          'first_name_changed', OLD.first_name IS DISTINCT FROM NEW.first_name,
          'last_name_changed', OLD.last_name IS DISTINCT FROM NEW.last_name,
          'email_changed', OLD.email IS DISTINCT FROM NEW.email,
          'role_changed', OLD.role IS DISTINCT FROM NEW.role,
          'status_changed', OLD.asset IS DISTINCT FROM NEW.asset
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para cambios de perfil
CREATE TRIGGER notify_profile_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_profile_changes();

-- Función para notificar eliminaciones
CREATE OR REPLACE FUNCTION public.notify_deletion(
  p_table_name TEXT,
  p_record_name TEXT,
  p_deleted_by_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleter_name TEXT;
  notification_type_val notification_type;
  notification_title TEXT;
  notification_message TEXT;
  affected_user_id UUID;
BEGIN
  -- Obtener nombre del usuario que elimina
  SELECT CONCAT(first_name, ' ', last_name) INTO deleter_name 
  FROM public.profiles WHERE id = p_deleted_by_user_id;
  
  -- Determinar tipo de notificación y mensaje
  CASE p_table_name
    WHEN 'reportes' THEN
      notification_type_val := 'reporte_eliminado';
      notification_title := 'Reporte eliminado';
      notification_message := format('El reporte "%s" ha sido eliminado por %s', p_record_name, COALESCE(deleter_name, 'el sistema'));
    WHEN 'profiles' THEN
      notification_type_val := 'usuario_eliminado';
      notification_title := 'Usuario eliminado';
      notification_message := format('El usuario "%s" ha sido eliminado por %s', p_record_name, COALESCE(deleter_name, 'el sistema'));
    WHEN 'roles' THEN
      notification_type_val := 'rol_eliminado';
      notification_title := 'Rol eliminado';
      notification_message := format('El rol "%s" ha sido eliminado por %s', p_record_name, COALESCE(deleter_name, 'el sistema'));
    WHEN 'categories' THEN
      notification_type_val := 'categoria_eliminada';
      notification_title := 'Categoría eliminada';
      notification_message := format('La categoría "%s" ha sido eliminada por %s', p_record_name, COALESCE(deleter_name, 'el sistema'));
    WHEN 'estados' THEN
      notification_type_val := 'estado_eliminado';
      notification_title := 'Estado eliminado';
      notification_message := format('El estado "%s" ha sido eliminado por %s', p_record_name, COALESCE(deleter_name, 'el sistema'));
    ELSE
      RETURN; -- No hacer nada para tablas no reconocidas
  END CASE;
  
  -- Notificar a todos los usuarios activos (administradores)
  FOR affected_user_id IN 
    SELECT id FROM public.profiles 
    WHERE deleted_at IS NULL 
    AND asset = true 
    AND 'admin' = ANY(role)
    AND id != p_deleted_by_user_id -- No notificar al que elimina
  LOOP
    PERFORM public.create_notification(
      affected_user_id,
      notification_type_val,
      notification_title,
      notification_message,
      jsonb_build_object(
        'table_name', p_table_name,
        'record_name', p_record_name,
        'deleted_by', p_deleted_by_user_id
      )
    );
  END LOOP;
END;
$$;

-- Trigger para notificar eliminaciones de reportes
CREATE OR REPLACE FUNCTION public.notify_reporte_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.notify_deletion('reportes', OLD.nombre, auth.uid());
  RETURN OLD;
END;
$$;

CREATE TRIGGER notify_reporte_deletion_trigger
  AFTER UPDATE OF deleted_at ON public.reportes
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION public.notify_reporte_deletion();

-- Trigger para notificar eliminaciones de usuarios
CREATE OR REPLACE FUNCTION public.notify_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.notify_deletion('profiles', CONCAT(OLD.first_name, ' ', OLD.last_name), auth.uid());
  RETURN OLD;
END;
$$;

CREATE TRIGGER notify_user_deletion_trigger
  AFTER UPDATE OF deleted_at ON public.profiles
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION public.notify_user_deletion();

-- Trigger para notificar eliminaciones de roles
CREATE OR REPLACE FUNCTION public.notify_role_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.notify_deletion('roles', OLD.nombre, auth.uid());
  RETURN OLD;
END;
$$;

CREATE TRIGGER notify_role_deletion_trigger
  AFTER UPDATE OF deleted_at ON public.roles
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION public.notify_role_deletion();

-- Trigger para notificar eliminaciones de categorías
CREATE OR REPLACE FUNCTION public.notify_category_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.notify_deletion('categories', OLD.nombre, auth.uid());
  RETURN OLD;
END;
$$;

CREATE TRIGGER notify_category_deletion_trigger
  AFTER UPDATE OF deleted_at ON public.categories
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION public.notify_category_deletion();

-- Trigger para notificar eliminaciones de estados
CREATE OR REPLACE FUNCTION public.notify_estado_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.notify_deletion('estados', OLD.nombre, auth.uid());
  RETURN OLD;
END;
$$;

CREATE TRIGGER notify_estado_deletion_trigger
  AFTER UPDATE OF deleted_at ON public.estados
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION public.notify_estado_deletion();

-- Habilitar realtime para notificaciones
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
