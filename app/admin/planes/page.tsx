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
import { PlanActivoTogglePlataforma } from "@/app/admin/planes/plan-activo-toggle";
import { NuevoPlanForm } from "@/app/admin/planes/nuevo-plan-form";

export default async function AdminPlanesPage() {
  const supabase = await createClient();
  const { data: planes } = await supabase
    .from("subscription_plans")
    .select("id, key, name, price_monthly, max_members, max_staff, is_active")
    .order("price_monthly");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Planes de suscripción</h1>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio/mes</TableHead>
              <TableHead>Límites</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(planes ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.key}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>${Number(p.price_monthly).toFixed(2)}</TableCell>
                <TableCell>
                  {p.max_members ?? "∞"} miembros / {p.max_staff ?? "∞"} staff
                </TableCell>
                <TableCell>
                  <Badge variant={p.is_active ? "default" : "secondary"}>
                    {p.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <PlanActivoTogglePlataforma planId={p.id} activo={p.is_active} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Nuevo plan</h2>
        <NuevoPlanForm />
      </div>
    </div>
  );
}
