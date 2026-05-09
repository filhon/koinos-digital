-- Sessão 6.3: Username único + visibilidade do perfil público
SET search_path = public;

-- Adiciona colunas ao members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS username           text    UNIQUE,
  ADD COLUMN IF NOT EXISTS public_email       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_phone       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_birth_date  boolean NOT NULL DEFAULT false;

-- Constraint de formato: letras minúsculas, números, ponto e underscore, 3–30 chars
ALTER TABLE public.members
  ADD CONSTRAINT members_username_format
    CHECK (username IS NULL OR username ~ '^[a-z0-9._]{3,30}$');

-- Índice único case-insensitive (garante unicidade independente de maiúsculas)
CREATE UNIQUE INDEX IF NOT EXISTS members_username_lower_idx
  ON public.members (LOWER(username))
  WHERE username IS NOT NULL;

-- Índice para busca rápida por username
CREATE INDEX IF NOT EXISTS members_username_idx
  ON public.members (username)
  WHERE username IS NOT NULL;
