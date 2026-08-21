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
import { PLATFORM_PAYMENT_STATUS_LABELS } from "@/lib/validations/platform-payment";
import { PagoPlataformaAcciones } from "@/app/admin/pagos/pago-plataforma-acciones";

export default async function AdminPagosPage() {
  const supabase = await createClient();

  const { data: pagos } = await supabase
    .from("platform_payments")
    .select("id, amount, status, proof_url, created_at, organizations(name), subscription_plans(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pagos de suscripción</h1>
      {!pagos || pagos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay pagos registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Club</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {(p.organizations as unknown as { name: string } | null)?.name}
                  </TableCell>
                  <TableCell>
                    {(p.subscription_plans as unknown as { name: string } | null)?.name}
                  </TableCell>
                  <TableCell>${Number(p.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "approved" ? "default" : "secondary"}>
                      {PLATFORM_PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === "pending_review" ? (
                      <PagoPlataformaAcciones paymentId={p.id} proofPath={p.proof_url} />
                    ) : null}
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
