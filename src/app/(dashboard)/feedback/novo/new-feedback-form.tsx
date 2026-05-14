"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { MessageCircleHeart, Lightbulb, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFeedback } from "@/actions/feedbacks";
import {
  createFeedbackSchema,
  type CreateFeedbackInput,
  type FeedbackType,
} from "@/lib/validators/feedbacks";

const TYPE_OPTIONS: {
  value: FeedbackType;
  label: string;
  desc: string;
  icon: React.ElementType;
  accent: string;
  ring: string;
}[] = [
  {
    value: "elogio",
    label: "Elogio",
    desc: "Algo que funcionou muito bem",
    icon: MessageCircleHeart,
    accent: "text-[oklch(0.48_0.118_148)]",
    ring: "ring-[oklch(0.48_0.118_148)] bg-[oklch(0.48_0.118_148/0.06)]",
  },
  {
    value: "sugestao",
    label: "Sugestão",
    desc: "Uma ideia para melhorar o sistema",
    icon: Lightbulb,
    accent: "text-[oklch(0.62_0.148_58)]",
    ring: "ring-[oklch(0.62_0.148_58)] bg-[oklch(0.62_0.148_58/0.06)]",
  },
  {
    value: "reclamacao",
    label: "Reclamação",
    desc: "Um problema que precisa ser resolvido",
    icon: AlertCircle,
    accent: "text-[oklch(0.52_0.148_28)]",
    ring: "ring-[oklch(0.52_0.148_28)] bg-[oklch(0.52_0.148_28/0.06)]",
  },
];

export function NewFeedbackForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  type FormValues = CreateFeedbackInput;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      createFeedbackSchema
    ) as import("react-hook-form").Resolver<FormValues>,
    defaultValues: { allow_public: false },
  });

  const selectedType = useWatch({ control, name: "type" });
  const description = useWatch({ control, name: "description" }) ?? "";
  const allowPublic = useWatch({ control, name: "allow_public" });

  // Reset allow_public quando tipo muda para não-elogio
  useEffect(() => {
    if (selectedType !== "elogio") {
      setValue("allow_public", false);
    }
  }, [selectedType, setValue]);

  async function onSubmit(data: CreateFeedbackInput) {
    setLoading(true);
    const result = await createFeedback(data);
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Feedback enviado com sucesso!");
    router.push("/feedback");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tipo */}
      <fieldset className="space-y-2">
        <legend className="text-[14px] font-medium text-[oklch(0.18_0.012_230)]">
          Tipo <span className="text-[oklch(0.52_0.148_28)]">*</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = selectedType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue("type", opt.value)}
                className={cn(
                  "flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all duration-150",
                  active
                    ? cn("ring-2", opt.ring, "border-transparent")
                    : "border-[oklch(0.88_0.01_220)] hover:border-[oklch(0.68_0.01_220)] hover:bg-[oklch(0.99_0.003_75)]"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    active ? opt.accent : "text-[oklch(0.52_0.016_220)]"
                  )}
                />
                <div>
                  <p
                    className={cn(
                      "text-[14px] font-medium",
                      active
                        ? "text-[oklch(0.18_0.012_230)]"
                        : "text-[oklch(0.42_0.016_220)]"
                    )}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[12px] text-[oklch(0.52_0.016_220)] mt-0.5">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {errors.type && (
          <p className="text-[12px] text-[oklch(0.52_0.148_28)]">
            {errors.type.message}
          </p>
        )}
      </fieldset>

      {/* Título */}
      <div className="space-y-1.5">
        <label
          htmlFor="title"
          className="text-[14px] font-medium text-[oklch(0.18_0.012_230)]"
        >
          Título <span className="text-[oklch(0.52_0.148_28)]">*</span>
        </label>
        <input
          id="title"
          {...register("title")}
          placeholder="Resuma em uma frase..."
          maxLength={100}
          className={cn(
            "w-full h-10 px-3 rounded-xl border bg-[oklch(0.99_0.003_75)] text-[oklch(0.18_0.012_230)] placeholder:text-[oklch(0.52_0.016_220)] text-[14px] outline-none transition-all duration-150",
            "focus:ring-2 focus:ring-[oklch(0.62_0.148_58/0.25)] focus:border-accent-500",
            errors.title
              ? "border-[oklch(0.52_0.148_28)] ring-2 ring-[oklch(0.52_0.148_28/0.2)]"
              : "border-[oklch(0.88_0.01_220)]"
          )}
        />
        {errors.title && (
          <p className="text-[12px] text-[oklch(0.52_0.148_28)]">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="description"
            className="text-[14px] font-medium text-[oklch(0.18_0.012_230)]"
          >
            Descrição <span className="text-[oklch(0.52_0.148_28)]">*</span>
          </label>
          <span
            className={cn(
              "text-[12px] tabular-nums",
              description.length > 1800
                ? "text-[oklch(0.52_0.148_28)]"
                : description.length > 1500
                  ? "text-accent-500"
                  : "text-[oklch(0.52_0.016_220)]"
            )}
          >
            {description.length}/2000
          </span>
        </div>
        <textarea
          id="description"
          {...register("description")}
          placeholder="Descreva com detalhes..."
          maxLength={2000}
          rows={6}
          className={cn(
            "w-full px-3 py-2.5 rounded-xl border bg-[oklch(0.99_0.003_75)] text-[oklch(0.18_0.012_230)] placeholder:text-[oklch(0.52_0.016_220)] text-[14px] outline-none transition-all duration-150 resize-none",
            "focus:ring-2 focus:ring-[oklch(0.62_0.148_58/0.25)] focus:border-accent-500",
            errors.description
              ? "border-[oklch(0.52_0.148_28)] ring-2 ring-[oklch(0.52_0.148_28/0.2)]"
              : "border-[oklch(0.88_0.01_220)]"
          )}
        />
        {errors.description && (
          <p className="text-[12px] text-[oklch(0.52_0.148_28)]">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Autorizar divulgação — apenas elogios */}
      <AnimatePresence>
        {selectedType === "elogio" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <label className="flex items-start gap-3 p-4 rounded-xl bg-[oklch(0.48_0.118_148/0.06)] border border-[oklch(0.48_0.118_148/0.2)] cursor-pointer hover:bg-[oklch(0.48_0.118_148/0.1)] transition-colors">
              <div className="mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  {...register("allow_public")}
                  checked={allowPublic}
                  onChange={(e) => setValue("allow_public", e.target.checked)}
                  className="w-4 h-4 accent-[oklch(0.48_0.118_148)] rounded"
                />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[oklch(0.18_0.012_230)]">
                  Autorizar divulgação pública
                </p>
                <p className="text-[12px] text-[oklch(0.42_0.016_220)] mt-0.5">
                  Este elogio poderá ser exibido anonimamente na página do
                  Koinos como depoimento de cliente.
                </p>
              </div>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 h-9 rounded-xl text-[14px] font-medium border border-[oklch(0.88_0.01_220)] text-[oklch(0.42_0.016_220)] hover:bg-[oklch(0.88_0.01_220/0.4)] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 h-9 rounded-xl text-[14px] font-medium bg-primary-700 text-[oklch(0.97_0.006_220)] hover:brightness-90 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar Feedback"}
        </button>
      </div>
    </form>
  );
}
