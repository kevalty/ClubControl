import { LinkButton } from "@/components/ui/link-button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        GestorClub
      </h1>
      <p className="max-w-md text-muted-foreground">
        Gestión de miembros, pagos y recordatorios por WhatsApp para clubes
        deportivos, academias y gimnasios en Ecuador.
      </p>
      <div className="flex gap-4">
        <LinkButton href="/auth/registro">Crear mi club</LinkButton>
        <LinkButton href="/auth/login" variant="outline">
          Ya tengo cuenta
        </LinkButton>
      </div>
    </main>
  );
}
