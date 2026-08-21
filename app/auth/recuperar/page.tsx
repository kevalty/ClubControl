"use client";

import Link from "next/link";
import { useActionState } from "react";
import { solicitarRecuperacion } from "@/app/auth/recuperar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RecuperarPage() {
  const [state, formAction, pending] = useActionState(solicitarRecuperacion, undefined);

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recuperar contraseña</CardTitle>
          <CardDescription>
            Te enviaremos un enlace para crear una nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.ok ? (
            <Alert>
              <AlertDescription>
                Si ese correo tiene una cuenta, te enviamos un enlace para
                restablecer tu contraseña. Revisa tu bandeja de entrada.
              </AlertDescription>
            </Alert>
          ) : (
            <form action={formAction} className="space-y-4">
              {state?.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            <Link href="/auth/login" className="text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
