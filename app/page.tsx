import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        <Link href="/auth/registro" className={cn(buttonVariants())}>
          Crear mi club
        </Link>
        <Link
          href="/auth/login"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Ya tengo cuenta
        </Link>
      </div>
    </main>
  );
}
