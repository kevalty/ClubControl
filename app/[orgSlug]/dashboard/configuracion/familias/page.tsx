import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";

type FamilyGroup = {
  id: string;
  name: string;
  discount_amount: number | null;
  discount_percent: number | null;
};

function formatDescuento(g: FamilyGroup): string {
  if (g.discount_amount != null && g.discount_percent != null) {
    return `-$${Number(g.discount_amount).toFixed(2)} / ${g.discount_percent}%`;
  }
  if (g.discount_amount != null) return `-$${Number(g.discount_amount).toFixed(2)}`;
  if (g.discount_percent != null) return `${g.discount_percent}%`;
  return "Sin descuento";
}

export default async function FamiliasPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: grupos } = await (supabase as any)
    .from("family_groups")
    .select("id, name, discount_amount, discount_percent")
    .eq("organization_id", org.id)
    .order("name");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fgmRaw } = await (supabase as any)
    .from("family_group_members")
    .select("family_group_id");

  // Build member count per group
  const countMap = new Map<string, number>();
  for (const row of (fgmRaw ?? []) as Array<{ family_group_id: string }>) {
    countMap.set(row.family_group_id, (countMap.get(row.family_group_id) ?? 0) + 1);
  }

  const list = (grupos ?? []) as FamilyGroup[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Grupos familiares</h1>
        <LinkButton href={`/${orgSlug}/dashboard/configuracion/familias/nuevo`}>
          Crear grupo
        </LinkButton>
      </div>

      {list.length === 0 ? (
        <p className="text-muted-foreground">
          Aún no hay grupos familiares. Crea el primero para aplicar descuentos a familias.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {list.map((g) => (
            <div key={g.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{g.name}</p>
                <p className="text-sm text-muted-foreground">
                  Descuento: {formatDescuento(g)} &middot;{" "}
                  {countMap.get(g.id) ?? 0} miembro(s)
                </p>
              </div>
              <Link
                href={`/${orgSlug}/dashboard/configuracion/familias/${g.id}`}
                className="text-sm font-medium text-[#818cf8] hover:underline"
              >
                Gestionar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
