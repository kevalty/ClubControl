import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";

export default function Home() {
  return (
    <>
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center"
      >
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
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <nav aria-label="Enlaces legales" className="flex justify-center gap-4">
          <Link href="/legal/privacidad" className="hover:text-foreground underline underline-offset-2">
            Política de privacidad
          </Link>
          <Link href="/legal/terminos" className="hover:text-foreground underline underline-offset-2">
            Términos y condiciones
          </Link>
        </nav>
        <p className="mt-1">© {new Date().getFullYear()} GestorClub — Ecuador</p>
      </footer>
    </>
  );
}
