# Bugs Conhecidos e Limitações do MVP

> Documento vivo. Atualizar a cada sessão quando novos problemas forem identificados ou resolvidos.
> Última atualização: 2026-05-05 (Sessão 5.5)

---

## Legenda

| Símbolo      | Significado                             |
| ------------ | --------------------------------------- |
| 🔴 Crítico   | Bloqueia funcionalidade principal       |
| 🟡 Médio     | Degradação de UX, workaround disponível |
| 🟢 Baixo     | Cosmético ou edge case raro             |
| ✅ Resolvido | Corrigido em sessão posterior           |

---

## Bugs Conhecidos

### 🟡 B-01 — Dark mode com flash no primeiro carregamento (SSR)

**Descrição:** Em conexões lentas, o tema dark pode piscar brevemente para light antes do cookie ser lido pelo servidor.
**Contexto:** `layout.tsx` lê o cookie via `getThemeFromCookie()`, mas o browser pode aplicar o CSS antes do HTML chegar completamente.
**Workaround:** Adicionar um inline script no `<head>` para aplicar a classe `.dark` antes da pintura (FOUC prevention).
**Status:** 🟡 Pendente

---

### 🟡 B-02 — Busca global não retorna resultados em CPF/RG

**Descrição:** Os campos CPF e RG são armazenados criptografados (AES-256). A busca global (`src/actions/search.ts`) usa `ilike` e não consegue buscar por esses campos.
**Impacto:** Administradores não conseguem localizar membros pelo CPF via busca global.
**Workaround:** Usar a página `/membros` com filtro específico.
**Status:** 🟡 Pendente — requereria busca no servidor com descriptografia por lote

---

### 🟡 B-03 — Edge Function de anonimização não tem retry automático

**Descrição:** Se a Edge Function `anonymize-members` falhar para um membro específico, o processo continua para os próximos mas não reagenda a tentativa.
**Impacto:** Membros com erro no banco (ex: constraint violation) podem nunca ser anonimizados.
**Workaround:** Verificar logs diários da Edge Function no Supabase Dashboard.
**Status:** 🟡 Pendente — implementar coluna `anonymization_failed_at` e lógica de retry

---

### 🟢 B-04 — Onboarding tour não é mostrado para pastores que logam antes do tour ser detectado

**Descrição:** O tour usa `isNew` baseado em `members.created_at` vs. 7 dias. Se o pastor tiver sido criado há mais de 7 dias (ex: via seed), o tour nunca aparece.
**Impacto:** Pastores em ambientes de staging ou migração de dados não recebem o tour.
**Workaround:** Limpar a chave `koinos_tour_v1` do localStorage manualmente.
**Status:** 🟢 Baixo — considerar adicionar coluna `tour_completed` no perfil

---

### 🟢 B-05 — Skeleton da página `/agenda` não corresponde exatamente ao layout real

**Descrição:** O skeleton do calendário mensal usa grid de 35 células, mas o componente real pode ter 28–42 células dependendo do mês.
**Impacto:** Pequeno layout shift ao carregar a agenda.
**Status:** 🟢 Baixo

---

### 🟢 B-06 — Formulário de aparência não sincroniza schedule do banco automaticamente no primeiro acesso

**Descrição:** O `ThemeProvider` lê o schedule do `localStorage`. No primeiro acesso à `/perfil/aparencia`, o schedule é populado via `useState` (run-once). Se o usuário acessar o dashboard em um dispositivo diferente, o schedule do banco não é aplicado até visitar `/perfil/aparencia`.
**Workaround:** Salvar novamente as configurações na página de aparência.
**Status:** 🟢 Baixo — implementar endpoint para carregar schedule no `ThemeProvider` via Server Action na montagem

---

### 🟡 B-07 — QR Code de check-in não funciona em iOS Safari com câmera restrita

**Descrição:** O scanner `qr-scanner` usa `getUserMedia`, que em iOS requer permissão explícita. Em alguns cenários de PWA, a permissão não é persistida entre sessões.
**Impacto:** Voluntários de check-in no iPhone precisam aceitar a permissão a cada sessão.
**Workaround:** Usar o modo de check-in por link curto `/c/[shortToken]`.
**Status:** 🟡 Pendente — considerar fallback com input type=file (galeria/câmera nativa)

---

### 🟡 B-08 — Relatório financeiro PDF tem limite de 5.000 transações

**Descrição:** `getTransactionsForExport` limita a 5.000 registros. Igrejas com histórico extenso receberão PDF incompleto sem aviso claro.
**Impacto:** Dados truncados em relatórios anuais de igrejas com alto volume de transações.
**Workaround:** Exportar por períodos menores (trimestral).
**Status:** 🟡 Pendente — adicionar aviso de truncamento no relatório

---

## Limitações do MVP

### L-01 — Sem importação de dados em massa

O sistema não possui funcionalidade de importação CSV/Excel para membros, transações ou eventos. Igrejas migrando de planilhas precisam cadastrar manualmente ou via API diretamente no Supabase.

### L-02 — App mobile nativo não disponível

Koinos é uma PWA (Progressive Web App) mobile-first, mas não está disponível na App Store ou Google Play. Funciona bem no navegador mobile, mas não tem acesso a notificações push nativas.

### L-03 — Integração com redes sociais não implementada

Posts do Mural não são sincronizados com Instagram, WhatsApp ou outras plataformas. Compartilhamento é manual.

### L-04 — Liturgia IA com dependência externa (GPT-4.1)

Se a API da OpenAI estiver indisponível e o fallback Gemini também falhar, o botão de sugestões IA na liturgia ficará sem resposta. Não há cache local de sugestões anteriores.

### L-05 — Votação remota requer e-mail funcionando

O sistema de OTP para voto remoto em assembleias depende do Resend para envio de email. Se o Resend estiver indisponível, votos remotos ficam bloqueados. Não há fallback via SMS.

### L-06 — Multi-congregação limitado a 2 níveis

A hierarquia de multi-tenant suporta apenas `matriz → congregação`. Estruturas com sub-congregações (ex: células de uma congregação) não são suportadas nativamente. O campo `parent_tenant_id` não suporta recursão.

### L-07 — Sem conformidade com LGPD Art. 18 §1° automatizada

Solicitações de portabilidade de dados (exportação) e direito ao esquecimento funcionam, mas não há envio automatizado de confirmação ao titular dentro do prazo legal de 15 dias.

### L-08 — Dark mode programado não sincroniza entre dispositivos em tempo real

O schedule de dark mode é salvo no banco mas lido via `localStorage` no cliente. Em múltiplos dispositivos, a sincronização ocorre apenas na próxima visita à página `/perfil/aparencia`.

---

## Débitos Técnicos Conhecidos

| ID    | Descrição                                                                                    | Prioridade |
| ----- | -------------------------------------------------------------------------------------------- | ---------- |
| TD-01 | Migrar `usePermissions` de `localStorage` para JWT claims para evitar race conditions        | Alta       |
| TD-02 | Adicionar testes unitários para as RPCs PostgreSQL (leaderboard, check_and_award_badges)     | Média      |
| TD-03 | Implementar paginação cursor-based no financeiro (atualmente offset-based)                   | Média      |
| TD-04 | Cache Redis para `getLandingPageBySlug` — ISR de 1h pode ser insuficiente com muitas edições | Baixa      |
| TD-05 | FOUC prevention script no `<head>` para dark mode (ver B-01)                                 | Alta       |
| TD-06 | Audit log não captura IP real em Server Actions chamadas via Vercel Edge                     | Média      |
| TD-07 | `generateRecurringInstances` não valida sobreposição com feriados nacionais                  | Baixa      |

---

_Atualizar este documento a cada sessão com novos bugs encontrados em teste ou produção._
