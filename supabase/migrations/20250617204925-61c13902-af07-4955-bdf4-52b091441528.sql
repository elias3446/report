
-- Habilitar RLS en la tabla notifications si no está habilitado
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir que los usuarios vean sus propias notificaciones
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Crear política para permitir que los usuarios actualicen sus propias notificaciones
CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Crear política para permitir que los usuarios eliminen sus propias notificaciones
CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Crear política para permitir que el sistema inserte notificaciones para cualquier usuario
CREATE POLICY "System can insert notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);
