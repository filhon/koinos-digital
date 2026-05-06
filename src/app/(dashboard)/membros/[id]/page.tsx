import { notFound } from "next/navigation";
import Link from "next/link";
import { getMemberById } from "@/actions/members";
import { getUser } from "@/lib/auth/session";
import { isLeadershipRole } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { MemberProfile } from "./member-profile";
import { FamilyLinksSection } from "./family-links-section";
import { RoleSection } from "./role-section";
import { TagsEditor } from "./tags-editor";
import { Pencil } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await getMemberById(id);
  if (!result || !("data" in result) || !result.data)
    return { title: "Membro — Koinos" };
  return { title: `${result.data.name} — Koinos` };
}

export default async function MembroPage({ params }: PageProps) {
  const { id } = await params;

  const [memberResult, user] = await Promise.all([
    getMemberById(id),
    getUser(),
  ]);

  if (!memberResult || !("data" in memberResult) || !memberResult.data) {
    notFound();
  }

  const member = memberResult.data;
  const isLeadership = user ? isLeadershipRole(user.role) : false;
  const canChangeRole = user?.role === "pastor" || user?.role === "admin";

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={member.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Membros", href: "/membros" },
          { label: member.name },
        ]}
        action={
          isLeadership ? (
            <Button
              render={<Link href={`/membros/${id}/editar`} />}
              nativeButton={false}
              size="sm"
              variant="outline"
            >
              <Pencil className="size-4" />
              Editar
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 space-y-6">
        <MemberProfile member={member} isLeadership={isLeadership} />
        {canChangeRole && (
          <RoleSection
            memberId={member.id}
            memberName={member.name}
            currentRole={member.role}
          />
        )}
        {isLeadership && (
          <TagsEditor memberId={member.id} initialTags={member.tags ?? []} />
        )}
        <FamilyLinksSection member={member} isLeadership={isLeadership} />
      </div>
    </div>
  );
}
