import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ORGANIZATION_STATUS_LABELS } from "@/lib/validations/platform-payment";
import { SuspensionToggle } from "@/app/admin/clubes/suspension-toggle";

export default async function AdminClubesPage() {
  const supabase = await createClient();

  const { data: orgs } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, status, created_at, organization_subscriptions(status, current_period_end, subscription_plans(name))"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clubes</h1>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Club</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Registrado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(orgs ?? []).map((o) => {
              const subs = (o.organization_subscriptions as unknown as
                | { subscription_plans: { name: string } | null }[]
                | null) ?? [];
              const planName = subs[0]?.subscription_plans?.name ?? "—";

              return (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    {o.name}
                    <div className="text-xs text-muted-foreground">/{o.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={o.status === "active" ? "default" : "secondary"}>
                      {ORGANIZATION_STATUS_LABELS[o.status] ?? o.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{planName}</TableCell>
                  <TableCell>
                    {new Date(o.created_at).toLocaleDateString("es-EC")}
                  </TableCell>
                  <TableCell className="text-right">
                    <SuspensionToggle orgId={o.id} suspendido={o.status === "suspended"} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
