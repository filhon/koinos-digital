> **Como usar:** Cada sessão é um prompt autocontido. Copie o prompt da sessão atual e cole no Claude Code ou Copilot. Antes de cada sessão, a IA deve ler o BRAIN.md.

---

## Instrução padrão de abertura (cole antes de cada prompt)

```
Leia o arquivo .docs/BRAIN.md antes de fazer qualquer coisa.
Não sugira tecnologias fora da stack definida.
Siga a estrutura de diretórios do .docs\BRAIN.md.
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

# FASE 0 — FUNDAÇÃO (Semanas 1–2)

---

## Sessão 0.1 — Scaffold do projeto + configuração base

```
CONTEXTO: Início do projeto Koinos do zero.
REFERÊNCIA: BRAIN.md (stack, estrutura de diretórios)

TAREFAS:
1. Inicialize o projeto Next.js 16 com TypeScript 6, Tailwind CSS 4 e App Router.
2. Configure o tsconfig.json com strict: true e path alias "@/" apontando para "src/".
3. Instale as dependências do projeto:
   - shadcn/ui (CLI v4), zod, react-hook-form, @hookform/resolvers,
     date-fns, @tanstack/react-query, framer-motion, lucide-react, stripe, @stripe/stripe-js
4. Configure ESLint (flat config, eslint.config.mjs) com:
   - @eslint/js recommended + typescript-eslint strict + eslint-plugin-react + next/core-web-vitals
   - Prettier como formatador (eslint-config-prettier para desativar regras conflitantes)
   - NÃO adicione plugins extras além dos listados acima
5. Configure Husky com pre-commit rodando: prettier --check + eslint + tsc --noEmit.
6. Crie a estrutura de diretórios conforme BRAIN.md seção 2 (pastas vazias com .gitkeep).
7. Crie um arquivo .env.example com as variáveis necessárias:
   - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
     SUPABASE_SERVICE_ROLE_KEY, ENCRYPTION_KEY, RESEND_API_KEY,
     STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY,
     STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_CRESCIMENTO,
     STRIPE_PRICE_ID_IGREJA, STRIPE_PRICE_ID_CATEDRAL,
     OPENAI_API_KEY, UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN

NÃO FAÇA: Não crie componentes, não conecte ao Supabase, não crie páginas.
ENTREGÁVEIS: Projeto rodando com `npm run dev`, lint passando, estrutura pronta.
```

---

## Sessão 0.2 — Supabase + Schema inicial do banco

```
CONTEXTO: Projeto scaffoldado. Agora vamos criar o banco de dados.
REFERÊNCIA: BRAIN.md seção 6 (checklist de tabelas), PRD seções 3.2, 8, 9, 11

TAREFAS:
1. Inicialize o Supabase CLI no projeto (supabase init).
2. Crie a primeira migration com as tabelas CORE:
   - tenants, members, family_links, invite_links,
     consent_records, audit_logs
3. Todas as PKs devem usar UUIDv7. Use a extensão pg_uuidv7 (CREATE EXTENSION IF NOT EXISTS pg_uuidv7) e uuid_generate_v7() como DEFAULT. Se a extensão não estiver disponível no Supabase, use gen_random_uuid() como fallback temporário e deixe um comentário TODO.
4. Colunas de timestamp: created_at DEFAULT now(), updated_at com trigger auto-update.
5. Campos enum usando PostgreSQL ENUM types:
   - member_role: admin, pastor, presbítero, diácono, tesoureiro, líder, membro, visitante
   - relationship_type: cônjuge, pai, mãe, filho, filha, irmão, irmã
6. Adicione constraints:
   - UNIQUE (church_id, cpf) em members
   - UNIQUE (church_id, member_id, related_member_id) em family_links
   - UNIQUE (code) em invite_links
7. Crie indexes:
   - GIN em members.name para busca textual
   - INDEX em members.church_id, members.role
   - INDEX em invite_links.code
8. Crie trigger para vínculo bidirecional em family_links:
   INSERT em (A→B) automaticamente insere (B→A) com relationship invertido.
   Mapeamento de inversão:
   - cônjuge ↔ cônjuge
   - pai → filho/filha (conforme gênero do related), filho/filha → pai
   - mãe → filho/filha (conforme gênero do related), filho/filha → mãe
   - irmão ↔ irmão/irmã (conforme gênero do related)

NÃO FAÇA: Não crie RLS ainda (próxima sessão). Não crie tabelas de outros módulos.
ENTREGÁVEIS: Migration SQL funcional, executável via `supabase db push`.
```

---

## Sessão 0.3 — RLS policies base + helpers de autenticação

```
CONTEXTO: Tabelas core criadas. Agora isolamento multi-tenant.
REFERÊNCIA: PRD seções 3.1, 6, 8.4 (TASK-RBAC-02)

TAREFAS:
1. Crie uma migration com RLS policies para TODAS as tabelas core:
   - SELECT: church_id = auth.jwt()->>'church_id'
   - INSERT: church_id = auth.jwt()->>'church_id'
   - UPDATE: church_id = auth.jwt()->>'church_id'
   - DELETE: church_id = auth.jwt()->>'church_id'
2. Para members: policy adicional que permite membro editar apenas seu próprio perfil
   (campos: avatar_url, phone, address, email).
3. Crie helpers no Supabase (funções SQL):
   - get_my_church_id() → retorna church_id do JWT
   - get_my_role() → retorna role do JWT
   - is_leadership() → retorna true se role IN ('pastor','presbítero','diácono','líder')
4. Crie os helpers TypeScript em src/lib/supabase/:
   - client.ts → createBrowserClient (client-side)
   - server.ts → createServerClient (server-side, cookies)
   - middleware.ts → helper para middleware Next.js
5. Crie src/lib/auth/session.ts com:
   - getSession() → retorna sessão do usuário ou null
   - getUser() → retorna user com church_id e role
   - requireAuth() → throw redirect se não autenticado
   - requireRole(roles[]) → throw 403 se role insuficiente

NÃO FAÇA: Não crie UI. Não crie páginas de login.
ENTREGÁVEIS: RLS ativo, helpers testáveis via chamada direta.
```

---

## Sessão 0.4 — Autenticação (signup, login, logout, reset)

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: RLS e helpers prontos. Agora as telas de auth.
REFERÊNCIA: PRD seções 6.1, 9.1, 9.2

TAREFAS:
1. Configure Supabase Auth com provider email/senha.
2. Crie o middleware Next.js em src/middleware.ts:
   - Rotas públicas: /, /login, /signup, /convite/*, /[slug] (landing)
   - Rotas protegidas: /dashboard/* → redireciona para /login se sem sessão
   - Refresh automático do token
3. Crie as páginas em src/app/(auth)/:
   - /login/page.tsx → form com email + senha
   - /signup/page.tsx → form com nome, CPF, email, senha (sem dados da igreja ainda)
   - /esqueci-senha/page.tsx → form com email para reset
   - /redefinir-senha/page.tsx → form com nova senha (via magic link)
4. Crie os Server Actions em src/actions/auth.ts:
   - signUp(formData) → cria usuário no Supabase Auth
   - signIn(formData) → autentica
   - signOut() → desloga + redireciona
   - resetPassword(email) → envia link de reset via Supabase
5. Use React Hook Form + Zod para validação dos forms.
6. Schemas Zod em src/lib/validators/auth.ts:
   - loginSchema, signupSchema, resetSchema
7. Inclua validação de CPF (algoritmo de dígitos verificadores).
8. Crie helper src/lib/utils/cpf.ts com validateCPF() e formatCPF().
9. Design das páginas de auth (primeira impressão do produto — deve ser memorável):
   - Layout split-screen no desktop: metade esquerda com branding (Instrument Serif display,
     gradiente mesh sutil ou textura atmosférica usando as cores do design system),
     metade direita com o form centralizado
   - Mobile: form full-width com branding compacto no topo (logo + slogan)
   - Animação de entrada: staggered reveal nos campos do form (usar variants de src/lib/motion.ts)
   - Background da seção de branding: tom acolhedor e profissional, NÃO corporativo/frio
   - Campos do form com espaçamento generoso, labels claras, feedback de erro inline

NÃO FAÇA: Não implemente onboarding de igreja (fase 1). Não implemente Cloudflare Turnstile nem 2FA (serão adicionados na sessão 1.6).
ENTREGÁVEIS: Fluxo completo de auth funcionando com design memorável. Usuário loga e vê página vazia do dashboard.
```

---

## Sessão 0.5 — Design system + componentes base

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Auth funcionando. Agora a identidade visual.
REFERÊNCIA: PRD seção 7

TAREFAS:
1. Configure o design system via Tailwind CSS 4 (@theme):
   - Paleta de cores com OKLCH — direção estética "warm editorial" (Kinfolk, não SaaS genérico):
     - Primary: azul-petróleo escuro (NÃO royal blue genérico) — seriedade e confiança
     - Accent: âmbar quente tendendo ao cobre (NÃO dourado brilhante/metálico)
     - Semânticas: success (verde-salvia), error (terracota), warning (mostarda)
     - Surface light: off-whites com temperatura quente (creme sutil, NÃO branco puro #fff)
     - Surface dark: cinza-carvão com temperatura quente (NÃO preto puro #000)
     - Defina os tokens com esses valores como ponto de partida — eu ajusto depois.
   - Tipografia (Google Fonts):
     - Display: Instrument Serif (expressiva, com personalidade)
     - Body: DM Sans (geométrica humanista, moderna sem ser genérica)
     - NÃO use Inter, Roboto, Arial ou system fonts — são genéricas demais (PRD 7.1.3)
   - Spacing scale, border-radius tokens (radius padrão: 0.75rem)
   - Shadow tokens com matiz de cor (NÃO box-shadow com preto puro):
     - shadow-sm, shadow-md, shadow-lg com leve matiz azul-petróleo
   - Profundidade visual com tokens de surface:
     - surface-0 (base) → surface-1 (card) → surface-2 (elevated) com diferença sutil
     - Evitar branco puro e preto puro em qualquer contexto
2. Implemente dark mode:
   - Classe no <html> via Tailwind dark:
   - Persistência em cookie (para SSR sem flash) + prefers-color-scheme como fallback inicial
     (desvio intencional do PRD 7.2 que diz localStorage — cookie é superior para SSR)
   - Toggle sol/lua no header com transição suave (150ms)
   - Hook useTheme() que lê cookie server-side e prefers-color-scheme como fallback no client
   - Dark mode NÃO é apenas inverter cores: superfícies com temperatura quente,
     texto com contraste reduzido (cinza-claro, não branco puro)
3. Instale e configure componentes shadcn/ui essenciais:
   - Button, Input, Label, Card, Dialog (Modal), Sheet, Toast (Sonner),
     Dropdown Menu, Avatar, Badge, Skeleton, Separator, Tabs
   - IMPORTANTE: customize o tema base (CSS variables) para refletir a paleta,
     tipografia e radius definidos acima. NÃO use os defaults do shadcn.
   - Button primary: fundo sólido primary com hover mais escuro, não outline genérico
   - Input: borda sutil no rest, borda accent no focus, sem anel azul padrão do browser
   - Card: aplique os shadow tokens definidos, não use shadow-sm padrão
   - Skeleton: shimmer sutil com gradiente, não pulse genérico
4. Defina a personalidade de motion do design system:
   - Crie src/lib/motion.ts com variants reutilizáveis para Framer Motion:
     - fadeIn (opacity 0→1, 200ms ease-out)
     - slideUp (translateY 16px→0 + fade, 300ms ease-out)
     - stagger (delay 50ms entre itens de lista/grid)
     - scaleIn (scale 0.95→1 + fade, para modals/dialogs)
   - Page transitions: fadeIn ao montar rotas do dashboard
   - Listas e grids: staggered reveal ao montar
   - Hover states: scale(1.02) em cards interativos, underline animado em links
   - Micro-interactions: botões com feedback tátil (scale 0.97 no press, 100ms)
   - Sidebar: transição de largura com spring (não linear)
   - Respeitar prefers-reduced-motion: desabilitar animações se ativado pelo OS
5. Crie componentes de layout em src/components/layout/:
   - AppShell.tsx → wrapper com sidebar (desktop) + bottom nav (mobile)
   - Sidebar.tsx → colapsável, agrupado por categoria, ícones Lucide
   - BottomNav.tsx → 5 itens (Início, Agenda, Mural, Mais, Perfil)
   - Header.tsx → logo, toggle dark mode, avatar do usuário, dropdown logout
     - Header com backdrop-blur e transparência sutil (glass effect leve)
   - PageHeader.tsx → título da página + breadcrumbs + ação principal
6. Layout responsivo:
   - < 640px: bottom nav, sem sidebar
   - 640–1024px: sidebar colapsada (ícones)
   - > 1024px: sidebar expandida
   - Espaçamento generoso entre seções (min 24px em mobile, 32px em desktop)
7. Crie src/app/(dashboard)/layout.tsx que usa o AppShell.
8. Acessibilidade (WCAG AA — exigido pelo PRD 7.1.4):
   - Todas as cores de texto devem ter contraste >= 4.5:1 contra seu background
   - Focus ring visível (outline, não box-shadow) em todos os componentes interativos
   - Skip-to-content link como primeiro item focusável da página
   - aria-label em ícones sem texto (toggle dark mode, sidebar collapse, etc.)
   - Navegação por teclado funcional em sidebar, bottom nav e dropdowns

NÃO FAÇA: Não implemente busca global (Cmd+K). Não crie conteúdo nas páginas.
ENTREGÁVEIS: Dashboard com shell responsivo, dark mode funcional, motion system configurado, acessibilidade base, navegação entre áreas.
```

---

## Sessão 0.6 — Helpers utilitários + encryption + audit log

> **UI:** Use `/frontend-design` para implementar o componente `PermissionGate` desta sessão.

```
CONTEXTO: Design system pronto. Últimos fundamentos antes do onboarding.
REFERÊNCIA: PRD seções 5.3, 6.1, 11.1

TAREFAS:
1. Crie src/lib/encryption/aes.ts:
   - encrypt(plainText, key) → cipherText (AES-256-GCM)
   - decrypt(cipherText, key) → plainText
   - Usa ENCRYPTION_KEY do .env
2. Crie src/lib/utils/formatters.ts:
   - formatCurrency(value) → R$ 1.234,56 (Intl.NumberFormat pt-BR)
   - formatDate(date) → 02/04/2026 (date-fns pt-BR)
   - formatPhone(phone) → (81) 99999-9999
3. Crie src/actions/audit.ts:
   - logAudit({ churchId, userId, action, entityType, entityId, metadata, ip })
   - Insere na tabela audit_logs
4. Crie src/lib/auth/permissions.ts:
   - checkPermission(userRole, module, action) → boolean
   - Baseado na matriz de permissões do PRD seção 8.2
   - Exportar constante PERMISSIONS_MATRIX tipada
5. Crie componente src/components/ui/permission-gate.tsx:
   - <PermissionGate role="pastor"> renderiza children condicionalmente
   - <PermissionGate module="financeiro" action="create"> idem
   - Usa hook usePermissions() que consome sessão do contexto
6. Crie src/hooks/usePermissions.ts:
   - Retorna { role, can(module, action), isLeadership }

NÃO FAÇA: Não crie o portal LGPD (vem depois). Não crie páginas de módulos.
ENTREGÁVEIS: Helpers de encryption, formatação, audit e permissões testáveis.
```

---

## Sessão 0.7 — CI/CD (Vercel) + headers de segurança

```
CONTEXTO: Scaffold pronto. Antes de qualquer funcionalidade, configurar deploy e segurança base.
REFERÊNCIA: PRD seção 6.1

TAREFAS:
1. Configure next.config.ts com security headers em todas as rotas:
   - Content-Security-Policy (CSP): default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: *.supabase.co; connect-src 'self' *.supabase.co *.upstash.io
   - Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: camera=(self), microphone=(), geolocation=(self)
2. Configure .github/dependabot.yml:
   - Atualizações automáticas de npm (semanais)
   - Atualizações de GitHub Actions (mensais)
3. Crie .github/workflows/ci.yml com:
   - Trigger: push para main, pull_request para main
   - Jobs sequenciais: type-check (tsc --noEmit) → lint (eslint) → build (next build)
   - npm audit --audit-level=high no job de build
4. Configure vercel.json:
   - Região: gru1 (São Paulo)
   - Framework: nextjs

NÃO FAÇA: Não configure ambientes de staging manuais (Vercel gera preview por PR automaticamente).
ENTREGÁVEIS: Headers de segurança ativos (verificar via securityheaders.com), CI rodando no GitHub Actions, deploy automático na Vercel funcionando.
```

---

# FASE 1 — ONBOARDING + RBAC (Semanas 3–4)

---

## Sessão 1.1 — Fluxo de criação de tenant (nova igreja)

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Fundação completa. Agora o primeiro fluxo real do produto.
REFERÊNCIA: PRD seção 9.1 (fluxo passo a passo), TASK-ONB-01

TAREFAS:
1. Crie a página /signup/igreja/page.tsx com wizard multi-step:
   - Step 1: Dados pessoais (nome, CPF, email, senha) — se não logado
   - Step 2: Consentimentos LGPD (checkboxes granulares por finalidade)
   - Step 3: Dados da igreja (nome, CNPJ opcional, denominação, endereço, telefone)
   - Step 4: Confirmação + criação
2. Server Action createChurch(data) em src/actions/onboarding.ts:
   - Validação Zod do payload completo
   - Verifica unicidade: CNPJ (se informado) OU nome + endereço
   - Se igreja já existe → associa como visitante + notifica
   - Se não existe → Transaction: INSERT tenant + INSERT member (role pastor) + INSERT invite_link
   - Registra consentimento LGPD com timestamp, IP, versão dos termos
   - Registra audit_log
3. Crie schema Zod em src/lib/validators/onboarding.ts:
   - churchSchema com validação condicional (CNPJ formato, endereço completo)
4. CPF é criptografado antes do INSERT (usa encrypt() da sessão 0.6).
5. Slug do tenant é gerado automaticamente a partir do nome da igreja (slugify).
6. Após criação bem-sucedida:
   - Seta church_id e role no JWT custom claims (via Supabase Auth admin)
   - Redireciona para /dashboard

NÃO FAÇA: Não implemente matching por CPF (próxima sessão).
ENTREGÁVEIS: Fluxo completo de criar igreja. Pastor logado vê dashboard vazio.
```

---

## Sessão 1.2 — Links de convite + cadastro via convite

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Criação de tenant funcionando. Agora permitir que membros entrem.
REFERÊNCIA: PRD seções 9.2, 9.3, TASK-ONB-02, TASK-ONB-03

TAREFAS:
1. Crie a página /convite/[code]/page.tsx:
   - Valida código do convite (busca em invite_links)
   - Se válido → exibe form de cadastro com tenant pré-selecionado
   - Se inválido/revogado → mensagem amigável + redireciona para signup genérico
2. Implemente matching por CPF no Server Action registerMember():
   - CPF já existe no tenant → associa ao registro existente, assume role definido
   - CPF match + email diferente → atualiza email + audit_log
   - CPF não existe → cria novo membro como visitante
3. Crie painel de convites em /dashboard/configuracoes/convites:
   - Gerar link geral da igreja (pastor/liderança)
   - Gerar link pessoal do membro (qualquer membro)
   - Listar links ativos com botão de revogar
   - Copiar link com um clique (clipboard API)
4. Registre invited_by no membro quando cadastro é via link pessoal.
5. Link pessoal → incrementa pontuação de gamificação do convidante
   (crie a estrutura, mesmo que o módulo de gamificação venha depois).

NÃO FAÇA: Não crie gamificação completa. Apenas registre o invited_by.
ENTREGÁVEIS: Fluxo completo de convite. Membro acessa link, se cadastra, aparece no tenant.
```

---

## Sessão 1.3 — Middleware de autorização + PermissionGate

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Onboarding funcionando. Agora proteger tudo.
REFERÊNCIA: PRD seção 8, TASK-RBAC-01, TASK-RBAC-03

TAREFAS:
1. Refine o middleware.ts para validar role em rotas protegidas:
   - /dashboard/financeiro/* → tesoureiro, pastor, presbítero, diácono (leitura)
   - /dashboard/configuracoes/* → pastor
   - /dashboard/assembleia/* → pastor
   - Demais rotas → qualquer role autenticado
2. Crie decorator para Server Actions em src/lib/auth/with-permission.ts:
   - withPermission(action, { module, minRole }) → wraps action com check
   - Retorna 403 se role insuficiente
   - Log de tentativa negada no audit_log
3. Aplique <PermissionGate> na Sidebar e BottomNav:
   - Filtre itens de navegação baseado no role do usuário
   - Membro/visitante não vê: Financeiro, Assembleia, Configurações avançadas
4. Crie página de "Acesso negado" (403) com mensagem amigável.
5. Teste manual: logue como visitante e verifique que rotas restritas redirecionam.

NÃO FAÇA: Não crie os módulos em si. Apenas proteja as rotas.
ENTREGÁVEIS: RBAC funcional end-to-end. Rotas protegidas, navegação filtrada.
```

---

## Sessão 1.4 — Consentimentos LGPD + perfil do membro

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Auth + RBAC prontos. Agora compliance e perfil.
REFERÊNCIA: PRD seções 5.2, 5.3, 11.3 (US-MEM-06, US-MEM-07)

TAREFAS:
1. Crie página /dashboard/perfil/page.tsx:
   - Exibe dados do membro logado (nome, email, telefone, endereço, foto)
   - Permite editar: avatar (upload Supabase Storage), telefone, endereço
   - NÃO permite editar: nome, CPF, role (apenas liderança altera)
2. Crie página /dashboard/perfil/privacidade/page.tsx:
   - Tab "Meus Dados": exibe todos os dados pessoais em formato legível
   - Tab "Consentimentos": lista finalidades com toggle on/off
   - Tab "Exportar": botão que gera ZIP (JSON + CSV) com todos os dados
   - Tab "Excluir": botão que inicia soft-delete com confirmação dupla
3. Server Actions em src/actions/privacy.ts:
   - updateConsent(purpose, consented) → atualiza consent_records
   - exportMyData() → gera JSON + CSV → retorna URL de download temporário
   - requestDeletion() → soft-delete (is_active = false) + agendamento de anonimização
4. Upload de avatar: Supabase Storage, path /{church_id}/avatars/{member_id}
   - Limite: 2MB, formatos: jpg/png/webp
   - Resize no client antes do upload (max 400x400)

NÃO FAÇA: Não implemente job de anonimização automática.
ENTREGÁVEIS: Perfil editável + portal de privacidade LGPD funcional.
```

---

## Sessão 1.5 — Seed data + testes de sanidade

```
CONTEXTO: Fase 1 completa. Agora dados de teste e validação.

TAREFAS:
1. Crie supabase/seed.sql com dados de teste:
   - 1 tenant "Igreja Teste" com slug "teste"
   - 1 pastor (fundador)
   - 5 membros com roles variados (presbítero, diácono, tesoureiro, líder, membro)
   - 2 visitantes
   - 3 vínculos familiares
   - 2 links de convite (1 geral, 1 pessoal)
   - Registros de consentimento para todos os membros
2. Documente no README.md:
   - Como rodar o projeto localmente
   - Como aplicar migrations e seed
   - Variáveis de ambiente necessárias
   - Credenciais de teste dos usuários seed
3. Faça um checklist manual de validação:
   - [x] Signup de nova igreja funciona
   - [x] Login/logout funciona
   - [x] Cadastro via convite funciona
   - [x] Matching por CPF funciona
   - [x] Dark mode funciona
   - [x] Sidebar filtra por role
   - [x] Perfil editável funciona
   - [x] Portal LGPD funciona
   - [x] RLS impede acesso cross-tenant

NÃO FAÇA: Não avance para a Fase 2.
ENTREGÁVEIS: Seed funcional, README completo, projeto validado end-to-end.
```

---

## Sessão 1.6 — Segurança adicional: Turnstile + 2FA + templates de e-mail

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Onboarding funcional. Agora adicionar camadas de segurança pendentes que foram adiadas.
REFERÊNCIA: PRD seção 6.1 (Turnstile, 2FA, rate limiting)

TAREFAS:
1. Cloudflare Turnstile nos formulários de signup e login:
   - Instale @marsidev/react-turnstile
   - Adicione NEXT_PUBLIC_TURNSTILE_SITE_KEY e TURNSTILE_SECRET_KEY ao .env.example
   - Validação server-side do token no Server Action antes de criar sessão
     (POST https://challenges.cloudflare.com/turnstile/v0/siteverify)
   - Modo "managed" (invisível quando possível, desafio visual apenas se suspeito)
2. Rate limiting com Upstash Redis:
   - Crie src/lib/rate-limit.ts: rateLimit({ identifier, limit, window }) → { success, remaining, reset }
   - Aplique nos Server Actions:
     - signIn: 5 tentativas / 15 min por IP
     - signUp: 10 / hora por IP
   - Aplique em API routes:
     - /api/checkin: 100 / min por IP
     - /api/ai/*: 10 / min por usuário autenticado
   - Retorne 429 com header Retry-After e mensagem amigável
3. 2FA (TOTP) via Supabase Auth MFA:
   - Página /dashboard/perfil/seguranca com seção "Autenticação em dois fatores":
     - Ativar: gerar QR code (compatível com Google Authenticator / Authy)
     - Confirmar código TOTP para ativar
     - Desativar com confirmação de senha
   - Middleware: se membro tem AAL1 e recurso exige AAL2 → redireciona para /verificar-2fa
   - Página /verificar-2fa com campo de 6 dígitos
4. Templates de e-mail com React Email + Resend:
   - src/emails/welcome.tsx → boas-vindas com nome da igreja e link para o app
   - src/emails/invite.tsx → convite com nome do convidante e link de convite
   - src/emails/reset-password.tsx → redefinição de senha (fluxo próprio se necessário)
   - src/emails/vote-code.tsx → código OTP para votação remota na assembléia
   - Centralize envio em src/lib/email.ts: sendEmail({ to, subject, template, data })

NÃO FAÇA: Não implemente backup codes para 2FA (simplificar MVP). Não substitua os e-mails nativos do Supabase Auth — use os templates acima apenas para fluxos próprios (convites, voto remoto, boas-vindas).
ENTREGÁVEIS: Turnstile ativo em signup/login, rate limiting em endpoints críticos, 2FA configurável no perfil, 4 templates de e-mail enviando corretamente.
```

---

# FASE 2 — MÓDULOS CORE (Semanas 5–8)

---

## Sessão 2.1 — CRUD Membros + vínculos familiares

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Início da fase 2. Primeiro módulo: Membros.
REFERÊNCIA: PRD seção 11, TASK-MEM-01, TASK-MEM-02

TAREFAS:
1. A tabela members já foi criada na sessão 0.2. Crie uma migration ALTER TABLE para adicionar colunas faltantes do PRD 11.1 que não estavam no schema core (ex: received_at, baptized_at, address, tags). NÃO recrie a tabela.
2. Crie página /dashboard/membros/page.tsx:
   - Lista de membros com busca por nome (case-insensitive, diacríticos)
   - Agrupamento por família (cards de família)
   - Filtros: role, status (ativo/inativo)
   - Paginação (cursor-based ou offset)
   - Skeleton loading
3. Crie página /dashboard/membros/novo/page.tsx:
   - Form para cadastro manual de membro (liderança)
   - Validação Zod com CPF obrigatório
   - CPF criptografado no INSERT
4. Crie página /dashboard/membros/[id]/page.tsx:
   - Visualização do perfil do membro
   - Botão editar (se liderança)
   - Seção de vínculos familiares com botão para adicionar
5. Server Actions em src/actions/members.ts:
   - createMember, updateMember, deleteMember (soft-delete), listMembers
   - addFamilyLink(memberId, relatedMemberId, relationship) → bidirecional
   - removeFamilyLink → remove ambas direções
6. Todas as actions usam withPermission() e logAudit().

NÃO FAÇA: Não crie alteração de role aqui (sessão separada).
```

---

## Sessão 2.2 — Promoção/rebaixamento de role + gestão de membros

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: CRUD de membros pronto. Agora gestão de papéis.
REFERÊNCIA: PRD seção 8.3 (US-RBAC-03)

TAREFAS:
1. Na página de detalhe do membro (/membros/[id]):
   - Adicione dropdown de alteração de role (apenas pastor pode)
   - Confirmação antes da mudança
   - Registra audit_log com role anterior e novo
2. Atualize o JWT custom claims quando role muda:
   - Server Action updateMemberRole() atualiza member + refresha claims
3. Adicione na lista de membros:
   - Badge visual com o role ao lado do nome
   - Ação rápida "Promover" / "Rebaixar" via dropdown

NÃO FAÇA: Não crie o módulo de ministérios (próxima sessão).
```

---

## Sessão 2.3 — CRUD Eventos

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Membros prontos. Segundo módulo: Eventos.
REFERÊNCIA: PRD seção 13, TASK-EVT-01

TAREFAS:
1. Crie migration para tabela events + tabelas pivot (event_ministries,
   event_music_groups, event_resources).
2. Crie página /dashboard/eventos/page.tsx:
   - Lista de eventos futuros, ordenados por data
   - Card com: nome, data, horário, modalidade, responsável
   - Filtro por modalidade (online/presencial)
3. Crie página /dashboard/eventos/novo/page.tsx:
   - Form com validação condicional (local obrigatório se presencial,
     link obrigatório se online)
   - Seleção de responsável (apenas liderança)
   - Toggle de recorrência (semanal/mensal) — apenas o campo no form, SEM lógica de geração de instâncias (vem na sessão 2.9)
4. Crie página /dashboard/eventos/[id]/page.tsx:
   - Detalhes do evento
   - Tabs: Detalhes, Ministérios, Música, Recursos, Liturgia
   - Cada tab será populada nos módulos correspondentes
5. Server Actions em src/actions/events.ts:
   - createEvent, updateEvent, deleteEvent (soft-delete), listEvents

NÃO FAÇA: Não implemente recorrência complexa (será coberta na sessão 2.9). Não associe ministérios ainda.
```

---

## Sessão 2.4 — Agenda (visualização mensal/semanal)

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Eventos criados. Agora visualização de agenda.
REFERÊNCIA: PRD seção 12, TASK-AGD-01

TAREFAS:
1. Crie página /dashboard/agenda/page.tsx:
   - Toggle mensal / semanal
   - Visualização mensal: grid de dias com indicadores de eventos
   - Visualização semanal: timeline com horários
   - Clicar em dia → expandir lista de eventos
   - Toggle "ver todos" vs "minha unidade" (para congregações)
2. Use date-fns com locale pt-BR para formatação.
3. Query otimizada: buscar eventos apenas no range de datas visível.
4. Estado vazio: mensagem + CTA "Criar evento" (se liderança).
5. Componente Calendar reutilizável em src/components/modules/agenda/.

NÃO FAÇA: Não integre com landing page ainda.
```

---

## Sessão 2.5 — CRUD Ministérios + Escalas

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Eventos prontos. Agora ministérios e escalas.
REFERÊNCIA: PRD seções 14, 15, TASK-MIN-01, TASK-ESC-01

TAREFAS:
1. Crie migrations para: ministries, ministry_members, scales.
2. CRUD Ministérios (/dashboard/ministerios):
   - Lista com nome, conselheiro, líder, nº de componentes
   - Form de criação: nome, conselheiro (presbítero), líder
   - Gestão de componentes (adicionar/remover membros)
3. CRUD Escalas:
   - Quando ministério é associado a evento → escala vazia criada
   - Líder do ministério seleciona componentes para o evento
   - Componente vê "Minha escala" agrupada por mês
4. Server Actions: src/actions/ministries.ts, src/actions/scales.ts
5. Permissões: apenas pastor/presbítero criam ministérios.
   Apenas líder do ministério edita sua escala.
6. NÃO implemente notificações aqui. Apenas adicione um comentário TODO nos pontos onde a notificação será disparada (o sistema de notificações será criado na sessão 2.8).

NÃO FAÇA: Não crie escala automática por IA (sessão 5.6). Não crie o sistema de notificações (sessão 2.8).
```

---

## Sessão 2.6 — CRUD Grupos Musicais + Repertório

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Ministérios prontos. Agora música.
REFERÊNCIA: PRD seções 17, 18, TASK-GM-01, TASK-REP-01

TAREFAS:
1. Crie migrations para: music_groups, music_group_members, songs.
2. CRUD Grupos Musicais (/dashboard/grupos-musicais):
   - Lista, criação, gestão de componentes
   - Permissão: pastor/presbítero
3. CRUD Repertório (/dashboard/repertorio):
   - Lista de músicas do grupo com busca por nome/artista
   - Form: nome, artista, letra, link cifra, link YouTube, mensagem central
   - Permissão: líder do grupo musical
4. Componente SongCard com expansão para letra e links.
5. Server Actions: src/actions/music-groups.ts, src/actions/songs.ts

NÃO FAÇA: Não integre com liturgia ainda (fase 4).
```

---

## Sessão 2.7 — CRUD Recursos

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Música pronta. Último CRUD da fase 2.
REFERÊNCIA: PRD seção 19, TASK-REC-01

TAREFAS:
1. Crie migration para: resources, event_resources.
2. CRUD Recursos (/dashboard/recursos):
   - Lista com badge de status (disponível/indisponível)
   - Form: nome, responsável, valor estimado
   - Alocação a eventos com check de conflito por data/horário
3. Quando evento é excluído → recurso volta a disponível (trigger ou action).
4. Server Actions: src/actions/resources.ts
5. Permissão: pastor, presbítero, diácono.

NÃO FAÇA: Não crie relatório de patrimônio.
```

---

## Sessão 2.8 — Associações de eventos (ministérios, música, recursos)

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Todos os CRUDs base prontos. Agora conectar.
REFERÊNCIA: PRD seção 13.4, TASK-EVT-02

TAREFAS:
1. Na página de detalhe do evento (/eventos/[id]):
   - Tab Ministérios: buscar e associar ministérios → cria escala vazia
   - Tab Música: buscar e associar grupo musical
   - Tab Recursos: buscar e alocar recurso (com check de conflito)
2. Ao associar ministério → notificação in-app para líder do ministério.
3. Ao remover ministério do evento → remove escala vinculada (se vazia).
4. Ao remover recurso → libera disponibilidade.
5. Crie sistema de notificações in-app simples:
   - Tabela notifications (id, member_id, church_id, type, message, read, created_at)
   - Ícone de sino no header com badge de contagem
   - Dropdown com lista de notificações
   - Marcar como lido

NÃO FAÇA: Não use push notifications (OneSignal vem depois).
```

---

## Sessão 2.9 — Recorrência complexa de eventos

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: CRUD de eventos funcional. Agora regras de recorrência adiadas na sessão 2.3.
REFERÊNCIA: PRD seção 13.1 (recurrence_rule jsonb), TASK-EVT-01 TEST 7

TAREFAS:
1. Defina o schema de recurrence_rule (JSONB):
   { frequency: 'weekly'|'monthly', interval: number, days_of_week?: number[], end_date?: string, count?: number }
2. Server Action generateRecurringInstances(parentEventId):
   - Gera até 52 instâncias (máximo 1 ano a partir da data base)
   - Cada instância é um evento independente com parent_event_id = parentEventId
   - Usa date-fns addWeeks / addMonths para calcular datas
   - Transação DB: insere todas as instâncias ou nenhuma
3. Na página de criação/edição do evento — seção "Repetição":
   - Toggle "Repetir este evento"
   - Frequência: Semanal / Mensal
   - Dias da semana (se semanal): checkboxes Dom–Sáb
   - Encerramento: "Após N ocorrências" OU "Em determinada data"
   - Preview: "Este evento se repetirá N vezes até DD/MM/AAAA"
4. Edição/exclusão de evento recorrente:
   - Dialog com 3 opções: "Apenas este" | "Este e todos os próximos" | "Todos"
   - "Este e todos os próximos": deleta/atualiza instâncias com date >= data atual
   - "Todos": afeta todas as instâncias do mesmo parent_event_id
5. Na agenda e na lista de eventos: badge "Recorrente" + ícone de repetição no card.

NÃO FAÇA: Não implemente RRULE completo nem use rrule.js. Mantenha lógica simples com date-fns.
```

---

# FASE 3 — INTERAÇÃO + ENGAJAMENTO (Semanas 9–11)

---

## Sessão 3.1 — Mural de interação (posts + comentários)

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Início da fase 3. Módulo social.
REFERÊNCIA: PRD seção 21, TASK-MUR-01

TAREFAS:
1. Crie migrations para: posts, comments, reactions.
2. Página /dashboard/mural/page.tsx:
   - Feed de posts com scroll infinito (cursor-based pagination)
   - Form de criação de post (textarea, max 2000 chars)
   - PostCard: avatar, nome, tags de role, streak (placeholder), conteúdo, ações
   - Comentários inline (expandir/colapsar)
   - Sanitização com DOMPurify no servidor
3. Server Actions: src/actions/posts.ts
   - createPost, deletePost, createComment, deleteComment
4. Permissões: todos postam, autor deleta o próprio, pastor deleta qualquer um.

NÃO FAÇA: Não implemente reações nem fixação (próxima sessão).
```

---

## Sessão 3.2 — Reações, fixação e algoritmo de relevância

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
REFERÊNCIA: PRD seção 21, TASK-MUR-02, TASK-MUR-03

TAREFAS:
1. Botões "Orar" e "Gratidão" no PostCard:
   - Toggle (reage/desreage)
   - Contadores visuais
   - Unique constraint (post_id, member_id, type)
2. Fixação de post:
   - Apenas pastor/presbítero
   - Campo pinned_until (timestamp) → desfixa automaticamente
   - Post fixado: badge visual + posicionado no topo
3. Algoritmo de relevância (ORDER BY):
   - 1º: Posts fixados (pinned_until > now())
   - 2º: Posts de liderança
   - 3º: Score = (reactions * 0.3) + (comments * 0.5) - (age_hours * 0.01)
   - 4º: created_at DESC
4. Server Actions: reactToPost, pinPost, unpinPost

NÃO FAÇA: Não use Supabase Realtime no mural (overhead desnecessário para MVP).
```

---

## Sessão 3.3 — Gamificação: equipes + pontuação + placar

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
REFERÊNCIA: PRD seção 22, TASK-GAM-01, TASK-GAM-02

TAREFAS:
1. Crie migrations: teams, member_teams, score_events.
2. Seed: 12 equipes (Tribos de Israel) criadas automaticamente por tenant.
   Nomes: Rúben, Simeão, Levi, Judá, Dã, Naftali, Gade, Aser, Issacar, Zebulom, José, Benjamim.
3. Atribuição automática no cadastro: equipe com menos membros.
4. Página /dashboard/gamificacao/page.tsx:
   - Placar (Leaderboard) com tabs mensal/anual
   - Lista de equipes com pontuação e nº membros
   - Ranking individual (top 10)
   - Design de "scoreboard" com energia visual:
     - Top 3 destacados com tamanho/estilo diferenciado (pódio visual)
     - Barras de progresso animadas (Framer Motion) mostrando pontuação relativa
     - Cada tribo com cor própria (definir 12 cores distintas mas harmônicas no seed)
     - Animação de transição quando ranking muda (layout animation do Framer Motion)
     - Badge visual da tribo ao lado do nome do membro em todo o app
5. Sistema de pontuação (triggers ou Server Actions):
   - Check-in em evento → +10 pts
   - Visitante cadastrado via link pessoal → +50 pts
   - Leitura diária → +5 pts (sessão 3.4)
6. View materializada ou query agregada para placar.

NÃO FAÇA: Não crie badges (sessão 3.5). Não crie check-in por QR (sessão 3.6).
```

---

## Sessão 3.4 — Streaks de devoção

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
REFERÊNCIA: PRD seção 22, TASK-GAM-03

TAREFAS:
1. Crie migrations: devotion_streaks, daily_readings.
2. Seed: daily_readings com os primeiros 90 dias da sequência bíblica (Gn 1 a Gn 50, Ex 1 a Ex 40). O restante será adicionado em seeds incrementais futuros. NÃO gere os 1.189 capítulos de uma vez.
3. Widget de leitura diária no dashboard home:
   - Exibe capítulo do dia
   - Botão "Li!" que marca como lido
   - Foguinho animado (Framer Motion) se streak ativo
4. Lógica de streak:
   - Marcar leitura → incrementa current_streak, atualiza last_read_date
   - Não ler por 1 dia → reset (job cron ou check no login)
   - Streak de 7 dias → +20 pts bônus
   - Streak de 30 dias → +100 pts bônus
5. Exibir foguinho no avatar do membro (PostCard do mural, perfil).
6. Server Actions: src/actions/devotion.ts
```

---

## Sessão 3.5 — Badges e conquistas

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
REFERÊNCIA: PRD seção 22, TASK-GAM-04

TAREFAS:
1. Crie migrations: badges, member_badges.
2. Seed badges iniciais:
   - "Primeiro check-in" (trigger: primeiro check_in)
   - "Evangelista" (trigger: 5 convites aceitos)
   - "Fiel" (trigger: streak de 7 dias)
   - "Devoto" (trigger: streak de 30 dias)
   - "Veterano" (trigger: 1 ano de cadastro)
3. Página /dashboard/perfil com seção de badges:
   - Grid com badges desbloqueados (coloridos) e bloqueados (cinza)
   - Animação de desbloqueio (Framer Motion)
4. Sistema de triggers:
   - DB function ou Server Action que verifica condições e atribui badge
   - Unique constraint (member_id, badge_id)
5. Server Actions: src/actions/badges.ts
```

---

## Sessão 3.6 — Check-in por QR Code

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
REFERÊNCIA: PRD seção 25, TASK-QR-01, TASK-QR-02

TAREFAS:
1. Crie migration: check_ins.
2. Tela de exibição (/dashboard/eventos/[id]/checkin):
   - QR code dinâmico (qrcode.react) com token assinado (Ed25519)
   - Rotação a cada 30s via Supabase Realtime
   - Countdown visual
   - Contagem em tempo real de check-ins
3. Tela de scan (/dashboard/checkin):
   - Scanner via câmera (qr-scanner)
   - Feedback imediato (sucesso/erro)
4. Validação do check-in (Server Action):
   - Verifica assinatura Ed25519
   - Verifica timestamp (janela de 60s)
   - Verifica nonce single-use (Upstash Redis, TTL 120s)
   - Verifica se membro já fez check-in no evento
   - Geolocalização opcional (Haversine distance)
   - Rate limit: 1 check-in por membro por evento
5. Check-in registrado → trigger de pontuação (+10 pts gamificação).
6. URL curta para visitantes sem app: /c/{shortToken} → página web de check-in.

NÃO FAÇA: Não implemente geofencing complexo. Raio fixo configurável basta.
```

---

## Sessão 3.7 — Tags de atribuição + painel admin SaaS

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Gamificação completa. Agora tags de perfil e painel administrativo global do SaaS.
REFERÊNCIA: PRD seção 22.1 (US-GAM-05, US-GAM-06), PRD seção 8.1 (US-RBAC-01)

TAREFAS:
1. Tags de atribuição no perfil do membro:
   - Migration: adicione coluna tags text[] DEFAULT '{}' ao members
   - Limite: até 3 tags por membro
   - Tags sugeridas (chips pré-definidos): "Intercessor", "Servidor", "Líder de Louvor",
     "Evangelista", "Discipulador", "Testemunha" + opção de texto livre
   - UI: no formulário de edição do membro (apenas liderança pode definir)
   - Exibição: chips coloridos no PostCard do mural (ao lado do badge de role) e na página de perfil
2. Painel admin SaaS em /admin/* (route group isolado do dashboard):
   - Middleware exclusivo: bloqueia qualquer role diferente de "admin" com redirect para /dashboard
   - /admin/dashboard:
     - Cards com métricas agregadas: tenants ativos, total de membros, breakdown por plano
     - Apenas metadados — sem nomes, CPFs ou dados sensíveis
   - /admin/gamificacao/equipes: listar, criar, editar nome/cor das 12 tribos padrão global
   - /admin/gamificacao/badges:
     - CRUD de badges globais (nome, descrição, ícone via Supabase Storage, tipo de trigger)
   - /admin/gamificacao/pontuacao: editar valores padrão da tabela de pontuação
3. RLS para admin:
   - Policy em members: admin vê apenas id, name, church_id, role (excluir CPF, RG, address, phone)
   - Policy em transactions: admin não visualiza (RLS bloqueia totalmente)
   - Policy em votes: admin não visualiza voter_hash nem candidate_id
   - Teste: query SELECT * FROM members como admin não retorna CPF

NÃO FAÇA: Não crie chat de suporte nem gerenciamento de billing no painel admin (vem na fase 5).
```

---

# FASE 4 — FEATURES AVANÇADAS (Semanas 12–14)

---

## Sessão 4.1 — Financeiro (contas + transações + KPIs)

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
REFERÊNCIA: PRD seção 20, TASK-FIN-01, TASK-FIN-02

TAREFAS:
1. Crie migrations: accounts, transactions com:
   - Trigger para atualizar current_balance em cada INSERT
   - Policy de imutabilidade: DENY UPDATE/DELETE em transactions
   - Criptografia AES-256 para account_number
2. Página /dashboard/financeiro:
   - KPI cards no topo: saldo total, receitas do ano, despesas do ano
   - Lista de transações com filtros (tipo, categoria, período, conta)
   - Botão "Nova entrada" / "Nova saída"
   - Botão "Estorno" (cria transação inversa)
3. Página /dashboard/financeiro/contas:
   - Lista de contas com saldo individual
   - Form de criação de conta
4. Upload de comprovante via Supabase Storage.
5. Flag shared_finances do tenant:
   - true → saldo consolidado (matriz + congregações)
   - false → saldo apenas da unidade
6. Permissões: CRUD = tesoureiro. Leitura = pastor, presbítero, diácono.

NÃO FAÇA: Não crie relatórios avançados com gráficos (add-on premium).
```

---

## Sessão 4.2 — Assembléia + Eleição/Votação

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
REFERÊNCIA: PRD seções 23, 24, TASK-ASM-01, TASK-VOT-01, TASK-VOT-02

TAREFAS:
1. Crie migrations: assemblies, elections, election_candidates,
   election_salts, votes.
2. CRUD Assembléias (/dashboard/assembleia):
   - Lista ordenada por data
   - Form: nome, data, horário, local, motivo, pauta, has_election
3. Sistema de eleição:
   - State machine: rascunho → aberta → encerrada/cancelada
   - Adicionar candidatos por cargo ou votação sim/não
   - Quórum calculado automaticamente (count membros ativos)
4. Votação anônima:
   - voter_hash = SHA-256(member_id + election_id + salt)
   - Salt único por eleição (tabela election_salts, acesso restrito)
   - Unique constraint (election_id, voter_hash)
   - Voto remoto: revalidar senha + código por email (Resend)
5. Resultado: contagem por candidato/cargo, verificação de quórum.
6. Permissão: pastor cria assembléia, pastor/presbítero cria eleição.

NÃO FAÇA: Não integre com check-in de QR code na votação (simplificar MVP).
```

---

## Sessão 4.3 — Liturgia (esqueleto editável)

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
REFERÊNCIA: PRD seção 16, TASK-LIT-01

TAREFAS:
1. Crie migrations: liturgies, liturgy_items.
2. Na página de detalhe do evento, tab Liturgia:
   - Botão "Adicionar liturgia" → cria com esqueleto padrão (11 itens)
   - Drag-and-drop para reordenar itens
   - Adicionar/remover itens customizados
   - Cada item: tipo, título, conteúdo (leitura bíblica, música, texto livre)
3. Componente LiturgyViewer para leitura por membros.
4. Permissão: apenas responsável do evento edita. Todos leem.
5. Server Actions: src/actions/liturgy.ts

NÃO FAÇA: Não integre IA (sessão 5.1). Não crie base bíblica (sessão 5.1).
```

---

## Sessão 4.4 — Landing page personalizável

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
REFERÊNCIA: PRD seção 10, TASK-LP-01, TASK-LP-02

TAREFAS:
1. Dynamic route /[slug]/page.tsx com ISR (revalidate: 3600):
   - Renderiza landing do tenant correspondente
   - Seções: Hero, Sobre Nós, Sobre o Pastor, Liderança, Próximos Eventos,
     Transmissão, Endereço (Google Maps embed), CTA de Cadastro
   - Seções opcionais ocultadas se dados vazios
   - Scroll animations com Framer Motion:
     - Seções reveladas com fade-up ao entrar no viewport (IntersectionObserver + Framer Motion)
     - Staggered reveal em listas (liderança, eventos)
     - Parallax sutil na hero image (translateY proporcional ao scroll, máx 30px)
   - Direção visual da landing:
     - Hero: tipografia Instrument Serif em tamanho display grande, CTA proeminente,
       imagem ou gradiente atmosférico como background
     - Tom: profissional mas acolhedor — NÃO corporativo/frio nem "template de igreja"
     - Seção "Sobre o Pastor": layout assimétrico com foto e citação em destaque
     - Transições entre seções: espaçamento generoso (min 80px), separadores visuais sutis
     - CTA final: destaque visual forte, contrastante com o resto da página
2. Painel de personalização (/dashboard/landing-page):
   - Upload de imagem hero (Supabase Storage, max 5MB)
   - Edição de textos (sobre nós, slogan)
   - Reordenação de seções (drag-and-drop)
   - Preview em tempo real
   - Botão "Publicar" que dispara revalidação ISR
3. CTA de cadastro na landing → cria visitante no tenant.

NÃO FAÇA: Não implemente domínio personalizado (sessão 4.5).
```

---

## Sessão 4.5 — Domínio personalizado (subdomínio)

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
REFERÊNCIA: PRD seção 10, TASK-LP-03

TAREFAS:
1. Subdomínio padrão: {slug}.Koinos via CNAME.
2. Middleware para resolver tenant a partir do hostname.
3. Tela de configuração de domínio personalizado:
   - Instruções DNS (CNAME ou A record)
   - Verificador de propagação DNS
   - SSL automático via Vercel
4. Link "Acessar sistema" no domínio personalizado → redireciona para app.Koinos.

NÃO FAÇA: Não implemente SSL customizado fora do Vercel.
```

---

## Sessão 4.6 — Gestão de multi-congregações

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Features avançadas prontas. Agora suporte completo à hierarquia matriz ↔ congregações.
REFERÊNCIA: PRD seção 3.1, PRD seção 9.1 (parent_tenant_id, shared_finances)

TAREFAS:
1. Página /dashboard/configuracoes/congregacoes (plano Catedral, apenas pastor da matriz):
   - Listar congregações vinculadas (WHERE parent_tenant_id = tenant atual)
   - Botão "Adicionar congregação":
     - Form: nome, endereço, denominação da congregação
     - Cria novo tenant com parent_tenant_id = tenant da matriz
     - Gera link de convite especial (tipo "pastor_congregacao") para o líder assumir
   - Toggle shared_finances por congregação
   - Botão desativar congregação (is_active = false no tenant filho)
2. Visualização cross-congregação para liderança da matriz:
   - Membros: filtro "Unidade" (dropdown com matriz + congregações)
   - Agenda: toggle "Ver eventos de todas as unidades" (filtra por parent_tenant_id)
   - Financeiro (se shared_finances = true): saldo consolidado com breakdown por unidade
3. RLS para hierarquia:
   - Migration: nova policy em tenants — pastor da matriz pode SELECT em tenants filhos
   - Members: liderança da matriz pode SELECT em membros de congregações filhas
   - Liderança de congregação: apenas seu tenant (sem acesso à matriz nem a irmãs)
4. Atualize JWT custom claims para incluir parent_tenant_id (se for congregação).

NÃO FAÇA: Não implemente transferência de membro entre congregações. Hierarquia máxima: 2 níveis (matriz → congregação, sem sub-congregações).
ENTREGÁVEIS: Pastor da matriz consegue criar, listar e gerenciar congregações; visualização consolidada funciona.
```

---

## Sessão 4.7 — Relatórios financeiros avançados (add-on premium)

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
CONTEXTO: Financeiro básico pronto. Agora o add-on de relatórios com gráficos.
REFERÊNCIA: PRD seção 4.2 (add-on "Financeiro com relatórios avançados e gráficos" R$ 39)

TAREFAS:
1. Instale recharts (compatível com shadcn/ui, sem overhead de D3).
2. Página /dashboard/financeiro/relatorios (protegida por <PremiumGate feature="financeiro_avancado">):
   - Filtros: período (mês atual / trimestre / ano / personalizado) e conta
   - Gráfico de barras: receitas vs despesas por mês (últimos 12 meses)
   - Gráfico de pizza: distribuição de receitas por categoria (dízimo, oferta, doação, campanha, outro)
   - Gráfico de pizza: distribuição de despesas por categoria
   - Tabela de top contribuintes: top 10 membros por total de contribuições no período
     (visível apenas para tesoureiro e pastor)
3. Export:
   - CSV: transactions filtradas pelo período (botão "Exportar CSV")
   - PDF simples com totais + gráficos renderizados no servidor (@react-pdf/renderer)
4. Server Action getFinancialReport(period, accountId?) → dados agregados por mês e categoria.

NÃO FAÇA: Não use Chart.js nem D3.js — apenas Recharts. Não exiba dados individuais de contribuição a roles abaixo de diácono.
```

---

# FASE 5 — PREMIUM + LANÇAMENTO (Semanas 15–16)

---

## Sessão 5.1 — Liturgia Inteligente (IA) + Base bíblica

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```
REFERÊNCIA: PRD seção 16, TASK-LIT-02, TASK-LIT-03

TAREFAS:
1. Crie migration: bible_verses (book, chapter, verse, text, version).
2. Seed com pelo menos 1 versão bíblica (verificar licenciamento).
   - API route GET /api/bible?ref=Jo+3:16&version=NVI
   - Index GIN para busca textual
3. Integração IA:
   - Server Action getAIRecommendations(objective, bibleVersion, musicGroupId)
   - Prompt system com repertório no prefix (context caching)
   - Schema Zod para validar response da IA
   - Fallback chain: GPT-4.1 → Gemini 2.5 Flash → resposta padrão
4. Na liturgia do evento:
   - Campo "Objetivo do culto" que dispara recomendação IA
   - Sugestões de leituras + cânticos do repertório
   - Aceitar/rejeitar cada sugestão
5. Feature flag: apenas plano Crescimento+ com add-on.

NÃO FAÇA: Não crie as 3 versões bíblicas completas sem verificar licenciamento.
```

---

## Sessão 5.2 — Sistema de billing (Stripe)

CONTEXTO: Features do produto prontas. Agora monetização.
REFERÊNCIA: PRD seção 4 (planos e preços), BRAIN.md seção 6 (tabelas billing)

TAREFAS:

1. Instale e configure o Stripe:
   - `stripe` (SDK Node.js) já instalado na sessão 0.1
   - Crie src/lib/stripe/client.ts com instância do Stripe usando STRIPE_SECRET_KEY
   - Crie src/lib/stripe/config.ts com mapeamento de planos:
     {
     crescimento: { priceId: env.STRIPE_PRICE_ID_CRESCIMENTO, limit: 300 },
     igreja: { priceId: env.STRIPE_PRICE_ID_IGREJA, limit: 1000 },
     catedral: { priceId: env.STRIPE_PRICE_ID_CATEDRAL, limit: Infinity }
     }

2. Crie migrations para: stripe_customers, subscriptions (versão atualizada).
   - stripe_customers: vincula church_id ao stripe_customer_id
   - subscriptions: espelha estado do Stripe localmente (source of truth = Stripe)
   - feature_flags: sem mudança (mesmo esquema)

3. Crie Server Actions em src/actions/billing.ts:
   - createCheckoutSession(churchId, planKey):
     → Busca ou cria Stripe Customer (usando email do pastor fundador)
     → Cria Checkout Session com mode: 'subscription'
     → Retorna URL do Checkout para redirect
   - createBillingPortalSession(churchId):
     → Cria sessão do Stripe Billing Portal
     → Retorna URL para redirect (gerenciar assinatura, cancelar, trocar plano)
   - getSubscriptionStatus(churchId):
     → Busca subscription local + valida com Stripe se necessário

4. Webhook handler em src/app/api/webhooks/stripe/route.ts:
   - Verificação de assinatura via stripe.webhooks.constructEvent()
     usando STRIPE_WEBHOOK_SECRET (NÃO use HMAC manual)
   - Eventos a tratar:
     → checkout.session.completed → cria/atualiza subscription local
     → customer.subscription.updated → atualiza plan, status, period
     → customer.subscription.deleted → marca subscription como cancelada
     → invoice.payment_failed → notifica pastor via email (Resend)
     → invoice.paid → atualiza status para ativo
   - Idempotência: verificar se evento já foi processado (campo stripe_event_id)
   - Responder sempre com 200 (mesmo em erro interno, logar no audit_log)

5. Página /dashboard/configuracoes/plano:
   - Exibe plano atual com features incluídas
   - Se plano Grátis: cards de upgrade com preços em BRL
     → Botão "Assinar" redireciona para Stripe Checkout
   - Se plano pago: botão "Gerenciar assinatura" abre Stripe Billing Portal
     (trocar plano, atualizar cartão, cancelar — tudo gerenciado pelo Stripe)
   - Badge de status: ativo, trial, past_due, canceled
   - Alerta se pagamento falhou (invoice.payment_failed)

6. Lógica de limites de membros:
   - Ao criar membro → verifica count vs limite do plano
   - Se atingiu limite → bloqueia criação + mostra CTA de upgrade
   - Não faz downgrade automático (apenas bloqueia novas adições)

7. Crie src/lib/stripe/helpers.ts:
   - getOrCreateStripeCustomer(churchId, email)
   - syncSubscriptionFromStripe(stripeSubscriptionId) → atualiza DB local
   - isFeatureEnabled(churchId, featureKey) → consulta subscription + feature_flags

NÃO FAÇA:

- Não implemente add-ons como assinaturas separadas no MVP. Use feature_flags manuais
  ativados pelo admin até validar demanda. Add-ons via Stripe virão no pós-MVP.
- Não crie UI customizada de pagamento. Use Stripe Checkout (hosted page).
- Não crie UI de gerenciamento de cartão/fatura. Use Stripe Billing Portal.
- Não implemente trial automático. Plano Grátis já serve como trial infinito.

ENTREGÁVEIS:

- Checkout funcional: pastor clica em "Assinar" → paga no Stripe → volta ao dashboard com plano ativo.
- Billing Portal funcional: pastor gerencia assinatura sem sair do app.
- Webhook processando eventos em tempo real.
- Feature flags bloqueando módulos por plano.

```

---

## Sessão 5.3 — Feature flags + PremiumGate

```

TAREFAS:

1. Seed feature_flags com features por plano:
   - Grátis: membros, agenda, eventos, mural, gamificação_basica
   - Crescimento: + ministérios, escalas, grupos_musicais, repertório, recursos
   - Igreja: + financeiro_basico, assembleia
   - Catedral: + multi_congregacao, suporte_prioritario
2. Add-ons: liturgia_ia, escala_ia, landing_dominio, financeiro_avancado,
   assembleia_votacao, analytics_gamificacao
3. Aplique <PremiumGate> em todas as rotas/funcionalidades restritas.
4. Testes: verificar que cada plano vê apenas o que deve ver.

```

---

## Sessão 5.4 — Testes E2E + audit de segurança

```

TAREFAS:

1. Configure Playwright para testes E2E.
2. Testes críticos:
   - Signup → criar igreja → dashboard
   - Convite → cadastro → matching CPF
   - CRUD membros com permissões
   - Financeiro: imutabilidade de transações
   - Votação: anonimidade dos votos
   - Check-in: QR code válido vs expirado
   - RLS: tentativa de acesso cross-tenant
3. Audit de segurança:
   - Verificar CSP headers
   - Verificar rate limiting
   - Verificar sanitização de inputs
   - Verificar criptografia de dados sensíveis
   - Verificar que admin não vê dados sensíveis de tenants

```

---

## Sessão 5.5 — Polish + soft launch

> **UI:** Use `/impeccable craft` para implementar as telas desta sessão.

```

TAREFAS:

1. Performance:
   - Lighthouse score > 90 em todas as páginas
   - Skeleton loaders em todas as listas
   - Optimistic updates no mural
   - Prefetch de rotas adjacentes
2. SEO da landing page: meta tags, OG image, structured data.
3. Página de erro customizada (404, 500).
4. Onboarding tour (tooltip guiado para novos pastores).
5. Busca global (Cmd+K / ícone de lupa no mobile):
   - Use o componente Command do shadcn/ui
   - Busca em: membros (nome), eventos (nome + data), músicas (nome + artista), posts do mural (conteúdo)
   - Atalho Cmd+K no desktop, ícone de busca no Header mobile
   - Resultados agrupados por categoria com ícones
6. Dark mode programável por horário (completar PRD 7.2):
   - Adicione coluna dark_mode_schedule jsonb ao members: { enableAt: "18:00", disableAt: "06:00", enabled: boolean }
   - Página /dashboard/perfil/aparencia com toggle "Programar dark mode" + campos de horário
   - Hook useTheme() verifica a preferência e aplica na montagem/via intervalo
7. Job de anonimização LGPD (completar o adiado na sessão 1.4):
   - Supabase Edge Function agendada (cron diário às 02h)
   - Busca membros com is_active = false há mais de 30 dias sem anonimização
   - Substitui name, cpf, rg, email, phone, address por hashes SHA-256 irreversíveis
   - Mantém dados financeiros e audit_logs (retenção legal: 5 anos)
   - Registra no audit_log com action = 'anonymize_member'
8. Preparar dados para soft launch:
   - Crie um seed separado (supabase/seed-pilot.sql) com 2 igrejas de exemplo completas
     (membros, eventos, posts, transações) para demonstração.
   - NÃO entre em contato com igrejas reais — apenas prepare os dados de demo.
9. Documentar bugs conhecidos e limitações do MVP em um arquivo KNOWN_ISSUES.md na raiz.

```

---

## Sessão 5.6 — Escala automática por IA (add-on premium)

> **UI:** Use `/impeccable craft` para implementar as telas desta sessão.

```

CONTEXTO: Liturgia Inteligente pronta. Agora o add-on de escala automática por IA.
REFERÊNCIA: PRD seção 4.2 (add-on "Escala Automática por IA" R$ 19)

TAREFAS:

1. Feature flag: escala_ia (disponível a partir do plano Crescimento com add-on).
2. Na tab Ministério da página do evento (/eventos/[id]), seção de escala:
   - Botão "Sugerir escala com IA" (renderizado apenas se feature habilitada)
   - Input opcional: contexto do evento (ex: "culto de missões", "casamento", "louvorzão")
3. Server Action suggestScale(eventMinistryId, context?):
   - Busca componentes do ministério com seus últimos 4 eventos escalados
   - Calcula distribuição atual (quem foi escalado mais/menos vezes)
   - Monta prompt com: contexto do evento, membros disponíveis, histórico de participação
   - Chama GPT-4.1 com strict JSON schema: { suggestions: [{ memberId, reason: string }] }
   - Fallback: Gemini 2.5 Flash
   - Schema Zod para validar response da IA antes de retornar
4. UI de revisão das sugestões:
   - Card por sugestão: nome do membro + justificativa da IA
   - Checkbox para aceitar/rejeitar cada sugestão individualmente
   - Botão "Aplicar selecionados" → insere membros confirmados na escala (reutiliza a action da sessão 2.5)
5. Wrap completo com <PremiumGate feature="escala_ia"> com CTA de upgrade.

NÃO FAÇA: A IA apenas sugere — nunca salva a escala sem confirmação explícita do líder. Não implemente escala automática sem revisão humana.

```

---

## Sessão 5.7 — Notificações de escala + Analytics de Gamificação (add-on premium)

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```

CONTEXTO: Dois itens pendentes do PRD nunca receberam prompt de implementação.

PARTE A — Notificações de escala (TASK-ESC-01 TEST 6, pendente desde sessão 2.5)

TAREFAS:

1. Em src/actions/scales.ts, na função upsertScaleMember, remova o TODO e implemente:
   - Após inserir o membro na escala, chame createNotification() para o membro escalado
   - Conteúdo: "Você foi adicionado à escala de {nome_do_evento} ({nome_do_ministerio})"
   - Tipo de notificação: "scale_assignment"
2. Apenas dispare se o membro foi inserido (não em update de registro existente).
   Use o retorno do upsert para distinguir INSERT de UPDATE.

NÃO FAÇA: Não altere o schema do banco (tabela notifications já existe).
ENTREGÁVEIS: Membro recebe notificação in-app ao ser escalado.

---

PARTE B — Analytics de Gamificação (PRD Seção 4.2, add-on R$19)

CONTEXTO: A feature flag `analytics_gamificacao` existe em feature_flags mas nenhuma UI foi criada.
REFERÊNCIA: PRD seção 22 (métricas de engajamento), PRD seção 4.2 (add-on).

TAREFAS:

1. Página /dashboard/gamificacao/analytics (protegida por <PremiumGate feature="analytics_gamificacao">):
   - Visível apenas para pastor, presbítero e admin.
2. Server Action getGamificationAnalytics(period: 'month'|'year') em src/actions/gamification.ts:
   - Membros mais ativos (top 10 por pontuação, com nome e equipe)
   - Distribuição de pontos por tipo de ação (check-in, convite, leitura, streak) — agregado
   - Taxa de participação de cada equipe: membros com ao menos 1 ponto / total de membros
   - Evolução mensal de check-ins (últimos 6 meses) — apenas contagem, sem dados pessoais
3. UI analytics-view.tsx (client component):
   - KPI cards: total de pontos distribuídos no período, membros ativos (ao menos 1 score_event)
   - Gráfico de barras (Recharts): check-ins por mês (últimos 6 meses)
   - Gráfico de pizza (Recharts): distribuição de pontos por tipo de ação
   - Tabela: top 10 membros com nome, equipe e pontuação do período (sem CPF/email/phone)
   - Barras de progresso por equipe: taxa de participação (%)
4. Link "Analytics" adicionado à página /gamificacao (apenas roles pastor/presbítero/admin).

NÃO FAÇA: Não exponha dados pessoais sensíveis (CPF, telefone, endereço). Apenas nome e pontuação.
Não use D3.js — apenas Recharts (já instalado).
ENTREGÁVEIS: Dashboard de analytics de engajamento funcional, bloqueado pelo PremiumGate.

```

---

## Sessão 5.8 — Integração Repertório → Liturgia + Delegação ao líder musical

> **UI:** Use `/frontend-design` para implementar as telas desta sessão.

```

CONTEXTO: O PRD especifica que músicas do repertório devem ser linkadas diretamente
aos itens de liturgia (US-REP-04), e que o responsável pode delegar a escolha de músicas
ao líder do grupo musical (US-LIT-04). Nenhuma dessas features foi implementada.

REFERÊNCIA: PRD seções 16.1 (US-LIT-04, US-LIT-05), 18.2 (US-REP-04)

TAREFAS:

1. Tipo de item de liturgia "cântico" (tipo já existe no ENUM liturgy_item_type):
   - Adicione coluna song_id UUIDv7 nullable (FK para songs) na tabela liturgy_items.
   - Migration: ALTER TABLE liturgy_items ADD COLUMN song_id uuid REFERENCES songs(id) ON DELETE SET NULL.
2. Server Actions em src/actions/liturgy.ts:
   - addSongToLiturgy(liturgyId, songId, order_index): insere liturgy_item do tipo "cântico"
     com title = songs.name, content = songs.central_message, song_id = songId
   - Reutiliza a permissão canEditEventLiturgy existente
3. No LiturgyEditor (src/app/(dashboard)/eventos/[id]/liturgy-editor.tsx):
   - Quando o usuário clica "Adicionar item" e seleciona tipo "cântico",
     exibir campo de busca de músicas (debounced, busca no repertório do grupo musical associado)
   - Se não há grupo musical associado ao evento, busca em todos os grupos do tenant
   - SongSearchInput: input com autocomplete (lista nome + artista), seleção fecha e preenche o item
   - Reutilize a API /api/resources/search como modelo para criar /api/songs/search
     (GET, params: q, event_id opcional para filtrar pelo grupo musical do evento)
4. Delegação ao líder musical (US-LIT-04):
   - Adicione coluna music_delegated_to uuid nullable (FK members) na tabela liturgies
   - Migration: ALTER TABLE liturgies ADD COLUMN music_delegated_to uuid REFERENCES members(id) ON DELETE SET NULL
   - Server Action delegateMusicSelection(liturgyId, memberId): apenas responsável do evento,
     define music_delegated_to + cria notificação in-app para o líder musical delegado
   - Server Action revokeMusicDelegation(liturgyId): remove a delegação
   - No LiturgyEditor: se o usuário atual = music_delegated_to ou é responsável do evento,
     exibe banner "Você foi delegado para escolher as músicas deste culto" com badge âmbar
   - Botão "Delegar músicas" (apenas responsável): abre select de líder musical (filtra por
     líderes de grupos musicais associados ao evento)
5. No LiturgyViewer: para itens do tipo "cântico" com song_id,
   exibir link clicável para a música no repertório (/repertorio/{id}).

NÃO FAÇA: Não refatore o LiturgyEditor além do necessário para essas features.
Não implemente edição colaborativa em tempo real.
ENTREGÁVEIS: Liturgia permite buscar e linkar músicas do repertório; responsável pode
delegar seleção ao líder musical com notificação.

```

---

_Fim dos prompts. Atualize o BRAIN.md ao concluir cada sessão._
```
