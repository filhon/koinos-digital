> **Como usar:** Cada sessão é um prompt autocontido. Copie o prompt da sessão atual e cole no Claude Code ou Copilot. Antes de cada sessão, a IA deve ler o BRAIN.md.
> **Pré-requisito:** Todas as sessões de PROMPTS.md (0.1 → 5.8) já foram finalizadas. Este arquivo cobre as features descritas em FEATURES.md.

---

## Instrução padrão de abertura (cole antes de cada prompt)

```
Leia o arquivo .docs/BRAIN.md antes de fazer qualquer coisa.
Não sugira tecnologias fora da stack definida.
Siga a estrutura de diretórios do .docs/BRAIN.md.
Confira o log de progresso (seção 7) para não refazer trabalho.
Implemente APENAS o que está explicitamente listado nas TAREFAS. Se algo parecer necessário mas não estiver no prompt, pergunte antes de fazer.
```

---

## Instrução padrão de encerramento (a IA deve seguir ao finalizar cada sessão)

```
Ao finalizar a sessão, atualize AUTOMATICAMENTE o arquivo .docs/BRAIN.md:
1. Adicione uma linha na tabela de "Registro de sessões" (seção 7) com:
   - Número da sessão, data (YYYY-MM-DD), resumo do que foi feito, arquivos criados/modificados
2. Marque com ✅ as tabelas criadas na seção 6 (se houver migrations nesta sessão).
3. Atualize "Sessão atual" no topo do BRAIN.md para a próxima sessão.
Não pule este passo. Não peça para o usuário fazer manualmente.
```

---

# FASE 6 — IDENTIDADE + LEGAL (Semanas 17–18)

---

## Sessão 6.1 — Termos de Uso e Política de Privacidade

```
CONTEXTO: O sistema coleta CPF, RG, dados pessoais e financeiros. É obrigatório ter termos
jurídicos para compliance LGPD antes do lançamento. Não temos advogado disponível —
gerar templates adaptados ao sistema.

REFERÊNCIA: FEATURES.md seção "Docs", BRAIN.md seção 3 (regras 3, 5)

TAREFAS:
1. Crie a página /termos/page.tsx (rota pública, fora do dashboard):
   - Termos de Uso completos para o SaaS Koinos, cobrindo:
     - Definições (Koinos, usuário, igreja, tenant)
     - Descrição do serviço e funcionalidades
     - Cadastro e responsabilidades do usuário
     - Planos e pagamentos (Grátis, Crescimento, Igreja, Catedral)
     - Propriedade intelectual
     - Limitação de responsabilidade
     - Encerramento de conta
     - Foro (Brasil)
   - Layout clean com tipografia editorial (Instrument Serif para títulos, DM Sans para corpo)
   - Sidebar de navegação fixa com âncoras para cada seção
   - Data de vigência no topo
   - Responsivo (sidebar vira dropdown no mobile)
2. Crie a página /privacidade/page.tsx (rota pública):
   - Política de Privacidade LGPD-compliant cobrindo:
     - Controlador de dados (Koinos Digital)
     - Dados coletados (pessoais: nome, CPF, RG, email, telefone, endereço, foto;
       financeiros: transações, contas; comportamentais: check-ins, leitura, gamificação)
     - Finalidade do tratamento (por categoria, detalhado)
     - Base legal (consentimento, execução de contrato, obrigação legal)
     - Compartilhamento (Supabase, Stripe, Resend, Vercel — listar todos os processadores)
     - Criptografia (AES-256 para CPF, RG, conta bancária)
     - Retenção de dados (período por tipo: financeiros 5 anos, pessoais até exclusão)
     - Direitos do titular (acesso, correção, exclusão, portabilidade — já implementados em /perfil/privacidade)
     - Cookies e localStorage (tema, sessão, tour)
     - Transferência internacional (Supabase US, Vercel edge)
     - Encarregado de dados (DPO) — campo para email de contato
     - Atualizações da política
   - Mesmo layout dos Termos de Uso
3. Adicione /termos e /privacidade como rotas públicas no middleware.
4. Adicione links para Termos e Privacidade:
   - No footer da landing page do SaaS (src/app/page.tsx / saas-landing.tsx)
   - No footer das landing pages dos tenants (src/app/[slug]/landing-page.tsx)
   - No step de consentimento LGPD do wizard de criação de igreja (/signup/igreja)
   - No formulário de cadastro via convite (/convite/[code])
   - Nos checkboxes de consentimento: "Li e aceito os [Termos de Uso](/termos) e a
     [Política de Privacidade](/privacidade)"
5. Atualize consent_records para registrar a versão dos termos aceitos:
   - A versão será a data de vigência (ex: "2026-05-01")
   - Defina uma constante CURRENT_TERMS_VERSION em src/lib/constants/legal.ts

NÃO FAÇA: Não crie subdomínio docs.koinos.digital. Não crie documentação de módulos (fase posterior).
ENTREGÁVEIS: Duas páginas de termos jurídicos acessíveis publicamente, linkadas em todos os pontos de consentimento.
```

---

## Sessão 6.2 — Renomear Gamificação → Liga + Mural → Comunicação + restrições

> **UI:** Use `/impeccable` para implementar as telas desta sessão.

```
CONTEXTO: Duas renomeações de identidade do produto + restrição de criação de posts no módulo Comunicação.
Tudo já funciona — são mudanças de texto, rotas e uma regra de permissão.

REFERÊNCIA: FEATURES.md seções "Gamificação" e "Mural"

TAREFAS:

PARTE A — Renomear Gamificação → Liga
1. Renomeie a rota /dashboard/gamificacao → /dashboard/liga:
   - Mova todos os arquivos de src/app/(dashboard)/gamificacao/ para src/app/(dashboard)/liga/
   - Atualize referências em: Sidebar.tsx, BottomNav.tsx, Header.tsx (se houver),
     middleware.ts, todos os links internos, loading.tsx
   - A rota /gamificacao/analytics vira /liga/analytics
2. Atualize textos no Sidebar: "Gamificação" → "Liga"
3. Atualize o PageHeader e breadcrumbs nas páginas do módulo.
4. Atualize referências em Server Actions e validators (nomes de arquivos mantém, apenas textos UI).
5. Atualize referências no admin SaaS (/admin/gamificacao → /admin/liga):
   - Mova arquivos de src/app/(admin)/gamificacao/ para src/app/(admin)/liga/
   - Atualize o nav do admin layout
6. Atualize a GlobalSearch (src/actions/search.ts) se houver referência textual a "gamificação".

PARTE B — Renomear Mural → Comunicação
1. Renomeie a rota /dashboard/mural → /dashboard/comunicacao:
   - Mova todos os arquivos de src/app/(dashboard)/mural/ para src/app/(dashboard)/comunicacao/
   - Atualize referências em: Sidebar.tsx, BottomNav.tsx, middleware.ts, links internos, loading.tsx
2. Atualize textos: "Mural" → "Comunicação" (Sidebar, PageHeader, breadcrumbs, BottomNav).
3. Atualize o ícone no Sidebar: manter MessageSquare ou trocar para Megaphone (mais coerente com quadro de avisos).

PARTE C — Restringir criação de posts no Comunicação
1. No PostForm (src/app/(dashboard)/comunicacao/post-form.tsx):
   - Renderize o formulário de criação APENAS para roles: pastor, presbítero, diácono, líder
   - Para membro e visitante: oculte o PostForm completamente
   - Membros e visitantes CONTINUAM podendo comentar nos posts (CommentsSection inalterada)
2. Atualize o Server Action createPost (src/actions/posts.ts):
   - Adicione validação server-side: só permite criação se is_leadership() === true
   - Retorne erro 403 se membro/visitante tentar criar post
3. Atualize a RLS do INSERT em posts (migration):
   - Policy posts_insert: church_id match + is_leadership()
   - Mantenha a policy de comments inalterada (todos comentam)

NÃO FAÇA: Não implemente menções por grupo (fase posterior). Não mude a lógica de reações ou fixação.
ENTREGÁVEIS: Módulo Liga acessível em /liga, módulo Comunicação acessível em /comunicacao, criação de posts restrita à liderança.
```

---

## Sessão 6.3 — Perfil público + username no cadastro

> **UI:** Use `/impeccable` para implementar as telas desta sessão.

```
CONTEXTO: O Koinos é uma plataforma de comunidade. O perfil público é essencial desde o dia 0
para criar identidade entre os membros. O usuário escolherá um username único no cadastro.

REFERÊNCIA: FEATURES.md seção "Perfil público do usuário"

TAREFAS:
1. Migration ALTER TABLE members:
   - ADD COLUMN username text UNIQUE
   - CHECK: username ~ '^[a-z0-9._]{3,30}$' (apenas minúsculas, números, ponto e underscore)
   - INDEX UNIQUE em username (case-insensitive via LOWER)
   - O username NÃO é obrigatório para membros existentes (nullable), mas será obrigatório
     no fluxo de cadastro a partir de agora
2. Server Action suggestUsername(fullName: string) em src/actions/profile.ts:
   - Gera sugestão a partir do nome: remove acentos, converte para minúsculas,
     pega primeiro nome + último sobrenome, junta sem espaço
   - Ex: "Filipe Honório da Silva Santos" → "filipehonorio"
   - Se já existe: tenta filipehonorio1, filipehonorio2, etc.
   - Retorna a primeira sugestão disponível
3. Server Action checkUsernameAvailability(username: string) → boolean
4. Server Action updateUsername(username: string) em src/actions/profile.ts:
   - Validação do formato
   - Check de unicidade
   - Audit log
   - Apenas o próprio usuário pode alterar seu username
5. Atualize o fluxo de cadastro — signup de nova igreja (/signup/igreja):
   - Adicione campo "Nome de usuário" no Step 1 (dados pessoais)
   - Sugestão automática ao preencher o nome (debounce 500ms, chama suggestUsername)
   - Indicador visual de disponibilidade (check verde / X vermelho) com debounce
   - Validação de formato inline (regex)
6. Atualize o fluxo de cadastro via convite (/convite/[code]):
   - Adicione campo "Nome de usuário" com mesma lógica
7. Crie a página de perfil público /[username]/page.tsx:
   - Rota pública (adicionar ao middleware)
   - ATENÇÃO: conflito com /[slug] (landing page da igreja). Resolver assim:
     - No middleware ou na página, primeiro tente resolver como slug de tenant
     - Se não encontrar tenant com esse slug, tente resolver como username de member
     - Se nenhum, retorne 404
   - Layout do perfil público:
     - Header com foto de capa (gradiente default, sem upload no MVP) + avatar circular grande
     - Nome completo + @username
     - Igreja(s) que pertence (nome da igreja como link para a landing page)
     - Badges conquistados (grid horizontal scrollable)
     - Posição na Liga da igreja (widget compacto: posição + pontos + nome da tribo)
     - NÃO exibir por padrão: email, telefone, data de nascimento
   - Server Action getPublicProfile(username: string):
     - Busca member por username
     - Retorna apenas dados públicos (nome, avatar, church name, badges, team, score)
     - NÃO retorna CPF, RG, telefone, email, endereço
8. Adicione no perfil privado (/perfil):
   - Seção "Perfil público" com:
     - Campo de edição do username
     - Link "Ver meu perfil público" → /[username]
     - Toggle de visibilidade para dados opcionais (email, telefone, data de nascimento)
   - Migration: ADD COLUMN public_email boolean DEFAULT false,
     public_phone boolean DEFAULT false, public_birth_date boolean DEFAULT false
     ao members

NÃO FAÇA: Não implemente upload de foto de capa. Não implemente feed de atividades no perfil.
Não implemente follow/unfollow (módulo Comunhão).
ENTREGÁVEIS: Username no cadastro, perfil público acessível, resolução de conflito [slug] vs [username].
```

---

## Sessão 6.4 — Onboarding guiado funcional

> **UI:** Use `/impeccable` para implementar as telas desta sessão.

```
CONTEXTO: O OnboardingTour atual (src/components/layout/OnboardingTour.tsx) é apenas uma janela
com textos genéricos que o usuário avança. Precisa ser um onboarding guiado com steps
que rastreiam o progresso real do pastor.

REFERÊNCIA: FEATURES.md seção "Onboarding guiado pós-cadastro para pastores"

TAREFAS:
1. Migration: crie tabela onboarding_progress:
   - id UUIDv7
   - member_id UUID FK members UNIQUE
   - church_id UUID FK tenants
   - steps_completed text[] DEFAULT '{}'
   - completed_at timestamp nullable (null = em andamento)
   - created_at, updated_at
   - RLS: member_id = auth.uid(), church_id match
2. Defina os steps do onboarding para o pastor:
   - step_1: "complete_profile" — Completar perfil (avatar + telefone)
   - step_2: "create_first_event" — Criar o primeiro evento
   - step_3: "invite_members" — Convidar pelo menos 1 membro (link gerado)
   - step_4: "create_ministry" — Criar um ministério
   - step_5: "customize_landing" — Personalizar a landing page da igreja
   - step_6: "explore_league" — Visitar a página da Liga
3. Refatore o OnboardingTour.tsx:
   - Remova a implementação atual (tooltip genérico)
   - Novo componente: OnboardingChecklist
   - UI: card fixo no canto inferior direito (desktop) ou bottom sheet (mobile)
   - Cada step como um item com:
     - Checkbox (preenchido automaticamente quando a ação é detectada)
     - Título do step
     - Descrição curta
     - Botão "Ir" que navega para a página relevante
   - Barra de progresso no topo (X de 6 completos)
   - Botão para minimizar/expandir o checklist
   - Quando todos os 6 steps forem concluídos:
     - Animação de celebração (confetti ou similar com Framer Motion)
     - Mensagem de parabéns
     - Botão "Fechar" que marca completed_at
   - Após completed_at != null: não exibir mais o checklist
4. Server Actions em src/actions/onboarding-progress.ts:
   - getOnboardingProgress(memberId)
   - markStepCompleted(memberId, stepKey)
   - completeOnboarding(memberId)
5. Detecção automática de steps completados:
   - complete_profile: verificar avatar_url != null E phone != null no member
   - create_first_event: verificar COUNT events WHERE church_id = X > 0
   - invite_members: verificar COUNT invite_links WHERE church_id = X AND member_id = pastor > 0
   - create_ministry: verificar COUNT ministries WHERE church_id = X > 0
   - customize_landing: verificar tenants.is_published = true OU tenants.about_us IS NOT NULL
   - explore_league: registrar quando o pastor visita /liga (via Server Action no page.tsx)
   - Chamar checkAndUpdateProgress() no dashboard/layout.tsx para sincronizar
6. Exibir o OnboardingChecklist apenas para:
   - Membros com role = 'pastor'
   - Que foram criados há menos de 30 dias
   - Que não completaram o onboarding (completed_at IS NULL)
7. Integre no dashboard layout (src/app/(dashboard)/layout.tsx):
   - Buscar onboarding_progress do pastor no SSR
   - Renderizar OnboardingChecklist condicionalmente

NÃO FAÇA: Não use tooltips com highlight de elementos DOM (complexo e frágil).
Use um checklist standalone. Não crie steps para módulos premium.
ENTREGÁVEIS: Checklist de onboarding funcional que rastreia progresso real do pastor.
```

---

# FASE 7 — ENGAJAMENTO DIÁRIO (Semanas 19–20)

---

## Sessão 7.1 — Módulo Leitura: Bíblia NVI + reader + fluxo diário expandido

> **UI:** Use `/impeccable` para implementar as telas desta sessão.

```
CONTEXTO: O sistema já possui tabelas daily_readings e devotion_streaks, um widget DailyReadingWidget
no dashboard, e a função mark_daily_reading com pontuação. Porém, o texto bíblico ainda não é
exibido — apenas o nome do capítulo. Precisamos de um módulo de leitura completo com o texto
da Bíblia NVI.

A API pública https://github.com/rribeiro1/bible-edge deve ser verificada. Se não estiver
funcional, servir a Bíblia localmente em JSON.

REFERÊNCIA: FEATURES.md seção "Módulo: Leitura", BRAIN.md seção 6 (daily_readings, devotion_streaks, bible_verses)

TAREFAS:
1. Verifique a API bible-edge (https://bible-edge.vercel.app ou endpoint documentado no repo):
   - Faça uma chamada GET de teste para verificar se retorna versículos NVI
   - Se funcionar: use-a como fonte primária com fallback local
   - Se NÃO funcionar: sirva a Bíblia localmente (próximo item)
2. Fonte local da Bíblia NVI (caso API indisponível ou como fallback):
   - Busque um arquivo JSON público com a NVI (verificar repositórios públicos no GitHub)
   - Crie um script de seed: supabase/seed-bible-nvi.sql ou um script Node.js que
     popule bible_verses com todos os versículos (31.102 versículos, 1.189 capítulos)
   - Se o arquivo for muito grande para uma migration, crie um script em src/scripts/seed-bible.ts
     que lê o JSON e insere em lotes de 1000
   - ATENÇÃO ao licenciamento: se a NVI não puder ser distribuída, use a ACF (Almeida Corrigida Fiel,
     domínio público) como alternativa e documente a decisão no BRAIN.md
3. Atualize a API route GET /api/bible:
   - Já existe em src/app/api/bible/route.ts
   - Adicione endpoint: GET /api/bible/chapter?book=Gênesis&chapter=1&version=NVI
   - Retorna todos os versículos do capítulo formatados
4. Crie o plano de leitura anual completo:
   - Expanda o seed de daily_readings (atualmente 90 dias, Gn 1–50 + Êx 1–40)
   - Gere os 365 dias cobrindo toda a Bíblia (usar um plano público "Bíblia em 1 ano")
   - Cada dia: 1 capítulo (ou trecho para capítulos longos como Salmos 119)
   - Reciclar: após 365 dias, reiniciar o ciclo (o daily_reading do dia = dia do ano % 365)
5. Crie a página /dashboard/leitura/page.tsx:
   - Adicione "Leitura" ao Sidebar (BookOpen icon, disponível para todos os roles)
   - Adicione ao middleware como rota acessível a todos
   - Layout da página:
     - Header com o capítulo do dia: "Leitura de hoje: Gênesis 1"
     - Widget de streak (foguinho + dias consecutivos + barra de progresso semanal)
     - Texto completo do capítulo com:
       - Números dos versículos em destaque (superscript, cor accent)
       - Tipografia confortável para leitura (font-size 18px, line-height 1.8)
       - Fundo surface-1 com padding generoso
       - Dark mode otimizado para leitura noturna
     - Botão "Concluir leitura" no final do texto:
       - Só habilitado se o usuário scrollou até o final (IntersectionObserver no último versículo)
       - Ao clicar: chama mark_daily_reading (já existe), animação de celebração
       - Se já leu hoje: exibe "Leitura concluída" com checkmark verde
     - Seção "Leituras anteriores" com calendário mini (últimos 30 dias, dias lidos marcados)
6. Atualize o DailyReadingWidget no dashboard:
   - Ao clicar "Li!" ou no card: navegar para /leitura em vez de apenas marcar como lido
   - Exibir preview dos primeiros 2 versículos do capítulo no card
7. Server Actions em src/actions/leitura.ts:
   - getTodayReading() → retorna daily_reading + versículos do capítulo
   - getReadingHistory(memberId, month) → retorna dias lidos no mês
   - O markRead() já existe em src/actions/devotion.ts — reutilizar

NÃO FAÇA: Não implemente perguntas por IA (fase posterior). Não implemente seleção de tradução
(NVI/ACF) — use apenas uma versão no MVP. Não crie busca textual na Bíblia (já existe em /api/bible).
ENTREGÁVEIS: Página de leitura com texto bíblico completo, streak visual, botão de conclusão funcional.
```

---

## Sessão 7.2 — Módulo Feedbacks (para equipe Koinos + respostas in-app)

> **UI:** Use `/impeccable` para implementar as telas desta sessão.

```
CONTEXTO: Módulo simples para liderança das igrejas enviar feedbacks à equipe Koinos.
Feedbacks do tipo "elogio" com autorização poderão ser exibidos na homepage futuramente.
O usuário também solicitou a possibilidade de responder feedbacks in-app.

REFERÊNCIA: FEATURES.md seção "Módulo: Feedbacks"

TAREFAS:
1. Migration: crie tabelas feedbacks e feedback_responses:
   feedbacks:
   - id UUIDv7
   - church_id UUID FK tenants
   - member_id UUID FK members
   - type: ENUM feedback_type ('elogio', 'sugestao', 'reclamacao')
   - title text NOT NULL (max 100 chars)
   - description text NOT NULL (max 2000 chars)
   - allow_public boolean DEFAULT false (apenas quando type = 'elogio')
   - status: ENUM feedback_status ('aberto', 'em_analise', 'respondido', 'fechado') DEFAULT 'aberto'
   - created_at, updated_at
   - RLS: SELECT/INSERT para is_leadership() com church_id match

   feedback_responses:
   - id UUIDv7
   - feedback_id UUID FK feedbacks
   - author_role text NOT NULL ('admin' ou 'team') — quem respondeu
   - content text NOT NULL (max 2000 chars)
   - created_at
   - RLS: SELECT para is_leadership() com church_id match via JOIN feedbacks;
     INSERT apenas via service_role (respostas vêm do admin SaaS)

2. Validators Zod em src/lib/validators/feedbacks.ts:
   - createFeedbackSchema (type, title, description, allow_public condicional)
   - listFeedbacksSchema (filtros: type, status, page)

3. Server Actions em src/actions/feedbacks.ts:
   - listFeedbacks(churchId, filters) → lista com paginação, para liderança
   - createFeedback(data) → insere com logAudit, apenas is_leadership()
   - getFeedbackById(id) → detalhes + respostas
   - deleteFeedback(id) → soft-delete, apenas autor

4. Página /dashboard/feedback/page.tsx:
   - Adicione "Feedback" ao Sidebar (MessageCircle icon, visível apenas para liderança:
     pastor, presbítero, diácono, líder)
   - Lista de feedbacks enviados pela liderança da igreja
   - Filtro por tipo (Elogio / Sugestão / Reclamação) com pill-filters coloridos:
     - Elogio: verde, Sugestão: âmbar, Reclamação: terracota
   - Filtro por status (Aberto / Em análise / Respondido / Fechado)
   - FeedbackCard com: tipo badge, título, preview da descrição, status badge, data
   - Botão "Novo Feedback"

5. Página /dashboard/feedback/novo/page.tsx:
   - Form com React Hook Form + Zod:
     - Select tipo (Elogio / Sugestão / Reclamação)
     - Input título (max 100 chars)
     - Textarea descrição (max 2000 chars)
     - Checkbox "Autorizo a divulgação pública deste elogio" (visível apenas se tipo = elogio)
   - Submit chama createFeedback
   - Redirect para /feedback após sucesso

6. Página /dashboard/feedback/[id]/page.tsx:
   - Detalhes do feedback (tipo, título, descrição, data, status)
   - Timeline de respostas (se houver):
     - Cada resposta com: avatar da equipe Koinos, conteúdo, data
     - Estilo de chat/thread simples
   - Status atualizado automaticamente quando há resposta

7. Painel admin para respostas — /admin/feedbacks:
   - Adicione "Feedbacks" ao nav do admin layout
   - Lista todos os feedbacks de todos os tenants
   - Filtro por tipo, status, igreja
   - Admin pode:
     - Visualizar detalhes do feedback
     - Responder (insere em feedback_responses via admin client)
     - Alterar status (aberto → em_analise → respondido → fechado)
   - Server Actions em src/actions/admin.ts:
     - listAllFeedbacks(filters)
     - respondToFeedback(feedbackId, content)
     - updateFeedbackStatus(feedbackId, status)

8. Notificação in-app quando o feedback recebe resposta:
   - Ao admin responder, crie notificação para o member_id do feedback
   - Tipo: "feedback_response"
   - Mensagem: "Seu feedback '{title}' recebeu uma resposta da equipe Koinos"

NÃO FAÇA: Não implemente upload de anexos (fotos/vídeos). Não implemente a seção de depoimentos
na homepage (fase posterior, depende de ter feedbacks reais).
ENTREGÁVEIS: Módulo de feedback funcional com envio pela liderança, respostas pelo admin, notificação.
```

---

## Sessão 7.3 — Notificações push (OneSignal) + email digest semanal

```
CONTEXTO: Notificações in-app já existem (tabela notifications, NotificationBell no header).
Agora precisamos de notificações push via OneSignal e um email digest semanal via Resend.

REFERÊNCIA: FEATURES.md seção "Notificações: push notifications ou email digest"

TAREFAS:
1. Instale e configure o OneSignal:
   - Instale @onesignal/node-onesignal (SDK server) e react-onesignal (SDK client)
   - Adicione ao .env.example:
     NEXT_PUBLIC_ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY
   - Crie src/lib/onesignal/client.ts:
     - Inicialização do OneSignal no client-side
     - Solicitar permissão de push notification
     - Registrar external_user_id = member.id
   - Crie src/lib/onesignal/server.ts:
     - sendPushNotification({ memberIds, title, message, url, data })
     - sendPushToChurch({ churchId, title, message, url }) — para todos os membros da igreja
2. Integre o OneSignal no app:
   - Inicialize no layout.tsx do dashboard (client-side, após login)
   - Solicite permissão de push no primeiro acesso (banner amigável, NÃO popup nativo direto)
   - Componente PushPermissionBanner:
     - "Ative as notificações para não perder nada da sua igreja"
     - Botão "Ativar" que chama OneSignal.showNativePrompt()
     - Botão "Agora não" que oculta por 7 dias (localStorage)
     - Exibir apenas se permissão não foi concedida ainda
3. Dispare push notifications nos eventos-chave (reutilize createNotification existente):
   - Refatore createNotification (src/actions/notifications.ts) para TAMBÉM enviar push:
     - Após inserir na tabela notifications, chame sendPushNotification se memberId tem push ativo
   - Eventos que já criam notificação (já dispararão push automaticamente):
     - Associação de ministério a evento (líder notificado)
     - Escala atribuída (membro notificado)
     - Feedback respondido (autor notificado)
   - Novos eventos de push (adicione createNotification onde faltava):
     - Novo post no Comunicação: push para todos os membros da igreja
     - Novo evento criado: push para todos os membros da igreja
     - Lembrete de evento: 1h antes do evento (cron ou edge function)
     - Streak prestes a expirar: se o membro não leu hoje e são 20h (cron)
4. Email digest semanal via Resend:
   - Crie template src/emails/weekly-digest.tsx (React Email):
     - Saudação personalizada com nome do membro
     - Resumo da semana: novos eventos, posts no Comunicação, posição na Liga
     - CTA: "Abrir Koinos"
     - Link para desativar digest
   - Crie Supabase Edge Function supabase/functions/weekly-digest/index.ts:
     - Cron: domingos às 08h (horário de Brasília)
     - Para cada tenant ativo:
       - Busca membros ativos com email
       - Agrega dados da semana (eventos, posts, leaderboard)
       - Envia email via Resend para cada membro
     - Responde ao opt-out (consent_records com purpose = 'email_digest')
   - Atualize config.toml com o schedule do cron
5. Adicione opt-out de notificações no perfil:
   - Em /perfil/privacidade ou nova seção em /perfil:
     - Toggle "Notificações push" (desativa no OneSignal)
     - Toggle "Email digest semanal" (atualiza consent_records)

NÃO FAÇA: Não implemente notificações por SMS. Não implemente lembrete de evento como edge function
complexa (use um check simples no login + push agendado via OneSignal scheduled notifications).
ENTREGÁVEIS: Push notifications via OneSignal funcionando, email digest semanal configurado.
```

---

## Sessão 7.4 — Roadmap público

> **UI:** Use `/impeccable` para implementar as telas desta sessão.

```
CONTEXTO: Página estática em koinos.digital/roadmap. Sem backend — dados hardcoded.
Referência visual: roadmaps públicos como AbacatePay.

REFERÊNCIA: FEATURES.md seção "Roadmap público de desenvolvimento"

TAREFAS:
1. Crie a página /roadmap/page.tsx (rota pública):
   - Adicione /roadmap como rota pública no middleware
   - Layout Kanban-style com 3 colunas:
     - "Planejado" (cinza/neutro)
     - "Em Desenvolvimento" (âmbar/accent)
     - "Lançado" (verde/success)
   - Cada item é um card com:
     - Título (bold)
     - Descrição curta (1-2 linhas)
     - Badge de categoria (ex: "Comunidade", "Gestão", "IA")
     - Ícone representativo (Lucide)
   - Responsivo: no mobile, as 3 colunas viram tabs horizontais com swipe
   - Animações: staggered reveal nos cards, hover scale sutil
   - Header com logo Koinos + título "Roadmap" + subtítulo explicativo
   - Footer com link para /feedback (para liderança logada)
2. Dados hardcoded em src/lib/constants/roadmap.ts:
   - Array de items com: id, title, description, category, status, icon
   - Items sugeridos:

   LANÇADO:
   - Gestão de membros e famílias
   - Agenda de eventos com recorrência
   - Comunicação interna (antigo Mural)
   - Liga (gamificação com tribos e badges)
   - Check-in por QR Code
   - Liturgia com sugestões de IA
   - Landing page personalizável
   - Financeiro com relatórios
   - Assembléia e votação anônima
   - Ministérios e escalas

   EM DESENVOLVIMENTO:
   - Leitura bíblica diária com Bíblia NVI
   - Perfil público de usuário
   - Níveis e Talentos (moeda virtual)
   - Notificações push
   - Loja digital

   PLANEJADO:
   - Feed social no início
   - Comunhão (rede entre igrejas)
   - Liga Geral entre igrejas
   - Chat em tempo real
   - Perguntas por IA na leitura diária

3. Adicione link para /roadmap:
   - No footer da landing page do SaaS (src/app/page.tsx / saas-landing.tsx)
   - Na sidebar do dashboard (ícone Map, link externo para koinos.digital/roadmap)

NÃO FAÇA: Não crie backend para gerenciar o roadmap. Não crie votação em items.
Dados hardcoded por enquanto — migrar para dinâmico quando necessário.
ENTREGÁVEIS: Página de roadmap público estática, profissional, acessível em /roadmap.
```

---

# FASE 8 — PROGRESSÃO + ECONOMIA (Semanas 21–22)

---

## Sessão 8.1 — Níveis e Talentos (sistema de XP, moeda virtual, progressão)

> **UI:** Use `/impeccable` para implementar as telas desta sessão.

```
CONTEXTO: A gamificação já funciona com pontos, tribos e badges. Agora vamos adicionar uma
camada de progressão (níveis) e uma moeda virtual (Talentos). Os Talentos serão usados na Loja (sessão 8.2).
O nível é determinado pelo total de Talentos já ganhos (não pelo saldo atual).

REFERÊNCIA: FEATURES.md seção "Níveis de usuário"

TAREFAS:
1. Migration: crie tabelas e colunas:
   levels:
   - level integer PK (1, 2, 3, ..., 30)
   - name text NOT NULL UNIQUE
   - min_xp integer NOT NULL (XP mínimo para atingir o nível)
   - icon text (emoji ou Lucide icon name)

   ALTER TABLE members:
   - ADD COLUMN total_xp integer DEFAULT 0 (total de Talentos ganhos, nunca diminui)
   - ADD COLUMN wallet_balance integer DEFAULT 0 (saldo de Talentos disponíveis para gastar)
   - ADD COLUMN current_level integer DEFAULT 1 REFERENCES levels(level)

   talent_transactions (registro de ganhos e gastos):
   - id UUIDv7
   - member_id UUID FK members
   - church_id UUID FK tenants
   - amount integer NOT NULL (positivo = ganho, negativo = gasto)
   - type: ENUM talent_tx_type ('earned', 'spent')
   - source text NOT NULL (ex: 'checkin', 'invite', 'daily_reading', 'streak_bonus', 'shop_purchase')
   - reference_id UUID nullable (id do score_event, shop_purchase, etc.)
   - created_at
   - RLS: SELECT para member_id = auth.uid(), INSERT via service_role

2. Seed a tabela levels com 30 níveis (escala temática bíblica):
   - Nível 1: "Semente" (0 XP)
   - Nível 2: "Broto" (50 XP)
   - Nível 3: "Raiz" (120 XP)
   - Nível 4: "Arbusto" (200 XP)
   - Nível 5: "Árvore" (350 XP)
   - Nível 6: "Fruto" (550 XP)
   - Nível 7: "Ceifa" (800 XP)
   - Nível 8: "Obreiro" (1.100 XP)
   - Nível 9: "Servo" (1.500 XP)
   - Nível 10: "Discípulo" (2.000 XP)
   - Nível 11: "Sal" (2.600 XP)
   - Nível 12: "Luz" (3.300 XP)
   - Nível 13: "Testemunha" (4.100 XP)
   - Nível 14: "Guardião" (5.000 XP)
   - Nível 15: "Profeta" (6.000 XP)
   - Nível 16: "Sacerdote" (7.200 XP)
   - Nível 17: "Ancião" (8.500 XP)
   - Nível 18: "Pastor" (10.000 XP)
   - Nível 19: "Apóstolo" (12.000 XP)
   - Nível 20: "Querubim" (14.500 XP)
   - Nível 21: "Serafim" (17.500 XP)
   - Nível 22: "Arcanjo" (21.000 XP)
   - Nível 23: "Trono" (25.000 XP)
   - Nível 24: "Dominação" (30.000 XP)
   - Nível 25: "Potestade" (36.000 XP)
   - Nível 26: "Principado" (43.000 XP)
   - Nível 27: "Virtude" (51.000 XP)
   - Nível 28: "Coroa" (60.000 XP)
   - Nível 29: "Glória" (70.000 XP)
   - Nível 30: "Eternidade" (80.000 XP)
   (Escala exponencial suave: cada nível requer ~20-25% mais XP que o anterior)

3. Integre Talentos com o sistema de pontuação existente:
   - Crie função SQL SECURITY DEFINER award_talents(member_id, amount, source, reference_id):
     - Insere em talent_transactions (type = 'earned')
     - Atualiza members.total_xp += amount
     - Atualiza members.wallet_balance += amount
     - Verifica se total_xp atingiu novo nível → atualiza members.current_level
     - Retorna { new_level, level_name } se level up, null otherwise
   - Atualize as funções existentes para TAMBÉM chamar award_talents:
     - award_checkin_points (+10 pts = +10 Talentos)
     - award_invite_points (+50 pts = +50 Talentos)
     - mark_daily_reading (+10 pts = +10 Talentos, bônus streak = bônus Talentos)
   - Talentos e pontos de equipe são independentes: score_events continua alimentando o placar
     da tribo, talent_transactions alimenta o nível individual e o saldo

4. UI de nível no perfil:
   - No perfil privado (/perfil): seção "Meu Nível" com:
     - Ícone + nome do nível + número
     - Barra de progresso para o próximo nível (XP atual / XP necessário)
     - Saldo de Talentos disponíveis (moeda)
     - Histórico de ganhos/gastos (últimos 20, paginado)
   - No perfil público (/[username]):
     - Badge de nível ao lado do nome (ícone + "Nível X: Nome")
   - Server Actions em src/actions/levels.ts:
     - getMyLevel() → level, name, xp, nextLevelXp, walletBalance
     - getMyTalentHistory(page) → talent_transactions paginado

5. Exibição do nível no app:
   - PostCard (Comunicação): badge de nível ao lado do nome do autor (compacto: "Nv.X")
   - MemberCard (/membros): badge de nível
   - Leaderboard (/liga): nível ao lado do nome no ranking individual

6. Animação de level-up:
   - Quando award_talents retorna novo nível:
     - Toast especial com animação (scale + glow + Framer Motion)
     - Mensagem: "Parabéns! Você alcançou o nível X: {nome}!"
   - Verificação de level-up no login/dashboard (caso o level-up tenha ocorrido via trigger)

NÃO FAÇA: Não crie a Loja (sessão 8.2). Não crie compra de Talentos com dinheiro real.
Talentos são ganhos APENAS por atividades no app. Não altere a lógica da Liga/placar de equipes.
ENTREGÁVEIS: 30 níveis, Talentos como moeda virtual, progressão integrada com pontuação existente, UI de nível em todo o app.
```

---

## Sessão 8.2 — Loja digital (itens digitais + compra com Talentos)

> **UI:** Use `/impeccable` para implementar as telas desta sessão.

```
CONTEXTO: Os Talentos (moeda virtual) foram implementados na sessão 8.1. Agora vamos criar
a Loja onde os membros podem gastar seus Talentos em itens digitais. A compra diminui
o saldo (wallet_balance) mas NÃO afeta o nível (total_xp permanece inalterado).

REFERÊNCIA: FEATURES.md seção "Módulo: Loja"

TAREFAS:
1. Migration: crie tabelas:
   shop_items:
   - id UUIDv7
   - name text NOT NULL
   - description text NOT NULL
   - category: ENUM shop_category ('avatar_frame', 'badge_special', 'theme', 'title', 'boost')
   - price integer NOT NULL (em Talentos)
   - icon_url text nullable (Supabase Storage)
   - metadata jsonb DEFAULT '{}' (dados específicos do tipo: cor do frame, nome do título, etc.)
   - is_active boolean DEFAULT true
   - max_purchases integer nullable (null = ilimitado, 1 = compra única)
   - created_at
   - RLS: SELECT para todos (is_active = true), INSERT/UPDATE/DELETE via service_role

   shop_purchases:
   - id UUIDv7
   - member_id UUID FK members
   - church_id UUID FK tenants
   - item_id UUID FK shop_items
   - price_paid integer NOT NULL (preço no momento da compra)
   - created_at
   - RLS: SELECT para member_id = auth.uid()
   - UNIQUE (member_id, item_id) WHERE max_purchases = 1 no shop_items

   member_equipped_items:
   - id UUIDv7
   - member_id UUID FK members UNIQUE per category
   - item_id UUID FK shop_items
   - category text NOT NULL
   - equipped_at timestamp DEFAULT now()
   - UNIQUE (member_id, category) — apenas 1 item equipado por categoria

2. Seed shop_items com itens iniciais:
   Categoria "avatar_frame" (molduras para o avatar):
   - Moldura Dourada (200 Talentos)
   - Moldura Prateada (100 Talentos)
   - Moldura Brilhante (300 Talentos) — efeito glow animado
   - Moldura Tribal (150 Talentos) — cor da tribo

   Categoria "badge_special" (badges exclusivos):
   - Colecionador (500 Talentos) — badge brilhante no perfil
   - Estrela Koinos (1000 Talentos) — badge premium

   Categoria "title" (títulos especiais exibidos no perfil):
   - "Desbravador" (100 Talentos)
   - "Benção Ambulante" (200 Talentos)
   - "Guerreiro de Oração" (300 Talentos)
   - "Adorador" (250 Talentos)

   Categoria "theme" (temas visuais do perfil público):
   - Tema Celestial (400 Talentos) — gradiente azul-dourado
   - Tema Amanhecer (300 Talentos) — gradiente quente
   - Tema Noturno (300 Talentos) — gradiente escuro com estrelas

   Categoria "boost" (boosts temporários):
   - Boost de XP 2x por 24h (150 Talentos) — metadata: { duration_hours: 24, multiplier: 2 }
   - Boost de XP 1.5x por 7 dias (500 Talentos) — metadata: { duration_hours: 168, multiplier: 1.5 }

3. Página /dashboard/loja/page.tsx:
   - Adicione "Loja" ao Sidebar (ShoppingBag icon, disponível para todos os roles)
   - Header com saldo de Talentos do usuário (moeda + ícone)
   - Grid de itens organizados por categoria (tabs ou seções):
     - ShopItemCard com: ícone/preview, nome, descrição, preço em Talentos, botão "Comprar"
     - Badge "Adquirido" se já comprou (para itens com max_purchases = 1)
     - Badge "Equipado" se está equipado
     - Animação hover: scale + shadow
   - Dialog de confirmação ao comprar:
     - Preview do item
     - Preço + saldo atual + saldo após compra
     - Aviso se saldo insuficiente
     - Botão "Confirmar compra"
   - Feedback pós-compra: animação de celebração + toast

4. Server Actions em src/actions/shop.ts:
   - listShopItems() → todos os itens ativos com status de compra do usuário
   - purchaseItem(itemId):
     - Verifica saldo suficiente (wallet_balance >= price)
     - Verifica max_purchases não excedido
     - Transaction: INSERT shop_purchases + INSERT talent_transactions (type='spent', amount negativo)
       + UPDATE members.wallet_balance -= price
     - Se boost: registrar ativação com expiração
     - Retorna item comprado
   - getMyPurchases() → itens comprados pelo usuário
   - equipItem(purchaseId, category) → ativa item visual (frame, title, theme)
   - unequipItem(category) → remove item equipado

5. Exibição dos itens equipados:
   - Avatar frame: componente AvatarWithFrame que envolve o Avatar existente com bordinha/animação
     - Aplique em: PostCard, MemberCard, perfil público, Header avatar
   - Título especial: exibido abaixo do nome no perfil público e ao lado do nome no PostCard
   - Tema do perfil: gradiente de fundo na página de perfil público
   - Badges especiais: exibidos na seção de badges do perfil com destaque visual

6. Boost de XP:
   - Migration: ADD COLUMN active_boost jsonb nullable ao members
     { item_id, multiplier, expires_at }
   - Atualize award_talents para verificar active_boost e multiplicar o amount
   - Cron/check: expirar boosts quando expires_at < now()
   - Badge visual temporário no avatar quando boost ativo (sparkle icon)

7. Admin SaaS — gestão da loja (/admin/loja):
   - CRUD de itens (nome, descrição, categoria, preço, ativo/inativo)
   - Estatísticas: itens mais comprados, total de Talentos gastos

NÃO FAÇA: Não implemente compra com dinheiro real. Não implemente troca de itens entre membros.
Não implemente marketplace (apenas itens gerenciados pelo admin).
ENTREGÁVEIS: Loja funcional com itens digitais, compra com Talentos, itens equipáveis com efeito visual.
```

---

# FASE 9 — SOCIAL (Semanas 23–24)

---

## Sessão 9.1 — Feed social no Início (versão MVP)

> **UI:** Use `/impeccable` para implementar as telas desta sessão.

```
CONTEXTO: A tela de Início (/dashboard) é um dashboard com widgets. O usuário quer transformá-la
num feed social, pois o foco do Koinos é comunidade. No MVP, como não existem os conceitos de
"seguir igrejas" ou "irmãos" (módulo Comunhão, posterior), o feed exibirá apenas:
- Posts públicos da igreja do usuário (publicados por pastor/presbítero)
- Posts dos membros da mesma igreja (todos os posts do Comunicação)

A Comunicação (/comunicacao, antigo Mural) continua existindo como módulo de quadro de avisos.
O feed do Início é uma VISUALIZAÇÃO diferente dos mesmos dados, potencialmente com posts de
outras igrejas no futuro.

REFERÊNCIA: FEATURES.md seção "Início"

TAREFAS:
1. Migration ALTER TABLE posts:
   - ADD COLUMN is_public boolean DEFAULT false
   - ADD COLUMN post_source text DEFAULT 'comunicacao' CHECK (post_source IN ('comunicacao', 'feed'))
   - Apenas pastor e presbítero podem criar posts com is_public = true
   - Posts criados no Comunicação: post_source = 'comunicacao', is_public = false
   - Posts criados no Feed: post_source = 'feed', is_public = true ou false
   - RLS: SELECT posts WHERE church_id = mine OR is_public = true (para feed futuro cross-church)

2. Refatore a página /dashboard/page.tsx:
   - Layout 2 colunas no desktop:
     - Coluna esquerda (sidebar de widgets, 30% width):
       - Widget de próximos eventos (UpcomingEventsCard, já existe)
       - Widget de leitura bíblica (DailyReadingWidget, já existe)
       - Widget de atalhos rápidos (QuickActions, já existe)
       - Widget "Meu Nível" (compacto: ícone + barra XP + saldo Talentos)
     - Coluna direita (feed, 70% width):
       - Toggle "Relevantes" / "Recentes" (alterna ordenação)
       - PostForm para criar post no feed (pastor/presbítero: toggle "Publicar pela Igreja")
       - Feed com rolagem infinita cursor-based
   - Layout 1 coluna no mobile:
     - Apenas o feed (sem widgets laterais)
     - Widgets acessíveis via swipe horizontal no topo ou via BottomNav

3. Seletor "Igreja / Você" para pastor e presbítero:
   - No PostForm do feed do Início:
     - Toggle visual: "Publicar como" → ícone da igreja / avatar do usuário
     - Se "Igreja": post com author_id = pastor_id, is_public = true, badge "Igreja" no card
     - Se "Você": post com author_id = pastor_id, is_public = false, post pessoal
   - Apenas pastor e presbítero veem o toggle

4. Feed com algoritmo de relevância:
   - RPC get_feed_posts(church_id, member_id, sort_by, cursor, limit):
     - sort_by = 'relevance': mesmo algoritmo do Comunicação
       (fixados → liderança → score → recente)
     - sort_by = 'recent': ORDER BY created_at DESC
     - Retorna posts da mesma igreja + posts is_public de outras igrejas (futuro)
     - Cursor-based pagination (created_at, id)
   - Rolagem infinita com IntersectionObserver (reutilizar padrão do MuralFeed)

5. FeedPost component (variante do PostCard):
   - Reutilize o PostCard existente com adaptações:
     - Badge "Igreja" (ícone da igreja) quando post é publicado pela igreja
     - Badge de nível do autor
     - Avatar com frame equipado (se houver, da Loja)
     - Título equipado (se houver)
     - Reações e comentários inalterados
   - Ações no post: reagir, comentar, fixar (liderança), deletar (autor/pastor)

6. Atualize o BottomNav:
   - Item "Início" aponta para /dashboard (feed)
   - Item "Comunicação" aponta para /comunicacao (quadro de avisos)
   - Ambos são módulos distintos visualmente, mesmo usando a tabela posts

NÃO FAÇA: Não implemente seguir igrejas (módulo Comunhão). Não implemente conceito de "irmãos".
Não implemente posts de outras igrejas no feed (apenas infraestrutura com is_public para o futuro).
Não remova os widgets do dashboard — reposicione-os na coluna esquerda.
ENTREGÁVEIS: Feed social na tela de início com 2 colunas, rolagem infinita, toggle relevância/recentes, seletor Igreja/Você.
```

---

## Sessão 9.2 — Liga Geral (ranking entre igrejas)

> **UI:** Use `/impeccable` para implementar as telas desta sessão.

```
CONTEXTO: A Liga interna (entre tribos da mesma igreja) já funciona. Agora vamos adicionar a
Liga Geral entre todas as igrejas que usam o sistema. A pontuação é balanceada pela quantidade
de membros ativos para não beneficiar igrejas maiores.

REFERÊNCIA: FEATURES.md seção "Gamificação" itens 2-5

TAREFAS:
1. Migration:
   - Crie RPC get_church_leaderboard(period text):
     - Agrega total de pontos por igreja (SUM score_events.points por church_id)
     - Calcula membros_ativos (COUNT DISTINCT member_id em score_events no período)
     - Pontuação normalizada = total_pontos / membros_ativos
     - Aplica fator logarítmico para evitar distorções com igrejas pequenas:
       normalized_score = (total_points / active_members) * LN(active_members + 1)
     - ORDER BY normalized_score DESC
     - Retorna: church_id, church_name, total_points, active_members, normalized_score, rank
     - Períodos: 'month', 'year'
   - RLS: a RPC roda com SECURITY DEFINER para acessar dados cross-tenant
     (apenas dados agregados, sem dados pessoais)

2. Validators: atualize src/lib/validators/gamification.ts:
   - ChurchRankRow { church_id, church_name, total_points, active_members, normalized_score, rank }
   - getChurchLeaderboardSchema

3. Server Action getChurchLeaderboard(period) em src/actions/gamification.ts:
   - Chama RPC get_church_leaderboard
   - Retorna lista rankeada + posição da igreja do usuário

4. Atualize a página /dashboard/liga:
   - Novo layout 3 colunas (desktop):
     - Coluna esquerda: "Seu Progresso" — nível, XP, saldo Talentos, streak
     - Coluna central: "Liga Interna" — pódio das tribos, placar completo, top 10 membros
       (já existe, mover para cá)
     - Coluna direita: "Liga Geral" — pódio das igrejas, top 10 igrejas, widget da igreja do
       usuário com posição atual
   - Mobile: tabs "Interno" / "Geral" / "Meu Progresso"

5. Componente ChurchLeaderboard:
   - Pódio visual (top 3 igrejas com tamanho diferenciado)
   - Lista top 10 com barras de progresso animadas (Framer Motion)
   - Widget "Sua Igreja": card destacado com posição, pontos normalizados, membros ativos
   - Tooltip explicando a fórmula de normalização: "A pontuação é balanceada pelo número de
     membros ativos para garantir competição justa entre igrejas de todos os tamanhos"

6. Se houver apenas 1 igreja no sistema:
   - Exibir mensagem amigável: "A Liga Geral será ativada quando mais igrejas entrarem no Koinos!"
   - Mostrar a igreja do usuário em 1º lugar (pódio solo)

NÃO FAÇA: Não exiba dados de membros individuais de outras igrejas. Apenas nome da igreja e
dados agregados. Não crie sistema de desafios entre igrejas.
ENTREGÁVEIS: Liga Geral com ranking normalizado entre igrejas, layout 3 colunas na página da Liga.
```

---

# FASE 10 — PÓS-MVP

> As sessões desta fase são de escopo maior e podem ser subdivididas durante a implementação.
> Priorize conforme demanda dos usuários após o lançamento.

---

## Sessão 10.1 — Módulo Comunhão (rede entre igrejas)

```
CONTEXTO: Módulo social que conecta igrejas próximas. Depende de geocoding e massa de igrejas.
REFERÊNCIA: FEATURES.md seção "Módulo: Comunhão"

TAREFAS:
1. Migration:
   - ALTER TABLE tenants ADD COLUMNS: latitude double precision, longitude double precision
   - Crie tabela church_circles (id, church_id_a, church_id_b, status ENUM 'pending'/'accepted'/'rejected',
     invited_by UUID FK members, created_at)
   - Crie tabela member_follows (id, follower_id FK members, church_id_followed FK tenants, created_at)
   - Crie tabela member_friendships (id, member_a FK members, member_b FK members,
     status ENUM 'pending'/'accepted', created_at)
   - Extensão PostGIS: CREATE EXTENSION IF NOT EXISTS postgis
   - Index GIST em tenants(latitude, longitude) para busca por raio
2. Geocoding no cadastro da igreja:
   - Após salvar endereço, chamar API de geocoding (Google Maps Geocoding API ou Nominatim/OSM free)
     para converter endereço → lat/lng
   - Adicione GOOGLE_MAPS_GEOCODING_KEY ao .env.example
3. Página /dashboard/comunhao:
   - Busca de igrejas por raio (slider 5–100km)
   - Mapa com marcadores (Google Maps ou Leaflet/OpenStreetMap)
   - Lista de igrejas encontradas com distância
   - Botão "Convidar para o Círculo" (pastor/presbítero)
   - Pesquisa por slug (todos os membros)
4. Sistema de "Irmãos":
   - Membro pode enviar convite para outro membro
   - Após aceite: tornam-se "irmãos" (bidirecional)
   - Irmãos aparecem no feed do Início (posts do feed)
5. Permissões: pastor/presbítero gerenciam o Círculo. Membros seguem igrejas e enviam convites de irmandade.

NÃO FAÇA: Não implemente chat entre igrejas. Não crie eventos compartilhados (sessão separada).
```

---

## Sessão 10.2 — Chat em tempo real

```
CONTEXTO: Chat entre membros da mesma igreja usando Supabase Realtime.
REFERÊNCIA: FEATURES.md seção "Módulo: Chat em tempo real"

TAREFAS:
1. Migration: conversations (id, church_id, type ENUM 'direct'/'group', name nullable, created_at),
   conversation_members (conversation_id, member_id, joined_at),
   messages (id, conversation_id, sender_id, content, created_at, is_read boolean).
2. Presença online: Supabase Realtime Presence para mostrar quem está ativo.
3. UI: ícone de chat no header, lista de conversas, janela de chat com mensagens em tempo real.
4. Grupos: criar grupo com múltiplos membros, renomear, adicionar/remover.
5. Mensagens persistidas com scroll infinito.
6. Badge de mensagens não lidas.

NÃO FAÇA: Não implemente chamadas de voz/vídeo. Não implemente envio de arquivos no MVP do chat.
```

---

## Sessão 10.3 — Comunicação: menções por grupo

```
CONTEXTO: Evoluir o módulo Comunicação para suportar menções a ministérios e grupos musicais.
REFERÊNCIA: FEATURES.md seção "Mural" itens 3-4, 7

TAREFAS:
1. Migration: post_mentions (post_id, mention_type ENUM 'ministry'/'music_group'/'all', mention_id nullable).
2. UI de menções: autocomplete com @ no PostForm, sugestões de ministérios/grupos.
3. Visibilidade seletiva: posts com menção só aparecem para membros do grupo mencionado.
4. Posts sem menção: visíveis para todos (comportamento atual).
5. Notificação push para membros dos grupos mencionados.
6. Permissões: líderes de ministério/grupo podem mencionar seu grupo. Liderança menciona qualquer grupo.

NÃO FAÇA: Não implemente menções individuais (@membro). Apenas grupos.
```

---

## Sessão 10.4 — Agenda: compartilhar eventos entre igrejas

```
CONTEXTO: Pastores podem convidar outras igrejas do seu Círculo para participar de eventos.
REFERÊNCIA: FEATURES.md seção "Agenda" itens 1-2
Depende do módulo Comunhão (sessão 10.1).

TAREFAS:
1. Migration: event_invites (id, event_id, from_church_id, to_church_id, message, status, created_at).
2. No detalhe do evento: botão "Convidar igreja" com select de igrejas do Círculo.
3. Pastor/presbítero da igreja convidada aceita/rejeita.
4. Evento aceito aparece na agenda da igreja convidada com badge "Convite".
5. Notificação push ao pastor da igreja convidada.
```

---

## Sessão 10.5 — Homepage: seção de depoimentos

```
CONTEXTO: Seção de depoimentos na landing page do SaaS (koinos.digital) usando feedbacks
do tipo "elogio" com autorização pública.
REFERÊNCIA: FEATURES.md seção "Homepage" itens 1-6
Depende do módulo Feedbacks (sessão 7.2) com massa de dados.

TAREFAS:
1. Server Action getPublicTestimonials():
   - Busca feedbacks com type='elogio' AND allow_public=true AND status='respondido' ou 'fechado'
   - Para cada: busca member (nome, avatar, church name)
   - IA: analisa qualidade do texto, corrige erros e extrai trecho impactante (max 150 chars)
     para exibição no card. NÃO modifica o texto original no banco.
2. Componente TestimonialsSection na landing page do SaaS:
   - Carrossel de rolagem infinita (horizontal, auto-scroll suave)
   - Card: foto do membro, nome, título (nome da igreja), trecho impactante
   - Se nenhum feedback elogioso: ocultar a seção inteiramente
3. Posicionar antes da seção de pricing.
```

---

## Sessão 10.6 — Leitura: perguntas por IA

```
CONTEXTO: Após a leitura diária, 5 perguntas geradas por IA sobre o texto lido.
REFERÊNCIA: FEATURES.md seção "Módulo: Leitura" itens 3-4

TAREFAS:
1. Migration: daily_questions (id, daily_reading_id, question, options jsonb, correct_option int,
   explanation text, created_at), member_answers (id, member_id, question_id, selected_option, is_correct).
2. Edge Function ou cron: gerar 5 perguntas por dia (uma única vez) via GPT-4.1 com fallback Gemini.
   - Prompt com o texto do capítulo do dia
   - 4 opções por pergunta, 1 correta
   - Armazenar no banco (daily_questions)
3. UI: após marcar leitura como concluída, exibir quiz de 5 perguntas.
   - Feedback imediato (certo/errado + explicação)
   - Pontuação: +2 Talentos por resposta correta (+10 máximo por dia)
4. Todas as perguntas são as mesmas para todos os membros no mesmo dia (isonomia).
```

---

## Sessão 10.7 — Docs (documentação dos módulos)

```
CONTEXTO: Página docs.koinos.digital com documentação de todos os módulos do sistema.
REFERÊNCIA: FEATURES.md seção "Página: Docs"

TAREFAS:
1. Subdomínio docs.koinos.digital (ou /docs como rota):
   - Usar framework de docs leve (Nextra, Fumadocs, ou MDX simples com App Router)
   - Sidebar com navegação por módulo
2. Documentação de cada módulo:
   - Descrição, como usar, permissões necessárias, screenshots
   - Gerada com auxílio de IA baseada na codebase
3. Hospedar os Termos de Uso e Política de Privacidade aqui (migrar de /termos e /privacidade)
   ou manter links cruzados.

NÃO FAÇA: Não gere documentação de API (interno). Apenas documentação para o usuário final.
```

---

_Fim dos prompts de features. Atualize o BRAIN.md ao concluir cada sessão._
