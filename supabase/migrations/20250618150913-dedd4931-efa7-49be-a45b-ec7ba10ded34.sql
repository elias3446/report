
-- Eliminar todas las actividades existentes de tipo READ
DELETE FROM public.actividades WHERE activity_type = 'READ';

-- Eliminar todas las entradas del historial de cambios relacionadas con operaciones SELECT
DELETE FROM public.cambios_historial WHERE operation_type = 'SELECT';

-- Actualizar la función audit_table_changes para excluir operaciones READ/SELECT
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  actividad_id UUID;
  current_user_id UUID;
  operation_desc TEXT;
  activity_enum activity_type;
  op_enum operation_type;
  campos_modificados TEXT[] := '{}';
  col_name TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  current_user_id := auth.uid();
  
  -- Si no hay usuario autenticado, no registrar auditoría
  IF current_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Determinar el tipo de operación (excluir READ/select)
  CASE TG_OP
    WHEN 'INSERT' THEN
      operation_desc := 'Registro creado en ' || TG_TABLE_NAME;
      activity_enum := 'CREATE';
      op_enum := 'INSERT';
    WHEN 'UPDATE' THEN
      operation_desc := 'Registro actualizado en ' || TG_TABLE_NAME;
      activity_enum := 'UPDATE';
      op_enum := 'UPDATE';
      
      -- Detectar campos modificados
      FOR col_name IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME 
        AND table_schema = 'public'
      LOOP
        EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', col_name, col_name) 
        INTO old_val, new_val 
        USING OLD, NEW;
        
        IF old_val IS DISTINCT FROM new_val THEN
          campos_modificados := array_append(campos_modificados, col_name);
        END IF;
      END LOOP;
      
    WHEN 'DELETE' THEN
      operation_desc := 'Registro eliminado de ' || TG_TABLE_NAME;
      activity_enum := 'DELETE';
      op_enum := 'DELETE';
  END CASE;

  -- Registrar actividad general
  actividad_id := public.registrar_actividad(
    activity_enum,
    operation_desc,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN (row_to_json(OLD)->>'id')::TEXT
      ELSE (row_to_json(NEW)->>'id')::TEXT
    END,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now()
    )
  );

  -- Registrar cambio específico en historial
  INSERT INTO public.cambios_historial (
    actividad_id,
    user_id,
    tabla_nombre,
    registro_id,
    operation_type,
    valores_anteriores,
    valores_nuevos,
    campos_modificados,
    descripcion_cambio
  ) VALUES (
    actividad_id,
    current_user_id,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN (row_to_json(OLD)->>'id')::TEXT
      ELSE (row_to_json(NEW)->>'id')::TEXT
    END,
    op_enum,
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    campos_modificados,
    operation_desc
  );

  -- Retornar el registro apropiado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Actualizar la función log_security_event para no usar activity_type READ por defecto
CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_description text, p_user_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  event_id UUID;
BEGIN
  -- Solo registrar eventos de seguridad importantes, no operaciones de lectura rutinarias
  IF p_event_type NOT IN ('FILE_UPLOAD_ATTEMPT', 'FILE_UPLOAD_REJECTED', 'FILE_UPLOAD_VALIDATED') THEN
    INSERT INTO public.actividades (
      user_id,
      activity_type,
      descripcion,
      tabla_afectada,
      registro_id,
      metadatos
    ) VALUES (
      COALESCE(p_user_id, auth.uid()),
      'CREATE'::activity_type, -- Cambiar de READ a CREATE para eventos de seguridad
      format('SECURITY: %s - %s', p_event_type, p_description),
      'security_events',
      NULL,
      p_metadata || jsonb_build_object(
        'security_event', true, 
        'event_type', p_event_type,
        'timestamp', now(),
        'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
      )
    ) RETURNING id INTO event_id;
  END IF;

  RETURN event_id;
END;
$function$;
