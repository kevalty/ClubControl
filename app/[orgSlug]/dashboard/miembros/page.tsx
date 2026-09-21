import { createClient } from "@/lib/supabase/server";
import { CopyInscripcionLink } from "@/components/dashboard/copy-inscripcion-link";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { MEMBER_STATUS_LABELS } from "@/lib/validations/member";

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  inactive: "secondary",
  frozen: "secondary",
  expired: "destructive",
};

export default async function MiembrosPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { orgSlug } = await params;
  const { q, estado } = await searchParams;
  const supabase = await createClient();

  const { data: authUser } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  const { data: myMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org!.id)
    .eq("user_id", authUser.user?.id ?? "")
    .maybeSingle();

  const canEdit = myMembership?.role !== "trainer";

  let query = supabase
    .from("members")
    .select("id, full_name, phone, document_id, status, join_date")
    .eq("organization_id", org!.id)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,document_id.ilike.%${q}%`
    );
  }
  if (estado && estado !== "todos") {
    query = query.eq("status", estado);
  }

  const { data: miembros, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Miembros</h1>
        <div className="flex gap-2">
          <LinkButton
            href={`/${orgSlug}/dashboard/miembros/export?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(estado ? { estado } : {}),
            }).toString()}`}
            variant="outline"
          >
            Exportar CSV
          </LinkButton>
          {canEdit ? (
            <LinkButton href={`/${orgSlug}/dashboard/miembros/nuevo`}>
              Nuevo miembro
            </LinkButton>
          ) : null}
        </div>
      </div>

      <CopyInscripcionLink orgSlug={orgSlug} />

      <form className="flex flex-wrap gap-3" method="get">
        <Input
          name="q"
          placeholder="Buscar por nombre, teléfono o cédula"
          defaultValue={q}
          className="max-w-xs"
        />
        <Select name="estado" defaultValue={estado ?? "todos"}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {Object.entries(MEMBER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-destructive">
          No se pudo cargar el listado de miembros. Intenta recargar la página.
        </p>
      ) : !miembros || miembros.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {q || estado ? (
            <p>No hay miembros que coincidan con la búsqueda.</p>
          ) : (
            <>
              <p>Aún no tienes miembros registrados.</p>
              {canEdit ? (
                <LinkButton
                  href={`/${orgSlug}/dashboard/miembros/nuevo`}
                  variant="link"
                >
                  Crea el primero
                </LinkButton>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ingreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {miembros.map((m) => (
                <TableRow key={m.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link
                      href={`/${orgSlug}/dashboard/miembros/${m.id}`}
                      className="hover:underline"
                    >
                      {m.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{m.phone}</TableCell>
                  <TableCell>{m.document_id ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[m.status] ?? "secondary"}>
                      {MEMBER_STATUS_LABELS[m.status] ?? m.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.join_date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
