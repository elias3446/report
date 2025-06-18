
-- Add unique constraint on user_id for notification_settings table
ALTER TABLE public.notification_settings 
ADD CONSTRAINT notification_settings_user_id_unique UNIQUE (user_id);
