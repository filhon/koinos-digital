import type { LucideIcon } from "lucide-react";
import {
  Users,
  CalendarDays,
  Megaphone,
  Trophy,
  ScanLine,
  Sparkles,
  Globe,
  BarChart2,
  Vote,
  ListTodo,
  BookOpen,
  UserCircle2,
  Coins,
  Bell,
  ShoppingBag,
  Rss,
  Network,
  MessageCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoadmapStatus = "launched" | "in_progress" | "planned";

export type RoadmapCategory =
  | "Gestão"
  | "Comunidade"
  | "IA"
  | "Liga"
  | "Marketing"
  | "Plataforma";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: RoadmapCategory;
  status: RoadmapStatus;
  icon: LucideIcon;
}

// ─── Items ────────────────────────────────────────────────────────────────────

export const ROADMAP_ITEMS: RoadmapItem[] = [
  // ── Lançado ──────────────────────────────────────────────────────────────
  {
    id: "members",
    title: "Gestão de membros e famílias",
    description:
      "Cadastro completo com CPF criptografado, vínculos familiares, histórico de funções e portal LGPD.",
    category: "Gestão",
    status: "launched",
    icon: Users,
  },
  {
    id: "events",
    title: "Agenda de eventos com recorrência",
    description:
      "Eventos presenciais e online com regras de recorrência semanal e mensal, liturgia e check-in integrados.",
    category: "Gestão",
    status: "launched",
    icon: CalendarDays,
  },
  {
    id: "communication",
    title: "Comunicação interna",
    description:
      "Mural de posts com reações, comentários, fixação e controle de quem pode publicar por cargo.",
    category: "Comunidade",
    status: "launched",
    icon: Megaphone,
  },
  {
    id: "league",
    title: "Liga e gamificação",
    description:
      "Tribos das 12 de Israel, streaks de devoção, badges de conquista e placar mensal e anual.",
    category: "Liga",
    status: "launched",
    icon: Trophy,
  },
  {
    id: "checkin",
    title: "Check-in por QR Code",
    description:
      "QR Code seguro que muda a cada evento. Funciona pelo celular, sem instalar app. Visitantes preenchem um formulário rápido.",
    category: "Gestão",
    status: "launched",
    icon: ScanLine,
  },
  {
    id: "liturgy-ai",
    title: "Liturgia com sugestões de IA",
    description:
      "Monte o culto arrastando itens. A IA sugere músicas e leituras com base no tema, com delegação ao líder musical.",
    category: "IA",
    status: "launched",
    icon: Sparkles,
  },
  {
    id: "landing",
    title: "Landing page personalizável",
    description:
      "Página pública por slug da igreja com domínio próprio, herói, seção do pastor, eventos e formulário para visitantes.",
    category: "Marketing",
    status: "launched",
    icon: Globe,
  },
  {
    id: "finance",
    title: "Financeiro com relatórios",
    description:
      "Contas, transações imutáveis, estornos, gráficos por categoria e período, exportação em PDF e CSV.",
    category: "Gestão",
    status: "launched",
    icon: BarChart2,
  },
  {
    id: "assembly",
    title: "Assembleia e votação anônima",
    description:
      "Eleições com hash anônimo, quórum automático, voto remoto por OTP e resultados em tempo real.",
    category: "Gestão",
    status: "launched",
    icon: Vote,
  },
  {
    id: "ministries",
    title: "Ministérios e escalas",
    description:
      "Gestão de ministérios, membros por função, escalas por evento e sugestão automática de escala com IA.",
    category: "Gestão",
    status: "launched",
    icon: ListTodo,
  },

  // ── Em Desenvolvimento ────────────────────────────────────────────────────
  {
    id: "bible-reading",
    title: "Leitura bíblica diária",
    description:
      "Plano de leitura em 4 anos com texto bíblico integrado, calendário de progresso e streaks.",
    category: "Comunidade",
    status: "in_progress",
    icon: BookOpen,
  },
  {
    id: "public-profile",
    title: "Perfil público de membro",
    description:
      "Página pública por username com badges desbloqueados, tribo, dados opcionais e link compartilhável.",
    category: "Comunidade",
    status: "in_progress",
    icon: UserCircle2,
  },
  {
    id: "levels",
    title: "Níveis e Talentos",
    description:
      "Moeda virtual para recompensar participação, com vitrine de benefícios e troca dentro da comunidade.",
    category: "Liga",
    status: "in_progress",
    icon: Coins,
  },
  {
    id: "push",
    title: "Notificações push",
    description:
      "Notificações em tempo real por OneSignal e digest semanal por e-mail com resumo da comunidade.",
    category: "Comunidade",
    status: "in_progress",
    icon: Bell,
  },
  {
    id: "store",
    title: "Loja digital",
    description:
      "Marketplace interno para inscrições em eventos, cursos, produtos e experiências da congregação.",
    category: "Plataforma",
    status: "in_progress",
    icon: ShoppingBag,
  },

  // ── Planejado ─────────────────────────────────────────────────────────────
  {
    id: "social-feed",
    title: "Feed social personalizado",
    description:
      "Linha do tempo na tela inicial com postagens relevantes da comunidade, sem algoritmo opaco.",
    category: "Comunidade",
    status: "planned",
    icon: Rss,
  },
  {
    id: "communion",
    title: "Comunhão entre igrejas",
    description:
      "Rede de congregações para compartilhar eventos, missões e voluntários entre igrejas parceiras.",
    category: "Comunidade",
    status: "planned",
    icon: Network,
  },
  {
    id: "global-league",
    title: "Liga Geral entre igrejas",
    description:
      "Competição amigável entre congregações com placar nacional e desafios mensais de engajamento.",
    category: "Liga",
    status: "planned",
    icon: Trophy,
  },
  {
    id: "chat",
    title: "Chat em tempo real",
    description:
      "Conversas por ministério, grupos musicais e mensagens diretas entre membros via Supabase Realtime.",
    category: "Comunidade",
    status: "planned",
    icon: MessageCircle,
  },
  {
    id: "ai-reading",
    title: "Perguntas por IA na leitura",
    description:
      "Reflexões, perguntas e aplicações práticas geradas por IA a partir do capítulo do dia.",
    category: "IA",
    status: "planned",
    icon: Sparkles,
  },
];

// ─── Column metadata ──────────────────────────────────────────────────────────

export const ROADMAP_COLUMNS: {
  status: RoadmapStatus;
  label: string;
  description: string;
}[] = [
  {
    status: "launched",
    label: "Lançado",
    description: "Disponível em todos os planos",
  },
  {
    status: "in_progress",
    label: "Em Desenvolvimento",
    description: "Chegando em breve",
  },
  {
    status: "planned",
    label: "Planejado",
    description: "No nosso radar",
  },
];
