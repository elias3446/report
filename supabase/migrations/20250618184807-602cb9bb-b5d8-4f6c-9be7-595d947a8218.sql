
-- Modificar la columna activo para permitir valores null
ALTER TABLE public.reportes 
ALTER COLUMN activo DROP NOT NULL,
ALTER COLUMN activo DROP DEFAULT;

-- Actualizar registros existentes si es necesario
-- Los reportes que ya están marcados como inactivos (false) los podemos marcar como resueltos (null)
UPDATE public.reportes 
SET activo = NULL 
WHERE activo = false;

-- Comentario: Ahora activo puede ser:
-- NULL = Resuelto/No pendiente
-- true = Pendiente
-- La combinación de activo=true + assigned_to!=null = En proceso
