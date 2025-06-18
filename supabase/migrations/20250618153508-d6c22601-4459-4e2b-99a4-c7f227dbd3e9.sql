
-- Agregar columna theme a la tabla notification_settings
ALTER TABLE public.notification_settings 
ADD COLUMN theme VARCHAR(10) NOT NULL DEFAULT 'system';

-- Agregar constraint para validar valores permitidos
ALTER TABLE public.notification_settings 
ADD CONSTRAINT theme_check CHECK (theme IN ('light', 'dark', 'system'));
