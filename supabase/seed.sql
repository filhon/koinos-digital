CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
SET search_path TO public, extensions;

-- 1. Criar o Tenant (Igreja Teste)
INSERT INTO public.tenants (id, name, slug, shared_finances, plan)
VALUES ('11111111-1111-1111-1111-111111111111', 'Igreja Teste', 'teste', true, 'gratis')
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir usuários no Supabase Auth (senha: Senha123) e suas identidades
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_super_admin)
VALUES
('11111111-0000-0000-0000-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@saas.com', crypt('Senha123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"admin"}', '{}', now(), now(), false),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pastor@teste.com', crypt('Senha123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"church_id":"11111111-1111-1111-1111-111111111111","role":"pastor"}', now(), now(), false),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'presbitero@teste.com', crypt('Senha123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"church_id":"11111111-1111-1111-1111-111111111111","role":"presbítero"}', now(), now(), false),
('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'diacono@teste.com', crypt('Senha123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"church_id":"11111111-1111-1111-1111-111111111111","role":"diácono"}', now(), now(), false),
('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tesoureiro@teste.com', crypt('Senha123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"church_id":"11111111-1111-1111-1111-111111111111","role":"tesoureiro"}', now(), now(), false),
('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lider@teste.com', crypt('Senha123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"church_id":"11111111-1111-1111-1111-111111111111","role":"líder"}', now(), now(), false),
('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'membro@teste.com', crypt('Senha123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"church_id":"11111111-1111-1111-1111-111111111111","role":"membro"}', now(), now(), false),
('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'visitante1@teste.com', crypt('Senha123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"church_id":"11111111-1111-1111-1111-111111111111","role":"visitante"}', now(), now(), false),
('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'visitante2@teste.com', crypt('Senha123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"church_id":"11111111-1111-1111-1111-111111111111","role":"visitante"}', now(), now(), false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
(gen_random_uuid(), '11111111-0000-0000-0000-111111111111', '11111111-0000-0000-0000-111111111111', '{"sub":"11111111-0000-0000-0000-111111111111","email":"admin@saas.com"}', 'email', now(), now(), now()),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '{"sub":"22222222-2222-2222-2222-222222222222","email":"pastor@teste.com"}', 'email', now(), now(), now()),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '{"sub":"33333333-3333-3333-3333-333333333333","email":"presbitero@teste.com"}', 'email', now(), now(), now()),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '{"sub":"44444444-4444-4444-4444-444444444444","email":"diacono@teste.com"}', 'email', now(), now(), now()),
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '{"sub":"55555555-5555-5555-5555-555555555555","email":"tesoureiro@teste.com"}', 'email', now(), now(), now()),
(gen_random_uuid(), '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', '{"sub":"66666666-6666-6666-6666-666666666666","email":"lider@teste.com"}', 'email', now(), now(), now()),
(gen_random_uuid(), '77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', '{"sub":"77777777-7777-7777-7777-777777777777","email":"membro@teste.com"}', 'email', now(), now(), now()),
(gen_random_uuid(), '88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', '{"sub":"88888888-8888-8888-8888-888888888888","email":"visitante1@teste.com"}', 'email', now(), now(), now()),
(gen_random_uuid(), '99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', '{"sub":"99999999-9999-9999-9999-999999999999","email":"visitante2@teste.com"}', 'email', now(), now(), now());

-- 3. Inserir Membros (Mock para o CPF com string "criptografada" mockada válida para AES [32:32:32])
INSERT INTO public.members (id, church_id, name, cpf, email, birth_date, role, is_active, phone)
VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Pastor Fundador', '00000000000000000000000000000000:00000000000000000000000000000000:00000000000000000000000000000000', 'pastor@teste.com', '1980-01-01', 'pastor', true, '(11) 99999-0001'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Presbítero João', '00000000000000000000000000000000:00000000000000000000000000000000:11111111111111111111111111111111', 'presbitero@teste.com', '1982-02-02', 'presbítero', true, '(11) 99999-0002'),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Diácono Pedro', '00000000000000000000000000000000:00000000000000000000000000000000:22222222222222222222222222222222', 'diacono@teste.com', '1985-03-03', 'diácono', true, '(11) 99999-0003'),
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Tesoureira Maria', '00000000000000000000000000000000:00000000000000000000000000000000:33333333333333333333333333333333', 'tesoureiro@teste.com', '1990-04-04', 'tesoureiro', true, '(11) 99999-0004'),
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Líder Lucas', '00000000000000000000000000000000:00000000000000000000000000000000:44444444444444444444444444444444', 'lider@teste.com', '1995-05-05', 'líder', true, '(11) 99999-0005'),
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'Membro Ana', '00000000000000000000000000000000:00000000000000000000000000000000:55555555555555555555555555555555', 'membro@teste.com', '1998-06-06', 'membro', true, '(11) 99999-0006'),
('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'Visitante Carlos', '00000000000000000000000000000000:00000000000000000000000000000000:66666666666666666666666666666666', 'visitante1@teste.com', '2000-07-07', 'visitante', true, '(11) 99999-0007'),
('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'Visitante Beatriz', '00000000000000000000000000000000:00000000000000000000000000000000:77777777777777777777777777777777', 'visitante2@teste.com', '2002-08-08', 'visitante', true, '(11) 99999-0008')
ON CONFLICT (id) DO NOTHING;

-- 4. Vínculos Familiares (A trigger criada fará a contraparte bidirecional automaticamente)
INSERT INTO public.family_links (id, church_id, member_id, related_member_id, relationship)
VALUES
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'cônjuge'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'pai'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'pai');

-- 5. Links de Convite (1 Geral e 1 Pessoal)
INSERT INTO public.invite_links (id, church_id, member_id, code, active)
VALUES
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', NULL, 'IGREJATESTE2026', true),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'PASTORINVITE', true);

-- 6. Registros de Consentimento (Para todos os membros no seed)
INSERT INTO public.consent_records (id, member_id, purpose, consented, ip, terms_version)
SELECT gen_random_uuid(), id, 'termos_gerais', true, '127.0.0.1', '1.0.0'
FROM public.members
WHERE church_id = '11111111-1111-1111-1111-111111111111';

-- 7. Cores das tribos — o trigger já criou as 12 tribos ao inserir o tenant;
-- aqui apenas garantimos as cores corretas por nome.
UPDATE public.teams SET color = '#DC2626' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Rúben';
UPDATE public.teams SET color = '#EA580C' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Simeão';
UPDATE public.teams SET color = '#CA8A04' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Levi';
UPDATE public.teams SET color = '#16A34A' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Judá';
UPDATE public.teams SET color = '#0891B2' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Dã';
UPDATE public.teams SET color = '#2563EB' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Naftali';
UPDATE public.teams SET color = '#7C3AED' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Gade';
UPDATE public.teams SET color = '#DB2777' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Aser';
UPDATE public.teams SET color = '#0D9488' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Issacar';
UPDATE public.teams SET color = '#4F46E5' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Zebulom';
UPDATE public.teams SET color = '#D97706' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'José';
UPDATE public.teams SET color = '#65A30D' WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Benjamim';

-- 8. Atribuição de membros às tribos — lookup por nome (IDs gerados pelo trigger)
-- O trigger members_assign_team já atribui automaticamente ao inserir membros,
-- mas pode ter ido para tribos diferentes; garantimos a distribuição desejada.
INSERT INTO public.member_teams (church_id, member_id, team_id)
SELECT '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', id
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Judá'
ON CONFLICT (member_id) DO UPDATE SET team_id = EXCLUDED.team_id;

INSERT INTO public.member_teams (church_id, member_id, team_id)
SELECT '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', id
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Naftali'
ON CONFLICT (member_id) DO UPDATE SET team_id = EXCLUDED.team_id;

INSERT INTO public.member_teams (church_id, member_id, team_id)
SELECT '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', id
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Judá'
ON CONFLICT (member_id) DO UPDATE SET team_id = EXCLUDED.team_id;

INSERT INTO public.member_teams (church_id, member_id, team_id)
SELECT '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', id
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Gade'
ON CONFLICT (member_id) DO UPDATE SET team_id = EXCLUDED.team_id;

INSERT INTO public.member_teams (church_id, member_id, team_id)
SELECT '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', id
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Rúben'
ON CONFLICT (member_id) DO UPDATE SET team_id = EXCLUDED.team_id;

INSERT INTO public.member_teams (church_id, member_id, team_id)
SELECT '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', id
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Issacar'
ON CONFLICT (member_id) DO UPDATE SET team_id = EXCLUDED.team_id;

INSERT INTO public.member_teams (church_id, member_id, team_id)
SELECT '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', id
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'José'
ON CONFLICT (member_id) DO UPDATE SET team_id = EXCLUDED.team_id;

INSERT INTO public.member_teams (church_id, member_id, team_id)
SELECT '11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', id
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Levi'
ON CONFLICT (member_id) DO UPDATE SET team_id = EXCLUDED.team_id;

-- 9. Pontos de demonstração — lookup de team_id por nome da tribo
-- Judá (Pastor + Diácono)
INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', id, 10, 'checkin'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Judá';

INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', id, 10, 'checkin'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Judá';

INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', id, 50, 'invite'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Judá';

INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', id, 10, 'checkin'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Judá';

-- Naftali (Presbítero)
INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', id, 10, 'checkin'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Naftali';

INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', id, 10, 'checkin'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Naftali';

INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', id, 10, 'checkin'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Naftali';

-- Gade (Tesoureira)
INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', id, 50, 'invite'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Gade';

INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', id, 10, 'checkin'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Gade';

-- Issacar (Membro)
INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', id, 5, 'daily_reading'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Issacar';

INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', id, 5, 'daily_reading'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Issacar';

-- Rúben (Líder)
INSERT INTO public.score_events (church_id, member_id, team_id, points, action_type)
SELECT '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', id, 10, 'checkin'
FROM public.teams WHERE church_id = '11111111-1111-1111-1111-111111111111' AND name = 'Rúben';

-- 10. Leituras diárias — primeiros 90 dias (Gn 1–50, Êx 1–40), início 2026-04-10
-- Seed incremental: NÃO inclui os 1.189 capítulos inteiros.
INSERT INTO public.daily_readings (date, book, chapter) VALUES
-- Gênesis (50 capítulos: 2026-04-10 a 2026-05-29)
('2026-04-10', 'Gênesis',  1),
('2026-04-11', 'Gênesis',  2),
('2026-04-12', 'Gênesis',  3),
('2026-04-13', 'Gênesis',  4),
('2026-04-14', 'Gênesis',  5),
('2026-04-15', 'Gênesis',  6),
('2026-04-16', 'Gênesis',  7),
('2026-04-17', 'Gênesis',  8),
('2026-04-18', 'Gênesis',  9),
('2026-04-19', 'Gênesis', 10),
('2026-04-20', 'Gênesis', 11),
('2026-04-21', 'Gênesis', 12),
('2026-04-22', 'Gênesis', 13),
('2026-04-23', 'Gênesis', 14),
('2026-04-24', 'Gênesis', 15),
('2026-04-25', 'Gênesis', 16),
('2026-04-26', 'Gênesis', 17),
('2026-04-27', 'Gênesis', 18),
('2026-04-28', 'Gênesis', 19),
('2026-04-29', 'Gênesis', 20),
('2026-04-30', 'Gênesis', 21),
('2026-05-01', 'Gênesis', 22),
('2026-05-02', 'Gênesis', 23),
('2026-05-03', 'Gênesis', 24),
('2026-05-04', 'Gênesis', 25),
('2026-05-05', 'Gênesis', 26),
('2026-05-06', 'Gênesis', 27),
('2026-05-07', 'Gênesis', 28),
('2026-05-08', 'Gênesis', 29),
('2026-05-09', 'Gênesis', 30),
('2026-05-10', 'Gênesis', 31),
('2026-05-11', 'Gênesis', 32),
('2026-05-12', 'Gênesis', 33),
('2026-05-13', 'Gênesis', 34),
('2026-05-14', 'Gênesis', 35),
('2026-05-15', 'Gênesis', 36),
('2026-05-16', 'Gênesis', 37),
('2026-05-17', 'Gênesis', 38),
('2026-05-18', 'Gênesis', 39),
('2026-05-19', 'Gênesis', 40),
('2026-05-20', 'Gênesis', 41),
('2026-05-21', 'Gênesis', 42),
('2026-05-22', 'Gênesis', 43),
('2026-05-23', 'Gênesis', 44),
('2026-05-24', 'Gênesis', 45),
('2026-05-25', 'Gênesis', 46),
('2026-05-26', 'Gênesis', 47),
('2026-05-27', 'Gênesis', 48),
('2026-05-28', 'Gênesis', 49),
('2026-05-29', 'Gênesis', 50),
-- Êxodo (40 capítulos: 2026-05-30 a 2026-07-08)
('2026-05-30', 'Êxodo',  1),
('2026-05-31', 'Êxodo',  2),
('2026-06-01', 'Êxodo',  3),
('2026-06-02', 'Êxodo',  4),
('2026-06-03', 'Êxodo',  5),
('2026-06-04', 'Êxodo',  6),
('2026-06-05', 'Êxodo',  7),
('2026-06-06', 'Êxodo',  8),
('2026-06-07', 'Êxodo',  9),
('2026-06-08', 'Êxodo', 10),
('2026-06-09', 'Êxodo', 11),
('2026-06-10', 'Êxodo', 12),
('2026-06-11', 'Êxodo', 13),
('2026-06-12', 'Êxodo', 14),
('2026-06-13', 'Êxodo', 15),
('2026-06-14', 'Êxodo', 16),
('2026-06-15', 'Êxodo', 17),
('2026-06-16', 'Êxodo', 18),
('2026-06-17', 'Êxodo', 19),
('2026-06-18', 'Êxodo', 20),
('2026-06-19', 'Êxodo', 21),
('2026-06-20', 'Êxodo', 22),
('2026-06-21', 'Êxodo', 23),
('2026-06-22', 'Êxodo', 24),
('2026-06-23', 'Êxodo', 25),
('2026-06-24', 'Êxodo', 26),
('2026-06-25', 'Êxodo', 27),
('2026-06-26', 'Êxodo', 28),
('2026-06-27', 'Êxodo', 29),
('2026-06-28', 'Êxodo', 30),
('2026-06-29', 'Êxodo', 31),
('2026-06-30', 'Êxodo', 32),
('2026-07-01', 'Êxodo', 33),
('2026-07-02', 'Êxodo', 34),
('2026-07-03', 'Êxodo', 35),
('2026-07-04', 'Êxodo', 36),
('2026-07-05', 'Êxodo', 37),
('2026-07-06', 'Êxodo', 38),
('2026-07-07', 'Êxodo', 39),
('2026-07-08', 'Êxodo', 40)
ON CONFLICT (date) DO NOTHING;

-- ============================================================================
-- Dados E2E — Sessão 5.4
-- Dependem dos tenants/membros inseridos acima; por isso ficam no seed (não migration).
-- ============================================================================

-- ─── Upgrade Tenant A para "catedral" (acessa todos os módulos nos testes) ───
UPDATE public.tenants
SET plan = 'catedral'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- ─── Tenant B (Igreja Beta E2E) — cross-tenant RLS ───────────────────────────
INSERT INTO public.tenants (id, name, slug, shared_finances, plan)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Igreja Beta E2E', 'beta-e2e', false, 'crescimento')
ON CONFLICT (id) DO NOTHING;

-- Auth user do pastor do Tenant B (senha: Senha123)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_super_admin
)
VALUES (
  'bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'pastor@beta.com',
  crypt('Senha123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"church_id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"pastor"}',
  now(), now(), false
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb',
  'bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb',
  '{"sub":"bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb","email":"pastor@beta.com"}',
  'email', now(), now(), now()
)
ON CONFLICT DO NOTHING;

-- Membro no Tenant B (CPF mock — substituído pelo setup-e2e.ts se necessário)
INSERT INTO public.members (id, church_id, name, cpf, email, birth_date, role, is_active, phone)
VALUES (
  'bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Pastor Beta',
  '00000000000000000000000000000000:00000000000000000000000000000000:00000000000000000000000000000000',
  'pastor@beta.com',
  '1985-01-01',
  'pastor',
  true,
  '(11) 99999-9999'
)
ON CONFLICT (id) DO NOTHING;

-- 12 Tribos para Tenant B (copia as tribos do Tenant A)
INSERT INTO public.teams (church_id, name, tribe_name, color)
SELECT 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name, tribe_name, color
FROM public.teams
WHERE church_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (church_id, name) DO NOTHING;

-- Atribui pastor B à primeira tribo do Tenant B
INSERT INTO public.member_teams (church_id, member_id, team_id)
SELECT 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
       'bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb',
       id
FROM public.teams
WHERE church_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
ORDER BY name
LIMIT 1
ON CONFLICT (member_id) DO NOTHING;

-- Recurso no Tenant B (para isolar do Tenant A nos testes de RLS)
INSERT INTO public.resources (id, church_id, name, responsible_id, status, value)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Datashow Beta',
  'bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb',
  'disponível',
  1500.00
)
ON CONFLICT (id) DO NOTHING;

-- ─── Evento E2E (Tenant A) — UUID fixo para testes de check-in ───────────────
INSERT INTO public.events (
  id, church_id, name, responsible_id, date, start_time, end_time,
  modality, location, is_recurring
)
VALUES (
  'eeeeeeee-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Culto E2E Test',
  '22222222-2222-2222-2222-222222222222',
  CURRENT_DATE + INTERVAL '7 days',
  '19:00',
  '21:00',
  'presencial',
  'Templo Principal',
  false
)
ON CONFLICT (id) DO NOTHING;

-- ─── Assembléia E2E (Tenant A) ────────────────────────────────────────────────
INSERT INTO public.assemblies (
  id, church_id, name, date, start_time, location, reason, has_election
)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Assembléia E2E Test',
  CURRENT_DATE + INTERVAL '14 days',
  '18:00',
  'Salão da Igreja',
  'Aprovação de orçamento anual',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Eleição em estado "aberta" para testes de votação e anonimidade
INSERT INTO public.elections (
  id, assembly_id, church_id, name, description,
  quorum, allow_remote_vote, status,
  active_members_at_open, opened_at
)
VALUES (
  'ffffffff-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Eleição E2E — Sim/Não',
  'Aprovação do orçamento de 2027',
  50,
  true,
  'aberta',
  8,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Salt da eleição (necessário para voter_hash funcionar)
INSERT INTO public.election_salts (election_id, salt)
VALUES (
  'ffffffff-0000-0000-0000-000000000001',
  'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
)
ON CONFLICT (election_id) DO NOTHING;

-- ─── Convite com CPF para teste de matching ───────────────────────────────────
-- Vinculado ao membro Ana (77777777); CPF real inserido pelo setup-e2e.ts
INSERT INTO public.invite_links (id, church_id, member_id, code, active)
VALUES (
  'cccccccc-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '77777777-7777-7777-7777-777777777777',
  'CPFMATCH2026',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ─── Conta bancária E2E (Tenant A) ───────────────────────────────────────────
-- account_number mock; substituído pelo setup-e2e.ts com criptografia real
INSERT INTO public.accounts (
  id, church_id, name, description, bank, agency,
  account_number, initial_balance, current_balance
)
VALUES (
  'dddddddd-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Conta E2E Test',
  'Conta para testes automatizados',
  'Banco do Brasil',
  '0001',
  '00000000000000000000000000000000:00000000000000000000000000000000:00000000000000000000000000000000',
  1000.00,
  1000.00
)
ON CONFLICT (id) DO NOTHING;

-- Transação de demonstração (para testar imutabilidade — sem botão editar/excluir)
INSERT INTO public.transactions (
  id, church_id, account_id, type, date, description, category, value
)
VALUES (
  'dddddddd-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'dddddddd-0000-0000-0000-000000000001',
  'entrada',
  CURRENT_DATE,
  'Dízimo E2E — imutabilidade',
  'dízimo',
  200.00
)
ON CONFLICT (id) DO NOTHING;
