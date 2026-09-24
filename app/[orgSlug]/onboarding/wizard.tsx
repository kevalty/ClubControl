"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  guardarPerfilClub,
  crearPrimerPlan,
  invitarPrimerStaff,
} from "@/app/[orgSlug]/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BILLING_CYCLE_LABELS } from "@/lib/validations/membership-plan";

type Org = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  primary_color: string | null;
  logo_url: string | null;
};

export function OnboardingWizard({ org }: { org: Org }) {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const irADashboard = () => router.push(`/${org.slug}/dashboard`);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardDescription>Paso {step} de 3</CardDescription>
        <CardTitle>
          {step === 1 && "Datos de tu club"}
          {step === 2 && "Crea tu primer plan de membresía"}
          {step === 3 && "Invita a tu primer colaborador"}
        </CardTitle>
      </CardHeader>

      {step === 1 && (
        <StepPerfilClub org={org} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <StepPrimerPlan orgId={org.id} onNext={() => setStep(3)} />
      )}
      {step === 3 && (
        <StepInvitarStaff orgId={org.id} onFinish={irADashboard} />
      )}
    </Card>
  );
}

function StepPerfilClub({ org, onNext }: { org: Org; onNext: () => void }) {
  const [state, formAction, pending] = useActionState(guardarPerfilClub, undefined);
  const [logoPreview, setLogoPreview] = useState<string | null>(org.logo_url);

  useEffect(() => {
    if (state?.ok) onNext();
  }, [state?.ok, onNext]);

  return (
    <form action={formAction}>
      <input type="hidden" name="orgId" value={org.id} />
      <CardContent className="space-y-4">
        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Logo upload */}
        <div className="space-y-2">
          <Label>Logo del club <span className="text-muted-foreground">(opcional)</span></Label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo" className="h-14 w-14 rounded-lg object-contain border bg-muted p-1" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed bg-muted">
                <Upload className="size-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <label htmlFor="logo" className="cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                {logoPreview ? "Cambiar" : "Subir logo"}
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setLogoPreview(URL.createObjectURL(f));
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG o SVG</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección (opcional)</Label>
          <Input id="address" name="address" defaultValue={org.address ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Color principal de tu marca</Label>
          <Input
            id="primaryColor"
            name="primaryColor"
            type="color"
            defaultValue={org.primary_color ?? "#0EA5E9"}
            className="h-10 w-20 p-1"
          />
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Continuar"}
        </Button>
      </CardFooter>
    </form>
  );
}

function StepPrimerPlan({
  orgId,
  onNext,
}: {
  orgId: string;
  onNext: () => void;
}) {
  const [state, formAction, pending] = useActionState(crearPrimerPlan, undefined);

  useEffect(() => {
    if (state?.ok) onNext();
  }, [state?.ok, onNext]);

  return (
    <form action={formAction}>
      <input type="hidden" name="orgId" value={orgId} />
      <CardContent className="space-y-4">
        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del plan</Label>
          <Input id="name" name="name" placeholder="Mensualidad full" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Precio (USD)</Label>
            <Input id="price" name="price" type="number" min="0" step="0.01" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationDays">Vigencia (días)</Label>
            <Input
              id="durationDays"
              name="durationDays"
              type="number"
              min="1"
              defaultValue={30}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="billingCycle">Tipo de plan</Label>
          <Select name="billingCycle" defaultValue="monthly">
            <SelectTrigger id="billingCycle" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BILLING_CYCLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Creando plan..." : "Continuar"}
        </Button>
      </CardFooter>
    </form>
  );
}

function StepInvitarStaff({
  orgId,
  onFinish,
}: {
  orgId: string;
  onFinish: () => void;
}) {
  const [state, formAction, pending] = useActionState(invitarPrimerStaff, undefined);

  useEffect(() => {
    if (state?.ok) onFinish();
  }, [state?.ok, onFinish]);

  return (
    <form action={formAction}>
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="role" value="staff" />
      <CardContent className="space-y-4">
        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Correo del colaborador (opcional)</Label>
          <Input id="email" name="email" type="email" placeholder="recepcion@tuclub.com" />
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button type="button" variant="ghost" onClick={onFinish}>
          Saltar por ahora
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Invitando..." : "Invitar"}
        </Button>
      </CardFooter>
    </form>
  );
}
