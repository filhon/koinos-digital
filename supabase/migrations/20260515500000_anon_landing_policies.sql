-- Policies anon para dados públicos da landing page
-- Permite que visitantes não-autenticados vejam liderança e eventos públicos

-- Eventos públicos: anon pode ver eventos ativos de tenants publicados
CREATE POLICY "events_select_anon_public"
  ON events FOR SELECT
  TO anon
  USING (
    is_active = true
    AND church_id IN (SELECT id FROM tenants WHERE is_published = true)
  );

-- Liderança pública: anon pode ver nome, role e avatar de líderes ativos
CREATE POLICY "members_select_anon_leadership"
  ON members FOR SELECT
  TO anon
  USING (
    is_active = true
    AND role IN ('pastor', 'presbítero', 'diácono')
    AND church_id IN (SELECT id FROM tenants WHERE is_published = true)
  );
