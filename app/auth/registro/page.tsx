"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrarClub } from "@/app/auth/registro/actions";
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

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(registrarClub, undefined);

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crea tu club en GestorClub</CardTitle>
          <CardDescription>
            Prueba gratuita de 14 días, sin tarjeta de crédito.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombreClub">Nombre del club</Label>
              <Input id="nombreClub" name="nombreClub" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreDueno">Tu nombre</Label>
              <Input id="nombreDueno" name="nombreDueno" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" type="tel" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creando club..." : "Crear mi club"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
