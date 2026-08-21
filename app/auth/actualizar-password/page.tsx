"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

// El enlace del correo de recuperación (CLAUDE.md 8.2 + Resend/Supabase
// Auth) trae la sesión en el fragmento de la URL (#access_token=...). El
// cliente de Supabase la detecta automáticamente al cargar esta página en
// el navegador — por eso este componente corre en el cliente, no en el
// servidor (los fragmentos de URL nunca llegan al servidor).
export default function ActualizarPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ok, setOk] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError(
        "No se pudo actualizar la contraseña. El enlace puede haber expirado — solicita uno nuevo."
      );
      return;
    }

    setOk(true);
    setTimeout(() => router.push("/auth/login"), 2000);
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crea una nueva contraseña</CardTitle>
          <CardDescription>Debe tener al menos 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          {ok ? (
            <Alert>
              <AlertDescription>
                Contraseña actualizada. Te llevamos a iniciar sesión...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
