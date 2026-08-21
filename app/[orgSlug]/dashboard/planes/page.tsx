import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BILLING_CYCLE_LABELS } from "@/lib/validations/membership-plan";
import { PlanActivoToggle } from "@/app/[orgSlug]/dashboard/planes/plan-activo-toggle";

export default async function PlanesPage({
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
    .single();

  const { data: planes, error } = await supabase
    .from("membership_plans")
    .select("id, name, price, billing_cycle, duration_days, is_active")
    .eq("organization_id", org!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Planes de membresía</h1>
        <LinkButton href={`/${orgSlug}/dashboard/planes/nuevo`}>
          Nuevo plan
        </LinkButton>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar los planes. Intenta recargar la página.
        </p>
      ) : !planes || planes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>Aún no tienes planes de membresía.</p>
          <LinkButton href={`/${orgSlug}/dashboard/planes/nuevo`} variant="link">
            Crea el primero
          </LinkButton>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planes.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>${Number(plan.price).toFixed(2)}</TableCell>
                  <TableCell>
                    {BILLING_CYCLE_LABELS[plan.billing_cycle] ?? plan.billing_cycle}
                  </TableCell>
                  <TableCell>{plan.duration_days} días</TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2 text-right">
                    <LinkButton
                      href={`/${orgSlug}/dashboard/planes/${plan.id}/editar`}
                      variant="outline"
                      size="sm"
                    >
                      Editar
                    </LinkButton>
                    <PlanActivoToggle
                      orgSlug={orgSlug}
                      planId={plan.id}
                      activo={plan.is_active}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
