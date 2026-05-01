## SaaS de Gestão para Igrejas

**Versão:** 1.0.0-MVP **Data:** 02/04/2026 **Autor:** Filipe (Product Owner) · Claude (PM técnico) **Status:** Draft para validação

---

## Sumário

1. [Visão do Produto](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#1-vis%C3%A3o-do-produto)
2. [Stack Técnica](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#2-stack-t%C3%A9cnica)
3. [Arquitetura](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#3-arquitetura)
4. [Modelo de Precificação](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#4-modelo-de-precifica%C3%A7%C3%A3o)
5. [LGPD e Compliance](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#5-lgpd-e-compliance)
6. [Segurança](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#6-seguran%C3%A7a)
7. [Design e UX](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#7-design-e-ux)
8. [Gestão de Acesso e Papéis (RBAC)](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#8-gest%C3%A3o-de-acesso-e-pap%C3%A9is-rbac)
9. [Onboarding e Multi-Tenancy](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#9-onboarding-e-multi-tenancy)
10. [Landing Page Personalizável](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#10-landing-page-personaliz%C3%A1vel)
11. [Módulo: Membros](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#11-m%C3%B3dulo-membros)
12. [Módulo: Agenda](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#12-m%C3%B3dulo-agenda)
13. [Módulo: Eventos](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#13-m%C3%B3dulo-eventos)
14. [Módulo: Ministérios](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#14-m%C3%B3dulo-minist%C3%A9rios)
15. [Módulo: Escalas](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#15-m%C3%B3dulo-escalas)
16. [Módulo: Liturgia](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#16-m%C3%B3dulo-liturgia)
17. [Módulo: Grupos Musicais](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#17-m%C3%B3dulo-grupos-musicais)
18. [Módulo: Repertório](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#18-m%C3%B3dulo-repert%C3%B3rio)
19. [Módulo: Recursos](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#19-m%C3%B3dulo-recursos)
20. [Módulo: Financeiro](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#20-m%C3%B3dulo-financeiro)
21. [Módulo: Mural de Interação](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#21-m%C3%B3dulo-mural-de-intera%C3%A7%C3%A3o)
22. [Módulo: Gamificação](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#22-m%C3%B3dulo-gamifica%C3%A7%C3%A3o)
23. [Módulo: Assembléia](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#23-m%C3%B3dulo-assembl%C3%A9ia)
24. [Módulo: Eleição/Votação](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#24-m%C3%B3dulo-elei%C3%A7%C3%A3ovota%C3%A7%C3%A3o)
25. [Check-in por QR Code](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#25-check-in-por-qr-code)
26. [Roadmap MVP](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#26-roadmap-mvp)
27. [Glossário](https://claude.ai/chat/7d5407cd-db05-4699-9c30-54ea574fd39f#27-gloss%C3%A1rio)

---

## 1. Visão do Produto

Koinos é um SaaS de gestão para igrejas de qualquer porte, focado no mercado brasileiro. O produto resolve três dores centrais: a ausência de presença digital de igrejas pequenas e médias, a gestão operacional fragmentada (planilhas, WhatsApp, cadernos) e o baixo engajamento de jovens e adolescentes na vida eclesiástica.

O diferencial competitivo está na experiência do usuário. Cada tela, cada componente e cada interação existem para responder uma pergunta: "eu sou necessário aqui?" Se a resposta for não, ele não existe. O SaaS deve encantar pela facilidade, ser leve, responsivo e acessível em qualquer dispositivo — com foco principal em celulares.

**Público-alvo primário:** Liderança de igrejas evangélicas brasileiras (pastores, presbíteros, diáconos, líderes de ministério).

**Público-alvo secundário:** Membros e jovens da igreja, que interagem com o mural, gamificação, liturgia e agenda.

**Meta de crescimento:**

| Marco       | Igrejas ativas | Membros estimados | Meta de tempo |
| ----------- | -------------- | ----------------- | ------------- |
| Validação   | 10             | 500               | Mês 1–3       |
| Tração      | 50             | 5.000             | Mês 4–6       |
| Crescimento | 200            | 25.000            | Mês 7–12      |
| Escala      | 1.000          | 150.000           | Ano 2         |

---

## 2. Stack Técnica

| Camada         | Tecnologia                | Versão       | Justificativa                                                                                                                  |
| -------------- | ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Framework      | Next.js                   | 16           | App Router, Turbopack (400% mais rápido), Server Components, `"use cache"` directive. Padrão de mercado para full-stack React. |
| UI Library     | React                     | 19.2         | Server Components estáveis, Actions API, View Transitions. Shipped com Next.js 16.                                             |
| Linguagem      | TypeScript                | 6.0          | `strict: true` padrão, tipagem robusta, bridge para TS 7.0 (Go-native).                                                        |
| Estilização    | Tailwind CSS              | 4.x          | Rewrite em Rust (5× mais rápido), config via CSS (`@theme`), container queries, OKLCH colors.                                  |
| Componentes    | shadcn/ui                 | CLI v4       | Ownership total do código, Radix UI primitives, sem vendor lock-in, estilização via Tailwind.                                  |
| Banco de dados | PostgreSQL                | 18           | UUIDv7 nativo (PKs otimizadas para SaaS), async I/O (2–3× perf), virtual generated columns.                                    |
| BaaS           | Supabase                  | Latest       | Auth, Realtime, Storage, Edge Functions, RLS nativo, região São Paulo. Free → $25/mo Pro.                                      |
| Autenticação   | Supabase Auth             | —            | Integrado ao Supabase, suporta email/senha, OAuth, magic link, phone. Mais simples que Auth.js v5 beta.                        |
| IA (Liturgia)  | OpenAI GPT-4.1            | —            | Strict JSON schema, melhor PT-BR entre LLMs, 1M context, prompt caching (75% desconto). Fallback: Gemini 2.5 Flash.            |
| QR Code        | qrcode.react + qr-scanner | 4.2 / latest | SVG dinâmico para display, Web Worker para scan. Padrão de mercado.                                                            |
| Deploy         | Vercel                    | —            | Edge-first, integração nativa com Next.js 16, preview deploys, analytics.                                                      |
| Email          | Resend                    | —            | API moderna, React Email templates, DKIM/DMARC, preço por volume.                                                              |
| Pagamento      | Stripe                    | —            | Checkout hosted, Billing Portal, Webhooks com verificação nativa, suporte a BRL, cartão + boleto + PIX via Stripe.             |

**Dependências complementares:**

| Lib                         | Uso                                                   |
| --------------------------- | ----------------------------------------------------- |
| Zod                         | Validação de schemas (forms, API, DB)                 |
| React Hook Form             | Forms performáticos com validação Zod                 |
| date-fns                    | Manipulação de datas (pt-BR locale)                   |
| next-intl                   | i18n preparado (PT-BR prioritário)                    |
| @tanstack/react-query       | Cache e sincronização de estado servidor              |
| Framer Motion               | Animações e transições (scrolling effects na landing) |
| Pusher ou Supabase Realtime | Real-time para QR code rotation e mural               |
| Redis (Upstash)             | Nonces de QR code, rate limiting, cache de sessão     |

---

## 3. Arquitetura

### 3.1 Multi-Tenancy

O modelo é **multi-tenant com isolamento lógico por Row-Level Security (RLS)** do PostgreSQL, operando sob o Supabase.

Cada igreja (tenant) é identificada por um `church_id` (UUIDv7) presente em todas as tabelas de dados. O RLS garante que queries só retornem dados do tenant do usuário autenticado.

**Hierarquia igreja matriz ↔ congregações:**

```
Igreja Matriz (tenant_id: uuid)
├── Congregação A (tenant_id: uuid, parent_tenant_id: matriz.uuid)
├── Congregação B (tenant_id: uuid, parent_tenant_id: matriz.uuid)
└── Congregação C (tenant_id: uuid, parent_tenant_id: matriz.uuid)
```

Regras:

- A base de membros é compartilhada entre matriz e congregações (campo `home_church_id` identifica a lotação do membro).
- O caixa financeiro pode ser compartilhado ou separado, a critério do tesoureiro da matriz (flag `shared_finances: boolean` no tenant).
- A agenda pode exibir eventos de todas as unidades ou apenas da unidade do membro (toggle no perfil do membro).
- A liderança da matriz tem visibilidade sobre todas as congregações. A liderança de uma congregação vê apenas sua unidade, salvo permissão explícita.

### 3.2 Modelo de Dados Simplificado (Entidades Principais)

```
tenants (churches)
├── members
│   ├── family_links
│   ├── member_teams (gamificação)
│   └── badges
├── events
│   ├── event_ministries → scales
│   ├── event_music_groups
│   ├── event_resources
│   └── liturgies
│       └── liturgy_items (leituras, cânticos)
├── ministries
│   └── ministry_members
├── music_groups
│   ├── music_group_members
│   └── repertoire
│       └── songs
├── resources
├── finances
│   ├── accounts
│   └── transactions
├── posts (mural)
│   ├── comments
│   └── reactions (orar/gratidão)
├── assemblies
│   └── elections
│       ├── election_candidates
│       └── votes
├── check_ins
├── teams (12 tribos)
│   └── team_scores
├── devotion_streaks
├── consent_records (LGPD)
└── audit_logs
```

---

## 4. Modelo de Precificação

### 4.1 Eixo 1 — Por Quantidade de Membros

| Plano           | Membros   | Preço/mês | Inclui                                                                       |
| --------------- | --------- | --------- | ---------------------------------------------------------------------------- |
| **Grátis**      | Até 100   | R$ 0      | Módulos core: Membros, Agenda, Eventos, Mural, Gamificação básica            |
| **Crescimento** | Até 300   | R$ 49     | Tudo do Grátis + Ministérios, Escalas, Grupos Musicais, Repertório, Recursos |
| **Igreja**      | Até 1.000 | R$ 129    | Tudo do Crescimento + Financeiro (básico), Assembléia                        |
| **Catedral**    | Ilimitado | R$ 299    | Tudo do Igreja + suporte prioritário, múltiplas congregações                 |

### 4.2 Eixo 2 — Features Premium (add-ons)

| Feature                                        | Preço/mês | Disponível a partir de |
| ---------------------------------------------- | --------- | ---------------------- |
| Liturgia Inteligente (IA)                      | R$ 29     | Crescimento            |
| Escala Automática por IA                       | R$ 19     | Crescimento            |
| Landing Page com domínio personalizado         | R$ 19     | Crescimento            |
| Financeiro com relatórios avançados e gráficos | R$ 39     | Igreja                 |
| Assembléia + Votação Digital                   | R$ 29     | Igreja                 |
| Analytics de Gamificação (liderança)           | R$ 19     | Crescimento            |

### 4.3 Estratégia de Conversão

O plano Grátis entrega valor real imediato (mural + gamificação + agenda). A gamificação básica e o mural criam retenção diária e viralidade orgânica entre jovens. O upgrade acontece naturalmente quando a igreja cresce além de 100 membros ou quando a liderança precisa de módulos operacionais (escalas, financeiro, liturgia).

---

## 5. LGPD e Compliance

### 5.1 Classificação dos Dados

A LGPD (Lei 13.709/2018) classifica **convicção religiosa** e **filiação a organização religiosa** como dados pessoais sensíveis (Art. 5º, II). O simples fato de um usuário estar cadastrado no Koinos revela sua afiliação religiosa, tornando **todos os dados processados pela plataforma efetivamente sensíveis**.

Diferente do GDPR europeu, **a LGPD não concede isenção para organizações religiosas**.

### 5.2 Base Legal

A base legal primária é o **consentimento explícito, específico e destacado** (Art. 11, I). O consentimento deve ser:

- Granular por finalidade (cadastro, frequência, contribuições, comunicações, fotos/vídeos, eventos).
- Revogável a qualquer momento por procedimento gratuito e fácil.
- Armazenado como evidência (registro de consentimento com timestamp, IP, versão dos termos).
- Renovável quando os termos mudarem.

### 5.3 Requisitos Técnicos Obrigatórios

| Requisito                     | Implementação                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Consentimento granular        | Tela de opt-in separada por finalidade durante onboarding. Painel de preferências de privacidade no perfil.              |
| Direitos do titular (Art. 18) | Portal self-service: acessar, corrigir, excluir, exportar dados. Prazo: 15 dias úteis.                                   |
| Exclusão em cascata           | Soft-delete com anonimização após período legal. Exclusão de backups onde viável.                                        |
| Portabilidade                 | Exportação em JSON e CSV via portal do membro.                                                                           |
| DPO (Encarregado)             | Obrigatório para o SaaS (Art. 41). Informações de contato públicas.                                                      |
| RIPD                          | Relatório de Impacto obrigatório por processar dados sensíveis em escala.                                                |
| DPA (Acordo de Processamento) | Contrato formal entre o SaaS (operador) e cada igreja (controlador).                                                     |
| ROPA (Registro de Atividades) | Documentação de cada categoria de dado, finalidade, base legal, retenção e controles de acesso.                          |
| Menores de 12 anos            | Consentimento parental obrigatório (Art. 14).                                                                            |
| Notificação de incidentes     | ANPD + titulares em até 3 dias úteis. Logs retidos por 5 anos mínimo.                                                    |
| Transferência internacional   | SCCs (Cláusulas Contratuais Padrão) obrigatórias se dados saírem do Brasil. Preferir região São Paulo (Supabase/Vercel). |

### 5.4 Penalidades

Multa de até 2% do faturamento no Brasil, limitada a R$ 50 milhões por infração, suspensão do processamento por até 6 meses, exclusão forçada de dados e divulgação pública da infração.

---

## 6. Segurança

### 6.1 Camadas de Proteção

| Camada           | Medida                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Transporte       | TLS 1.3 obrigatório em todas as conexões. HSTS com preload.                                                     |
| Dados em repouso | Criptografia AES-256 no Supabase (habilitado por padrão).                                                       |
| Autenticação     | Supabase Auth com email/senha + opção 2FA (TOTP). Rate limiting em login (5 tentativas / 15 min).               |
| Autorização      | RLS no PostgreSQL por `church_id`. Middleware Next.js validando sessão + role em cada rota.                     |
| CSRF             | Tokens CSRF em todas as mutações (Server Actions do Next.js 16 incluem proteção nativa).                        |
| XSS              | CSP (Content Security Policy) restritiva. Sanitização de inputs com DOMPurify no mural.                         |
| SQL Injection    | Supabase client usa prepared statements. Validação Zod em todas as entradas.                                    |
| Rate Limiting    | Upstash Redis: rate limit por IP e por usuário em endpoints sensíveis.                                          |
| Bots             | Cloudflare Turnstile (alternativa ao reCAPTCHA) no cadastro e login. Invisível para UX.                         |
| Webhook          | Verificação de assinatura via `stripe.webhooks.constructEvent()` com signing secret.                            |
| Auditoria        | Tabela `audit_logs` com todas as operações sensíveis (quem, quando, o quê, IP). Retenção: 5 anos.               |
| Secrets          | Variáveis de ambiente via Vercel (encrypted at rest). Rotação programada de API keys.                           |
| Headers          | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. |
| Dependências     | Dependabot + `npm audit` no CI. Lock files versionados.                                                         |

### 6.2 Isolamento Multi-Tenant

O admin do SaaS (time de desenvolvimento) tem acesso às configurações do sistema, mas **não visualiza dados sensíveis de tenants**. O acesso administrativo opera via painel separado com RLS restritivo que exclui colunas sensíveis (CPF, RG, dados financeiros, votos). Queries administrativas retornam apenas metadados agregados (contagem de membros, status do plano, métricas de uso).

---

## 7. Design e UX

### 7.1 Princípios

1. **Mobile-first:** Toda tela é desenhada para celular primeiro e adaptada para desktop depois.
2. **Minimalismo funcional:** Cada componente responde "eu sou necessário aqui?" Se não, ele não existe.
3. **Fuga do padrão IA:** Nada de gradientes genéricos, cards idênticos empilhados ou layouts que gritam "template". Tipografia expressiva, espaçamento generoso, micro-interações intencionais.
4. **Acessibilidade:** Contraste WCAG AA, navegação por teclado, `aria-labels`, textos alternativos.
5. **Performance percebida:** Skeleton loaders, optimistic updates, prefetch de rotas adjacentes.

### 7.2 Modo Noturno

- Toggle acessível no header (ícone sol/lua), sempre visível.
- Programável por horário (ex: ativar às 18h, desativar às 6h) nas configurações do perfil.
- Persistido em `localStorage` + `prefers-color-scheme` como fallback.
- Implementado via Tailwind CSS `dark:` com classe no `<html>`.
- Transição suave (150ms) entre modos.

### 7.3 Navegação

- **Mobile:** Bottom navigation com 5 itens máximos (Início, Agenda, Mural, Mais, Perfil). Drawer lateral para módulos administrativos.
- **Desktop:** Sidebar colapsável com agrupamento por categoria (Gestão, Comunicação, Financeiro, Configurações).
- **Breadcrumbs** em telas de profundidade > 2 níveis.
- **Busca global** com `Cmd+K` / toque no ícone de busca.

### 7.4 Responsividade

| Breakpoint | Target                             |
| ---------- | ---------------------------------- |
| < 640px    | Smartphones (layout single-column) |
| 640–1024px | Tablets (layout adaptativo)        |
| > 1024px   | Desktop (sidebar + content area)   |

---

## 8. Gestão de Acesso e Papéis (RBAC)

### 8.1 Papéis do Sistema

| Papel          | Escopo      | Descrição                                                                                                                                                                               |
| -------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **admin**      | SaaS global | Time de desenvolvimento. Full access em configurações do sistema. Sem acesso a dados sensíveis de tenants. Pode ser membro de uma igreja (recebe privilégios de pastor naquele tenant). |
| **pastor**     | Tenant      | Máximo acesso dentro da igreja. CRUD total em todos os módulos. Cria assembléias. Define permissões de votação remota.                                                                  |
| **presbítero** | Tenant      | CRUD em ministérios, grupos musicais, escalas, liturgia. Cria eleições/votações. Lê financeiro. Fixa posts no mural.                                                                    |
| **diácono**    | Tenant      | CRUD em recursos. Cria, edita e exclui eventos e membros. Lê financeiro.                                                                                                                |
| **tesoureiro** | Tenant      | CRUD exclusivo no financeiro. Lê demais módulos conforme nível de membro. Define flag `shared_finances`.                                                                                |
| **líder**      | Tenant      | Cria, edita e exclui eventos. Gerencia escalas do próprio ministério. Cria membros.                                                                                                     |
| **membro**     | Tenant      | Lê módulos públicos (agenda, eventos, liturgia, repertório no contexto da liturgia). Posta e comenta no mural. Participa da gamificação.                                                |
| **visitante**  | Tenant      | Acesso mínimo: lê agenda, eventos públicos, mural. Participa da gamificação. Pode ser promovido pela liderança.                                                                         |

**Definição de "liderança":** pastor, presbítero, diácono e líder.

### 8.2 Matriz de Permissões por Módulo

| Módulo                   | Criar                       | Ler                                     | Editar                      | Excluir                     |
| ------------------------ | --------------------------- | --------------------------------------- | --------------------------- | --------------------------- |
| **Membros**              | liderança                   | liderança                               | liderança                   | liderança                   |
| **Agenda**               | liderança                   | todos                                   | liderança                   | liderança                   |
| **Eventos**              | liderança                   | todos                                   | liderança                   | liderança                   |
| **Ministérios**          | pastor, presbítero          | todos                                   | pastor, presbítero          | pastor, presbítero          |
| **Escalas**              | líder do ministério         | membros do ministério + liderança       | líder do ministério         | líder do ministério         |
| **Liturgia**             | responsável do evento       | todos                                   | responsável do evento       | responsável do evento       |
| **Grupos Musicais**      | pastor, presbítero          | todos                                   | pastor, presbítero          | pastor, presbítero          |
| **Repertório**           | líder do grupo musical      | todos (no contexto da liturgia)         | líder do grupo musical      | líder do grupo musical      |
| **Recursos**             | pastor, presbítero, diácono | liderança                               | pastor, presbítero, diácono | pastor, presbítero, diácono |
| **Financeiro**           | tesoureiro                  | pastor, presbítero, diácono, tesoureiro | tesoureiro                  | tesoureiro                  |
| **Mural**                | todos (texto)               | todos                                   | autor do post               | autor do post + pastor      |
| **Assembléia**           | pastor                      | conforme convocação                     | pastor                      | pastor                      |
| **Eleição/Votação**      | pastor, presbítero          | conforme assembléia                     | pastor, presbítero          | pastor, presbítero          |
| **Gamificação (config)** | admin SaaS                  | todos                                   | admin SaaS                  | admin SaaS                  |

### 8.3 User Stories — RBAC

**US-RBAC-01:** Como admin do SaaS, quero gerenciar configurações globais (equipes de gamificação, badges, triggers de pontuação) sem visualizar dados sensíveis dos tenants, para manter a privacidade das igrejas.

**US-RBAC-02:** Como admin do SaaS que também é membro de uma igreja, quero receber automaticamente privilégios de pastor naquele tenant específico, sem perder meu acesso administrativo global.

**US-RBAC-03:** Como pastor, quero promover ou rebaixar o papel de qualquer membro da minha igreja, para adequar o acesso às responsabilidades reais.

**US-RBAC-04:** Como membro, quero visualizar apenas os módulos e ações permitidos ao meu papel, para não ser confundido por funcionalidades inacessíveis.

### 8.4 Tasks Técnicas — RBAC

**TASK-RBAC-01: Implementar middleware de autorização**

```
TDD:
├── TEST 1: Requisição sem sessão → retorna 401
├── TEST 2: Requisição com sessão válida mas role insuficiente → retorna 403
├── TEST 3: Requisição com sessão válida e role suficiente → retorna 200
├── TEST 4: Admin acessando painel admin → permite
├── TEST 5: Admin acessando dados sensíveis de tenant → bloqueia
├── TEST 6: Admin que é membro de igreja X acessando módulos de X → permite como pastor
├── TEST 7: Admin que é membro de igreja X acessando módulos de Y → bloqueia dados sensíveis
├── IMPL: Middleware Next.js + helper `checkPermission(userId, churchId, module, action)`
├── IMPL: Decorador de Server Actions com validação de permissão
└── IMPL: Hook `usePermissions()` para controle de UI no cliente
```

**TASK-RBAC-02: Implementar RLS policies no Supabase**

```
TDD:
├── TEST 1: Query SELECT com user do tenant A → retorna apenas dados do tenant A
├── TEST 2: Query INSERT com user do tenant A em tabela do tenant B → rejeita
├── TEST 3: Query como admin → retorna metadados sem colunas sensíveis
├── TEST 4: Query como tesoureiro → permite acesso ao financeiro do próprio tenant
├── TEST 5: Query como membro → bloqueia financeiro
├── IMPL: Policies RLS em todas as tabelas com `church_id = auth.jwt()->>'church_id'`
├── IMPL: Column-level security para admin (excluir CPF, RG, dados financeiros)
└── IMPL: Policies específicas por role usando claims do JWT customizado
```

**TASK-RBAC-03: Implementar componente de UI condicional por permissão**

```
TDD:
├── TEST 1: <PermissionGate role="pastor"> renderiza conteúdo para pastor
├── TEST 2: <PermissionGate role="pastor"> oculta conteúdo para membro
├── TEST 3: <PermissionGate module="financeiro" action="create"> renderiza apenas para tesoureiro
├── TEST 4: Navegação mobile exibe apenas itens permitidos ao role do usuário
├── IMPL: Componente <PermissionGate> com props `role`, `module`, `action`
├── IMPL: Hook `usePermissions()` consumindo contexto de sessão
└── IMPL: Filtragem de itens de navegação baseada em permissões
```

---

## 9. Onboarding e Multi-Tenancy

### 9.1 Fluxo de Cadastro — Nova Igreja

1. Usuário acessa o SaaS e clica em "Cadastrar minha igreja".
2. Preenche dados pessoais: nome completo, CPF, e-mail, senha.
3. Aceita termos de uso + consentimentos granulares LGPD (tela dedicada).
4. Preenche dados da igreja: nome, CNPJ (opcional), denominação, endereço completo, telefone.
5. Sistema valida unicidade: busca por CNPJ (se informado) ou combinação nome + endereço.
6. **Se a igreja não existir:** cria o tenant. O usuário recebe o papel de pastor (fundador).
7. **Se a igreja já existir:** o usuário é associado silenciosamente como **visitante** daquele tenant. Notificação discreta: "Encontramos sua igreja! Você foi adicionado como visitante. A liderança poderá atualizar seu papel."
8. Após criação, o pastor recebe um **link de convite** único para compartilhar com membros.

### 9.2 Fluxo de Cadastro — Via Link de Convite

1. Membro acessa o link de convite (ex: `https://app.Koinos/convite/{code}`).
2. Preenche dados pessoais: nome completo, CPF, e-mail, senha.
3. Aceita termos + consentimentos LGPD.
4. Sistema associa o membro ao tenant do convite como **visitante**.
5. **Matching por CPF:** se o CPF já existir na base de membros (cadastro manual prévio), o sistema associa silenciosamente o novo acesso ao membro existente, assumindo o role definido pelo criador e todos os dados vinculados.
6. **Conflito de e-mail:** se o CPF bater mas o e-mail for diferente, o e-mail informado pelo usuário sobrescreve o cadastrado manualmente. A alteração é registrada no `audit_logs`.

### 9.3 Link de Convite — Tipos

| Tipo                   | Gerado por       | Validade               | Uso                                                                |
| ---------------------- | ---------------- | ---------------------- | ------------------------------------------------------------------ |
| Link geral da igreja   | Pastor/liderança | Permanente (revogável) | Compartilhar com futuros membros                                   |
| Link pessoal do membro | Qualquer membro  | Permanente             | Gamificação: trackeia quem trouxe quem (código de convite pessoal) |

### 9.4 User Stories — Onboarding

**US-ONB-01:** Como novo usuário, quero cadastrar minha igreja preenchendo informações básicas, para começar a usar o SaaS imediatamente.

**US-ONB-02:** Como novo usuário acessando pelo link de convite, quero me cadastrar sem precisar informar dados da igreja, para agilizar minha entrada.

**US-ONB-03:** Como pastor, quero gerar e compartilhar um link de convite para minha igreja, para facilitar o cadastro de membros.

**US-ONB-04:** Como membro existente (cadastrado manualmente), quero que ao me cadastrar no SaaS meu perfil seja automaticamente associado ao registro existente via CPF, para não perder meu histórico.

**US-ONB-05:** Como novo usuário tentando cadastrar uma igreja que já existe, quero ser redirecionado silenciosamente como visitante, para não criar duplicatas.

**US-ONB-06:** Como membro, quero ter meu próprio link de convite pessoal, para que visitantes que eu trouxer sejam rastreados na gamificação.

### 9.5 Tasks Técnicas — Onboarding

**TASK-ONB-01: Implementar fluxo de criação de tenant**

```
TDD:
├── TEST 1: Dados válidos de igreja → cria tenant + membro fundador com role pastor
├── TEST 2: CNPJ duplicado → retorna erro com mensagem e redireciona como visitante
├── TEST 3: Nome + endereço duplicados → retorna erro com mensagem e redireciona como visitante
├── TEST 4: Dados incompletos → validação Zod retorna erros específicos
├── TEST 5: Criação bem-sucedida → gera link de convite geral automaticamente
├── IMPL: Server Action `createChurch(data)` com validação Zod
├── IMPL: Transaction DB: INSERT tenant + INSERT member + INSERT invite_link
└── IMPL: Registro de consentimento LGPD com timestamp e versão dos termos
```

**TASK-ONB-02: Implementar matching por CPF no cadastro**

```
TDD:
├── TEST 1: CPF existe na base de membros do tenant → associa ao registro existente
├── TEST 2: CPF match + e-mail diferente → atualiza e-mail + registra no audit_log
├── TEST 3: CPF match → assume role definido no registro manual
├── TEST 4: CPF não existe → cria novo membro como visitante
├── TEST 5: CPF válido (algoritmo de validação) → aceita
├── TEST 6: CPF inválido → rejeita com mensagem
├── IMPL: Server Action `registerMember(data, inviteCode?)` com lookup por CPF
├── IMPL: Helper `validateCPF(cpf)` com verificação de dígitos
└── IMPL: Audit log entry para cada matching e atualização de dados
```

**TASK-ONB-03: Implementar sistema de links de convite**

```
TDD:
├── TEST 1: Gerar link geral → cria código único associado ao tenant
├── TEST 2: Gerar link pessoal → cria código único associado ao membro
├── TEST 3: Acessar link válido → redireciona para cadastro com tenant pré-selecionado
├── TEST 4: Acessar link revogado → redireciona para cadastro genérico com mensagem
├── TEST 5: Cadastro via link pessoal → registra `invited_by` no membro
├── TEST 6: Link pessoal + gamificação → incrementa pontuação do convidante
├── IMPL: Tabela `invite_links` com colunas: code, church_id, member_id (nullable), active, created_at
├── IMPL: API route GET /convite/[code] → valida e redireciona
└── IMPL: Hook no cadastro para verificar e registrar `invited_by`
```

---

## 10. Landing Page Personalizável

### 10.1 Especificação

Landing page one-page com scrolling effects, sincronizada com os módulos de gestão. A landing é uma feature premium (a partir do plano Crescimento, com add-on para domínio personalizado).

**Seções obrigatórias (ordem padrão, reordenável):**

1. **Hero:** imagem de fundo (upload), nome da igreja, slogan, CTA principal.
2. **Sobre Nós:** breve descrição da igreja (textarea com limite).
3. **Sobre o Pastor:** foto, nome, breve bio.
4. **Liderança:** grid com fotos e nomes da liderança (puxado do módulo Membros com filtro por role).
5. **Próximos Eventos:** cards dos próximos 3–5 eventos (sincronizado com módulo Agenda).
6. **Transmissão On-line:** embed de YouTube/Vimeo ou link direto.
7. **Endereço:** mapa interativo (Google Maps embed) + endereço formatado.
8. **CTA de Cadastro:** formulário simplificado que cadastra o usuário como visitante no tenant da igreja.

### 10.2 Domínio Personalizado

- Subdomínio padrão: `{slug}.Koinos` (CNAME).
- Domínio personalizado: o gestor aponta seu domínio via CNAME ou A record para o IP do Koinos. SSL automático via Let's Encrypt.
- Ao acessar o SaaS a partir da landing page, o usuário é redirecionado para `app.Koinos` (domínio padrão do SaaS) com sessão autenticada.

### 10.3 User Stories — Landing Page

**US-LP-01:** Como pastor, quero personalizar a landing page da minha igreja com imagens, textos e cores, para ter presença online sem contratar um desenvolvedor.

**US-LP-02:** Como visitante, quero me cadastrar direto da landing page da igreja, para acessar o SaaS já vinculado àquela igreja como visitante.

**US-LP-03:** Como pastor, quero que os próximos eventos na landing page sejam atualizados automaticamente quando eu criar eventos no SaaS, para não ter retrabalho.

**US-LP-04:** Como pastor, quero usar um domínio próprio na minha landing page, para manter minha identidade digital.

**US-LP-05:** Como visitante navegando na landing page, quero que ao clicar em "Acessar o sistema" eu seja redirecionado para o SaaS no domínio padrão, para separar a experiência pública da experiência interna.

### 10.4 Tasks Técnicas — Landing Page

**TASK-LP-01: Implementar renderização da landing page por tenant**

```
TDD:
├── TEST 1: Acessar /{slug} → renderiza landing do tenant correspondente
├── TEST 2: Acessar slug inexistente → retorna 404 com página amigável
├── TEST 3: Landing com todos os campos preenchidos → renderiza todas as seções
├── TEST 4: Landing com campos opcionais vazios → oculta seções correspondentes
├── TEST 5: Seção "Próximos Eventos" → exibe apenas eventos futuros, ordenados por data
├── TEST 6: CTA de cadastro → cria visitante no tenant + redireciona ao SaaS
├── IMPL: Dynamic route /[slug]/page.tsx com ISR (revalidate: 3600)
├── IMPL: Server Component buscando dados do tenant via Supabase
├── IMPL: Framer Motion para scrolling effects suaves entre seções
└── IMPL: Componentes de seção isolados e reordenáveis
```

**TASK-LP-02: Implementar painel de personalização da landing**

```
TDD:
├── TEST 1: Upload de imagem hero → armazena no Supabase Storage + atualiza tenant
├── TEST 2: Edição de texto "Sobre Nós" → salva e reflete na landing após revalidação
├── TEST 3: Reordenação de seções → persiste ordem + reflete na landing
├── TEST 4: Preview em tempo real → exibe alterações antes de publicar
├── TEST 5: Apenas pastor pode acessar o painel de personalização
├── IMPL: Página /dashboard/landing-page com form React Hook Form + Zod
├── IMPL: Upload de imagens via Supabase Storage (limite: 5MB, formatos: jpg/png/webp)
├── IMPL: Drag-and-drop para reordenação de seções
└── IMPL: Botão "Publicar" que dispara revalidação ISR
```

**TASK-LP-03: Implementar domínio personalizado**

```
TDD:
├── TEST 1: Configurar subdomínio {slug}.Koinos → resolve para a landing do tenant
├── TEST 2: Configurar domínio personalizado → instrui usuário sobre CNAME + valida DNS
├── TEST 3: SSL automático via Vercel/Let's Encrypt → certificado emitido após validação DNS
├── TEST 4: Acesso pelo domínio personalizado → renderiza a landing correta
├── TEST 5: Link "Acessar sistema" no domínio personalizado → redireciona para app.Koinos
├── IMPL: Configuração de domínio personalizado via API do Vercel (ou Caddy/nginx se self-hosted)
├── IMPL: Tela de configuração com instruções DNS e verificador de propagação
└── IMPL: Middleware para resolver tenant a partir do hostname
```

---

## 11. Módulo: Membros

### 11.1 Campos do Membro

| Campo          | Tipo      | Obrigatório | Sensível (LGPD) | Notas                                                             |
| -------------- | --------- | ----------- | --------------- | ----------------------------------------------------------------- |
| id             | UUIDv7    | auto        | —               | PK                                                                |
| church_id      | UUIDv7    | auto        | —               | FK para tenant                                                    |
| home_church_id | UUIDv7    | auto        | —               | Lotação (matriz ou congregação)                                   |
| name           | string    | sim         | sim             | Nome completo                                                     |
| cpf            | string    | sim         | sim             | Criptografado em repouso. Chave de matching.                      |
| rg             | string    | não         | sim             | Criptografado em repouso.                                         |
| email          | string    | sim         | sim             | E-mail de acesso. Sobrescreve o manual no matching.               |
| birth_date     | date      | sim         | sim             | Para aniversariantes e verificação de idade.                      |
| role           | enum      | sim         | —               | pastor, presbítero, diácono, tesoureiro, líder, membro, visitante |
| received_at    | date      | não         | —               | Data de recebimento na igreja                                     |
| baptized_at    | date      | não         | —               | Data de batismo                                                   |
| address        | jsonb     | não         | sim             | {rua, numero, complemento, bairro, cidade, estado, cep}           |
| phone          | string    | não         | sim             | Telefone/WhatsApp                                                 |
| avatar_url     | string    | não         | —               | Foto de perfil                                                    |
| invited_by     | UUIDv7    | não         | —               | FK para membro que convidou (gamificação)                         |
| is_active      | boolean   | auto        | —               | Soft-delete                                                       |
| created_at     | timestamp | auto        | —               |                                                                   |
| updated_at     | timestamp | auto        | —               |                                                                   |

### 11.2 Vínculos Familiares

Tabela `family_links`:

| Campo             | Tipo   | Notas                                 |
| ----------------- | ------ | ------------------------------------- |
| id                | UUIDv7 | PK                                    |
| church_id         | UUIDv7 | FK tenant                             |
| member_id         | UUIDv7 | FK membro                             |
| related_member_id | UUIDv7 | FK membro relacionado                 |
| relationship      | enum   | cônjuge, pai, mãe, filho(a), irmão(ã) |

A listagem de membros agrupa por famílias. O agrupamento usa os vínculos para criar "cards de família" na visualização de lista. Membros sem vínculos aparecem individualmente.

### 11.3 User Stories — Membros

**US-MEM-01:** Como líder, quero cadastrar um novo membro manualmente com informações básicas, para registrar alguém que ainda não tem acesso digital.

**US-MEM-02:** Como pastor, quero visualizar a lista de membros agrupados por família, para ter uma visão clara da composição da igreja.

**US-MEM-03:** Como líder, quero adicionar vínculos familiares entre membros, para que o sistema agrupe automaticamente as famílias.

**US-MEM-04:** Como membro, quero que ao me cadastrar no SaaS com meu CPF, meu perfil seja associado ao registro manual existente sem perder dados, para ter continuidade.

**US-MEM-05:** Como pastor, quero alterar o papel (role) de um membro, para refletir mudanças na estrutura da igreja.

**US-MEM-06:** Como membro, quero editar meu próprio perfil (foto, endereço, telefone), para manter meus dados atualizados.

**US-MEM-07:** Como membro, quero acessar o portal de privacidade para visualizar, exportar ou solicitar exclusão dos meus dados, para exercer meus direitos LGPD.

### 11.4 Tasks Técnicas — Membros

**TASK-MEM-01: CRUD de membros com validação e criptografia**

```
TDD:
├── TEST 1: Criar membro com dados válidos → insere no DB com CPF criptografado
├── TEST 2: Criar membro com CPF duplicado no mesmo tenant → rejeita
├── TEST 3: Criar membro com CPF inválido → rejeita com mensagem
├── TEST 4: Criar membro com role inválido → rejeita
├── TEST 5: Editar membro → atualiza campos + registra no audit_log
├── TEST 6: Excluir membro → soft-delete (is_active = false) + registra no audit_log
├── TEST 7: Listar membros → retorna apenas membros do tenant do usuário (RLS)
├── TEST 8: Buscar por nome → busca case-insensitive com diacríticos
├── TEST 9: Listar apenas liderança → filtra por roles de liderança
├── TEST 10: Apenas liderança pode CRUD → membro/visitante recebe 403
├── IMPL: Server Actions com validação Zod
├── IMPL: Criptografia AES-256 para CPF e RG via helper `encrypt()`/`decrypt()`
├── IMPL: Tabela members com RLS policy por church_id
└── IMPL: Index GIN em `name` para busca textual eficiente
```

**TASK-MEM-02: Vínculos familiares e agrupamento**

```
TDD:
├── TEST 1: Adicionar vínculo cônjuge A→B → cria vínculo bidirecional B→A automaticamente
├── TEST 2: Adicionar vínculo pai A→B → cria vínculo filho B→A automaticamente
├── TEST 3: Remover vínculo → remove ambas as direções
├── TEST 4: Listar membros agrupados → retorna famílias compostas + membros individuais
├── TEST 5: Membro com múltiplos vínculos → aparece em uma única família
├── TEST 6: Vínculo entre membros de tenants diferentes → rejeita
├── IMPL: Tabela family_links com trigger para vínculo bidirecional
├── IMPL: Query com CTE recursiva para agrupar famílias
└── IMPL: Componente FamilyCard para exibição na listagem
```

**TASK-MEM-03: Portal de privacidade LGPD**

```
TDD:
├── TEST 1: Membro acessa portal → visualiza todos os seus dados pessoais
├── TEST 2: Membro solicita exportação → gera JSON + CSV com todos os dados
├── TEST 3: Membro solicita exclusão → soft-delete + agendamento de anonimização
├── TEST 4: Membro revoga consentimento específico → desativa processamento correspondente
├── TEST 5: Exportação inclui: dados pessoais, vínculos, check-ins, contribuições, votos
├── TEST 6: Exclusão não remove dados com retenção legal obrigatória (financeiro: 5 anos)
├── IMPL: Página /perfil/privacidade com tabs (Meus Dados, Exportar, Excluir, Consentimentos)
├── IMPL: Server Action `exportMemberData(memberId)` → gera ZIP com JSON + CSV
├── IMPL: Job assíncrono para anonimização (substituir dados pessoais por hash)
└── IMPL: Tabela consent_records com histórico de consentimentos
```

---

## 12. Módulo: Agenda

### 12.1 Especificação

Visualização centralizada dos eventos da igreja. A agenda é alimentada pelo módulo de Eventos e sincroniza com a seção "Próximos Eventos" da landing page.

### 12.2 User Stories

**US-AGD-01:** Como membro, quero visualizar a agenda da minha igreja em formato mensal e semanal, para saber o que está programado.

**US-AGD-02:** Como líder, quero adicionar um evento existente à agenda, para que todos os membros visualizem.

**US-AGD-03:** Como membro de uma congregação, quero ver os eventos da minha unidade e opcionalmente da matriz, para estar informado de ambas.

**US-AGD-04:** Como membro, quero receber notificações de eventos próximos, para não perder compromissos.

### 12.3 Tasks Técnicas

**TASK-AGD-01: Implementar visualização de agenda**

```
TDD:
├── TEST 1: Visualização mensal → exibe dias com indicadores de eventos
├── TEST 2: Visualização semanal → exibe timeline com horários dos eventos
├── TEST 3: Clicar em um dia → expande lista de eventos daquele dia
├── TEST 4: Filtro por unidade (matriz/congregação) → exibe apenas eventos da unidade
├── TEST 5: Toggle "ver todos" → exibe eventos de todas as unidades do tenant
├── TEST 6: Agenda vazia → exibe estado vazio com CTA para criar evento (se liderança)
├── TEST 7: Sincronização com landing page → eventos futuros refletem na seção pública
├── IMPL: Componente Calendar com view toggle (mensal/semanal)
├── IMPL: Query otimizada com range de datas (não carregar todos os eventos)
└── IMPL: ISR trigger para atualizar landing page quando eventos mudam
```

---

## 13. Módulo: Eventos

### 13.1 Campos do Evento

| Campo           | Tipo    | Obrigatório | Notas                              |
| --------------- | ------- | ----------- | ---------------------------------- |
| id              | UUIDv7  | auto        | PK                                 |
| church_id       | UUIDv7  | auto        | FK tenant                          |
| name            | string  | sim         | Nome do evento                     |
| responsible_id  | UUIDv7  | sim         | FK membro (liderança)              |
| date            | date    | sim         |                                    |
| start_time      | time    | sim         |                                    |
| end_time        | time    | não         |                                    |
| modality        | enum    | sim         | online, presencial                 |
| location        | string  | condicional | Obrigatório se presencial          |
| meeting_link    | string  | condicional | Obrigatório se online              |
| description     | text    | não         | Informações adicionais             |
| is_recurring    | boolean | não         | Se repete semanalmente/mensalmente |
| recurrence_rule | jsonb   | não         | Regra de recorrência               |

### 13.2 Relacionamentos do Evento

Um evento pode ter: ministérios associados (ativa escalas), grupos musicais, recursos alocados e liturgia.

### 13.3 User Stories

**US-EVT-01:** Como líder, quero criar um evento com informações básicas, para organizar atividades da igreja.

**US-EVT-02:** Como líder, quero associar ministérios a um evento, para que o líder de cada ministério monte a escala.

**US-EVT-03:** Como líder, quero associar um grupo musical a um evento, para definir quem conduz o louvor.

**US-EVT-04:** Como líder, quero alocar recursos a um evento, para reservar equipamentos e espaços.

**US-EVT-05:** Como responsável pelo evento, quero adicionar uma liturgia, para organizar a ordem do culto.

**US-EVT-06:** Como membro, quero visualizar os detalhes de um evento, para saber data, horário, local e equipe envolvida.

### 13.4 Tasks Técnicas

**TASK-EVT-01: CRUD de eventos**

```
TDD:
├── TEST 1: Criar evento presencial sem endereço → rejeita
├── TEST 2: Criar evento online sem link → rejeita
├── TEST 3: Criar evento com dados válidos → insere + registra audit_log
├── TEST 4: Responsável deve ser membro do tipo liderança → rejeita se for membro/visitante
├── TEST 5: Editar evento → atualiza + registra audit_log
├── TEST 6: Excluir evento → soft-delete + libera recursos alocados
├── TEST 7: Criar evento recorrente → gera instâncias conforme regra de recorrência
├── TEST 8: Apenas liderança pode CRUD → membro recebe 403
├── IMPL: Server Actions com validação Zod e schema condicional por modalidade
├── IMPL: Tabela events com RLS por church_id
└── IMPL: Trigger para liberar recursos ao excluir evento
```

**TASK-EVT-02: Associação de ministérios, grupos musicais e recursos a eventos**

```
TDD:
├── TEST 1: Associar ministério a evento → cria registro na pivot + notifica líder do ministério
├── TEST 2: Associar grupo musical → cria registro na pivot
├── TEST 3: Alocar recurso disponível → muda status para indisponível no período do evento
├── TEST 4: Alocar recurso já indisponível → rejeita com mensagem
├── TEST 5: Remover associação de ministério → remove escala vinculada (se vazia)
├── TEST 6: Remover recurso → libera status
├── IMPL: Tabelas pivot: event_ministries, event_music_groups, event_resources
├── IMPL: Check de conflito de recurso por data/horário
└── IMPL: Notificação (in-app) ao líder quando ministério é adicionado a evento
```

---

## 14. Módulo: Ministérios

### 14.1 Campos

| Campo        | Tipo     | Obrigatório | Notas                                                      |
| ------------ | -------- | ----------- | ---------------------------------------------------------- |
| id           | UUIDv7   | auto        | PK                                                         |
| church_id    | UUIDv7   | auto        | FK tenant                                                  |
| name         | string   | sim         | Nome do ministério                                         |
| counselor_id | UUIDv7   | não         | FK membro (presbítero). Pode ficar em branco.              |
| leader_id    | UUIDv7   | sim         | FK membro                                                  |
| members      | UUIDv7[] | não         | Lista de componentes (via tabela pivot `ministry_members`) |

### 14.2 User Stories

**US-MIN-01:** Como pastor, quero criar um ministério definindo nome, conselheiro e líder, para organizar a estrutura de serviço da igreja.

**US-MIN-02:** Como presbítero, quero adicionar e remover componentes de um ministério, para manter a equipe atualizada.

**US-MIN-03:** Como membro, quero ver os ministérios dos quais faço parte, para saber minhas responsabilidades.

### 14.3 Tasks Técnicas

**TASK-MIN-01: CRUD de ministérios**

```
TDD:
├── TEST 1: Criar ministério com dados válidos → insere
├── TEST 2: Conselheiro deve ser presbítero → rejeita se for outro role
├── TEST 3: Apenas pastor e presbítero podem CRUD → líder recebe 403
├── TEST 4: Adicionar componente → insere em ministry_members
├── TEST 5: Remover componente que está em escala futura → alerta antes de remover
├── TEST 6: Listar ministérios do membro → retorna apenas os que o membro participa
├── IMPL: Server Actions + tabela ministries + ministry_members (pivot)
└── IMPL: RLS por church_id
```

---

## 15. Módulo: Escalas

### 15.1 Especificação

Escalas são ativadas quando um ministério é associado a um evento. O líder do ministério seleciona quais componentes participarão daquele evento específico.

### 15.2 User Stories

**US-ESC-01:** Como líder de ministério, quero montar a escala do meu ministério para um evento, selecionando quais componentes participarão.

**US-ESC-02:** Como componente de ministério, quero ver minha escala de eventos, para saber quando devo servir.

**US-ESC-03:** Como liderança, quero visualizar todas as escalas de um evento, para ter visão geral da equipe.

### 15.3 Tasks Técnicas

**TASK-ESC-01: CRUD de escalas**

```
TDD:
├── TEST 1: Ministério adicionado a evento → cria registro de escala vazia
├── TEST 2: Líder adiciona componente à escala → insere (componente deve ser membro do ministério)
├── TEST 3: Adicionar não-componente do ministério → rejeita
├── TEST 4: Apenas líder do ministério pode editar escala → outro líder recebe 403
├── TEST 5: Liderança pode visualizar qualquer escala → permite
├── TEST 6: Componente vê apenas suas escalas → filtra por member_id
├── IMPL: Tabela scales com: id, event_ministry_id, member_id
├── IMPL: Query para "minha escala" agrupada por mês
└── IMPL: Notificação in-app quando componente é adicionado a uma escala
```

---

## 16. Módulo: Liturgia

### 16.1 Especificação

O responsável por um evento pode adicionar uma liturgia. A liturgia tem um esqueleto predefinido (editável) com os momentos do culto. O responsável define o objetivo/título e a IA recomenda leituras bíblicas e cânticos do repertório.

**Esqueleto padrão (editável):**

1. Acolhida / Boas-vindas
2. Oração inicial
3. Louvor (congregacional)
4. Leitura bíblica
5. Oração pastoral
6. Louvor (especial)
7. Mensagem / Pregação
8. Apelo
9. Oração final
10. Avisos
11. Bênção apostólica

**Feature Premium — Liturgia Inteligente (IA):**

- Input: objetivo do culto (ações de graças, casamento, louvorzão, etc.) ou título da mensagem.
- Output: sugestões de leituras bíblicas (versões ARA, NAA, NVI) e cânticos do repertório do grupo musical associado.
- Provider: GPT-4.1 com strict JSON schema. Fallback: Gemini 2.5 Flash.
- O responsável pode aceitar, rejeitar ou editar cada sugestão.
- O responsável pode delegar a escolha de músicas ao líder do grupo musical.

### 16.2 User Stories

**US-LIT-01:** Como responsável pelo evento, quero adicionar uma liturgia com o esqueleto padrão, para organizar a ordem do culto.

**US-LIT-02:** Como responsável, quero editar o esqueleto da liturgia (reordenar, adicionar, remover itens), para adaptar ao formato do culto.

**US-LIT-03:** Como responsável (premium), quero definir o objetivo do culto e receber sugestões de leituras e cânticos por IA, para agilizar o planejamento.

**US-LIT-04:** Como responsável, quero delegar a escolha de músicas ao líder do grupo musical, para que ele defina o setlist.

**US-LIT-05:** Como membro, quero ler a liturgia do evento, para acompanhar o culto.

**US-LIT-06:** Como responsável, quero selecionar a versão da Bíblia (ARA, NAA, NVI) para as leituras, para usar a versão que a igreja adota.

### 16.3 Tasks Técnicas

**TASK-LIT-01: CRUD de liturgia com esqueleto editável**

```
TDD:
├── TEST 1: Adicionar liturgia a evento → cria com esqueleto padrão
├── TEST 2: Evento já com liturgia → rejeita duplicata
├── TEST 3: Reordenar itens da liturgia → persiste nova ordem
├── TEST 4: Adicionar item customizado → insere na posição desejada
├── TEST 5: Remover item → atualiza ordem dos demais
├── TEST 6: Apenas responsável do evento pode editar → outro membro recebe 403
├── TEST 7: Todos podem ler liturgia → permite para qualquer role
├── IMPL: Tabela liturgies + liturgy_items com campo `order` (integer)
├── IMPL: Drag-and-drop para reordenação no frontend
└── IMPL: Componente LiturgyViewer para leitura por membros
```

**TASK-LIT-02: Integração com IA para recomendações (Premium)**

```
TDD:
├── TEST 1: Enviar objetivo "ações de graças" → retorna leituras bíblicas relevantes em JSON válido
├── TEST 2: Enviar objetivo + grupo musical → retorna cânticos do repertório daquele grupo
├── TEST 3: Repertório vazio → retorna apenas leituras, sem cânticos
├── TEST 4: Resposta da IA fora do schema → fallback para Gemini 2.5 Flash
├── TEST 5: Timeout da API → retorna mensagem amigável sem quebrar a tela
├── TEST 6: Igreja sem plano premium → bloqueia feature com CTA de upgrade
├── TEST 7: Sugestão aceita → insere como liturgy_item
├── TEST 8: Sugestão rejeitada → não insere
├── IMPL: Server Action `getAIRecommendations(objective, bibleVersion, musicGroupId)`
├── IMPL: Prompt system com repertório no prefix (caching 75% desconto)
├── IMPL: Schema Zod para validar response da IA
├── IMPL: Fallback chain: GPT-4.1 → Gemini 2.5 Flash → resposta padrão sem IA
└── IMPL: Feature flag por plano (tabela subscriptions)
```

**TASK-LIT-03: Base de dados bíblica (ARA, NAA, NVI)**

```
TDD:
├── TEST 1: Buscar versículo por referência (ex: "João 3:16") em ARA → retorna texto correto
├── TEST 2: Buscar mesma referência em NAA → retorna texto da NAA
├── TEST 3: Buscar referência inválida → retorna erro
├── TEST 4: Buscar range (ex: "Salmos 23:1-6") → retorna todos os versículos
├── TEST 5: Busca textual (ex: "amor") → retorna versículos contendo a palavra
├── IMPL: Tabela bible_verses com: book, chapter, verse, text, version (enum: ARA, NAA, NVI)
├── IMPL: Seed com textos das três versões (verificar licenciamento)
├── IMPL: Index GIN para busca textual em português
└── IMPL: API route GET /api/bible?ref=Jo+3:16&version=NVI
```

> **Nota:** Verificar licenciamento das versões bíblicas antes do seed. ARA (SBB) e NVI (Biblica) possuem restrições de uso comercial. A definir com o PO.

---

## 17. Módulo: Grupos Musicais

### 17.1 Campos

| Campo     | Tipo     | Obrigatório | Notas                                  |
| --------- | -------- | ----------- | -------------------------------------- |
| id        | UUIDv7   | auto        | PK                                     |
| church_id | UUIDv7   | auto        | FK tenant                              |
| name      | string   | sim         | Nome do grupo                          |
| leader_id | UUIDv7   | sim         | FK membro                              |
| members   | UUIDv7[] | —           | Via tabela pivot `music_group_members` |

### 17.2 User Stories

**US-GM-01:** Como pastor, quero criar um grupo musical definindo nome e líder, para organizar as equipes de louvor.

**US-GM-02:** Como presbítero, quero adicionar e remover componentes de um grupo musical, para manter a equipe atualizada.

**US-GM-03:** Como líder do grupo musical, quero gerenciar o repertório do meu grupo, para ter controle das músicas que tocamos.

### 17.3 Tasks Técnicas

**TASK-GM-01: CRUD de grupos musicais**

```
TDD:
├── TEST 1: Criar grupo com dados válidos → insere
├── TEST 2: Apenas pastor e presbítero podem CRUD → líder recebe 403
├── TEST 3: Adicionar componente → insere em music_group_members
├── TEST 4: Listar grupos do membro → retorna apenas os que participa
├── IMPL: Server Actions + tabela music_groups + music_group_members (pivot)
└── IMPL: RLS por church_id
```

---

## 18. Módulo: Repertório

### 18.1 Campos de Música

| Campo           | Tipo   | Obrigatório | Notas                      |
| --------------- | ------ | ----------- | -------------------------- |
| id              | UUIDv7 | auto        | PK                         |
| music_group_id  | UUIDv7 | sim         | FK grupo musical           |
| church_id       | UUIDv7 | auto        | FK tenant                  |
| name            | string | sim         | Nome da música             |
| artist          | string | sim         | Artista/compositor         |
| lyrics          | text   | não         | Letra completa             |
| chord_url       | string | não         | Link da cifra              |
| youtube_url     | string | não         | Link do YouTube            |
| central_message | text   | não         | Mensagem central da música |

### 18.2 User Stories

**US-REP-01:** Como líder do grupo musical, quero adicionar músicas ao repertório com nome, artista, letra, links e mensagem central.

**US-REP-02:** Como líder do grupo musical, quero editar e excluir músicas do meu repertório.

**US-REP-03:** Como membro, quero visualizar as músicas de uma liturgia, para acompanhar o louvor.

**US-REP-04:** Como pastor, quero adicionar músicas do repertório de um grupo musical à liturgia, para montar o setlist do culto.

### 18.3 Tasks Técnicas

**TASK-REP-01: CRUD de repertório**

```
TDD:
├── TEST 1: Criar música com dados válidos → insere no repertório do grupo
├── TEST 2: Apenas líder do grupo musical pode CRUD → componente recebe 403
├── TEST 3: Editar música → atualiza + audit_log
├── TEST 4: Excluir música que está em liturgia futura → alerta antes de excluir
├── TEST 5: Listar repertório do grupo → retorna músicas com busca por nome/artista
├── TEST 6: Ler músicas na liturgia → qualquer membro pode visualizar
├── IMPL: Tabela songs com RLS por church_id
├── IMPL: Index em name e artist para busca
└── IMPL: Componente SongCard com expansão para letra e links
```

---

## 19. Módulo: Recursos

### 19.1 Campos

| Campo          | Tipo    | Obrigatório | Notas                     |
| -------------- | ------- | ----------- | ------------------------- |
| id             | UUIDv7  | auto        | PK                        |
| church_id      | UUIDv7  | auto        | FK tenant                 |
| name           | string  | sim         | Nome do recurso           |
| responsible_id | UUIDv7  | não         | FK membro responsável     |
| status         | enum    | sim         | disponível, indisponível  |
| value          | decimal | não         | Valor estimado do recurso |

### 19.2 User Stories

**US-REC-01:** Como diácono, quero cadastrar recursos da igreja (equipamentos, salas, veículos) com nome, responsável, estado e valor.

**US-REC-02:** Como líder, quero alocar um recurso a um evento, para reservá-lo.

**US-REC-03:** Como liderança, quero ver o status atual de todos os recursos, para saber o que está disponível.

### 19.3 Tasks Técnicas

**TASK-REC-01: CRUD de recursos com controle de disponibilidade**

```
TDD:
├── TEST 1: Criar recurso com dados válidos → insere com status "disponível"
├── TEST 2: Apenas pastor, presbítero e diácono podem CRUD → líder recebe 403
├── TEST 3: Alocar recurso a evento → status muda para "indisponível" no período
├── TEST 4: Alocar recurso já indisponível → rejeita com conflito
├── TEST 5: Evento excluído → recurso volta para "disponível"
├── TEST 6: Listar recursos → exibe status atual + próxima alocação
├── IMPL: Tabela resources + event_resources (pivot com datas)
├── IMPL: Check de conflito por overlap de data/horário
└── IMPL: Badge de status visual (verde/vermelho) na listagem
```

---

## 20. Módulo: Financeiro

### 20.1 Especificação

Módulo de controle financeiro com KPIs visuais. Acesso CRUD exclusivo do tesoureiro. Leitura para pastor, presbítero e diácono.

**KPIs (cards no topo):**

- Saldo total (com tooltip detalhando saldo por conta)
- Receitas realizadas no ano corrente
- Despesas realizadas no ano corrente

### 20.2 Campos de Conta

| Campo           | Tipo    | Obrigatório | Notas                                              |
| --------------- | ------- | ----------- | -------------------------------------------------- |
| id              | UUIDv7  | auto        | PK                                                 |
| church_id       | UUIDv7  | auto        | FK tenant                                          |
| name            | string  | sim         | Nome da conta (ex: Conta Principal, Conta Missões) |
| description     | text    | não         |                                                    |
| bank            | string  | não         | Nome do banco                                      |
| agency          | string  | não         | Número da agência                                  |
| account_number  | string  | não         | Número da conta (criptografado)                    |
| initial_balance | decimal | sim         | Saldo inicial                                      |
| current_balance | decimal | auto        | Calculado por triggers                             |

### 20.3 Campos de Transação

| Campo       | Tipo    | Obrigatório | Notas                                                                                                                                        |
| ----------- | ------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| id          | UUIDv7  | auto        | PK                                                                                                                                           |
| church_id   | UUIDv7  | auto        | FK tenant                                                                                                                                    |
| account_id  | UUIDv7  | sim         | FK conta                                                                                                                                     |
| type        | enum    | sim         | entrada, saída                                                                                                                               |
| date        | date    | sim         | Data da transação                                                                                                                            |
| description | string  | sim         | Descrição                                                                                                                                    |
| category    | enum    | sim         | **Entradas:** dízimo, oferta, doação, campanha, outro. **Saídas:** aluguel, manutenção, salário, missões, água/luz/internet, material, outro |
| value       | decimal | sim         | Valor (sempre positivo)                                                                                                                      |
| member_id   | UUIDv7  | não         | FK membro (apenas entradas: associar contribuição ao membro)                                                                                 |
| receipt_url | string  | não         | Upload do comprovante (Supabase Storage)                                                                                                     |
| notes       | text    | não         | Observações                                                                                                                                  |

> **Nota:** Os registros financeiros são **imutáveis** após criação. Correções são feitas via estorno (nova transação inversa). Isso garante integridade para auditoria.

### 20.4 User Stories

**US-FIN-01:** Como tesoureiro, quero abrir contas bancárias no sistema com nome, banco, agência, conta e saldo inicial.

**US-FIN-02:** Como tesoureiro, quero registrar entradas (dízimo, oferta, doação) com data, valor, categoria, membro associado e comprovante.

**US-FIN-03:** Como tesoureiro, quero registrar saídas com data, valor, categoria, conta e comprovante.

**US-FIN-04:** Como tesoureiro, quero visualizar KPIs de saldo total, receitas e despesas do ano.

**US-FIN-05:** Como pastor, quero ler o financeiro para acompanhar a saúde financeira da igreja, sem poder alterar registros.

**US-FIN-06:** Como tesoureiro da matriz, quero decidir se o caixa das congregações será compartilhado ou separado.

### 20.5 Tasks Técnicas

**TASK-FIN-01: CRUD de contas e transações**

```
TDD:
├── TEST 1: Criar conta com dados válidos → insere com current_balance = initial_balance
├── TEST 2: Registrar entrada → insere transação + atualiza current_balance da conta via trigger
├── TEST 3: Registrar saída → insere transação + atualiza current_balance da conta via trigger
├── TEST 4: Saída maior que saldo → permite (saldo pode ficar negativo) + alerta visual
├── TEST 5: Apenas tesoureiro pode CRUD → pastor tentando criar recebe 403
├── TEST 6: Pastor lendo financeiro → permite
├── TEST 7: Membro lendo financeiro → 403
├── TEST 8: Transação imutável → tentativa de UPDATE retorna erro
├── TEST 9: Estorno → cria nova transação inversa com referência à original
├── TEST 10: Upload de comprovante → armazena no Supabase Storage com path criptografado
├── TEST 11: Número da conta criptografado em repouso
├── IMPL: Tabelas accounts + transactions com RLS por church_id + role tesoureiro
├── IMPL: DB trigger para atualizar current_balance a cada INSERT em transactions
├── IMPL: Policy de imutabilidade: DENY UPDATE/DELETE em transactions
├── IMPL: Criptografia AES-256 para account_number
└── IMPL: Upload de comprovante via Supabase Storage com path: /{church_id}/receipts/{uuid}
```

**TASK-FIN-02: KPIs financeiros**

```
TDD:
├── TEST 1: Saldo total → soma de current_balance de todas as contas do tenant
├── TEST 2: Receitas do ano → soma de transações tipo "entrada" no ano corrente
├── TEST 3: Despesas do ano → soma de transações tipo "saída" no ano corrente
├── TEST 4: Tooltip de saldo por conta → lista contas com saldo individual
├── TEST 5: Flag shared_finances = true → exibe saldo consolidado (matriz + congregações)
├── TEST 6: Flag shared_finances = false → exibe apenas saldo da unidade
├── IMPL: Server Component com query agregada
├── IMPL: KPI cards com formatação BRL (Intl.NumberFormat)
└── IMPL: Tooltip com breakdown por conta
```

---

## 21. Módulo: Mural de Interação

### 21.1 Especificação

Feed estilo rede social, apenas texto no MVP. Algoritmo de relevância priorizando posts de líderes. Possibilidade de fixar posts por tempo determinado (pastor e presbítero).

**Botões de ação:** Orar e Gratidão (substituem curtidas).

### 21.2 User Stories

**US-MUR-01:** Como membro, quero criar um post de texto no mural, para compartilhar com a comunidade.

**US-MUR-02:** Como membro, quero comentar em posts, para interagir com a comunidade.

**US-MUR-03:** Como membro, quero reagir com "orar" ou "gratidão" a um post, para expressar apoio.

**US-MUR-04:** Como pastor, quero fixar um post no topo do mural por tempo determinado, para dar destaque a avisos importantes.

**US-MUR-05:** Como membro, quero ver o mural ordenado por relevância (posts de líderes primeiro, depois recentes), para não perder conteúdo importante.

**US-MUR-06:** Como membro, quero ver as tags de atribuição (pastor, líder, etc.) ao lado do nome do autor, para saber quem está falando.

**US-MUR-07:** Como membro, quero ver o streak de devoção (foguinho) no avatar do autor, para ver quem mantém a leitura diária.

### 21.3 Tasks Técnicas

**TASK-MUR-01: CRUD de posts e comentários**

```
TDD:
├── TEST 1: Criar post com texto válido → insere com author_id e timestamp
├── TEST 2: Post vazio → rejeita
├── TEST 3: Post com mais de 2000 caracteres → rejeita
├── TEST 4: Comentar em post → insere comment com parent_post_id
├── TEST 5: Excluir próprio post → soft-delete
├── TEST 6: Pastor exclui post de outro membro → permite
├── TEST 7: Membro exclui post de outro → 403
├── TEST 8: Input sanitizado contra XSS → DOMPurify remove scripts
├── TEST 9: RLS → posts visíveis apenas dentro do tenant
├── IMPL: Tabelas posts + comments com RLS por church_id
├── IMPL: Sanitização com DOMPurify no servidor antes do INSERT
└── IMPL: Componente PostCard com avatar, tags, streak, ações
```

**TASK-MUR-02: Reações e fixação**

```
TDD:
├── TEST 1: Reagir com "orar" → incrementa contador + salva membro que reagiu
├── TEST 2: Reagir novamente com "orar" → remove reação (toggle)
├── TEST 3: Reagir com "gratidão" → funciona independente de "orar"
├── TEST 4: Fixar post → apenas pastor e presbítero podem
├── TEST 5: Fixar com tempo determinado (ex: 7 dias) → post desfixa automaticamente após prazo
├── TEST 6: Post fixado aparece no topo do feed → independente do algoritmo
├── IMPL: Tabela reactions com unique constraint (post_id, member_id, type)
├── IMPL: Campo pinned_until (timestamp nullable) em posts
└── IMPL: Job scheduled para remover fixação expirada (ou check no query)
```

**TASK-MUR-03: Algoritmo de relevância**

```
TDD:
├── TEST 1: Posts fixados → sempre no topo, ordenados por pinned_at
├── TEST 2: Posts de liderança (pastor, presbítero, líder) → prioridade sobre posts de membros
├── TEST 3: Dentro da mesma prioridade → ordenados por recência (created_at DESC)
├── TEST 4: Posts com mais reações → boost de relevância (peso leve)
├── TEST 5: Posts antigos (> 7 dias) → decaimento de relevância
├── IMPL: Query com ORDER BY: pinned (DESC), is_leader (DESC), score (DESC), created_at (DESC)
├── IMPL: Score = (reactions_count * 0.3) + (comments_count * 0.5) - (age_hours * 0.01)
└── IMPL: Paginação cursor-based para scroll infinito
```

---

## 22. Módulo: Gamificação

### 22.1 Especificação

Módulo de engajamento para jovens. Gerenciado pelo admin do SaaS (equipes, badges, triggers, pontuação). As igrejas não personalizam as regras.

**Componentes:**

1. **Equipes (12 Tribos de Israel):** Ao se cadastrar, cada membro é atribuído automaticamente a uma equipe. As equipes são globais por tenant (gerenciadas pelo admin).
2. **Pontuação:** Ações individuais somam pontos para a equipe.
3. **Placar:** Parcial mensal e total anual.
4. **Streaks de devoção:** Capítulo da Bíblia sugerido diariamente. Ao ler, o membro mantém o "foguinho" no avatar.
5. **Badges colecionáveis:** Medalhas por participação, marcos de leitura, campeão anual, badges de serviço.
6. **Tags no perfil:** Até 3 tags com atribuições (pastor, líder, etc.).

### 22.2 Tabela de Pontuação (gerenciada pelo admin)

| Ação                                          | Pontos      | Frequência    |
| --------------------------------------------- | ----------- | ------------- |
| Check-in em culto                             | 10          | Por evento    |
| Presença na escola dominical                  | 15          | Por evento    |
| Trazer visitante (cadastro pelo link pessoal) | 50          | Por visitante |
| Completar leitura diária                      | 5           | Por dia       |
| Streak de 7 dias                              | 20 (bônus)  | Semanal       |
| Streak de 30 dias                             | 100 (bônus) | Mensal        |

> Os valores acima são defaults configuráveis pelo admin do SaaS. As igrejas recebem as mesmas regras.

### 22.3 User Stories

**US-GAM-01:** Como membro, quero ser atribuído automaticamente a uma equipe ao me cadastrar, para participar da gincana.

**US-GAM-02:** Como membro, quero ver o placar geral das equipes com parcial mensal e total anual, para acompanhar a competição.

**US-GAM-03:** Como membro, quero manter meu streak de devoção lendo o capítulo diário sugerido, para manter o foguinho no meu avatar.

**US-GAM-04:** Como membro, quero colecionar badges por participar de eventos e alcançar marcos, para exibir no meu perfil.

**US-GAM-05:** Como membro, quero exibir até 3 tags de atribuição no meu perfil e nos meus posts, para identificar meu papel na igreja.

**US-GAM-06:** Como admin do SaaS, quero gerenciar equipes, badges e triggers de pontuação, para controlar a mecânica de gamificação.

### 22.4 Tasks Técnicas

**TASK-GAM-01: Sistema de equipes e atribuição automática**

```
TDD:
├── TEST 1: Novo membro cadastrado → atribuído à equipe com menos membros no tenant
├── TEST 2: 12 equipes criadas por tenant → distribuição round-robin balanceada
├── TEST 3: Equipes são criadas automaticamente quando tenant é criado
├── TEST 4: Membro não pode trocar de equipe → imutável após atribuição
├── TEST 5: Placar mensal → soma de pontos dos membros da equipe no mês
├── TEST 6: Placar anual → soma de pontos dos membros da equipe no ano
├── IMPL: Tabela teams (12 por tenant, seed automático) + member_teams (pivot)
├── IMPL: Query de atribuição: SELECT team com MIN(count) de membros no tenant
├── IMPL: View materializada para placar (refresh a cada 5 min ou on-demand)
└── IMPL: Componente Leaderboard com tabs mensal/anual
```

**TASK-GAM-02: Sistema de pontuação**

```
TDD:
├── TEST 1: Check-in em evento → +10 pts para o membro e sua equipe
├── TEST 2: Visitante cadastrado pelo link pessoal → +50 pts para o convidante
├── TEST 3: Leitura diária completada → +5 pts
├── TEST 4: Streak de 7 dias → +20 pts bônus
├── TEST 5: Streak de 30 dias → +100 pts bônus
├── TEST 6: Pontuação negativa → não permitida (mínimo 0)
├── TEST 7: Pontos registrados com timestamp e referência à ação → auditável
├── IMPL: Tabela score_events com: member_id, team_id, points, action_type, reference_id, created_at
├── IMPL: Trigger que insere score_event quando check_in é criado
├── IMPL: Trigger que insere score_event quando membro é criado com invited_by
└── IMPL: DB function para cálculo agregado de placar
```

**TASK-GAM-03: Streaks de devoção**

```
TDD:
├── TEST 1: Marcar leitura do dia → incrementa streak_count + registra pontos
├── TEST 2: Não ler por 1 dia → streak_count reseta para 0
├── TEST 3: Streak ativo → exibe foguinho animado no avatar (perfil + mural)
├── TEST 4: Capítulo diário sugerido → sequência bíblica predefinida (Gênesis → Apocalipse)
├── TEST 5: Streak de 7 dias → dispara badge + pontos bônus
├── TEST 6: Streak de 30 dias → dispara badge + pontos bônus
├── IMPL: Tabela devotion_streaks: member_id, current_streak, longest_streak, last_read_date
├── IMPL: Tabela daily_readings: date, book, chapter (seed sequencial)
├── IMPL: Job diário (cron) para resetar streaks não atualizados
├── IMPL: Componente FireStreak com animação CSS (Framer Motion)
└── IMPL: Badge trigger via DB function quando streak atinge marcos
```

**TASK-GAM-04: Badges e conquistas**

```
TDD:
├── TEST 1: Admin cria badge com nome, descrição, ícone e trigger → insere na tabela global
├── TEST 2: Trigger "streak_7" atingido → badge atribuído automaticamente ao membro
├── TEST 3: Trigger "evento_especial_xyz" → badge atribuído ao fazer check-in no evento
├── TEST 4: Badge de serviço "1 ano no ministério X" → cálculo por data de entrada
├── TEST 5: Membro visualiza seus badges no perfil → grid com badges desbloqueados e bloqueados
├── TEST 6: Badge não duplica → unique constraint (member_id, badge_id)
├── IMPL: Tabela badges (global, gerenciada por admin): id, name, description, icon_url, trigger_type, trigger_config
├── IMPL: Tabela member_badges: member_id, badge_id, unlocked_at
├── IMPL: Sistema de triggers: DB functions + event listeners
└── IMPL: Componente BadgeGrid com estado locked/unlocked + animação de desbloqueio
```

---

## 23. Módulo: Assembléia

### 23.1 Campos

| Campo        | Tipo    | Obrigatório | Notas                |
| ------------ | ------- | ----------- | -------------------- |
| id           | UUIDv7  | auto        | PK                   |
| church_id    | UUIDv7  | auto        | FK tenant            |
| name         | string  | sim         | Nome da assembléia   |
| date         | date    | sim         |                      |
| start_time   | time    | sim         |                      |
| location     | string  | sim         | Local                |
| reason       | text    | sim         | Motivo da convocação |
| agenda       | text    | sim         | Pauta                |
| has_election | boolean | não         | Se contém votação    |

### 23.2 User Stories

**US-ASM-01:** Como pastor, quero criar uma assembléia com nome, data, local, motivo e pauta.

**US-ASM-02:** Como pastor, quero adicionar uma eleição/votação a uma assembléia, para conduzir decisões eclesiásticas.

**US-ASM-03:** Como membro convocado, quero visualizar os detalhes da assembléia e sua pauta.

### 23.3 Tasks Técnicas

**TASK-ASM-01: CRUD de assembléias**

```
TDD:
├── TEST 1: Criar assembléia com dados válidos → insere
├── TEST 2: Apenas pastor pode criar → presbítero recebe 403
├── TEST 3: Adicionar elemento eleição → cria election vinculada
├── TEST 4: Excluir assembléia com votação em andamento → bloqueia
├── TEST 5: Listar assembléias → ordenadas por data DESC
├── IMPL: Tabela assemblies com RLS por church_id
└── IMPL: Componente AssemblyCard com indicador de votação ativa
```

---

## 24. Módulo: Eleição/Votação

### 24.1 Campos

| Campo             | Tipo    | Obrigatório | Notas                                       |
| ----------------- | ------- | ----------- | ------------------------------------------- |
| id                | UUIDv7  | auto        | PK                                          |
| assembly_id       | UUIDv7  | sim         | FK assembléia                               |
| church_id         | UUIDv7  | auto        | FK tenant                                   |
| name              | string  | sim         | Nome da eleição                             |
| description       | text    | não         |                                             |
| quorum            | integer | auto        | Calculado pela quantidade de membros ativos |
| allow_remote_vote | boolean | sim         | Definido pelo pastor/presbítero             |
| status            | enum    | auto        | rascunho, aberta, encerrada, cancelada      |

### 24.2 Candidatos e Cargos

Tabela `election_candidates`:

| Campo       | Tipo   | Notas                                                                  |
| ----------- | ------ | ---------------------------------------------------------------------- |
| id          | UUIDv7 | PK                                                                     |
| election_id | UUIDv7 | FK                                                                     |
| member_id   | UUIDv7 | FK membro candidato                                                    |
| position    | string | Cargo disputado (bispo, pastor, presbítero, diácono, presidente, etc.) |

Para votações do tipo sim/não (aprovação de pauta), `position` = "aprovação" e `member_id` = null, com candidatos fixos: "Sim" e "Não".

### 24.3 Votos

Tabela `votes`:

| Campo        | Tipo      | Notas                                                               |
| ------------ | --------- | ------------------------------------------------------------------- |
| id           | UUIDv7    | PK                                                                  |
| election_id  | UUIDv7    | FK                                                                  |
| candidate_id | UUIDv7    | FK election_candidates                                              |
| voter_hash   | string    | Hash anônimo do votante (SHA-256 de member_id + election_id + salt) |
| voted_at     | timestamp |                                                                     |
| vote_method  | enum      | presencial, remoto                                                  |

**Anonimização:** O voto é armazenado com um `voter_hash` que permite verificar se um membro já votou sem revelar quem votou em quem. O salt é único por eleição e armazenado separadamente.

### 24.4 Fluxo de Votação

1. Pastor/presbítero cria a eleição (rascunho).
2. Adiciona candidatos por cargo ou cria votação sim/não.
3. Define se voto remoto é permitido.
4. Na assembléia, abre a votação (status: aberta).
5. Membros presenciais fazem check-in por QR code e votam pelo app.
6. Se `allow_remote_vote = true`, membros autenticados podem votar remotamente com autenticação forte (senha + código por e-mail).
7. Ao encerrar a votação, o sistema calcula os resultados e exibe.
8. Votos são salvos para auditoria de forma anônima.

### 24.5 User Stories

**US-VOT-01:** Como pastor, quero criar uma eleição dentro de uma assembléia, definindo candidatos e cargos.

**US-VOT-02:** Como presbítero, quero criar uma votação do tipo sim/não para aprovação de pauta.

**US-VOT-03:** Como pastor, quero definir se membros ausentes podem votar remotamente.

**US-VOT-04:** Como membro presente na assembléia, quero fazer check-in por QR code e votar pelo app.

**US-VOT-05:** Como membro remoto autorizado, quero votar após autenticação forte (senha + código por e-mail).

**US-VOT-06:** Como pastor, quero encerrar a votação e visualizar os resultados, para proclamar o resultado.

**US-VOT-07:** Como auditor, quero verificar a integridade dos votos sem identificar os votantes, para garantir transparência.

### 24.6 Tasks Técnicas

**TASK-VOT-01: CRUD de eleições**

```
TDD:
├── TEST 1: Criar eleição com dados válidos → insere com status "rascunho"
├── TEST 2: Apenas pastor e presbítero podem CRUD → diácono recebe 403
├── TEST 3: Quórum calculado automaticamente → count de membros ativos no tenant
├── TEST 4: Adicionar candidato → insere em election_candidates
├── TEST 5: Candidato deve ser membro ativo do tenant → rejeita externo
├── TEST 6: Votação sim/não → cria 2 candidatos fixos sem member_id
├── TEST 7: Abrir votação → muda status para "aberta" + registra timestamp
├── TEST 8: Encerrar votação → muda status para "encerrada" + calcula resultado
├── IMPL: Tabelas elections + election_candidates com RLS
└── IMPL: State machine para status (rascunho → aberta → encerrada/cancelada)
```

**TASK-VOT-02: Sistema de votação anônima**

```
TDD:
├── TEST 1: Membro com check-in presencial vota → insere voto com voter_hash
├── TEST 2: Membro sem check-in + allow_remote = true → exige autenticação forte
├── TEST 3: Membro sem check-in + allow_remote = false → rejeita voto
├── TEST 4: Membro tenta votar duas vezes → rejeita (voter_hash duplicado na mesma eleição)
├── TEST 5: Voto armazenado anonimamente → impossível associar voter_hash a member_id sem salt
├── TEST 6: Salt único por eleição → armazenado em tabela separada com acesso restrito
├── TEST 7: Resultado calculado → contagem de votos por candidato/cargo
├── TEST 8: Quórum não atingido → resultado marcado como "sem quórum"
├── IMPL: Tabela votes com unique constraint (election_id, voter_hash)
├── IMPL: Helper `generateVoterHash(memberId, electionId, salt)` com SHA-256
├── IMPL: Tabela election_salts com RLS restrito (apenas DB admin)
├── IMPL: Autenticação forte para voto remoto: revalidar senha + enviar código por e-mail (Resend)
└── IMPL: Server Action `castVote(electionId, candidateId)` com todas as validações
```

---

## 25. Check-in por QR Code

### 25.1 Arquitetura

O sistema usa **QR codes dinâmicos com token assinado criptograficamente**, rotacionando a cada 30 segundos.

**Fluxo:**

1. Líder do evento abre a tela de check-in no dispositivo de exibição (projetor, tablet, TV).
2. O servidor gera um token assinado: `{eventId, locationId, timestamp, nonce}` com Ed25519.
3. O token é codificado em QR code (SVG via `qrcode.react`) e exibido com countdown.
4. A cada 30 segundos, novo token é enviado via Supabase Realtime (ou Pusher) e o QR atualiza.
5. Membro abre o app, escaneia o QR (via `qr-scanner`).
6. O app envia o token + geolocalização ao servidor.
7. O servidor valida: assinatura, timestamp (janela de 60s), nonce (single-use via Redis), geolocalização (raio configurável).
8. Check-in registrado.

### 25.2 Camadas de Segurança

| Camada                       | Proteção                                |
| ---------------------------- | --------------------------------------- |
| Assinatura criptográfica     | Impede falsificação de tokens           |
| Expiração em 30s             | Screenshots expiram rápido              |
| Nonce single-use (Redis TTL) | Impede reutilização                     |
| Geolocalização (opcional)    | Impede check-in remoto                  |
| Rate limiting                | 1 check-in por membro por evento        |
| Janela de evento             | 15 min antes a 30 min depois do horário |

### 25.3 User Stories

**US-QR-01:** Como líder do evento, quero abrir uma tela de check-in que exibe um QR code dinâmico, para que os membros registrem presença.

**US-QR-02:** Como membro, quero escanear o QR code no app para fazer check-in no evento.

**US-QR-03:** Como visitante sem app, quero usar a câmera do celular para escanear o QR e ser direcionado a uma página de check-in web.

**US-QR-04:** Como líder, quero ver em tempo real quantos membros fizeram check-in no evento.

### 25.4 Tasks Técnicas

**TASK-QR-01: Geração e rotação de QR codes**

```
TDD:
├── TEST 1: Gerar token → contém eventId, locationId, timestamp, nonce
├── TEST 2: Token assinado com Ed25519 → verificação com chave pública retorna true
├── TEST 3: Token com timestamp > 60s atrás → falha na validação
├── TEST 4: Nonce já consumido → falha na validação
├── TEST 5: Rotação a cada 30s → novo token enviado via realtime
├── TEST 6: QR encoda URL curta: https://app.Koinos/c/{shortToken}
├── IMPL: API route POST /api/checkin/generate com Ed25519 signing
├── IMPL: Canal Supabase Realtime para push de novos tokens
├── IMPL: Componente QRDisplay com countdown visual e auto-refresh
└── IMPL: Redis (Upstash) para tracking de nonces com TTL de 120s
```

**TASK-QR-02: Validação e registro de check-in**

```
TDD:
├── TEST 1: Token válido + membro autenticado → check-in registrado
├── TEST 2: Token inválido (assinatura falha) → rejeita
├── TEST 3: Token expirado → rejeita com mensagem
├── TEST 4: Nonce já consumido → rejeita
├── TEST 5: Membro já fez check-in neste evento → rejeita (idempotente)
├── TEST 6: Geolocalização fora do raio → rejeita (se geolocation ativada no evento)
├── TEST 7: Fora da janela de evento → rejeita
├── TEST 8: Check-in registrado → incrementa pontos de gamificação
├── TEST 9: Check-in sem app (URL curta) → redireciona para página web de check-in
├── IMPL: Server Action `validateCheckin(token, geolocation)`
├── IMPL: Tabela check_ins: id, event_id, member_id, checked_in_at, method (qr/web), geo_lat, geo_lng
├── IMPL: Unique constraint (event_id, member_id)
├── IMPL: Trigger para inserir score_event na gamificação
└── IMPL: Haversine distance function para validação de geolocalização
```

---

## 26. Roadmap MVP

### Fase 0 — Fundação (Semanas 1–2)

- Setup do projeto: Next.js 16, TypeScript 6, Tailwind CSS 4, shadcn/ui, Supabase.
- Estrutura de diretórios, linting, Prettier, Husky (pre-commit).
- CI/CD com Vercel (preview deploys, production).
- Schema inicial do banco de dados com migrações (Supabase CLI).
- RLS policies base para multi-tenancy.
- Sistema de autenticação (Supabase Auth): signup, login, logout, reset de senha.
- Design system: tokens de cor, tipografia, spacing, componentes base (Button, Input, Card, Modal, Toast).
- Modo noturno (toggle + programável).
- Layout responsivo: mobile bottom nav + desktop sidebar.

### Fase 1 — Onboarding e RBAC (Semanas 3–4)

- Fluxo de criação de tenant (nova igreja).
- Matching por CPF.
- Sistema de links de convite (geral + pessoal).
- Middleware de autorização.
- Consentimentos LGPD granulares.
- Painel de perfil do membro.

### Fase 2 — Módulos Core (Semanas 5–8)

- CRUD Membros + vínculos familiares.
- CRUD Eventos.
- Agenda (visualização mensal/semanal).
- CRUD Ministérios + Escalas.
- CRUD Grupos Musicais + Repertório.
- CRUD Recursos.

### Fase 3 — Interação e Engajamento (Semanas 9–11)

- Mural de interação (posts, comentários, reações).
- Algoritmo de relevância.
- Fixação de posts.
- Gamificação: equipes, pontuação, placar.
- Streaks de devoção.
- Badges (estrutura + badges iniciais).
- Check-in por QR code.

### Fase 4 — Features Avançadas (Semanas 12–14)

- Financeiro (contas, transações, KPIs).
- Assembléia + Eleição/Votação.
- Liturgia (esqueleto editável).
- Landing page personalizável.
- Domínio personalizado (subdomínio).

### Fase 5 — Premium e Lançamento (Semanas 15–16)

- Liturgia Inteligente (integração IA).
- Sistema de billing (AbacatePay).
- Feature flags por plano.
- Portal de privacidade LGPD.
- Testes E2E com Playwright.
- Audit de segurança.
- Soft launch com 10 igrejas piloto.

---

## 27. Glossário

| Termo           | Definição                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------- |
| **Tenant**      | Instância isolada de uma igreja no sistema multi-tenant.                                           |
| **RLS**         | Row-Level Security — mecanismo do PostgreSQL para isolar dados por tenant.                         |
| **Lotação**     | A unidade (matriz ou congregação) onde o membro está alocado.                                      |
| **Liderança**   | Membros com role: pastor, presbítero, diácono ou líder.                                            |
| **Matching**    | Processo de associar um novo cadastro digital a um membro pré-existente via CPF.                   |
| **Streak**      | Sequência ininterrupta de dias com leitura bíblica completada.                                     |
| **Badge**       | Medalha/conquista colecionável desbloqueada por ações ou marcos.                                   |
| **Nonce**       | Número aleatório de uso único para prevenir replay attacks no QR code.                             |
| **RIPD**        | Relatório de Impacto à Proteção de Dados (equivalente ao DPIA do GDPR).                            |
| **DPA**         | Data Processing Agreement — contrato entre controlador (igreja) e operador (SaaS).                 |
| **Controlador** | A igreja — define as finalidades do processamento de dados.                                        |
| **Operador**    | O SaaS (Koinos) — processa dados em nome do controlador.                                           |
| **UUIDv7**      | UUID com componente temporal, ideal para PKs com ordenação natural e performance de índice.        |
| **ISR**         | Incremental Static Regeneration — técnica do Next.js para regenerar páginas estáticas sob demanda. |
