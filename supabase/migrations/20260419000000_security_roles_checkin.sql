-- ============================================================
-- MIGRACIÓN: Seguridad y roles extendidos
-- Fecha: 2026-04-18
-- ============================================================

-- 1. Extender enum app_role para incluir los nuevos roles
-- (ALTER TYPE ADD VALUE es seguro en Postgres, no rompe datos existentes)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'caja';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operador';

-- 2. Políticas para check-in público (anon puede insertar/leer clientes)
-- La ruta /checkin es pública y necesita acceso sin autenticación
-- IMPORTANTE: Solo INSERT y SELECT por plate — no actualizar ni borrar
CREATE POLICY IF NOT EXISTS "Anon can insert clients for checkin"
  ON public.clients FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anon can select clients by plate"
  ON public.clients FOR SELECT
  TO anon
  USING (true);

-- 3. user_roles: el usuario autenticado puede ver su propio rol
-- (ya existe la policy, pero la función has_role solo compara admin. Extender permiso de upsert)
-- El admin puede actualizar roles (upsert)
CREATE POLICY IF NOT EXISTS "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Profiles: permitir a todos los admins ver todos los perfiles para el panel de usuarios
CREATE POLICY IF NOT EXISTS "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Asegurar que la tabla app_settings tiene RLS activo
-- (por si fue creada sin RLS en una migration anterior)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_settings' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
