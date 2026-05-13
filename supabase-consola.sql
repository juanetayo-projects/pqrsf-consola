-- ================================================================
--  App 3 – Consola de Gestión PQRSF  |  Clínica Santa Bárbara
--  Ejecutar en: Supabase → SQL Editor
-- ================================================================

-- ── 1. Columna estado en reportes_pqrsf (si no existe) ─────────
ALTER TABLE public.reportes_pqrsf
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Recibida';

-- ── 2. Tabla de perfiles de usuarios de la consola ─────────────
CREATE TABLE IF NOT EXISTS public.consola_perfiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre     TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  rol        TEXT    NOT NULL DEFAULT 'analista', -- analista | coordinador | admin
  activo     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.consola_perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfil_propio" ON public.consola_perfiles;
CREATE POLICY "perfil_propio"
  ON public.consola_perfiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_all_perfiles" ON public.consola_perfiles;
CREATE POLICY "admin_all_perfiles"
  ON public.consola_perfiles FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.consola_perfiles p
    WHERE p.id = auth.uid() AND p.rol = 'admin'
  ));

-- ── 3. RLS en reportes_pqrsf para la consola ───────────────────
DROP POLICY IF EXISTS "auth_select_reportes" ON public.reportes_pqrsf;
CREATE POLICY "auth_select_reportes"
  ON public.reportes_pqrsf FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_reportes" ON public.reportes_pqrsf;
CREATE POLICY "auth_update_reportes"
  ON public.reportes_pqrsf FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_delete_reportes" ON public.reportes_pqrsf;
CREATE POLICY "auth_delete_reportes"
  ON public.reportes_pqrsf FOR DELETE TO authenticated USING (true);

GRANT ALL ON public.reportes_pqrsf TO authenticated;

-- ── 4. RLS en respuestas_pqrsf para la consola ─────────────────
DROP POLICY IF EXISTS "auth_select_respuestas" ON public.respuestas_pqrsf;
CREATE POLICY "auth_select_respuestas"
  ON public.respuestas_pqrsf FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_respuestas" ON public.respuestas_pqrsf;
CREATE POLICY "auth_update_respuestas"
  ON public.respuestas_pqrsf FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_delete_respuestas" ON public.respuestas_pqrsf;
CREATE POLICY "auth_delete_respuestas"
  ON public.respuestas_pqrsf FOR DELETE TO authenticated USING (true);

GRANT ALL ON public.respuestas_pqrsf TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ── 5. Función trigger para crear perfil al registrar usuario ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.consola_perfiles (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'analista')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 6. Índices para rendimiento ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reportes_estado      ON public.reportes_pqrsf(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo        ON public.reportes_pqrsf(tipo_reporte);
CREATE INDEX IF NOT EXISTS idx_reportes_created     ON public.reportes_pqrsf(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha_man   ON public.reportes_pqrsf(fecha_manifestacion);
CREATE INDEX IF NOT EXISTS idx_reportes_sede        ON public.reportes_pqrsf(sede);
CREATE INDEX IF NOT EXISTS idx_reportes_proceso     ON public.reportes_pqrsf(proceso);
CREATE INDEX IF NOT EXISTS idx_reportes_convenio    ON public.reportes_pqrsf(convenio_eps);
