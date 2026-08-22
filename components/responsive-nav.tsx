"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = { href: string; label: string };

// Barra lateral vertical en desktop; menú desplegable en mobile. Una fila
// horizontal con scroll (el patrón anterior) esconde items sin ninguna
// pista de que hay más — encontrado en la auditoría visual de mobile
// (CLAUDE.md §15.3).
export function ResponsiveNav({ basePath, items }: { basePath: string; items: NavItem[] }) {
  const hrefFor = (href: string) => `${basePath}${href ? `/${href}` : ""}`;

  return (
    <>
      <nav className="hidden md:flex md:flex-col md:gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={hrefFor(item.href)}
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" className="w-full justify-start gap-2">
                <MenuIcon className="size-4" />
                Menú
              </Button>
            }
          />
          <DropdownMenuContent align="start" className="w-56">
            {items.map((item) => (
              <DropdownMenuItem key={item.href} render={<Link href={hrefFor(item.href)} />}>
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
