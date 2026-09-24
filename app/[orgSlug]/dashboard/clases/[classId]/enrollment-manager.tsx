"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { enrollMember, unenrollMember } from "./actions";

type EnrolledMember = {
  id: string;
  full_name: string;
  phone: string;
  status: string;
};

type AvailableMember = {
  id: string;
  full_name: string;
  phone: string;
  currentClass: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function EnrollmentManager({
  orgSlug,
  orgId,
  classId,
  enrolledMembers,
  availableMembers,
}: {
  orgSlug: string;
  orgId: string;
  classId: string;
  enrolledMembers: EnrolledMember[];
  availableMembers: AvailableMember[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [conflictMember, setConflictMember] = useState<AvailableMember | null>(null);

  const doEnroll = (memberId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await enrollMember(orgSlug, orgId, classId, memberId);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Deportista inscrito correctamente.");
        router.refresh();
      }
    });
  };

  const handleAdd = (member: AvailableMember) => {
    if (member.currentClass) {
      setConflictMember(member);
    } else {
      doEnroll(member.id);
    }
  };

  const handleUnenroll = (memberId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await unenrollMember(orgSlug, orgId, classId, memberId);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg bg-[rgba(239,68,68,0.1)] px-4 py-2 text-sm text-[#f87171]">
          {error}
        </p>
      )}

      {/* ── Inscritos ── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Inscritos ({enrolledMembers.length})
        </h2>
        {enrolledMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1a1a2e] p-8 text-center text-sm text-[#6b7280]">
            Ningún deportista inscrito aún.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {enrolledMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6366f1]/20 text-sm font-bold text-[#818cf8]">
                  {initials(m.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {m.full_name}
                  </p>
                  <p className="text-xs text-[#6b7280]">{m.phone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleUnenroll(m.id)}
                  className="shrink-0 text-[#f87171] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#f87171]"
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Disponibles para agregar ── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Agregar deportista ({availableMembers.length} disponibles)
        </h2>
        {availableMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1a1a2e] p-8 text-center text-sm text-[#6b7280]">
            Todos los miembros activos ya están inscritos en esta clase.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {availableMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a1a2e] text-sm font-bold text-[#6b7280]">
                  {initials(m.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {m.full_name}
                  </p>
                  {m.currentClass ? (
                    <p className="truncate text-xs text-amber-400">
                      Ya en: {m.currentClass}
                    </p>
                  ) : (
                    <p className="text-xs text-[#6b7280]">{m.phone}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleAdd(m)}
                  className="shrink-0 bg-[#6366f1] text-white hover:bg-[#5254cc]"
                >
                  +
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Diálogo de confirmación de conflicto ── */}
      <Dialog open={!!conflictMember} onOpenChange={(open) => { if (!open) setConflictMember(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deportista en otra clase</DialogTitle>
            <DialogDescription>
              <strong>{conflictMember?.full_name}</strong> ya está inscrito/a en{" "}
              <strong>{conflictMember?.currentClass}</strong>. ¿Deseas inscribirlo/a
              también en esta clase?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConflictMember(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (conflictMember) doEnroll(conflictMember.id);
                setConflictMember(null);
              }}
            >
              Confirmar inscripción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
