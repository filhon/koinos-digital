import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge } from "../role-badge";
import { formatDate } from "@/lib/utils/formatters";
import { formatCPF, formatPhone } from "@/lib/utils/cpf";
import type { MemberWithLinks } from "@/actions/members";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

interface InfoRowProps {
  label: string;
  value?: string | null;
}

function InfoRow({ label, value }: InfoRowProps) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

interface MemberProfileProps {
  member: MemberWithLinks;
  isLeadership: boolean;
}

export function MemberProfile({ member, isLeadership }: MemberProfileProps) {
  const address = member.address as Record<string, string> | null;
  const addressStr = address
    ? [
        address.rua &&
          `${address.rua}${address.numero ? `, ${address.numero}` : ""}`,
        address.complemento,
        address.bairro,
        address.cidade && address.estado
          ? `${address.cidade} - ${address.estado}`
          : address.cidade || address.estado,
        address.cep,
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header with avatar */}
      <div className="relative bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 px-5 py-6">
        <div className="flex items-start gap-4">
          <Avatar
            size="lg"
            className="size-16 ring-2 ring-background shadow-md"
          >
            {member.avatar_url && (
              <AvatarImage src={member.avatar_url} alt={member.name} />
            )}
            <AvatarFallback className="text-xl font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pt-1">
            <h2
              className="text-xl font-semibold truncate"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {member.name}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <RoleBadge role={member.role} />
              {!member.is_active && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-error-light text-error-dark">
                  Inativo
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div className="px-5 divide-y-0">
        {isLeadership && member.cpf && (
          <InfoRow
            label="CPF"
            value={formatCPF(member.cpf.replace(/\D/g, ""))}
          />
        )}
        {isLeadership && member.rg && <InfoRow label="RG" value={member.rg} />}
        <InfoRow label="E-mail" value={member.email} />
        <InfoRow
          label="Telefone"
          value={member.phone ? formatPhone(member.phone) : null}
        />
        <InfoRow
          label="Data de nascimento"
          value={member.birth_date ? formatDate(member.birth_date) : null}
        />
        {isLeadership && (
          <>
            <InfoRow
              label="Recebimento na igreja"
              value={member.received_at ? formatDate(member.received_at) : null}
            />
            <InfoRow
              label="Batismo"
              value={member.baptized_at ? formatDate(member.baptized_at) : null}
            />
          </>
        )}
        <InfoRow label="Endereço" value={addressStr} />
        <InfoRow label="Membro desde" value={formatDate(member.created_at)} />
      </div>
    </div>
  );
}
