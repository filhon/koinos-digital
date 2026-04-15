"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import Link from "next/link";
import { Reorder, useDragControls } from "framer-motion";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateLandingPage,
  uploadHeroImage,
  uploadPastorPhoto,
  publishLandingPage,
} from "@/actions/landing-page";
import {
  updateLandingPageSchema,
  SECTION_LABELS,
  type LandingPageData,
  type LandingSection,
  type UpdateLandingPageInput,
} from "@/lib/validators/landing-page";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionItem({ section }: { section: LandingSection }) {
  const controls = useDragControls();

  return (
    <Reorder.Item value={section} dragListener={false} dragControls={controls}>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors"
        style={{
          background: "var(--surface-1)",
          borderColor: "var(--border)",
        }}
      >
        <button
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab active:cursor-grabbing touch-none"
          type="button"
          aria-label="Arrastar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="text-muted-foreground"
          >
            <circle cx="5" cy="4" r="1.5" />
            <circle cx="11" cy="4" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="11" cy="12" r="1.5" />
          </svg>
        </button>
        <span className="text-sm font-medium flex-1">
          {SECTION_LABELS[section]}
        </span>
        {section !== "hero" && section !== "cta" && (
          <span className="text-xs text-muted-foreground">Oculta se vazia</span>
        )}
      </div>
    </Reorder.Item>
  );
}

function ImageUploadField({
  label,
  currentUrl,
  onUpload,
  hint,
}: {
  label: string;
  currentUrl: string | null;
  onUpload: (formData: FormData) => Promise<void>;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo maior que 5 MB");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await onUpload(fd);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer group border-2 border-dashed transition-colors"
        style={{ borderColor: "var(--border)", minHeight: "120px" }}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={preview} alt={label} className="w-full h-48 object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span className="text-xs">
              {hint ?? "Clique para fazer upload"}
            </span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors pointer-events-none" />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Preview mini-frame ───────────────────────────────────────────────────────

function LivePreview({
  data,
  sectionsOrder,
  formValues,
}: {
  data: LandingPageData;
  sectionsOrder: LandingSection[];
  formValues: Partial<UpdateLandingPageInput>;
}) {
  const slogan = formValues.slogan ?? data.slogan;
  const aboutUs = formValues.about_us ?? data.about_us;
  const pastorName = formValues.pastor_name ?? data.pastor_name;
  const pastorQuote = formValues.pastor_quote ?? data.pastor_quote;

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        borderColor: "var(--border)",
        background: "oklch(0.97 0.005 250)",
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        </div>
        <div
          className="flex-1 mx-4 px-3 py-1 rounded text-xs truncate"
          style={{
            background: "var(--surface-2)",
            color: "var(--muted-foreground)",
          }}
        >
          koinos.app/{data.slug}
        </div>
      </div>

      {/* Page preview (scaled down) */}
      <div className="overflow-y-auto max-h-[600px]">
        {sectionsOrder.map((section) => (
          <div
            key={section}
            className="border-b last:border-b-0"
            style={{ borderColor: "oklch(0.88 0.01 250)" }}
          >
            {section === "hero" && (
              <div
                className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[140px]"
                style={{
                  background: data.hero_image_url
                    ? `linear-gradient(oklch(0.08 0.02 250 / 0.7), oklch(0.08 0.02 250 / 0.9)), url(${data.hero_image_url}) center/cover`
                    : "radial-gradient(ellipse at 60% 40%, oklch(0.35 0.08 230), oklch(0.1 0.025 265))",
                }}
              >
                <p
                  className="text-2xl font-normal text-white leading-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {data.name}
                </p>
                {slogan && (
                  <p
                    className="mt-2 text-sm"
                    style={{ color: "oklch(0.8 0.02 250)" }}
                  >
                    {slogan}
                  </p>
                )}
              </div>
            )}
            {section === "about" && aboutUs && (
              <div
                className="py-8 px-6"
                style={{ background: "oklch(0.97 0.005 250)" }}
              >
                <p
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{ color: "oklch(0.55 0.1 250)" }}
                >
                  Sobre Nós
                </p>
                <p
                  className="text-sm leading-relaxed line-clamp-4"
                  style={{ color: "oklch(0.28 0.03 250)" }}
                >
                  {aboutUs}
                </p>
              </div>
            )}
            {section === "pastor" && pastorName && (
              <div
                className="py-8 px-6"
                style={{ background: "oklch(0.12 0.03 250)" }}
              >
                <p
                  className="text-xs uppercase tracking-widest mb-2"
                  style={{ color: "oklch(0.55 0.06 250)" }}
                >
                  Pastor
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.9 0.01 250)" }}
                >
                  {pastorName}
                </p>
                {pastorQuote && (
                  <p
                    className="mt-1 text-xs italic line-clamp-2"
                    style={{ color: "oklch(0.78 0.1 55)" }}
                  >
                    &quot;{pastorQuote}&quot;
                  </p>
                )}
              </div>
            )}
            {section === "cta" && (
              <div
                className="py-8 px-6 text-center"
                style={{ background: "oklch(0.55 0.17 48)" }}
              >
                <p
                  className="text-lg font-normal"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "oklch(0.12 0.04 250)",
                  }}
                >
                  Faça parte da {data.name}
                </p>
                <div
                  className="mt-4 py-2 px-6 rounded-full inline-block text-sm font-semibold"
                  style={{
                    background: "oklch(0.12 0.04 250)",
                    color: "oklch(0.88 0.1 55)",
                  }}
                >
                  Cadastre-se
                </div>
              </div>
            )}
            {!["hero", "about", "pastor", "cta"].includes(section) && (
              <div
                className="py-4 px-6"
                style={{ background: "oklch(0.95 0.005 250)" }}
              >
                <p className="text-xs text-muted-foreground">
                  {SECTION_LABELS[section]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

interface Props {
  initialData: LandingPageData;
}

export default function LandingEditor({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [sectionsOrder, setSectionsOrder] = useState<LandingSection[]>(
    initialData.sections_order
  );
  const [, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const {
    register,
    handleSubmit,
    watch,
    formState: { isDirty, errors },
  } = useForm<UpdateLandingPageInput>({
    resolver: zodResolver(updateLandingPageSchema),
    defaultValues: {
      slogan: initialData.slogan ?? "",
      about_us: initialData.about_us ?? "",
      pastor_name: initialData.pastor_name ?? "",
      pastor_bio: initialData.pastor_bio ?? "",
      pastor_quote: initialData.pastor_quote ?? "",
      streaming_url: initialData.streaming_url ?? "",
      address_text: initialData.address_text ?? "",
      address_embed_url: initialData.address_embed_url ?? "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const formValues = watch();

  const handleHeroUpload = useCallback(async (fd: FormData) => {
    const result = await uploadHeroImage(fd);
    if ("code" in result || result.error) {
      toast.error(result.error ?? "Erro ao fazer upload");
    } else {
      toast.success("Imagem de capa atualizada");
      setData((d) => ({ ...d, hero_image_url: result.data }));
    }
  }, []);

  const handlePastorPhotoUpload = useCallback(async (fd: FormData) => {
    const result = await uploadPastorPhoto(fd);
    if ("code" in result || result.error) {
      toast.error(result.error ?? "Erro ao fazer upload");
    } else {
      toast.success("Foto do pastor atualizada");
      setData((d) => ({ ...d, pastor_photo_url: result.data }));
    }
  }, []);

  async function onSave(values: UpdateLandingPageInput) {
    setIsSaving(true);
    const result = await updateLandingPage({
      ...values,
      sections_order: sectionsOrder,
    });
    setIsSaving(false);
    if ("code" in result || result.error) {
      toast.error(result.error ?? "Erro ao salvar");
    } else {
      toast.success("Alterações salvas");
    }
  }

  async function handleSectionsReorder(newOrder: LandingSection[]) {
    setSectionsOrder(newOrder);
    startTransition(async () => {
      const result = await updateLandingPage({ sections_order: newOrder });
      if ("code" in result || result.error) {
        toast.error("Erro ao reordenar seções");
        setSectionsOrder(sectionsOrder); // rollback
      }
    });
  }

  async function handlePublish() {
    setIsPublishing(true);
    const result = await publishLandingPage();
    setIsPublishing(false);
    if ("code" in result || result.error) {
      toast.error(result.error ?? "Erro ao publicar");
    } else {
      toast.success(`Landing page publicada! koinos.app/${result.data}`);
      setData((d) => ({ ...d, is_published: true }));
    }
  }

  return (
    <div className="flex-1 overflow-hidden">
      {/* Mobile tab toggle */}
      <div
        className="xl:hidden flex border-b px-4 pt-2"
        style={{ borderColor: "var(--border)" }}
      >
        {(["editor", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize"
            style={{
              borderColor: activeTab === tab ? "var(--primary)" : "transparent",
              color:
                activeTab === tab
                  ? "var(--primary)"
                  : "var(--muted-foreground)",
            }}
          >
            {tab === "editor" ? "Editor" : "Preview"}
          </button>
        ))}
      </div>

      <div className="flex h-full overflow-hidden">
        {/* ── Left: Editor form ── */}
        <div
          className={`flex-1 overflow-y-auto p-6 ${activeTab === "preview" ? "hidden xl:block" : ""}`}
        >
          <form
            onSubmit={handleSubmit(onSave)}
            className="max-w-2xl space-y-10"
          >
            {/* Publish bar */}
            <div
              className="flex items-center justify-between rounded-xl p-4 border"
              style={{
                background: data.is_published
                  ? "oklch(0.55 0.118 148 / 0.08)"
                  : "var(--surface-1)",
                borderColor: data.is_published
                  ? "oklch(0.55 0.118 148 / 0.3)"
                  : "var(--border)",
              }}
            >
              <div>
                <p className="text-sm font-medium">
                  {data.is_published ? "Publicada" : "Não publicada"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data.is_published
                    ? `koinos.app/${data.slug}`
                    : "Salve e publique para tornar visível"}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60"
                style={{
                  background: data.is_published
                    ? "var(--surface-2)"
                    : "var(--primary)",
                  color: data.is_published
                    ? "var(--foreground)"
                    : "var(--primary-foreground)",
                }}
              >
                {isPublishing
                  ? "Publicando..."
                  : data.is_published
                    ? "Republicar"
                    : "Publicar"}
              </button>
            </div>

            {/* Domain shortcut */}
            <Link
              href="/landing-page/dominio"
              className="flex items-center justify-between rounded-xl px-4 py-3 border transition-colors group"
              style={{
                background: "var(--surface-1)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🌐</span>
                <div>
                  <p className="text-sm font-medium">Domínio personalizado</p>
                  <p className="text-xs text-muted-foreground">
                    {(data as { custom_domain?: string | null }).custom_domain
                      ? (data as { custom_domain: string }).custom_domain
                      : "Configurar domínio próprio"}
                  </p>
                </div>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-muted-foreground group-hover:text-foreground transition-colors"
              >
                <path
                  d="M3 7h8M7 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            {/* ── Seção: Imagens ── */}
            <fieldset className="space-y-6">
              <legend className="text-base font-semibold">Imagens</legend>
              <ImageUploadField
                label="Imagem de capa (Hero)"
                currentUrl={data.hero_image_url}
                onUpload={handleHeroUpload}
                hint="JPG, PNG ou WebP • máx 5 MB"
              />
              <ImageUploadField
                label="Foto do pastor"
                currentUrl={data.pastor_photo_url}
                onUpload={handlePastorPhotoUpload}
                hint="Recomendado: retrato (proporção 3:4)"
              />
            </fieldset>

            {/* ── Seção: Textos ── */}
            <fieldset className="space-y-5">
              <legend className="text-base font-semibold">Textos</legend>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Slogan
                </label>
                <input
                  {...register("slogan")}
                  placeholder="Ex: Uma comunidade de fé, amor e propósito"
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none focus:ring-2 ring-primary/30 transition"
                  style={{ borderColor: "var(--border)" }}
                />
                {errors.slogan && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.slogan.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Sobre Nós
                </label>
                <textarea
                  {...register("about_us")}
                  placeholder="Conte a história da sua igreja, valores, missão..."
                  rows={5}
                  maxLength={2000}
                  className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none focus:ring-2 ring-primary/30 transition resize-none"
                  style={{ borderColor: "var(--border)" }}
                />
                <p className="mt-1 text-xs text-muted-foreground text-right">
                  {(watch("about_us") ?? "").length}/2000
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Nome do Pastor
                </label>
                <input
                  {...register("pastor_name")}
                  placeholder="Ex: Pr. João Silva"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none focus:ring-2 ring-primary/30 transition"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Bio do Pastor
                </label>
                <textarea
                  {...register("pastor_bio")}
                  placeholder="Uma breve apresentação do pastor..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none focus:ring-2 ring-primary/30 transition resize-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Citação em Destaque
                </label>
                <textarea
                  {...register("pastor_quote")}
                  placeholder="Uma frase marcante do pastor..."
                  rows={2}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none focus:ring-2 ring-primary/30 transition resize-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            </fieldset>

            {/* ── Seção: Links ── */}
            <fieldset className="space-y-5">
              <legend className="text-base font-semibold">Links</legend>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Link de Transmissão
                </label>
                <input
                  {...register("streaming_url")}
                  placeholder="https://youtube.com/watch?v=..."
                  type="url"
                  className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none focus:ring-2 ring-primary/30 transition"
                  style={{ borderColor: "var(--border)" }}
                />
                {errors.streaming_url && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.streaming_url.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Endereço
                </label>
                <input
                  {...register("address_text")}
                  placeholder="Ex: R. das Flores, 123 — Centro, São Paulo/SP"
                  maxLength={300}
                  className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none focus:ring-2 ring-primary/30 transition"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Google Maps Embed URL
                </label>
                <input
                  {...register("address_embed_url")}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  type="url"
                  className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none focus:ring-2 ring-primary/30 transition"
                  style={{ borderColor: "var(--border)" }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  No Google Maps: Compartilhar → Incorporar um mapa → Copiar a
                  URL do src do iframe
                </p>
                {errors.address_embed_url && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.address_embed_url.message}
                  </p>
                )}
              </div>
            </fieldset>

            {/* ── Seção: Ordem das seções ── */}
            <fieldset className="space-y-4">
              <div>
                <legend className="text-base font-semibold">
                  Ordem das seções
                </legend>
                <p className="text-xs text-muted-foreground mt-1">
                  Arraste para reordenar. Seções sem conteúdo são ocultadas
                  automaticamente.
                </p>
              </div>
              <Reorder.Group
                axis="y"
                values={sectionsOrder}
                onReorder={handleSectionsReorder}
                className="space-y-2"
              >
                {sectionsOrder.map((section) => (
                  <SectionItem key={section} section={section} />
                ))}
              </Reorder.Group>
            </fieldset>

            {/* Save button */}
            <div className="flex items-center gap-3 pt-2 pb-8">
              <button
                type="submit"
                disabled={isSaving || !isDirty}
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </button>
              {!isDirty && (
                <span className="text-xs text-muted-foreground">
                  Sem alterações pendentes
                </span>
              )}
            </div>
          </form>
        </div>

        {/* ── Right: Live Preview ── */}
        <div
          className={`w-[420px] flex-shrink-0 border-l p-6 overflow-y-auto ${activeTab === "editor" ? "hidden xl:block" : ""}`}
          style={{ borderColor: "var(--border)" }}
        >
          <div className="sticky top-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Preview
            </p>
            <LivePreview
              data={{ ...data, hero_image_url: data.hero_image_url }}
              sectionsOrder={sectionsOrder}
              formValues={formValues}
            />
            <p className="mt-3 text-xs text-center text-muted-foreground">
              Preview simplificado • A página real tem animações e layout
              completo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
