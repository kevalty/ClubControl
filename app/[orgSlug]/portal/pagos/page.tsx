import { getCurrentMember } from "@/lib/portal/get-current-member";
import { registrarPagoPropio } from "@/app/[orgSlug]/portal/pagos/actions";
import { PagarForm } from "@/app/[orgSlug]/portal/pagos/pagar-form";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/validations/payment";

export default async function PortalPagosPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { supabase, org, member } = await getCurrentMember(orgSlug);

  const [{ data: pagos }, { data: planes }, { data: membresias }, { data: cuenta }] =
    await Promise.all([
      supabase
        .from("payments")
        .select("id, amount, method, status, created_at")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("membership_plans")
        .select("id, name, price")
        .eq("organization_id", org.id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("memberships")
        .select("id, end_date, membership_plans(name)")
        .eq("member_id", member.id)
        .in("status", ["active", "frozen"]),
      supabase
        .from("bank_accounts")
        .select("bank_name, account_type, account_number, account_holder_name, account_holder_document")
        .eq("organization_id", org.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

  const action = registrarPagoPropio.bind(null, orgSlug, org.id, member.id);

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Registrar un pago</h1>
        <PagarForm
          action={action}
          planes={planes ?? []}
          membresias={(membresias ?? []).map((m) => ({
            id: m.id,
            end_date: m.end_date,
            plan_name: (m.membership_plans as unknown as { name: string } | null)?.name ?? "Plan",
          }))}
          cuentaBancaria={cuenta ?? null}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Historial de pagos</h2>
        {!pagos || pagos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no tienes pagos registrados.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.created_at).toLocaleDateString("es-EC")}</TableCell>
                    <TableCell>${Number(p.amount).toFixed(2)}</TableCell>
                    <TableCell>{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "approved" ? "default" : "secondary"}>
                        {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
