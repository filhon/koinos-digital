import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { getSongById } from "@/actions/songs";
import { EditSongForm } from "./edit-song-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Editar Música — Koinos" };

export default async function EditarMusicaPage({ params }: PageProps) {
  await requireRole(["admin", "pastor", "presbítero", "diácono", "líder"]);

  const { id } = await params;
  const result = await getSongById(id);

  if (!result || "code" in result || result.error || !result.data) {
    notFound();
  }

  const song = result.data;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Editar Música"
        description={`Editando: ${song.name}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Repertório", href: "/repertorio" },
          { label: song.name },
          { label: "Editar" },
        ]}
      />

      <div className="mt-6">
        <EditSongForm song={song} />
      </div>
    </div>
  );
}
