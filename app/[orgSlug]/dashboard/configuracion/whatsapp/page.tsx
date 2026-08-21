import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  WHATSAPP_TEMPLATE_KEYS,
  WHATSAPP_TEMPLATE_LABELS,
} from "@/lib/validations/whatsapp-template";
import { guardarPlantilla } from "@/app/[orgSlug]/dashboard/configuracion/whatsapp/actions";
import { PlantillaForm } from "@/app/[orgSlug]/dashboard/configuracion/whatsapp/plantilla-form";

export default async function ConfiguracionWhatsappPage({
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

  const { data: templates } = await supabase
    .from("whatsapp_templates")
    .select("organization_id, key, content")
    .in("key", WHATSAPP_TEMPLATE_KEYS)
    .or(`organization_id.eq.${org!.id},organization_id.is.null`);

  // Chequeo server-side (esta página es un server component, no hace falta
  // NEXT_PUBLIC_) de si Twilio está configurado. Ver lib/whatsapp/twilio.ts.
  const whatsappConfigurado = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
  );

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Plantillas de WhatsApp</h1>

      {!whatsappConfigurado ? (
        <Alert>
          <AlertDescription>
            Tu club todavía no tiene una cuenta de WhatsApp Business
            verificada conectada. Los recordatorios se seguirán generando
            normalmente, pero el envío fallará silenciosamente (queda
            registrado como &quot;failed&quot;) hasta que se conecte una
            cuenta. La verificación de negocio ante Twilio/Meta puede tardar
            varios días — te recomendamos iniciarla cuanto antes.
          </AlertDescription>
        </Alert>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Variables disponibles: <code>{"{{nombre}}"}</code>,{" "}
        <code>{"{{monto}}"}</code>, <code>{"{{fecha_vencimiento}}"}</code>,{" "}
        <code>{"{{link_pago}}"}</code>, <code>{"{{club}}"}</code>.
      </p>

      <div className="space-y-4">
        {WHATSAPP_TEMPLATE_KEYS.map((key) => {
          const propia = templates?.find((t) => t.organization_id === org!.id && t.key === key);
          const global = templates?.find((t) => t.organization_id === null && t.key === key);
          const action = guardarPlantilla.bind(null, orgSlug, org!.id, key);

          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-base">
                  {WHATSAPP_TEMPLATE_LABELS[key]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlantillaForm
                  action={action}
                  defaultContent={propia?.content ?? global?.content ?? ""}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
