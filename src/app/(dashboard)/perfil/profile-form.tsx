"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AvatarUpload } from "./avatar-upload";

import { updateProfile } from "@/actions/profile";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validators/profile";
import { formatPhone } from "@/lib/utils/formatters";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { MemberProfile, MemberAddress } from "@/actions/profile";

// Role labels PT-BR
const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  pastor: "Pastor",
  presbítero: "Presbítero",
  diácono: "Diácono",
  tesoureiro: "Tesoureiro",
  líder: "Líder",
  membro: "Membro",
  visitante: "Visitante",
};

interface ProfileFormProps {
  profile: MemberProfile;
  churchId: string;
  streak?: number;
}

export function ProfileForm({
  profile,
  churchId,
  streak = 0,
}: ProfileFormProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [showAddress, setShowAddress] = useState(!!profile.address);

  const defaultAddress: MemberAddress = profile.address ?? {
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      phone: profile.phone ? formatPhone(profile.phone) : "",
      address: defaultAddress,
    },
  });

  async function onSubmit(data: UpdateProfileInput) {
    const result = await updateProfile({
      ...data,
      // Only send address if user showed the section
      address: showAddress ? data.address : undefined,
    });

    if (result.success) {
      toast.success("Perfil atualizado com sucesso.");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Avatar + identidade */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader>
            <CardTitle>Foto e identificação</CardTitle>
            <CardDescription>
              Nome, e-mail e cargo só podem ser alterados pela liderança da
              igreja.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-6 items-start">
            <AvatarUpload
              currentUrl={avatarUrl}
              name={profile.name}
              churchId={churchId}
              memberId={profile.id}
              streak={streak}
              onUpdate={setAvatarUrl}
            />

            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              {/* Nome — read-only */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" aria-hidden="true" />
                  Nome completo
                </Label>
                <div className="flex h-9 items-center rounded-md border border-input/50 bg-muted/40 px-3 text-sm text-muted-foreground select-none">
                  {profile.name}
                </div>
              </div>

              {/* E-mail — read-only */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" aria-hidden="true" />
                  E-mail
                </Label>
                <div className="flex h-9 items-center rounded-md border border-input/50 bg-muted/40 px-3 text-sm text-muted-foreground select-none truncate">
                  {profile.email}
                </div>
              </div>

              {/* Role — read-only */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" aria-hidden="true" />
                  Cargo
                </Label>
                <div className="flex h-9 items-center">
                  <Badge variant="secondary">
                    {ROLE_LABELS[profile.role] ?? profile.role}
                  </Badge>
                </div>
              </div>

              {/* Membro desde */}
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Membro desde</Label>
                <div className="flex h-9 items-center rounded-md border border-input/50 bg-muted/40 px-3 text-sm text-muted-foreground select-none">
                  {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Formulário editável */}
      <motion.div variants={staggerItem}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Card>
            <CardHeader>
              <CardTitle>Contato e endereço</CardTitle>
              <CardDescription>
                Informações que você pode atualizar diretamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Telefone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  autoComplete="tel"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <Separator />

              {/* Endereço toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Endereço residencial
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddress((v) => !v)}
                >
                  {showAddress ? "Ocultar" : "Informar endereço"}
                </Button>
              </div>

              {showAddress && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="address.street">Rua / Avenida</Label>
                    <Input
                      id="address.street"
                      placeholder="Rua das Flores"
                      {...register("address.street")}
                    />
                    {errors.address?.street && (
                      <p className="text-xs text-destructive">
                        {errors.address.street.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address.number">Número</Label>
                    <Input
                      id="address.number"
                      placeholder="123"
                      {...register("address.number")}
                    />
                    {errors.address?.number && (
                      <p className="text-xs text-destructive">
                        {errors.address.number.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address.complement">
                      Complemento{" "}
                      <span className="text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input
                      id="address.complement"
                      placeholder="Apto 4"
                      {...register("address.complement")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address.neighborhood">Bairro</Label>
                    <Input
                      id="address.neighborhood"
                      placeholder="Centro"
                      {...register("address.neighborhood")}
                    />
                    {errors.address?.neighborhood && (
                      <p className="text-xs text-destructive">
                        {errors.address.neighborhood.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address.city">Cidade</Label>
                    <Input
                      id="address.city"
                      placeholder="São Paulo"
                      {...register("address.city")}
                    />
                    {errors.address?.city && (
                      <p className="text-xs text-destructive">
                        {errors.address.city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address.state">Estado (sigla)</Label>
                    <Input
                      id="address.state"
                      placeholder="SP"
                      maxLength={2}
                      className="uppercase"
                      {...register("address.state")}
                    />
                    {errors.address?.state && (
                      <p className="text-xs text-destructive">
                        {errors.address.state.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address.zip">CEP</Label>
                    <Input
                      id="address.zip"
                      placeholder="01234-567"
                      {...register("address.zip")}
                    />
                    {errors.address?.zip && (
                      <p className="text-xs text-destructive">
                        {errors.address.zip.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 pb-6">
              <Link
                href="/perfil/privacidade"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Privacidade e dados pessoais (LGPD)
              </Link>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-28"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Salvando...
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </div>
          </Card>
        </form>
      </motion.div>
    </motion.div>
  );
}
