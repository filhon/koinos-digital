"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Reorder,
  useDragControls,
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  GripVertical,
  Trash2,
  Plus,
  BookOpen,
  Music2,
  Music,
  Heart,
  Mic2,
  Gift,
  Bell,
  Users,
  Droplets,
  FileText,
  HandHeart,
  Check,
  Loader2,
  ChevronDown,
  Sparkles,
  Search,
  X,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateLiturgyItem,
  reorderLiturgyItems,
  addLiturgyItem,
  removeLiturgyItem,
  addSongToLiturgy,
  delegateMusicSelection,
  revokeMusicDelegation,
  getEventMusicGroupLeaders,
} from "@/actions/liturgy";
import { getAIRecommendations } from "@/actions/ai";
import { PremiumGate } from "@/components/ui/premium-gate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  LITURGY_ITEM_TYPES,
  LITURGY_ITEM_TYPE_LABELS,
  type LiturgyRow,
  type LiturgyItemRow,
  type LiturgyItemType,
  type MusicLeader,
} from "@/lib/validators/liturgy";
import { type AIRecommendationResult } from "@/lib/validators/ai";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  LiturgyItemType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  acolhimento: {
    icon: HandHeart,
    color: "text-success-dark",
    bg: "bg-success-light",
  },
  louvor: { icon: Music2, color: "text-accent-700", bg: "bg-accent-100" },
  oracao: { icon: Heart, color: "text-error-dark", bg: "bg-error-light" },
  leitura_biblica: {
    icon: BookOpen,
    color: "text-primary-700",
    bg: "bg-primary-100",
  },
  pregacao: { icon: Mic2, color: "text-primary-800", bg: "bg-primary-200" },
  oferta: { icon: Gift, color: "text-warning-dark", bg: "bg-warning-light" },
  avisos: { icon: Bell, color: "text-warning-dark", bg: "bg-warning-light" },
  comunhao: { icon: Users, color: "text-success-dark", bg: "bg-success-light" },
  batismo: { icon: Droplets, color: "text-primary-500", bg: "bg-primary-100" },
  texto_livre: {
    icon: FileText,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  cântico: { icon: Music, color: "text-amber-600", bg: "bg-amber-50" },
};

// ─── SongResult type ──────────────────────────────────────────────────────────

interface SongResult {
  id: string;
  name: string;
  artist: string;
  central_message: string | null;
}

// ─── SongSearchInput ──────────────────────────────────────────────────────────

interface SongSearchInputProps {
  eventId: string;
  selectedSong: SongResult | null;
  onSelect: (song: SongResult) => void;
  onClear: () => void;
}

function SongSearchInput({
  eventId,
  selectedSong,
  onSelect,
  onClear,
}: SongSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/songs/search?q=${encodeURIComponent(query)}&event_id=${encodeURIComponent(eventId)}`
        );
        const data = (await res.json()) as { songs?: SongResult[] };
        setResults(data.songs ?? []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, eventId]);

  if (selectedSong) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <Music className="size-4 mt-0.5 shrink-0 text-amber-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {selectedSong.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedSong.artist}
          </p>
          {selectedSong.central_message && (
            <p className="text-xs text-amber-700 mt-1 italic leading-snug line-clamp-2">
              {selectedSong.central_message}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            onClear();
            setQuery("");
          }}
          className="shrink-0 flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-amber-100 transition-colors"
          aria-label="Remover seleção"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou artista..."
          className="pl-9 pr-9"
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <AnimatePresence>
        {showDropdown && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full top-full mt-1 rounded-xl border border-border bg-popover shadow-lg overflow-hidden"
          >
            {results.map((song) => (
              <button
                key={song.id}
                type="button"
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                onMouseDown={() => {
                  onSelect(song);
                  setQuery("");
                  setShowDropdown(false);
                }}
              >
                <Music className="size-4 mt-0.5 shrink-0 text-amber-500" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{song.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {song.artist}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {showDropdown &&
          results.length === 0 &&
          !loading &&
          query.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full top-full mt-1 rounded-xl border border-border bg-popover shadow p-4 text-center"
            >
              <p className="text-sm text-muted-foreground">
                Nenhuma música encontrada.
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tente outro nome ou artista.
              </p>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

// ─── LiturgyItemCard ──────────────────────────────────────────────────────────

interface LiturgyItemCardProps {
  item: LiturgyItemRow;
  onUpdated: (updated: LiturgyItemRow) => void;
  onRemoved: (id: string) => void;
}

function LiturgyItemCard({ item, onUpdated, onRemoved }: LiturgyItemCardProps) {
  const dragControls = useDragControls();
  const [isPending, startTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();
  const [editTitle, setEditTitle] = useState(item.title);
  const [editContent, setEditContent] = useState(item.content ?? "");
  const [editType, setEditType] = useState<LiturgyItemType>(item.type);
  const [showContent, setShowContent] = useState(!!item.content);
  const titleRef = useRef<HTMLInputElement>(null);

  const config = TYPE_CONFIG[editType];
  const Icon = config.icon;

  function saveItem() {
    if (!editTitle.trim()) return;
    startTransition(async () => {
      const result = await updateLiturgyItem({
        id: item.id,
        type: editType,
        title: editTitle.trim(),
        content: editContent.trim() || null,
      });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if (result && "data" in result && result.data) {
        onUpdated(result.data);
      }
    });
  }

  function handleRemove() {
    startRemoveTransition(async () => {
      const result = await removeLiturgyItem({ id: item.id });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      onRemoved(item.id);
    });
  }

  const isDirty =
    editTitle.trim() !== item.title ||
    (editContent.trim() || null) !== item.content ||
    editType !== item.type;

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 shadow-sm touch-none"
      whileDrag={{
        boxShadow: "0 8px 24px oklch(0.32 0.096 224 / 0.16)",
        scale: 1.01,
      }}
    >
      {/* Drag handle */}
      <button
        onPointerDown={(e) => dragControls.start(e)}
        className="mt-1 flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Arrastar"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Type icon */}
      <div
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
      >
        <Icon className={`size-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-2">
        {/* Type selector + title */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value as LiturgyItemType)}
              className="cursor-pointer appearance-none rounded-md border border-border bg-muted px-2 py-1 pr-6 text-[11px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {LITURGY_ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LITURGY_ITEM_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <Input
          ref={titleRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={saveItem}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              titleRef.current?.blur();
            }
          }}
          className="h-8 border-transparent bg-transparent px-0 text-sm font-medium shadow-none focus:border-input focus:bg-muted/50 focus:px-2"
          placeholder="Título do item..."
        />

        {showContent && (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={saveItem}
            rows={2}
            className="resize-none border-transparent bg-transparent px-0 text-xs shadow-none focus:border-input focus:bg-muted/50 focus:px-2"
            placeholder="Descrição, referência bíblica, letra, etc. (opcional)"
          />
        )}

        <div className="flex items-center gap-2">
          {!showContent && (
            <button
              type="button"
              onClick={() => setShowContent(true)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              + Adicionar descrição
            </button>
          )}
          {showContent && (
            <button
              type="button"
              onClick={() => {
                setShowContent(false);
                setEditContent("");
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Remover descrição
            </button>
          )}

          <AnimatePresence>
            {isDirty && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={saveItem}
                disabled={isPending}
                className="ml-auto flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Check className="size-3" />
                )}
                Salvar
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={handleRemove}
        disabled={isRemoving}
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-error-light hover:text-error-dark disabled:opacity-50"
        aria-label="Remover item"
      >
        {isRemoving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </button>
    </Reorder.Item>
  );
}

// ─── AddItemDialog ────────────────────────────────────────────────────────────

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liturgyId: string;
  eventId: string;
  onAdded: (item: LiturgyItemRow) => void;
}

function AddItemDialog({
  open,
  onOpenChange,
  liturgyId,
  eventId,
  onAdded,
}: AddItemDialogProps) {
  const [type, setType] = useState<LiturgyItemType>("texto_livre");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const isCântico = type === "cântico";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isCântico) {
      if (!selectedSong) return;
      startTransition(async () => {
        const result = await addSongToLiturgy({
          liturgy_id: liturgyId,
          song_id: selectedSong.id,
        });
        if (result && "error" in result && result.error) {
          toast.error(result.error);
          return;
        }
        if (result && "data" in result && result.data) {
          onAdded(result.data);
          setSelectedSong(null);
          setType("texto_livre");
          onOpenChange(false);
        }
      });
      return;
    }

    if (!title.trim()) return;
    startTransition(async () => {
      const result = await addLiturgyItem({
        liturgy_id: liturgyId,
        type,
        title: title.trim(),
        content: content.trim() || null,
      });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if (result && "data" in result && result.data) {
        onAdded(result.data);
        setTitle("");
        setContent("");
        setType("texto_livre");
        onOpenChange(false);
      }
    });
  }

  const canSubmit = isCântico ? !!selectedSong : !!title.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Adicionar item
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <select
              value={type}
              onChange={(e) => {
                const newType = e.target.value as LiturgyItemType;
                setType(newType);
                if (newType !== "cântico") {
                  setSelectedSong(null);
                }
              }}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {LITURGY_ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LITURGY_ITEM_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {isCântico ? (
            <div className="space-y-1.5">
              <Label>Música do repertório *</Label>
              <SongSearchInput
                eventId={eventId}
                selectedSong={selectedSong}
                onSelect={setSelectedSong}
                onClear={() => setSelectedSong(null)}
              />
              <p className="text-[11px] text-muted-foreground">
                Busca no repertório dos grupos musicais associados ao evento.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Oração pelos enfermos"
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Referência bíblica, letra, notas..."
                  rows={3}
                  maxLength={2000}
                  className="resize-none"
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DelegateMusicDialog ──────────────────────────────────────────────────────

interface DelegateMusicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liturgyId: string;
  eventId: string;
  onDelegated: (memberId: string, memberName: string) => void;
}

function DelegateMusicDialog({
  open,
  onOpenChange,
  liturgyId,
  eventId,
  onDelegated,
}: DelegateMusicDialogProps) {
  const [leaders, setLeaders] = useState<MusicLeader[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [selectedLeaderId, setSelectedLeaderId] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }

    let ignore = false;

    async function loadLeaders() {
      setLoadingLeaders(true);
      try {
        const result = await getEventMusicGroupLeaders(eventId);
        if (!ignore) {
          setSelectedLeaderId("");
          if (result && "data" in result && result.data) {
            setLeaders(result.data);
          }
        }
      } finally {
        if (!ignore) setLoadingLeaders(false);
      }
    }

    loadLeaders();

    return () => {
      ignore = true;
    };
  }, [open, eventId]);

  function handleDelegate() {
    if (!selectedLeaderId) return;
    const leader = leaders.find((l) => l.id === selectedLeaderId);
    if (!leader) return;

    startTransition(async () => {
      const result = await delegateMusicSelection({
        liturgy_id: liturgyId,
        member_id: selectedLeaderId,
      });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      onDelegated(selectedLeaderId, leader.name);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Delegar seleção de músicas
          </DialogTitle>
        </DialogHeader>

        {loadingLeaders ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="py-6 text-center space-y-1">
            <p className="text-sm text-foreground font-medium">
              Nenhum grupo musical associado
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Adicione um grupo musical ao evento na aba Música para poder
              delegar a seleção de cânticos.
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              O líder selecionado receberá uma notificação e poderá escolher os
              cânticos desta liturgia.
            </p>
            <div className="space-y-2">
              {leaders.map((leader) => (
                <button
                  key={leader.id}
                  type="button"
                  onClick={() => setSelectedLeaderId(leader.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    selectedLeaderId === leader.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={leader.avatar_url ?? ""} />
                    <AvatarFallback className="text-xs font-medium">
                      {leader.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {leader.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Líder — {leader.group_name}
                    </p>
                  </div>
                  {selectedLeaderId === leader.id && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleDelegate}
            disabled={!selectedLeaderId || isPending || loadingLeaders}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Delegar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── AISuggestionsDialog ──────────────────────────────────────────────────────

interface AISuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liturgyId: string;
  onAdded: (item: LiturgyItemRow) => void;
}

function AISuggestionsDialog({
  open,
  onOpenChange,
  liturgyId,
  onAdded,
}: AISuggestionsDialogProps) {
  const [objective, setObjective] = useState("");
  const [isGenerating, startGenerating] = useTransition();
  const [suggestions, setSuggestions] = useState<AIRecommendationResult | null>(
    null
  );

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!objective.trim()) return;

    startGenerating(async () => {
      const res = await getAIRecommendations(objective.trim());
      if (res.error) {
        toast.error(res.error);
        if (res.data) setSuggestions(res.data);
        return;
      }
      setSuggestions(res.data);
    });
  }

  async function handleAccept(
    type: LiturgyItemType,
    title: string,
    content: string
  ) {
    const result = await addLiturgyItem({
      liturgy_id: liturgyId,
      type,
      title,
      content,
    });
    if (result && "error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    if (result && "data" in result && result.data) {
      onAdded(result.data);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Sparkles className="size-5 text-amber-500" />
            Sugestões com IA
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate(e);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Qual o objetivo ou tema do culto?</Label>
            <Input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex: Culto de ceia, consagração de jovens, missões..."
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isGenerating || !objective.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            Gerar Sugestões
          </Button>
        </form>

        {suggestions && (
          <div className="mt-6 space-y-6 border-t pt-4">
            <div>
              <h3 className="font-semibold text-sm mb-3">Leituras Sugeridas</h3>
              <div className="space-y-3">
                {suggestions.leituras.map((l, i) => {
                  const title = `${l.livro} ${l.capitulo}:${l.versiculo_inicial}-${l.versiculo_final}`;
                  return (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row gap-3 rounded-lg border p-3 bg-muted/50"
                    >
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-primary">{title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {l.justificativa}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleAccept(
                            "leitura_biblica",
                            `Leitura: ${title}`,
                            l.justificativa
                          )
                        }
                      >
                        <Check className="mr-1 size-3" /> Aceitar
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">Cânticos Sugeridos</h3>
              <div className="space-y-3">
                {suggestions.canticos.map((c, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row gap-3 rounded-lg border p-3 bg-muted/50"
                  >
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-primary">
                        {c.titulo}{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          — {c.artista}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.justificativa}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        handleAccept(
                          "louvor",
                          `Louvor: ${c.titulo}`,
                          `Artista: ${c.artista}\n${c.justificativa}`
                        )
                      }
                    >
                      <Check className="mr-1 size-3" /> Aceitar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── LiturgyEditor ────────────────────────────────────────────────────────────

interface LiturgyEditorProps {
  liturgy: LiturgyRow;
  eventId: string;
  isResponsible?: boolean;
  currentMemberId?: string;
}

export function LiturgyEditor({
  liturgy,
  eventId,
  isResponsible = false,
  currentMemberId,
}: LiturgyEditorProps) {
  const router = useRouter();
  const [items, setItems] = useState<LiturgyItemRow[]>(liturgy.items);
  const [originalOrder, setOriginalOrder] = useState<string[]>(
    liturgy.items.map((i) => i.id)
  );
  const [isSavingOrder, startSaveOrder] = useTransition();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showDelegateDialog, setShowDelegateDialog] = useState(false);
  const [isRevoking, startRevoke] = useTransition();

  const [musicDelegatedTo, setMusicDelegatedTo] = useState<string | null>(
    liturgy.music_delegated_to ?? null
  );
  const [delegatedMemberName, setDelegatedMemberName] = useState<string | null>(
    (liturgy.delegated_member as { id: string; name: string } | null)?.name ??
      null
  );

  const currentOrder = items.map((i) => i.id);
  const orderChanged =
    currentOrder.length !== originalOrder.length ||
    currentOrder.some((id, idx) => id !== originalOrder[idx]);

  const isDelegatedToMe =
    !!currentMemberId && currentMemberId === musicDelegatedTo;
  const showDelegationBanner =
    !!musicDelegatedTo && (isDelegatedToMe || isResponsible);

  function handleReorder(newItems: LiturgyItemRow[]) {
    setItems(newItems);
  }

  function handleSaveOrder() {
    startSaveOrder(async () => {
      const result = await reorderLiturgyItems({
        liturgy_id: liturgy.id,
        ordered_ids: items.map((i) => i.id),
      });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      setOriginalOrder(items.map((i) => i.id));
      toast.success("Ordem salva.");
      router.refresh();
    });
  }

  function handleItemUpdated(updated: LiturgyItemRow) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function handleItemRemoved(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setOriginalOrder((prev) => prev.filter((i) => i !== id));
  }

  function handleItemAdded(item: LiturgyItemRow) {
    setItems((prev) => [...prev, item]);
    setOriginalOrder((prev) => [...prev, item.id]);
    toast.success("Item adicionado.");
  }

  function handleDelegated(memberId: string, memberName: string) {
    setMusicDelegatedTo(memberId);
    setDelegatedMemberName(memberName);
    toast.success(`Músicas delegadas para ${memberName}.`);
  }

  function handleRevoke() {
    startRevoke(async () => {
      const result = await revokeMusicDelegation({ liturgy_id: liturgy.id });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      setMusicDelegatedTo(null);
      setDelegatedMemberName(null);
      toast.success("Delegação revogada.");
    });
  }

  return (
    <div className="space-y-3">
      {/* Delegation banner */}
      <AnimatePresence>
        {showDelegationBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <UserCheck className="size-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              {isDelegatedToMe ? (
                <p className="text-sm font-medium text-amber-800">
                  Você foi delegado(a) para escolher as músicas deste culto
                </p>
              ) : (
                <p className="text-sm font-medium text-amber-800">
                  Músicas delegadas para{" "}
                  <span className="font-semibold">{delegatedMemberName}</span>
                </p>
              )}
            </div>
            {isResponsible && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRevoke}
                disabled={isRevoking}
                className="shrink-0 h-7 gap-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
              >
                {isRevoking ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <UserX className="size-3" />
                )}
                Revogar
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order changed banner */}
      <AnimatePresence>
        {orderChanged && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between rounded-xl border border-accent-300 bg-accent-50 px-4 py-2.5"
          >
            <p className="text-xs font-medium text-accent-700">
              Ordem alterada — salvar para persistir.
            </p>
            <Button
              size="sm"
              onClick={handleSaveOrder}
              disabled={isSavingOrder}
              className="h-7 text-xs"
            >
              {isSavingOrder && <Loader2 className="size-3 animate-spin" />}
              Salvar ordem
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items */}
      {items.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Nenhum item. Adicione abaixo.
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={handleReorder}
          className="space-y-2"
          as="div"
        >
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <LiturgyItemCard
                key={item.id}
                item={item}
                onUpdated={handleItemUpdated}
                onRemoved={handleItemRemoved}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <div className="flex items-center gap-2">
            <Plus className="size-4" />
            Adicionar item
          </div>
        </button>

        <PremiumGate feature="liturgia_ia">
          <button
            type="button"
            onClick={() => setShowAIDialog(true)}
            className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-accent-300 bg-accent-50/50 py-3 text-sm font-medium text-accent-700 transition-colors hover:border-accent-400 hover:bg-accent-100"
            style={{ width: "100%" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />
              Sugestões com IA
            </div>
          </button>
        </PremiumGate>
      </div>

      {/* Delegate button — only for responsible with no active delegation */}
      {isResponsible && !musicDelegatedTo && (
        <button
          type="button"
          onClick={() => setShowDelegateDialog(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 py-3 text-sm font-medium text-amber-700 transition-colors hover:border-amber-400 hover:bg-amber-100"
        >
          <UserCheck className="size-4" />
          Delegar músicas
        </button>
      )}

      <AddItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        liturgyId={liturgy.id}
        eventId={eventId}
        onAdded={handleItemAdded}
      />

      <AISuggestionsDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        liturgyId={liturgy.id}
        onAdded={handleItemAdded}
      />

      <DelegateMusicDialog
        open={showDelegateDialog}
        onOpenChange={setShowDelegateDialog}
        liturgyId={liturgy.id}
        eventId={eventId}
        onDelegated={handleDelegated}
      />
    </div>
  );
}
