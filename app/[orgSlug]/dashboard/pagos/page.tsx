import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import { PagoAcciones } from "@/app/[orgSlug]/dashboard/pagos/pago-acciones";

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  pending_review: "secondary",
  approved: "default",
  rejected: "destructive",
  refunded: "secondary",
};

export default async function PagosPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ estado?: string; metodo?: string }>;
}) {
  const { orgSlug } = await params;
  const { estado, metodo } = await searchParams;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  let query = supabase
    .from("payments")
    .select("id, amount, currency, method, status, reference_number, proof_url, created_at, members(full_name)")
    .eq("organization_id", org!.id)
    .order("created_at", { ascending: false });

  const estadoFiltro = estado ?? "pending_review";
  if (estadoFiltro !== "todos") {
    query = query.eq("status", estadoFiltro);
  }
  if (metodo && metodo !== "todos") {
    query = query.eq("method", metodo);
  }

  const { data: pagos, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Pagos</h1>
        <LinkButton href={`/${orgSlug}/dashboard/pagos/nuevo`}>
          Registrar pago
        </LinkButton>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <Select name="estado" defaultValue={estadoFiltro}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="metodo" defaultValue={metodo ?? "todos"}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los métodos</SelectItem>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar los pagos. Intenta recargar la página.
        </p>
      ) : !pagos || pagos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>
            {estadoFiltro === "pending_review"
              ? "No hay pagos pendientes de revisión."
              : "No hay pagos que coincidan con el filtro."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {(p.members as unknown as { full_name: string } | null)?.full_name ?? "—"}
                  </TableCell>
                  <TableCell>${Number(p.amount).toFixed(2)}</TableCell>
                  <TableCell>{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</TableCell>
                  <TableCell>{p.reference_number ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? "secondary"}>
                      {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString("es-EC")}</TableCell>
                  <TableCell className="text-right">
                    <PagoAcciones
                      orgSlug={orgSlug}
                      paymentId={p.id}
                      proofPath={p.proof_url}
                      soloVerComprobante={p.status !== "pending_review"}
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
