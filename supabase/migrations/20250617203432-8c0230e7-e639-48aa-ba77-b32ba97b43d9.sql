
-- Crear tabla de configuración de notificaciones
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auto_delete_read BOOLEAN NOT NULL DEFAULT false,
  retention_days INTEGER NOT NULL DEFAULT 30,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean su propia configuración
CREATE POLICY "Users can view own notification settings" ON public.notification_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar su configuración
CREATE POLICY "Users can update own notification settings" ON public.notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar su configuración
CREATE POLICY "Users can insert own notification settings" ON public.notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para limpiar notificaciones antiguas automáticamente
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setting_record RECORD;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Limpiar notificaciones basado en la configuración de cada usuario
  FOR setting_record IN 
    SELECT user_id, retention_days 
    FROM public.notification_settings 
    WHERE enabled = true
  LOOP
    cutoff_date := now() - INTERVAL '1 day' * setting_record.retention_days;
    
    DELETE FROM public.notifications 
    WHERE user_id = setting_record.user_id 
    AND created_at < cutoff_date;
  END LOOP;
END;
$$;
