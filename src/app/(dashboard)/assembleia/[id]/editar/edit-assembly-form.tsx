"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateAssembly, deleteAssembly } from "@/actions/assembleia";
import {
  createAssemblySchema,
  type AssemblyRow,
} from "@/lib/validators/assembleia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Vote } from "lucide-react";
import type { z } from "zod";

type FormValues = z.input<typeof createAssemblySchema>;

interface EditAssemblyFormProps {
  assembly: AssemblyRow;
}

export function EditAssemblyForm({ assembly }: EditAssemblyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createAssemblySchema),
    defaultValues: {
      name: assembly.name,
      date: assembly.date,
      start_time: assembly.start_time.slice(0, 5),
      location: assembly.location,
      reason: assembly.reason,
      agenda: assembly.agenda ?? "",
      has_election: assembly.has_election,
    },
  });

  const hasElection = watch("has_election");

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const result = await updateAssembly({
        ...(data as object),
        id: assembly.id,
      } as Parameters<typeof updateAssembly>[0]);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Assembleia atualizada!");
      router.push(`/assembleia/${assembly.id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteAssembly(assembly.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Assembleia excluída.");
      router.push("/assembleia");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}
      className="space-y-6"
    >
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message as string}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Horário *</Label>
              <Input id="start_time" type="time" {...register("start_time")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local *</Label>
            <Input id="location" {...register("location")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo *</Label>
            <Input id="reason" {...register("reason")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agenda">Pauta</Label>
            <Textarea id="agenda" rows={4} {...register("agenda")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Vote className="h-4 w-4 text-amber-500" />
                <span className="font-medium">Incluir eleição</span>
              </div>
            </div>
            <Switch
              checked={!!hasElection}
              onCheckedChange={(v) => setValue("has_election", v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/assembleia/${assembly.id}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir assembléia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A assembléia será removida
              permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              variant="destructive"
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
