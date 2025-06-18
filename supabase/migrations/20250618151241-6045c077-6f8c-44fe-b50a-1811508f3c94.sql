
-- Actualizar la función log_security_event para registrar actividades importantes
CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_description text, p_user_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  event_id UUID;
  activity_type_val activity_type;
BEGIN
  -- Determinar el tipo de actividad basado en el evento
  CASE p_event_type
    WHEN 'LOGIN', 'SIGNIN', 'USER_LOGIN' THEN
      activity_type_val := 'LOGIN';
    WHEN 'LOGOUT', 'SIGNOUT', 'USER_LOGOUT' THEN
      activity_type_val := 'LOGOUT';
    WHEN 'IMPORT', 'DATA_IMPORT', 'BULK_IMPORT' THEN
      activity_type_val := 'IMPORT';
    WHEN 'EXPORT', 'DATA_EXPORT', 'BULK_EXPORT' THEN
      activity_type_val := 'EXPORT';
    WHEN 'SEARCH', 'USER_SEARCH' THEN
      activity_type_val := 'SEARCH';
    WHEN 'FILE_UPLOAD_ATTEMPT', 'FILE_UPLOAD_REJECTED', 'FILE_UPLOAD_VALIDATED' THEN
      activity_type_val := 'CREATE'; -- Para eventos de archivos
    ELSE
      activity_type_val := 'CREATE'; -- Por defecto para otros eventos de seguridad
  END CASE;

  -- Registrar la actividad
  INSERT INTO public.actividades (
    user_id,
    activity_type,
    descripcion,
    tabla_afectada,
    registro_id,
    metadatos
  ) VALUES (
    COALESCE(p_user_id, auth.uid()),
    activity_type_val,
    CASE 
      WHEN p_event_type IN ('LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT', 'SEARCH') THEN p_description
      ELSE format('SECURITY: %s - %s', p_event_type, p_description)
    END,
    CASE 
      WHEN p_event_type IN ('LOGIN', 'LOGOUT') THEN 'auth_sessions'
      WHEN p_event_type IN ('IMPORT', 'EXPORT') THEN 'data_operations'
      WHEN p_event_type = 'SEARCH' THEN 'search_operations'
      ELSE 'security_events'
    END,
    NULL,
    p_metadata || jsonb_build_object(
      'event_type', p_event_type,
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    )
  ) RETURNING id INTO event_id;

  RETURN event_id;
END;
$function$;

-- Crear función específica para registrar login
CREATE OR REPLACE FUNCTION public.log_user_login(p_user_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.log_security_event(
    'LOGIN',
    'Usuario inició sesión',
    p_user_id,
    p_metadata
  );
END;
$function$;

-- Crear función específica para registrar logout
CREATE OR REPLACE FUNCTION public.log_user_logout(p_user_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.log_security_event(
    'LOGOUT',
    'Usuario cerró sesión',
    p_user_id,
    p_metadata
  );
END;
$function$;

-- Crear función específica para registrar importaciones
CREATE OR REPLACE FUNCTION public.log_data_import(p_table_name text, p_records_count integer, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.log_security_event(
    'IMPORT',
    format('Importación de datos: %s registros en %s', p_records_count, p_table_name),
    auth.uid(),
    p_metadata || jsonb_build_object(
      'table_name', p_table_name,
      'records_count', p_records_count,
      'operation_type', 'import'
    )
  );
END;
$function$;

-- Crear función específica para registrar exportaciones
CREATE OR REPLACE FUNCTION public.log_data_export(p_table_name text, p_records_count integer, p_export_format text DEFAULT 'CSV', p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.log_security_event(
    'EXPORT',
    format('Exportación de datos: %s registros de %s en formato %s', p_records_count, p_table_name, p_export_format),
    auth.uid(),
    p_metadata || jsonb_build_object(
      'table_name', p_table_name,
      'records_count', p_records_count,
      'export_format', p_export_format,
      'operation_type', 'export'
    )
  );
END;
$function$;
