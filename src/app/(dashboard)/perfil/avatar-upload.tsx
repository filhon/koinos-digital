"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/actions/profile";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentUrl: string | null;
  name: string;
  churchId: string;
  memberId: string;
  onUpdate: (url: string) => void;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_DIMENSION = 400;

/** Resizes image client-side to max 400×400 using Canvas API */
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(
        MAX_DIMENSION / img.width,
        MAX_DIMENSION / img.height,
        1
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Falha ao gerar imagem"));
          resolve(blob);
        },
        "image/webp",
        0.85
      );
    };
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = url;
  });
}

export function AvatarUpload({
  currentUrl,
  name,
  churchId,
  memberId,
  onUpdate,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo 2MB.");
      return;
    }

    setUploading(true);

    try {
      const resized = await resizeImage(file);

      // Show local preview immediately
      const previewUrl = URL.createObjectURL(resized);
      setPreview(previewUrl);

      const supabase = createClient();
      const path = `${churchId}/avatars/${memberId}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, resized, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        toast.error("Erro ao enviar foto. Tente novamente.");
        setPreview(null);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      const result = await updateProfile({ avatar_url: publicUrl });
      if (!result.success) {
        toast.error(result.error);
        setPreview(null);
        return;
      }

      onUpdate(publicUrl);
      toast.success("Foto atualizada com sucesso.");
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displayUrl = preview ?? currentUrl ?? undefined;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="size-24">
          <AvatarImage src={displayUrl} alt={name} />
          <AvatarFallback
            className="text-2xl font-medium"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Alterar foto de perfil"
          className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-background transition-colors focus-visible:outline-2 focus-visible:outline-ring"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Selecionar foto"
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-xs text-muted-foreground"
      >
        {uploading ? "Enviando..." : "Alterar foto"}
      </Button>
    </div>
  );
}
