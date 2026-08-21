import Link, { type LinkProps } from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// El Button de esta versión de shadcn (@base-ui/react) no soporta el patrón
// `asChild` de Radix para renderizar un <Link> con estilos de botón. Este
// wrapper reemplaza `<Button asChild><Link>...</Link></Button>` en toda la app.
type LinkButtonProps = LinkProps &
  Omit<React.ComponentProps<"a">, keyof LinkProps> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    children: React.ReactNode;
  };

export function LinkButton({
  className,
  variant,
  size,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
