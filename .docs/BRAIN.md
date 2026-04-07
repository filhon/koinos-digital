> **Propósito:** Este é o documento central de contexto do projeto. Toda sessão de desenvolvimento assistido por IA DEVE começar lendo este arquivo. Ele evita desvios, elimina redundâncias e economiza tokens.

**Última atualização:** 2026-04-07
**Fase atual:** 2 - Módulos Core
**Sessão atual:** 2.1

---

## 1. O que é o projeto (contexto mínimo)

SaaS de gestão para igrejas evangélicas brasileiras. Multi-tenant com RLS no Supabase/PostgreSQL. Mobile-first. Mercado BR com compliance LGPD.

**Stack fixa (não pergunte nem sugira alternativas):**

| Camada           | Tech                                                              |
| ---------------- | ----------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Turbopack)                                |
| UI               | React 19.2 + shadcn/ui v4 + Tailwind CSS 4                        |
| Linguagem        | TypeScript 6 (strict)                                             |
| DB/Auth          | Supabase (PostgreSQL 18, Auth, Storage, Realtime, Edge Functions) |
| Validação        | Zod + React Hook Form                                             |
| Estado servidor  | @tanstack/react-query                                             |
| Datas            | date-fns (pt-BR)                                                  |
| Animações        | Framer Motion                                                     |
| Cache/Rate Limit | Upstash Redis                                                     |
| Email            | Resend (React Email)                                              |
| Pagamento        | AbacatePay (PIX)                                                  |
| IA (Liturgia)    | GPT-4.1 → fallback Gemini 2.5 Flash                               |
| Deploy           | Vercel                                                            |
| QR Code          | qrcode.react + qr-scanner                                         |

---

## 2. Estrutura de diretórios (padrão do projeto)

```
Koinos/
├── src/
│   ├── app/                    # App Router (Next.js 16)
│   │   ├── (auth)/             # Rotas públicas (login, signup, convite)
│   │   ├── (dashboard)/        # Rotas protegidas
│   │   │   ├── membros/
│   │   │   ├── agenda/
│   │   │   ├── eventos/
│   │   │   ├── ministerios/
│   │   │   ├── escalas/
│   │   │   ├── liturgia/
│   │   │   ├── grupos-musicais/
│   │   │   ├── repertorio/
│   │   │   ├── recursos/
│   │   │   ├── financeiro/
│   │   │   ├── mural/
│   │   │   ├── gamificacao/
│   │   │   ├── assembleia/
│   │   │   ├── configuracoes/
│   │   │   └── landing-page/
│   │   ├── [slug]/             # Landing page pública por tenant
│   │   ├── api/
│   │   │   ├── checkin/
│   │   │   ├── bible/
│   │   │   ├── webhooks/
│   │   │   └── ai/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Landing do SaaS
│   ├── components/
│   │   ├── ui/                 # shadcn/ui (ownership)
│   │   ├── layout/             # Shell, Sidebar, BottomNav, Header
│   │   ├── forms/              # Form components reutilizáveis
│   │   └── modules/            # Componentes por módulo
│   ├── lib/
│   │   ├── supabase/           # Client, server, middleware helpers
│   │   ├── auth/               # Session, permissions, RBAC
│   │   ├── validators/         # Schemas Zod
│   │   ├── encryption/         # AES-256 helpers (CPF, RG, conta)
│   │   ├── utils/              # Helpers (CPF validator, formatters)
│   │   └── constants/          # Enums, roles, planos
│   ├── hooks/                  # Custom hooks
│   ├── types/                  # TypeScript types/interfaces
│   ├── styles/                 # Global CSS + Tailwind config
│   └── actions/                # Server Actions por módulo
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── seed.sql                # Seed data
│   └── config.toml
├── public/
├── tests/                      # Testes E2E (Playwright)
└── docs/                       # PRD, BRAIN.md, PROMPTS.md
```

---

## 3. Regras invioláveis

1. **Todo CRUD usa Server Actions** com validação Zod. Nunca API routes para mutações internas.
2. **RLS obrigatório** em todas as tabelas. Toda tabela tem `church_id`. Nunca confiar no client.
3. **Dados sensíveis (CPF, RG, conta bancária) são criptografados** com AES-256 em repouso.
4. **Transações financeiras são imutáveis.** Correção = estorno (nova transação inversa).
5. **Consentimento LGPD granular** registrado com timestamp, IP e versão dos termos.
6. **UUIDv7** para todas as PKs. Nunca auto-increment.
7. **Mobile-first.** Toda tela começa no celular. Desktop é adaptação.
8. **Sem vendor lock-in.** shadcn/ui com ownership total. Nada de libs UI opacas.
9. **Português do Brasil** como idioma padrão. i18n preparado mas não prioritário.
10. **Audit log** em toda operação sensível (quem, quando, o quê, IP).

---

## 4. Modelo RBAC (hierarquia de papéis)

```
admin (SaaS) → acesso global, sem dados sensíveis de tenants
  └── pastor → máximo dentro do tenant
       └── presbítero → gestão de ministérios, grupos, escalas, liturgia
            └── diácono → recursos, eventos, membros, lê financeiro
                 └── tesoureiro → CRUD exclusivo financeiro
                      └── líder → eventos, escalas do próprio ministério
                           └── membro → lê módulos públicos, posta no mural
                                └── visitante → acesso mínimo
```

**Regra de ouro:** a IA não deve inventar permissões. Sempre consultar a seção 8 do PRD.

---

## 5. Roadmap de fases e status

| Fase | Nome                    | Semanas | Status          | Sessões   |
| ---- | ----------------------- | ------- | --------------- | --------- |
| 0    | Fundação                | 1–2     | 🔵 Em andamento | 0.1 → 0.6 |
| 1    | Onboarding + RBAC       | 3–4     | ⚪ Pendente     | 1.1 → 1.5 |
| 2    | Módulos Core            | 5–8     | ⚪ Pendente     | 2.1 → 2.8 |
| 3    | Interação + Engajamento | 9–11    | ⚪ Pendente     | 3.1 → 3.6 |
| 4    | Features Avançadas      | 12–14   | ⚪ Pendente     | 4.1 → 4.5 |
| 5    | Premium + Lançamento    | 15–16   | ⚪ Pendente     | 5.1 → 5.5 |

---

## 6. Tabelas do banco (checklist de criação)

> Marque com ✅ conforme as migrations forem criadas.

### Core

- [x] `tenants` (churches) — id, name, cnpj, slug, parent_tenant_id, shared_finances, plan, created_at
- [x] `members` — id, church_id, home_church_id, name, cpf (encrypted), rg (encrypted), email, birth_date, role, phone, avatar_url, invited_by, is_active, created_at, updated_at
- [x] `family_links` — id, church_id, member_id, related_member_id, relationship
- [x] `invite_links` — id, church_id, member_id (nullable), code, active, created_at
- [x] `consent_records` — id, member_id, purpose, consented, ip, terms_version, created_at
- [x] `audit_logs` — id, church_id, user_id, action, entity_type, entity_id, metadata, ip, created_at

### Eventos + Liturgia

- [ ] `events` — id, church_id, name, responsible_id, date, start_time, end_time, modality, location, meeting_link, description, is_recurring, recurrence_rule
- [ ] `event_ministries` — id, event_id, ministry_id
- [ ] `event_music_groups` — id, event_id, music_group_id
- [ ] `event_resources` — id, event_id, resource_id
- [ ] `liturgies` — id, event_id, church_id
- [ ] `liturgy_items` — id, liturgy_id, type, title, content, order

### Ministérios + Escalas

- [ ] `ministries` — id, church_id, name, counselor_id, leader_id
- [ ] `ministry_members` — id, ministry_id, member_id
- [ ] `scales` — id, event_ministry_id, member_id

### Música

- [ ] `music_groups` — id, church_id, name, leader_id
- [ ] `music_group_members` — id, music_group_id, member_id
- [ ] `songs` — id, music_group_id, church_id, name, artist, lyrics, chord_url, youtube_url, central_message

### Recursos

- [ ] `resources` — id, church_id, name, responsible_id, status, value

### Financeiro

- [ ] `accounts` — id, church_id, name, description, bank, agency, account_number (encrypted), initial_balance, current_balance
- [ ] `transactions` — id, church_id, account_id, type, date, description, category, value, member_id, receipt_url, notes

### Mural

- [ ] `posts` — id, church_id, author_id, content, pinned_until, created_at
- [ ] `comments` — id, post_id, church_id, author_id, content, created_at
- [ ] `reactions` — id, post_id, member_id, type (orar/gratidão)

### Gamificação

- [ ] `teams` — id, church_id, name, tribe_name
- [ ] `member_teams` — id, member_id, team_id
- [ ] `score_events` — id, member_id, team_id, church_id, points, action_type, reference_id, created_at
- [ ] `devotion_streaks` — id, member_id, current_streak, longest_streak, last_read_date
- [ ] `daily_readings` — id, date, book, chapter
- [ ] `badges` — id, name, description, icon_url, trigger_type, trigger_config
- [ ] `member_badges` — id, member_id, badge_id, unlocked_at

### Assembléia + Votação

- [ ] `assemblies` — id, church_id, name, date, start_time, location, reason, agenda, has_election
- [ ] `elections` — id, assembly_id, church_id, name, description, quorum, allow_remote_vote, status
- [ ] `election_candidates` — id, election_id, member_id, position
- [ ] `election_salts` — id, election_id, salt (acesso restrito)
- [ ] `votes` — id, election_id, candidate_id, voter_hash, voted_at, vote_method

### Check-in

- [ ] `check_ins` — id, event_id, member_id, checked_in_at, method, geo_lat, geo_lng

### Bíblia (Liturgia IA)

- [ ] `bible_verses` — id, book, chapter, verse, text, version

### Billing

- [ ] `subscriptions` — id, church_id, plan, status, started_at, expires_at
- [ ] `feature_flags` — id, plan, feature_key, enabled

---

## 7. Registro de sessões (log de progresso)

> Após cada sessão, registre aqui o que foi feito. A IA da próxima sessão lê apenas este log + a seção da fase atual.

| Sessão | Data | O que foi feito | Arquivos criados/modificados |
| 0.1 | 2026-04-07 | Scaffold do Next.js 16 + Tailwind v4 + TS 6 + Prettier/eslint + Husky/shadcn/dependências base + estrutura de pastas. | package.json, tsconfig.json, eslint.config.mjs, .husky/pre-commit, src/\* |
| 0.2 | 2026-04-07 | Inicialização do Supabase CLI, migration com schema core gerado | supabase/migrations/\*\_initial_core_schema.sql |
| 0.3 | 2026-04-07 | RLS policies multi-tenant + helpers SQL (get_my_church_id, get_my_role, is_leadership) + helpers TS Supabase (client/server/middleware) + src/lib/auth/session.ts | supabase/migrations/20260407120000_rls_policies.sql, src/lib/supabase/client.ts, src/lib/supabase/server.ts, src/lib/supabase/middleware.ts, src/lib/auth/session.ts |
| 0.4 | 2026-04-07 | Auth completo: middleware Next.js com proteção de rotas, Server Actions (signIn/signUp/signOut/resetPassword/updatePassword), validators Zod (loginSchema/signupSchema/resetSchema/newPasswordSchema), helper CPF (validateCPF/formatCPF), variants Framer Motion, 4 páginas de auth com split-screen design + dashboard placeholder | src/middleware.ts, src/actions/auth.ts, src/lib/validators/auth.ts, src/lib/utils/cpf.ts, src/lib/motion.ts, src/app/(auth)/layout.tsx, src/app/(auth)/login/page.tsx, src/app/(auth)/signup/page.tsx, src/app/(auth)/esqueci-senha/page.tsx, src/app/(auth)/redefinir-senha/page.tsx, src/app/(dashboard)/layout.tsx, src/app/(dashboard)/dashboard/page.tsx |
| 0.5 | 2026-04-07 | Design system completo: globals.css com paleta OKLCH "warm editorial" (azul-petróleo/âmbar-cobre/semânticas/superfícies), tipografia Instrument Serif + DM Sans, shadow tokens com matiz, dark mode via classe .dark + cookie SSR + hook useTheme, ThemeProvider client, motion.ts reescrito com fadeIn/slideUp/scaleIn/stagger/pageTransition/sidebarSpring, 13 componentes shadcn instalados e customizados (Button/Input/Card/Skeleton/+), layout AppShell + Sidebar colapsável + BottomNav mobile + Header glass + PageHeader, dashboard layout atualizado com AppShell | src/styles/globals.css, src/app/layout.tsx, src/lib/theme.ts, src/lib/motion.ts, src/components/layout/ThemeProvider.tsx, src/components/layout/AppShell.tsx, src/components/layout/Sidebar.tsx, src/components/layout/BottomNav.tsx, src/components/layout/Header.tsx, src/components/layout/PageHeader.tsx, src/components/layout/index.ts, src/components/ui/button.tsx, src/components/ui/input.tsx, src/components/ui/card.tsx, src/components/ui/skeleton.tsx, src/components/ui/{input,label,dialog,sheet,sonner,dropdown-menu,avatar,badge,separator,tabs}.tsx, src/app/(dashboard)/layout.tsx |
| 0.6 | 2026-04-07 | Helpers de encryption (AES-256-GCM), formatters (currency/date/phone pt-BR), Server Action logAudit, matriz de permissões RBAC (PERMISSIONS_MATRIX + checkPermission + isLeadershipRole), hook usePermissions, componente PermissionGate | src/lib/encryption/aes.ts, src/lib/utils/formatters.ts, src/actions/audit.ts, src/lib/auth/permissions.ts, src/hooks/usePermissions.ts, src/components/ui/permission-gate.tsx |
| 0.7 | 2026-04-07 | Security headers (CSP/HSTS/X-Frame/nosniff/Referrer/Permissions-Policy) no next.config.mjs, dependabot.yml (npm semanal + actions mensal), CI com jobs sequenciais type-check→lint→build + npm audit, vercel.json com região gru1 | next.config.mjs, .github/dependabot.yml, .github/workflows/ci.yml, vercel.json |
| 1.1 | 2026-04-07 | Wizard multi-step de criação de igreja (4 steps: dados pessoais, consentimentos LGPD, dados da igreja, confirmação), Server Action createChurch com validação Zod + unicidade CNPJ/nome + associação como visitante + INSERT tenant+member+invite_link + consentimento LGPD + JWT custom claims via admin client + audit_log, schema Zod onboarding, admin client Supabase, /signup/igreja adicionada às rotas públicas do middleware | src/lib/validators/onboarding.ts, src/actions/onboarding.ts, src/lib/supabase/admin.ts, src/app/(auth)/signup/igreja/page.tsx, src/middleware.ts |
| 1.2 | 2026-04-07 | Fluxo completo de convite: página /convite/[code] (valida código, exibe form ou erro amigável), Server Action registerMember com CPF matching (associa existente / atualiza email / cria visitante), registro de invited_by, consentimentos LGPD, JWT claims; Server Actions generateInviteLink (pessoal/geral com RBAC), revokeInviteLink, getInviteLinks; painel /dashboard/configuracoes/convites com listagem, geração e revogação de links + clipboard API; formatPhone adicionado ao utils/cpf; schema registerMemberSchema adicionado aos validators; correção de erros TS pré-existentes em signup/igreja (useForm sem generic explícito) | src/lib/validators/onboarding.ts, src/actions/onboarding.ts, src/lib/utils/cpf.ts, src/app/(auth)/convite/[code]/page.tsx, src/app/(auth)/convite/[code]/invite-register-form.tsx, src/app/(dashboard)/configuracoes/convites/page.tsx, src/app/(dashboard)/configuracoes/convites/invite-links-panel.tsx, src/app/(auth)/signup/igreja/page.tsx |
| Extra | 2026-04-07 | Auditoria do banco via Supabase MCP Advisors + migration de correções de segurança e performance: search_path fixo nas 5 funções SQL/plpgsql, pg_trgm movido para schema extensions, policy members_update unificada (eliminou múltiplas permissive policies + fix auth.uid() por row), 10 índices criados em FKs sem cobertura | supabase/migrations/20260407130000_security_performance_fixes.sql |
| 1.3 | 2026-04-07 | RBAC end-to-end: middleware refinado com guards de role por rota (/financeiro → tesoureiro+, /configuracoes e /assembleia → pastor); decorator withPermission para Server Actions com log de tentativas negadas; Sidebar e BottomNav filtram itens por role (Financeiro/Assembleia/Configurações ocultos para membro/visitante); página /403 com mensagem amigável | src/middleware.ts, src/lib/auth/with-permission.ts, src/components/layout/Sidebar.tsx, src/components/layout/BottomNav.tsx, src/app/403/page.tsx |
| 1.4 | 2026-04-07 | Perfil editável + portal de privacidade LGPD: migration address JSONB + bucket avatars (Storage RLS), validators profile.ts, Server Actions getProfile/updateProfile (profile.ts) e getConsents/updateConsent/exportMyData/requestDeletion (privacy.ts), página /perfil com AvatarUpload (resize canvas 400×400, webp, 2MB), ProfileForm (phone + address editável, leitura nome/email/role), página /perfil/privacidade com 4 tabs LGPD (Meus Dados / Consentimentos com toggle imutável / Exportar JSON+CSV / Excluir com dupla confirmação + soft-delete), Header linkado para /perfil via useRouter | supabase/migrations/20260407140000_member_address_and_storage.sql, src/lib/validators/profile.ts, src/actions/profile.ts, src/actions/privacy.ts, src/app/(dashboard)/perfil/page.tsx, src/app/(dashboard)/perfil/profile-form.tsx, src/app/(dashboard)/perfil/avatar-upload.tsx, src/app/(dashboard)/perfil/privacidade/page.tsx, src/app/(dashboard)/perfil/privacidade/privacy-portal.tsx, src/components/layout/Header.tsx |
| 1.5 | 2026-04-07 | Dados de teste injetados (seed.sql) populando 1 tenant ("Igreja Teste"), 8 usuários diversos cobrindo todos os roles principais do sistema, 3 relacionamentos de família e 2 links de convite ativos; Criação da documentação padrão do README com instruções de setup local e credenciais para teste de validação E2E da Fase 1. | supabase/seed.sql, README.md |
| 1.6 | 2026-04-07 | Segurança multicamada: Cloudflare Turnstile (modo managed) em login e signup com validação server-side via siteverify; rate limiting Upstash Redis (signIn 5/15min, signUp 10/hora, checkin 100/min, ai 10/min por usuário) com header Retry-After; 2FA TOTP via Supabase Auth MFA (enroll QR code, verify, unenroll com reauth de senha, página /perfil/seguranca, página /verificar-2fa, middleware AAL2 para rotas sensíveis); 4 templates React Email (welcome, invite, reset-password, vote-code) + helper centralizado sendEmail via Resend; API routes /api/checkin e /api/ai com rate limiting; link de Segurança adicionado à página de perfil. | src/lib/rate-limit.ts, src/lib/turnstile.ts, src/lib/email.ts, src/actions/auth.ts, src/actions/mfa.ts, src/app/(auth)/login/page.tsx, src/app/(auth)/signup/page.tsx, src/app/(auth)/verificar-2fa/page.tsx, src/app/(dashboard)/perfil/seguranca/page.tsx, src/app/(dashboard)/perfil/seguranca/security-panel.tsx, src/app/(dashboard)/perfil/page.tsx, src/app/api/checkin/route.ts, src/app/api/ai/route.ts, src/emails/welcome.tsx, src/emails/invite.tsx, src/emails/reset-password.tsx, src/emails/vote-code.tsx, src/middleware.ts, .env.example |

---

## 8. Convenções de código

- **Naming:** camelCase para variáveis/funções, PascalCase para componentes/types, snake_case para colunas DB
- **Arquivos:** kebab-case para nomes de arquivos (ex: `member-card.tsx`)
- **Imports:** absolutos com `@/` (alias para `src/`)
- **Server Actions:** em `src/actions/{modulo}.ts`, exportadas como named functions
- **Schemas Zod:** em `src/lib/validators/{modulo}.ts`
- **Types:** em `src/types/{modulo}.ts`
- **Componentes:** um componente por arquivo, co-locados quando possível
- **Commits:** conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`)

---

## 9. Decisões de banco e segurança (registro de ADRs)

> Registre aqui decisões não-óbvias que afetam o schema, RLS ou segurança. Evita regressão em sessões futuras.

### search_path fixo em funções SQL/plpgsql

**Decisão:** Todas as funções devem usar `SET search_path = public` na definição.
**Motivo:** Sem isso, um usuário mal-intencionado com permissão de criar objetos no schema `public` pode fazer schema hijacking substituindo funções do sistema. Exigência do Supabase Security Advisor.
**Aplica-se a:** qualquer nova função criada via migration.

### pg_trgm no schema extensions

**Decisão:** A extensão `pg_trgm` fica no schema `extensions`, não em `public`.
**Motivo:** Extensões em `public` expõem funções/operadores de sistema misturados com código de aplicação. Recomendação do Supabase Security Advisor.
**Impacto:** O índice GIN em `members.name` usa `gin_trgm_ops`. O `SET search_path = public, extensions` é necessário na sessão em que o índice é criado.

### Policy UPDATE de members unificada

**Decisão:** Uma única policy `members_update` substitui `members_update_leadership` + `members_update_self`.
**Motivo:** Múltiplas permissive policies para o mesmo role+action fazem o Postgres avaliar ambas em cada query. Impacto O(2n) desnecessário.
**Lógica:** `is_leadership() OR id = (SELECT auth.uid())` — liderança edita qualquer membro do tenant; membro edita apenas o próprio registro. A restrição de quais colunas cada role pode editar é aplicada na Server Action, não no RLS.

### auth.uid() envolvido em SELECT nas policies

**Decisão:** Usar `(SELECT auth.uid())` em vez de `auth.uid()` direto nas policies RLS.
**Motivo:** Sem o SELECT, o Postgres reavalia a função para cada row. Com o SELECT, é avaliada uma vez e cached como init-plan. Recomendação do Supabase Performance Advisor.

### Leaked Password Protection

**Pendente (configuração manual):** Ativar no Supabase Dashboard em Authentication → Settings → Password Security → "Enable leaked password protection". Integra com HaveIBeenPwned.org. Não é configurável via SQL/migration.

---

## 10. Como usar este documento

### Para o dev (Filipe):

1. Antes de cada sessão, atualize a "Fase atual" e "Sessão atual" no topo.
2. Após cada sessão, adicione uma linha no log de progresso (seção 7).
3. Marque as tabelas criadas na seção 6.

### Para a IA (Claude Code / Copilot):

1. **LEIA ESTE ARQUIVO INTEIRO** antes de qualquer ação.
2. Não sugira tecnologias fora da stack (seção 1).
3. Não invente permissões — consulte a seção 4 e o PRD seção 8.
4. Siga a estrutura de diretórios (seção 2). Não crie pastas fora do padrão.
5. Use o log de progresso (seção 7) para saber o que já foi feito. Não refaça.
6. Cada prompt do PROMPTS.md tem escopo fechado. Não antecipe fases futuras.
7. Pergunte antes de criar algo que não está no escopo da sessão.
8. **Ao finalizar cada sessão, atualize este arquivo automaticamente:**
   - Adicione uma linha na tabela da seção 7 com: sessão, data, o que foi feito, arquivos criados/modificados.
   - Marque com ✅ as tabelas criadas na seção 6.
   - Atualize "Sessão atual" no topo para a próxima sessão.
   - **Não pule este passo. Não peça para o usuário fazer manualmente.**

---

_Este documento é vivo. Atualize-o a cada sessão._
