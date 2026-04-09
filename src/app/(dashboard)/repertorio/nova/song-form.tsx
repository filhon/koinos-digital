"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Music,
  User,
  Video,
  Guitar,
  MessageSquareQuote,
  AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSong } from "@/actions/songs";
import {
  createSongSchema,
  type CreateSongInput,
} from "@/lib/validators/music-groups";

interface MusicGroupOption {
  id: string;
  name: string;
}

interface SongFormProps {
  groups: MusicGroupOption[];
  defaultGroupId?: string;
}

export function SongForm({ groups, defaultGroupId }: SongFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSongInput>({
    resolver: zodResolver(createSongSchema),
    defaultValues: {
      music_group_id: defaultGroupId ?? groups[0]?.id ?? "",
      name: "",
      artist: "",
      lyrics: "",
      chord_url: "",
      youtube_url: "",
      central_message: "",
    },
  });

  const onSubmit = (data: CreateSongInput) => {
    startTransition(async () => {
      const result = await createSong(data);

      if (!result || "code" in result) {
        toast.error("code" in result ? result.error : "Erro inesperado");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Música adicionada ao repertório!");
      router.push(`/repertorio?grupo=${data.music_group_id}`);
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-border bg-card p-6 space-y-6"
    >
      {/* Grupo Musical */}
      <div className="space-y-2">
        <Label htmlFor="music_group_id" className="flex items-center gap-1.5">
          <Music className="size-3.5 text-muted-foreground" />
          Grupo Musical
          <span className="text-destructive ml-0.5">*</span>
        </Label>
        <select
          id="music_group_id"
          {...register("music_group_id")}
          className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {errors.music_group_id && (
          <p className="text-xs text-destructive">
            {errors.music_group_id.message}
          </p>
        )}
      </div>

      {/* Nome + Artista */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-1.5">
            <Music className="size-3.5 text-muted-foreground" />
            Nome da música
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ex: Oceans, Gratidão..."
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist" className="flex items-center gap-1.5">
            <User className="size-3.5 text-muted-foreground" />
            Artista / Compositor
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="artist"
            placeholder="Ex: Hillsong, Fernandinho..."
            {...register("artist")}
            aria-invalid={!!errors.artist}
          />
          {errors.artist && (
            <p className="text-xs text-destructive">{errors.artist.message}</p>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="youtube_url" className="flex items-center gap-1.5">
            <Video className="size-3.5 text-muted-foreground" />
            Link YouTube
            <span className="text-xs text-muted-foreground font-normal ml-1">
              (opcional)
            </span>
          </Label>
          <Input
            id="youtube_url"
            type="url"
            placeholder="https://youtube.com/..."
            {...register("youtube_url")}
            aria-invalid={!!errors.youtube_url}
          />
          {errors.youtube_url && (
            <p className="text-xs text-destructive">
              {errors.youtube_url.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="chord_url" className="flex items-center gap-1.5">
            <Guitar className="size-3.5 text-muted-foreground" />
            Link da Cifra
            <span className="text-xs text-muted-foreground font-normal ml-1">
              (opcional)
            </span>
          </Label>
          <Input
            id="chord_url"
            type="url"
            placeholder="https://cifraclub.com.br/..."
            {...register("chord_url")}
            aria-invalid={!!errors.chord_url}
          />
          {errors.chord_url && (
            <p className="text-xs text-destructive">
              {errors.chord_url.message}
            </p>
          )}
        </div>
      </div>

      {/* Mensagem central */}
      <div className="space-y-2">
        <Label htmlFor="central_message" className="flex items-center gap-1.5">
          <MessageSquareQuote className="size-3.5 text-muted-foreground" />
          Mensagem central
          <span className="text-xs text-muted-foreground font-normal ml-1">
            (opcional)
          </span>
        </Label>
        <textarea
          id="central_message"
          rows={3}
          placeholder="Qual é a mensagem principal desta música?"
          {...register("central_message")}
          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors resize-none"
        />
        {errors.central_message && (
          <p className="text-xs text-destructive">
            {errors.central_message.message}
          </p>
        )}
      </div>

      {/* Letra */}
      <div className="space-y-2">
        <Label htmlFor="lyrics" className="flex items-center gap-1.5">
          <AlignLeft className="size-3.5 text-muted-foreground" />
          Letra
          <span className="text-xs text-muted-foreground font-normal ml-1">
            (opcional)
          </span>
        </Label>
        <textarea
          id="lyrics"
          rows={10}
          placeholder="Cole aqui a letra completa da música..."
          {...register("lyrics")}
          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors resize-y font-mono"
        />
        {errors.lyrics && (
          <p className="text-xs text-destructive">{errors.lyrics.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/60">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Adicionar ao repertório
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/repertorio")}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
