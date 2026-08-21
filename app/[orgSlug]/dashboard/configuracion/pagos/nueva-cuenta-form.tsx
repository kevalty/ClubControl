"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NuevaCuentaForm({
  action,
}: {
  action: (
    prevState: { error?: string; ok?: boolean } | undefined,
    formData: FormData
  ) => Promise<{ error?: string; ok?: boolean } | undefined>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="bankName">Banco</Label>
        <Input id="bankName" name="bankName" placeholder="Banco Pichincha" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accountType">Tipo de cuenta</Label>
          <Select name="accountType" defaultValue="ahorros">
            <SelectTrigger id="accountType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ahorros">Ahorros</SelectItem>
              <SelectItem value="corriente">Corriente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Número de cuenta</Label>
          <Input id="accountNumber" name="accountNumber" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accountHolderName">Nombre del titular</Label>
          <Input id="accountHolderName" name="accountHolderName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountHolderDocument">Cédula / RUC del titular</Label>
          <Input id="accountHolderDocument" name="accountHolderDocument" required />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Agregar cuenta"}
      </Button>
    </form>
  );
}
