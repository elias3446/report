
-- Actualizar la función log_security_event para no registrar eventos de visualización rutinarios
CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_description text, p_user_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  event_id UUID;
  activity_type_val activity_type;
BEGIN
  -- Solo registrar eventos de seguridad críticos, no operaciones rutinarias de visualización
  IF p_event_type IN ('REPORT_VIEW_ATTEMPT', 'FILE_VIEW_ATTEMPT', 'DATA_VIEW_ATTEMPT', 'USER_VIEW_ATTEMPT') THEN
    -- No registrar eventos de visualización rutinarios
    RETURN NULL;
  END IF;

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
      activity_type_val := 'CREATE';
    ELSE
      activity_type_val := 'CREATE';
  END CASE;

  -- Registrar solo eventos de seguridad importantes
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

-- Limpiar los eventos de seguridad existentes relacionados con visualización
DELETE FROM public.actividades 
WHERE descripcion LIKE '%SECURITY: REPORT_VIEW_ATTEMPT%' 
   OR descripcion LIKE '%SECURITY: FILE_VIEW_ATTEMPT%'
   OR descripcion LIKE '%SECURITY: DATA_VIEW_ATTEMPT%'
   OR descripcion LIKE '%SECURITY: USER_VIEW_ATTEMPT%';
