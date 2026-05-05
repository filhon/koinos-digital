-- =============================================================================
-- SEED PILOT — Dados de demonstração para soft launch
-- 2 igrejas de exemplo completas: Primeira Igreja Batista de Demo + Igreja Nova Vida Demo
-- NÃO usar com igrejas reais. Dados totalmente fictícios.
-- =============================================================================

-- Extensão para gerar UUIDs determinísticos
-- uuid_generate_v5(namespace, name) — namespace '6ba7b810-...' = URL namespace

-- =============================================================================
-- IGLESIA 1: Primeira Igreja Batista de Demo
-- =============================================================================

INSERT INTO tenants (id, name, cnpj, slug, plan, is_published, slogan, about_us, pastor_name, pastor_bio, is_active, created_at)
VALUES (
  '11111111-0000-7000-8000-000000000001',
  'Primeira Igreja Batista de Demo',
  '00.000.000/0001-01',
  'pib-demo',
  'catedral',
  true,
  'Edificando vidas, transformando comunidades',
  'Somos uma comunidade evangélica comprometida com o crescimento espiritual, a família e o serviço ao próximo. Fundada em 2005, nossa igreja reúne mais de 300 famílias em uma atmosfera de acolhimento e adoração.',
  'Rev. João Evangelista',
  'Formado em Teologia pelo Seminário Batista do Sul, com mais de 20 anos de ministério pastoral. Apaixonado pela Palavra e pela comunidade.',
  true,
  now() - interval '2 years'
) ON CONFLICT (id) DO NOTHING;

-- Membros da PIB Demo
INSERT INTO members (id, church_id, name, email, role, phone, is_active, created_at)
VALUES
  ('11111111-0000-7000-8000-100000000001', '11111111-0000-7000-8000-000000000001', 'Rev. João Evangelista', 'pastor@pib-demo.koinos.app', 'pastor', '(11) 99000-0001', true, now() - interval '2 years'),
  ('11111111-0000-7000-8000-100000000002', '11111111-0000-7000-8000-000000000001', 'Maria Santos Evangelista', 'maria.santos@pib-demo.koinos.app', 'presbítero', '(11) 99000-0002', true, now() - interval '2 years'),
  ('11111111-0000-7000-8000-100000000003', '11111111-0000-7000-8000-000000000001', 'Carlos Oliveira', 'carlos.oliveira@pib-demo.koinos.app', 'diácono', '(11) 99000-0003', true, now() - interval '18 months'),
  ('11111111-0000-7000-8000-100000000004', '11111111-0000-7000-8000-000000000001', 'Ana Lima', 'ana.lima@pib-demo.koinos.app', 'tesoureiro', '(11) 99000-0004', true, now() - interval '18 months'),
  ('11111111-0000-7000-8000-100000000005', '11111111-0000-7000-8000-000000000001', 'Pedro Costa', 'pedro.costa@pib-demo.koinos.app', 'líder', '(11) 99000-0005', true, now() - interval '14 months'),
  ('11111111-0000-7000-8000-100000000006', '11111111-0000-7000-8000-000000000001', 'Juliana Ferreira', 'juliana.ferreira@pib-demo.koinos.app', 'membro', '(11) 99000-0006', true, now() - interval '12 months'),
  ('11111111-0000-7000-8000-100000000007', '11111111-0000-7000-8000-000000000001', 'Lucas Rodrigues', 'lucas.rodrigues@pib-demo.koinos.app', 'membro', '(11) 99000-0007', true, now() - interval '10 months'),
  ('11111111-0000-7000-8000-100000000008', '11111111-0000-7000-8000-000000000001', 'Beatriz Almeida', 'beatriz.almeida@pib-demo.koinos.app', 'membro', '(11) 99000-0008', true, now() - interval '8 months'),
  ('11111111-0000-7000-8000-100000000009', '11111111-0000-7000-8000-000000000001', 'Rafael Nunes', 'rafael.nunes@pib-demo.koinos.app', 'visitante', '(11) 99000-0009', true, now() - interval '1 month')
ON CONFLICT (id) DO NOTHING;

-- Conta financeira PIB Demo
INSERT INTO accounts (id, church_id, name, description, bank, initial_balance, current_balance, is_active, created_at)
VALUES (
  '11111111-0000-7000-8000-200000000001',
  '11111111-0000-7000-8000-000000000001',
  'Conta Corrente Principal',
  'Conta principal para movimentações da igreja',
  'Banco do Brasil',
  15000.00,
  23450.00,
  true,
  now() - interval '2 years'
) ON CONFLICT (id) DO NOTHING;

-- Transações PIB Demo
INSERT INTO transactions (id, church_id, account_id, type, date, description, category, value, is_active, created_at)
VALUES
  ('11111111-0000-7000-8000-300000000001', '11111111-0000-7000-8000-000000000001', '11111111-0000-7000-8000-200000000001', 'receita', current_date - 30, 'Dízimos de outubro', 'dizimos', 8500.00, true, now() - interval '30 days'),
  ('11111111-0000-7000-8000-300000000002', '11111111-0000-7000-8000-000000000001', '11111111-0000-7000-8000-200000000001', 'receita', current_date - 30, 'Ofertas culto dominical', 'ofertas', 2200.00, true, now() - interval '30 days'),
  ('11111111-0000-7000-8000-300000000003', '11111111-0000-7000-8000-000000000001', '11111111-0000-7000-8000-200000000001', 'despesa', current_date - 28, 'Conta de energia elétrica', 'utilidades', 780.00, true, now() - interval '28 days'),
  ('11111111-0000-7000-8000-300000000004', '11111111-0000-7000-8000-000000000001', '11111111-0000-7000-8000-200000000001', 'despesa', current_date - 25, 'Salário coordenador de ministérios', 'salarios', 3200.00, true, now() - interval '25 days'),
  ('11111111-0000-7000-8000-300000000005', '11111111-0000-7000-8000-000000000001', '11111111-0000-7000-8000-200000000001', 'receita', current_date - 20, 'Aluguel do salão para evento', 'outros', 1500.00, true, now() - interval '20 days'),
  ('11111111-0000-7000-8000-300000000006', '11111111-0000-7000-8000-000000000001', '11111111-0000-7000-8000-200000000001', 'despesa', current_date - 15, 'Material gráfico e comunicação', 'comunicacao', 450.00, true, now() - interval '15 days'),
  ('11111111-0000-7000-8000-300000000007', '11111111-0000-7000-8000-000000000001', '11111111-0000-7000-8000-200000000001', 'receita', current_date - 7, 'Dízimos e ofertas culto de mid-semana', 'dizimos', 3100.00, true, now() - interval '7 days'),
  ('11111111-0000-7000-8000-300000000008', '11111111-0000-7000-8000-000000000001', '11111111-0000-7000-8000-200000000001', 'despesa', current_date - 3, 'Manutenção do sistema de som', 'manutencao', 1200.00, true, now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- Eventos PIB Demo
INSERT INTO events (id, church_id, name, date, start_time, end_time, modality, location, description, is_recurring, is_active, created_at)
VALUES
  ('11111111-0000-7000-8000-400000000001', '11111111-0000-7000-8000-000000000001', 'Culto Dominical', current_date + 3, '09:00', '11:00', 'presencial', 'Templo principal', 'Culto de adoração dominical com louvor e pregação da Palavra.', true, true, now()),
  ('11111111-0000-7000-8000-400000000002', '11111111-0000-7000-8000-000000000001', 'Culto de Mid-semana', current_date + 5, '19:30', '21:00', 'presencial', 'Templo principal', 'Culto de estudo bíblico e oração.', true, true, now()),
  ('11111111-0000-7000-8000-400000000003', '11111111-0000-7000-8000-000000000001', 'Retiro de Jovens 2026', current_date + 21, '08:00', '18:00', 'presencial', 'Sítio Recanto da Paz — Ibiúna/SP', 'Retiro anual da juventude com pregações, atividades e momentos de oração em grupo.', false, true, now()),
  ('11111111-0000-7000-8000-400000000004', '11111111-0000-7000-8000-000000000001', 'Reunião de Liderança', current_date + 10, '19:00', '21:00', 'hibrido', 'Sala de reuniões + Zoom', 'Reunião mensal de pastores, presbíteros e líderes de ministério.', false, true, now())
ON CONFLICT (id) DO NOTHING;

-- Posts no mural PIB Demo
INSERT INTO posts (id, church_id, author_id, content, is_active, created_at)
VALUES
  ('11111111-0000-7000-8000-500000000001', '11111111-0000-7000-8000-000000000001', '11111111-0000-7000-8000-100000000001',
   'Deus tem nos abençoado imensamente este mês! Os dízimos e ofertas superaram nossa meta e pudemos ajudar 3 famílias em situação de vulnerabilidade. Toda honra e glória a Ele!', true, now() - interval '2 days'),
  ('11111111-0000-7000-8000-500000000002', '11111111-0000-7000-8000-000000000001', '11111111-0000-7000-8000-100000000002',
   'Lembrando a todos que o retiro de jovens está confirmado! As inscrições se encerram na próxima sexta-feira. Não perca essa oportunidade de edificação e comunhão.', true, now() - interval '1 day'),
  ('11111111-0000-7000-8000-500000000003', '11111111-0000-7000-8000-000000000001', '11111111-0000-7000-8000-100000000005',
   'O grupo de louvor está ensaiando músicas novas para o próximo culto. Vai ser especial! Convide seus amigos e família.', true, now() - interval '12 hours')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- IGLESIA 2: Igreja Nova Vida Demo
-- =============================================================================

INSERT INTO tenants (id, name, cnpj, slug, plan, is_published, slogan, about_us, pastor_name, pastor_bio, is_active, created_at)
VALUES (
  '22222222-0000-7000-8000-000000000001',
  'Igreja Nova Vida Demo',
  '00.000.000/0002-02',
  'nova-vida-demo',
  'igreja',
  true,
  'Renovados pela graça, transformados pelo amor',
  'A Igreja Nova Vida é uma congregação pentecostal com foco em louvor, cura e evangelismo. Fundada em 2010, crescemos de 12 para mais de 180 membros ativos.',
  'Pr. Samuel Proença',
  'Pastor com formação no Centro de Treinamento de Líderes da CGADB. 15 anos de experiência em plantação de igrejas e avivamento.',
  true,
  now() - interval '3 years'
) ON CONFLICT (id) DO NOTHING;

-- Membros Igreja Nova Vida Demo
INSERT INTO members (id, church_id, name, email, role, phone, is_active, created_at)
VALUES
  ('22222222-0000-7000-8000-100000000001', '22222222-0000-7000-8000-000000000001', 'Pr. Samuel Proença', 'pastor@nova-vida-demo.koinos.app', 'pastor', '(21) 98000-0001', true, now() - interval '3 years'),
  ('22222222-0000-7000-8000-100000000002', '22222222-0000-7000-8000-000000000001', 'Débora Proença', 'debora.proenca@nova-vida-demo.koinos.app', 'presbítero', '(21) 98000-0002', true, now() - interval '3 years'),
  ('22222222-0000-7000-8000-100000000003', '22222222-0000-7000-8000-000000000001', 'Tiago Melo', 'tiago.melo@nova-vida-demo.koinos.app', 'diácono', '(21) 98000-0003', true, now() - interval '2 years'),
  ('22222222-0000-7000-8000-100000000004', '22222222-0000-7000-8000-000000000001', 'Fernanda Carvalho', 'fernanda.carvalho@nova-vida-demo.koinos.app', 'tesoureiro', '(21) 98000-0004', true, now() - interval '2 years'),
  ('22222222-0000-7000-8000-100000000005', '22222222-0000-7000-8000-000000000001', 'Bruno Santana', 'bruno.santana@nova-vida-demo.koinos.app', 'líder', '(21) 98000-0005', true, now() - interval '20 months'),
  ('22222222-0000-7000-8000-100000000006', '22222222-0000-7000-8000-000000000001', 'Camila Pinto', 'camila.pinto@nova-vida-demo.koinos.app', 'membro', '(21) 98000-0006', true, now() - interval '18 months'),
  ('22222222-0000-7000-8000-100000000007', '22222222-0000-7000-8000-000000000001', 'Diego Faria', 'diego.faria@nova-vida-demo.koinos.app', 'membro', '(21) 98000-0007', true, now() - interval '14 months')
ON CONFLICT (id) DO NOTHING;

-- Conta financeira Igreja Nova Vida Demo
INSERT INTO accounts (id, church_id, name, description, bank, initial_balance, current_balance, is_active, created_at)
VALUES (
  '22222222-0000-7000-8000-200000000001',
  '22222222-0000-7000-8000-000000000001',
  'Conta Corrente Ministério',
  'Conta principal da congregação',
  'Caixa Econômica Federal',
  8000.00,
  11200.00,
  true,
  now() - interval '3 years'
) ON CONFLICT (id) DO NOTHING;

-- Transações Igreja Nova Vida Demo
INSERT INTO transactions (id, church_id, account_id, type, date, description, category, value, is_active, created_at)
VALUES
  ('22222222-0000-7000-8000-300000000001', '22222222-0000-7000-8000-000000000001', '22222222-0000-7000-8000-200000000001', 'receita', current_date - 30, 'Dízimos de outubro', 'dizimos', 5200.00, true, now() - interval '30 days'),
  ('22222222-0000-7000-8000-300000000002', '22222222-0000-7000-8000-000000000001', '22222222-0000-7000-8000-200000000001', 'receita', current_date - 30, 'Ofertas especiais', 'ofertas', 1800.00, true, now() - interval '30 days'),
  ('22222222-0000-7000-8000-300000000003', '22222222-0000-7000-8000-000000000001', '22222222-0000-7000-8000-200000000001', 'despesa', current_date - 25, 'Aluguel do espaço', 'aluguel', 2800.00, true, now() - interval '25 days'),
  ('22222222-0000-7000-8000-300000000004', '22222222-0000-7000-8000-000000000001', '22222222-0000-7000-8000-200000000001', 'despesa', current_date - 20, 'Materiais de louvor (cabos, microfone)', 'equipamentos', 620.00, true, now() - interval '20 days'),
  ('22222222-0000-7000-8000-300000000005', '22222222-0000-7000-8000-000000000001', '22222222-0000-7000-8000-200000000001', 'receita', current_date - 7, 'Oferta de ação de graças', 'ofertas', 2300.00, true, now() - interval '7 days'),
  ('22222222-0000-7000-8000-300000000006', '22222222-0000-7000-8000-000000000001', '22222222-0000-7000-8000-200000000001', 'despesa', current_date - 3, 'Confraternização de fim de ano — adiantamento', 'eventos', 480.00, true, now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- Eventos Igreja Nova Vida Demo
INSERT INTO events (id, church_id, name, date, start_time, end_time, modality, location, description, is_recurring, is_active, created_at)
VALUES
  ('22222222-0000-7000-8000-400000000001', '22222222-0000-7000-8000-000000000001', 'Culto de Celebração', current_date + 4, '18:00', '20:00', 'presencial', 'Auditório principal', 'Culto semanal de celebração e adoração.', true, true, now()),
  ('22222222-0000-7000-8000-400000000002', '22222222-0000-7000-8000-000000000001', 'Noite de Louvor e Adoração', current_date + 12, '19:00', '22:00', 'presencial', 'Auditório principal', 'Noite especial dedicada ao louvor contemporâneo e momentos de oração.', false, true, now()),
  ('22222222-0000-7000-8000-400000000003', '22222222-0000-7000-8000-000000000001', 'Confraternização de Natal', current_date + 45, '17:00', '21:00', 'presencial', 'Salão comunitário', 'Festa de confraternização para membros e visitantes, com amigo secreto e ceias.', false, true, now())
ON CONFLICT (id) DO NOTHING;

-- Posts no mural Igreja Nova Vida Demo
INSERT INTO posts (id, church_id, author_id, content, is_active, created_at)
VALUES
  ('22222222-0000-7000-8000-500000000001', '22222222-0000-7000-8000-000000000001', '22222222-0000-7000-8000-100000000001',
   'Que Deus abençoe a todos! Estamos animados com o crescimento que temos visto — só neste mês recebemos 8 novos membros. A colheita é abundante!', true, now() - interval '3 days'),
  ('22222222-0000-7000-8000-500000000002', '22222222-0000-7000-8000-000000000001', '22222222-0000-7000-8000-100000000005',
   'Ensaio do grupo de louvor nesta quinta às 19h. Todos os músicos confirmem presença! Vamos preparar algo especial para a Noite de Louvor.', true, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Nota final
-- =============================================================================
-- Para usar este seed:
--   supabase db reset --seed-file supabase/seed-pilot.sql
-- Ou no ambiente de homologação:
--   psql $DATABASE_URL -f supabase/seed-pilot.sql
