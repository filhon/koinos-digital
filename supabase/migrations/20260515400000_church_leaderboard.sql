-- ─── Sessão 9.2: Liga Geral — RPC cross-tenant de ranking entre igrejas ────────
-- SECURITY DEFINER necessário para acessar score_events de múltiplos tenants.
-- Retorna apenas dados agregados (sem informações de membros individuais).

CREATE OR REPLACE FUNCTION public.get_church_leaderboard(
  p_period text  -- 'month' | 'year'
)
RETURNS TABLE (
  church_id         uuid,
  church_name       text,
  total_points      bigint,
  active_members    bigint,
  normalized_score  double precision,
  rank              bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH church_stats AS (
    SELECT
      se.church_id,
      SUM(se.points)::bigint                AS total_points,
      COUNT(DISTINCT se.member_id)::bigint  AS active_members
    FROM public.score_events se
    WHERE
      CASE
        WHEN p_period = 'month'
          THEN date_trunc('month', se.created_at) = date_trunc('month', now())
        ELSE
          date_trunc('year', se.created_at) = date_trunc('year', now())
      END
    GROUP BY se.church_id
    HAVING SUM(se.points) > 0
  ),
  normalized AS (
    SELECT
      cs.church_id,
      t.name                                                                AS church_name,
      cs.total_points,
      cs.active_members,
      -- Normalização logarítmica: evita distorção por tamanho da congregação
      -- Igrejas menores altamente engajadas competem com igrejas maiores
      (cs.total_points::double precision / cs.active_members::double precision)
        * LN(cs.active_members::double precision + 1.0)                    AS normalized_score
    FROM church_stats cs
    JOIN public.tenants t ON t.id = cs.church_id
    WHERE t.is_active IS DISTINCT FROM false  -- exclui tenants desativados
  )
  SELECT
    n.church_id,
    n.church_name,
    n.total_points,
    n.active_members,
    ROUND(n.normalized_score::numeric, 2)::double precision                AS normalized_score,
    ROW_NUMBER() OVER (ORDER BY n.normalized_score DESC)::bigint           AS rank
  FROM normalized n
  ORDER BY n.normalized_score DESC;
END;
$$;

-- Permissão: membros autenticados podem chamar (dados são apenas agregados)
GRANT EXECUTE ON FUNCTION public.get_church_leaderboard(text) TO authenticated;
