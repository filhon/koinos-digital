"use client";

import { useState, useTransition, useRef } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import {
  updateLiturgyItem,
  reorderLiturgyItems,
  addLiturgyItem,
  removeLiturgyItem,
} from "@/actions/liturgy";
import {
  LITURGY_ITEM_TYPES,
  LITURGY_ITEM_TYPE_LABELS,
  type LiturgyRow,
  type LiturgyItemRow,
  type LiturgyItemType,
} from "@/lib/validators/liturgy";
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
};

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
  onAdded: (item: LiturgyItemRow) => void;
}

function AddItemDialog({
  open,
  onOpenChange,
  liturgyId,
  onAdded,
}: AddItemDialogProps) {
  const [type, setType] = useState<LiturgyItemType>("texto_livre");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
              onChange={(e) => setType(e.target.value as LiturgyItemType)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {LITURGY_ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LITURGY_ITEM_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── LiturgyEditor ────────────────────────────────────────────────────────────

interface LiturgyEditorProps {
  liturgy: LiturgyRow;
}

export function LiturgyEditor({ liturgy }: LiturgyEditorProps) {
  const router = useRouter();
  const [items, setItems] = useState<LiturgyItemRow[]>(liturgy.items);
  const [originalOrder, setOriginalOrder] = useState<string[]>(
    liturgy.items.map((i) => i.id)
  );
  const [isSavingOrder, startSaveOrder] = useTransition();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const currentOrder = items.map((i) => i.id);
  const orderChanged =
    currentOrder.length !== originalOrder.length ||
    currentOrder.some((id, idx) => id !== originalOrder[idx]);

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

  return (
    <div className="space-y-3">
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

      {/* Add item */}
      <button
        type="button"
        onClick={() => setShowAddDialog(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Plus className="size-4" />
        Adicionar item
      </button>

      <AddItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        liturgyId={liturgy.id}
        onAdded={handleItemAdded}
      />
    </div>
  );
}
