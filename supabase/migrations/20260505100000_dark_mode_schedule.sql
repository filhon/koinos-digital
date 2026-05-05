-- Sessão 5.5: Adiciona coluna dark_mode_schedule em members
-- Formato: { "enabled": true, "enableAt": "18:00", "disableAt": "06:00" }

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS dark_mode_schedule jsonb DEFAULT NULL;

COMMENT ON COLUMN members.dark_mode_schedule IS
  'Agendamento de dark mode: { enabled: boolean, enableAt: "HH:MM", disableAt: "HH:MM" }';
