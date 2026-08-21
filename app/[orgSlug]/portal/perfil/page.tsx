import { getCurrentMember } from "@/lib/portal/get-current-member";
import { actualizarPerfilPropio } from "@/app/[orgSlug]/portal/perfil/actions";
import { PerfilForm } from "@/app/[orgSlug]/portal/perfil/perfil-form";

export default async function PortalPerfilPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { member } = await getCurrentMember(orgSlug);

  const action = actualizarPerfilPropio.bind(null, orgSlug, member.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mi perfil</h1>
      <PerfilForm action={action} initialValues={member} />
    </div>
  );
}
