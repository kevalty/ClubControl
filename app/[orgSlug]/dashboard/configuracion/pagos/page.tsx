import { createClient } from "@/lib/supabase/server";
import { crearCuentaBancaria } from "@/app/[orgSlug]/dashboard/configuracion/pagos/actions";
import { CuentaActivaToggle } from "@/app/[orgSlug]/dashboard/configuracion/pagos/cuenta-activa-toggle";
import { NuevaCuentaForm } from "@/app/[orgSlug]/dashboard/configuracion/pagos/nueva-cuenta-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCOUNT_TYPE_LABELS } from "@/lib/validations/bank-account";

export default async function ConfiguracionPagosPage({
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

  const { data: cuentas } = await supabase
    .from("bank_accounts")
    .select("id, bank_name, account_type, account_number, account_holder_name, is_active")
    .eq("organization_id", org!.id)
    .order("created_at", { ascending: false });

  const action = crearCuentaBancaria.bind(null, orgSlug, org!.id);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Cuentas bancarias</h1>
      <p className="text-sm text-muted-foreground">
        Estos datos se le muestran al miembro cuando va a pagar por
        transferencia.
      </p>

      {!cuentas || cuentas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no has registrado ninguna cuenta bancaria.
        </p>
      ) : (
        <div className="space-y-3">
          {cuentas.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">
                  {c.bank_name} — {ACCOUNT_TYPE_LABELS[c.account_type]}
                </CardTitle>
                <Badge variant={c.is_active ? "default" : "secondary"}>
                  {c.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm">
                <div>
                  <div>N.º de cuenta: {c.account_number}</div>
                  <div className="text-muted-foreground">
                    Titular: {c.account_holder_name}
                  </div>
                </div>
                <CuentaActivaToggle
                  orgSlug={orgSlug}
                  accountId={c.id}
                  activa={c.is_active}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar cuenta bancaria</CardTitle>
        </CardHeader>
        <CardContent>
          <NuevaCuentaForm action={action} />
        </CardContent>
      </Card>
    </div>
  );
}
