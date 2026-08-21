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
import { WEEKDAYS } from "@/lib/validations/class";
import { ClaseActivaToggle } from "@/app/[orgSlug]/dashboard/clases/clase-activa-toggle";

export default async function ClasesPage({
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

  const { data: clases, error } = await supabase
    .from("classes")
    .select("id, name, capacity, location, recurrence_rule, is_active")
    .eq("organization_id", org!.id)
    .order("name");

  const labelDias = (days: string[]) =>
    days.map((d) => WEEKDAYS.find((w) => w.value === d)?.label ?? d).join(", ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Clases</h1>
        <div className="flex gap-2">
          <LinkButton href={`/${orgSlug}/dashboard/clases/calendario`} variant="outline">
            Ver calendario
          </LinkButton>
          <LinkButton href={`/${orgSlug}/dashboard/clases/nuevo`}>Nueva clase</LinkButton>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive">No se pudieron cargar las clases.</p>
      ) : !clases || clases.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>Aún no tienes clases creadas.</p>
          <LinkButton href={`/${orgSlug}/dashboard/clases/nuevo`} variant="link">
            Crea la primera
          </LinkButton>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Cupo</TableHead>
                <TableHead>Lugar</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clases.map((c) => {
                const rule = c.recurrence_rule as unknown as {
                  days: string[];
                  start_time: string;
                  end_time: string;
                };
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      {labelDias(rule.days)} {rule.start_time}–{rule.end_time}
                    </TableCell>
                    <TableCell>{c.capacity}</TableCell>
                    <TableCell>{c.location ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2 text-right">
                      <LinkButton
                        href={`/${orgSlug}/dashboard/clases/${c.id}/editar`}
                        variant="outline"
                        size="sm"
                      >
                        Editar
                      </LinkButton>
                      <ClaseActivaToggle orgSlug={orgSlug} classId={c.id} activa={c.is_active} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
