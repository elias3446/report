
-- Crear o reemplazar la función que maneja la confirmación de email
CREATE OR REPLACE FUNCTION public.handle_user_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar el campo confirmed en profiles cuando el usuario confirma su email
  UPDATE public.profiles 
  SET confirmed = true, updated_at = now()
  WHERE id = NEW.id AND NEW.email_confirmed_at IS NOT NULL;
  
  RETURN NEW;
END;
$$;

-- Eliminar el trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Crear el trigger que se ejecuta cuando se actualiza un usuario en auth.users
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_user_confirmation();
