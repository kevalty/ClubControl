import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// TODO(Fase 1 - módulo 8.1): formulario completo de registro de club +
// wizard de onboarding de 3 pasos. Placeholder de Fase 0.
export default function RegistroPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crear mi club</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>El registro de clubes se habilita en la próxima fase.</p>
          <Link href="/auth/login" className="text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
