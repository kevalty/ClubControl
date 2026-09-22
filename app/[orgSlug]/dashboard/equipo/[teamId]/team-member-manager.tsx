"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type TeamMember = { member_id: string; full_name: string };
type AvailableMember = { id: string; full_name: string };

export function TeamMemberManager({
  orgSlug,
  teamId,
  teamMembers: initialTeamMembers,
  availableMembers: initialAvailable,
  agregarAction,
  quitarAction,
}: {
  orgSlug: string;
  teamId: string;
  teamMembers: TeamMember[];
  availableMembers: AvailableMember[];
  agregarAction: (memberId: string) => Promise<{ error?: string }>;
  quitarAction: (memberId: string) => Promise<{ error?: string }>;
}) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const agregar = () => {
    if (!selectedMemberId) return;
    startTransition(async () => {
      const result = await agregarAction(selectedMemberId);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Miembro agregado al equipo.");
        setSelectedMemberId("");
      }
    });
  };

  const quitar = (memberId: string) => {
    startTransition(async () => {
      const result = await quitarAction(memberId);
      if (result?.error) toast.error(result.error);
      else toast.info("Miembro removido del equipo.");
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold mb-3">
          Integrantes del equipo ({initialTeamMembers.length})
        </h2>
        {initialTeamMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 text-center">
            No hay miembros en este equipo aún.
          </p>
        ) : (
          <div className="divide-y rounded-lg border">
            {initialTeamMembers.map((m) => (
              <div
                key={m.member_id}
                className="flex items-center justify-between p-3"
              >
                <span className="text-sm font-medium">{m.full_name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => quitar(m.member_id)}
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {initialAvailable.length > 0 ? (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-medium">Agregar miembro al equipo</h3>
          <div className="flex gap-2">
            <Select
              value={selectedMemberId}
              onValueChange={setSelectedMemberId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar miembro activo..." />
              </SelectTrigger>
              <SelectContent>
                {initialAvailable.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={agregar}
              disabled={pending || !selectedMemberId}
            >
              Agregar
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No hay más miembros activos disponibles para agregar.
        </p>
      )}
    </div>
  );
}
