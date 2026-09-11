"use client";

import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Member = {
  id: string;
  full_name: string;
  photo_url: string | null;
  status: string;
  qr_code: string;
  join_date: string;
};
type Org = { name: string; logo_url: string | null; primary_color: string };
type Membership = {
  end_date: string;
  membership_plans: { name: string } | null;
} | null;

export function CarnetView({
  member,
  org,
  activeMembership,
}: {
  member: Member;
  org: Org;
  activeMembership: Membership;
}) {
  const isActive = member.status === "active";

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Botón de impresión — oculto al imprimir */}
        <Button
          className="w-full print:hidden"
          onClick={() => window.print()}
        >
          Imprimir / Guardar PDF
        </Button>

        {/* Carnet */}
        <div
          className="rounded-2xl border-2 bg-white overflow-hidden shadow-lg print:shadow-none print:rounded-none"
          style={{ borderColor: org.primary_color }}
          id="carnet"
        >
          {/* Cabecera con color del club */}
          <div
            className="p-4 text-white text-center"
            style={{ backgroundColor: org.primary_color }}
          >
            {org.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logo_url}
                alt={org.name}
                className="h-8 mx-auto mb-1 object-contain"
              />
            ) : null}
            <p className="font-bold text-lg">{org.name}</p>
            <p className="text-sm opacity-90">CARNET DE ESTUDIANTE</p>
          </div>

          {/* Foto + datos */}
          <div className="p-6 flex gap-4">
            <div className="flex-shrink-0">
              {member.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.photo_url}
                  alt={member.full_name}
                  className="h-20 w-20 rounded-lg object-cover border-2"
                  style={{ borderColor: org.primary_color }}
                />
              ) : (
                <div
                  className="h-20 w-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: org.primary_color }}
                >
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg leading-tight">{member.full_name}</p>
              {activeMembership ? (
                <p className="text-sm text-muted-foreground mt-1">
                  {(activeMembership.membership_plans as { name: string } | null)?.name}
                </p>
              ) : null}
              <div className="mt-2">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "ACTIVO" : "INACTIVO"}
                </Badge>
              </div>
              {activeMembership ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Válido hasta:{" "}
                  {new Date(activeMembership.end_date).toLocaleDateString("es-EC")}
                </p>
              ) : null}
            </div>
          </div>

          {/* Código QR */}
          <div className="border-t px-6 pb-6 pt-4 flex flex-col items-center gap-2">
            <QRCode value={member.qr_code} size={120} />
            <p className="text-xs text-muted-foreground">Código de acceso</p>
          </div>
        </div>
      </div>
    </div>
  );
}
