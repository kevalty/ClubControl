"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { crearPlanPlataforma } from "@/app/admin/planes/actions";

export function NuevoPlanForm() {
  const [state, formAction, pending] = useActionState(crearPlanPlataforma, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={formRef} action={formAction} className="max-w-md space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="key">Clave (única)</Label>
          <Input id="key" name="key" placeholder="pro_plus" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" placeholder="Pro Plus" required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priceMonthly">Precio/mes (USD)</Label>
          <Input id="priceMonthly" name="priceMonthly" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxMembers">Máx. miembros</Label>
          <Input id="maxMembers" name="maxMembers" type="number" min="1" placeholder="Sin límite" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxStaff">Máx. staff</Label>
          <Input id="maxStaff" name="maxStaff" type="number" min="1" placeholder="Sin límite" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creando..." : "Crear plan"}
      </Button>
    </form>
  );
}
