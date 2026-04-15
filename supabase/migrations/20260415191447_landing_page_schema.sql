-- ─── Landing Page: campos no tenant ──────────────────────────────────────────

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS hero_image_url      TEXT,
  ADD COLUMN IF NOT EXISTS slogan              TEXT,
  ADD COLUMN IF NOT EXISTS about_us            TEXT,
  ADD COLUMN IF NOT EXISTS pastor_name         TEXT,
  ADD COLUMN IF NOT EXISTS pastor_photo_url    TEXT,
  ADD COLUMN IF NOT EXISTS pastor_bio          TEXT,
  ADD COLUMN IF NOT EXISTS pastor_quote        TEXT,
  ADD COLUMN IF NOT EXISTS streaming_url       TEXT,
  ADD COLUMN IF NOT EXISTS address_text        TEXT,
  ADD COLUMN IF NOT EXISTS address_embed_url   TEXT,
  ADD COLUMN IF NOT EXISTS sections_order      JSONB
    DEFAULT '["hero","about","pastor","leadership","events","streaming","address","cta"]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_published        BOOLEAN NOT NULL DEFAULT FALSE;

-- Pastor pode atualizar dados da landing page do seu tenant
-- (a policy UPDATE existente já permite, mas reforçamos a semântica via nota)
-- A policy "tenants_update" existente (id = get_my_church_id()) já cobre isso.
-- Adicionamos policy SELECT pública para slugs publicados, usada no ISR.

CREATE POLICY "tenants_select_public_published"
  ON tenants FOR SELECT
  TO anon
  USING (is_published = TRUE);

-- ─── Storage: bucket landing-hero ────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-hero',
  'landing-hero',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública (landing page pública)
CREATE POLICY "landing_hero_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'landing-hero');

-- Upload restrito a pastor/admin do tenant (pasta = church_id)
CREATE POLICY "landing_hero_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'landing-hero'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'church_id')
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'pastor')
  );

CREATE POLICY "landing_hero_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'landing-hero'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'church_id')
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'pastor')
  );

CREATE POLICY "landing_hero_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'landing-hero'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'church_id')
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'pastor')
  );
