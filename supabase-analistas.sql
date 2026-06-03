-- ================================================================
--  Usuarios Analistas desde lista_procesos
--  Clínica de Alta Complejidad Santa Bárbara – PQRSF
--  Ejecutar en: Supabase → SQL Editor
--  ⚠ Contraseña temporal asignada: Pqrsf2024*
--    Cada analista debe cambiarla en su primer acceso.
--
--  NOTA: Varios procesos comparten correos separados por coma.
--        El script divide cada correo y crea/actualiza un usuario
--        por cada dirección individual.
--        Si un correo aparece en varios procesos, se asigna el
--        proceso del último que se procese (orden ascendente).
-- ================================================================


-- ── PASO 1: Columna "proceso" en consola_perfiles ───────────────
ALTER TABLE public.consola_perfiles
  ADD COLUMN IF NOT EXISTS proceso TEXT;


-- ── PASO 2: Actualizar trigger handle_new_user ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.consola_perfiles (id, nombre, email, rol, proceso)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'analista'),
    NEW.raw_user_meta_data->>'proceso'
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre  = EXCLUDED.nombre,
    email   = EXCLUDED.email,
    proceso = EXCLUDED.proceso;
  RETURN NEW;
END;
$$;


-- ── PASO 3: Recrear RPC get_my_console_profile ─────────────────
DROP FUNCTION IF EXISTS public.get_my_console_profile();

CREATE OR REPLACE FUNCTION public.get_my_console_profile()
RETURNS public.consola_perfiles
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.consola_perfiles WHERE id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_console_profile() TO authenticated;


-- ── PASO 4: Crear usuarios auth + perfiles desde lista_procesos ─
-- Itera cada proceso activo con correo, divide correos por coma,
-- y crea/actualiza un usuario por cada dirección individual.
DO $$
DECLARE
  proc        RECORD;
  raw_correo  TEXT;
  correo_item TEXT;
  correos     TEXT[];
  uid         UUID;
BEGIN
  FOR proc IN
    SELECT nombre, correo
    FROM  public.lista_procesos
    WHERE activo  = true
      AND correo IS NOT NULL
      AND correo <> ''
    ORDER BY orden
  LOOP

    -- Dividir campo correo por coma y limpiar espacios
    correos := string_to_array(proc.correo, ',');

    FOREACH raw_correo IN ARRAY correos
    LOOP
      correo_item := trim(raw_correo);
      CONTINUE WHEN correo_item = '';

      -- ¿Ya existe el usuario en auth.users?
      SELECT id INTO uid FROM auth.users WHERE email = correo_item;

      IF uid IS NULL THEN
        -- ── Crear nuevo usuario ────────────────────────────────
        uid := gen_random_uuid();

        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at,
          confirmation_token,
          email_change,
          email_change_token_new,
          recovery_token
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          uid,
          'authenticated',
          'authenticated',
          correo_item,
          crypt('Pqrsf2024*', gen_salt('bf')),
          NOW(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object(
            'nombre',  split_part(correo_item, '@', 1),
            'rol',     'analista',
            'proceso', proc.nombre
          ),
          NOW(),
          NOW(),
          '', '', '', ''
        );
        -- El trigger handle_new_user crea consola_perfiles automáticamente

      ELSE
        -- ── Usuario ya existe: asegurar que su perfil esté correcto ──
        INSERT INTO public.consola_perfiles (id, nombre, email, rol, proceso)
        VALUES (uid, split_part(correo_item, '@', 1), correo_item, 'analista', proc.nombre)
        ON CONFLICT (id) DO UPDATE SET
          proceso = EXCLUDED.proceso,
          nombre  = COALESCE(NULLIF(EXCLUDED.nombre, ''), consola_perfiles.nombre),
          rol     = CASE WHEN consola_perfiles.rol = 'admin' THEN 'admin'
                         ELSE 'analista' END;  -- nunca degradar un admin

      END IF;

      RAISE NOTICE 'Procesado: % → %', proc.nombre, correo_item;
    END LOOP;

  END LOOP;
END $$;


-- ── PASO 5: Verificar resultado ─────────────────────────────────
SELECT
  cp.nombre                                AS "Nombre",
  cp.email                                 AS "Correo",
  cp.rol                                   AS "Rol",
  cp.proceso                               AS "Proceso",
  cp.activo                                AS "Activo",
  (au.email_confirmed_at IS NOT NULL)      AS "Email confirmado"
FROM  public.consola_perfiles cp
JOIN  auth.users              au ON au.id = cp.id
ORDER BY cp.rol DESC, cp.proceso;
