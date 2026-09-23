"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";

type AttendanceMember = {
  memberId: string;
  fullName: string;
  status: "attended" | "no_show" | "justified" | "booked" | null;
};

export function AttendancePanel({
  members,
  marcarAction,
}: {
  members: AttendanceMember[];
  marcarAction: (
    memberId: string,
    estado: "attended" | "no_show" | "justified"
  ) => Promise<{ error?: string }>;
}) {
  const [pending, startTransition] = useTransition();

  function marcar(
    memberId: string,
    estado: "attended" | "no_show" | "justified"
  ) {
    startTransition(async () => {
      await marcarAction(memberId, estado);
    });
  }

  if (members.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        No hay alumnos inscritos en este horario. Cuando se aprueben inscripciones
        y se asigne esta clase, los alumnos aparecerán aquí.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((m) => (
        <div
          key={m.memberId}
          className="flex flex-col gap-2 rounded-lg border border-[#1a1a2e] bg-[#0d0d1a] p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="text-sm font-medium">{m.fullName}</span>
          <div className="flex shrink-0 gap-1.5">
            <button
              disabled={pending}
              onClick={() => marcar(m.memberId, "attended")}
              className={cn(
                "min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                m.status === "attended"
                  ? "bg-green-600 text-white"
                  : "bg-[#1a1a2e] text-green-400 hover:bg-green-900/40"
              )}
            >
              Presente
            </button>
            <button
              disabled={pending}
              onClick={() => marcar(m.memberId, "no_show")}
              className={cn(
                "min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                m.status === "no_show"
                  ? "bg-red-600 text-white"
                  : "bg-[#1a1a2e] text-red-400 hover:bg-red-900/40"
              )}
            >
              Ausente
            </button>
            <button
              disabled={pending}
              onClick={() => marcar(m.memberId, "justified")}
              className={cn(
                "min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                m.status === "justified"
                  ? "bg-amber-500 text-white"
                  : "bg-[#1a1a2e] text-amber-400 hover:bg-amber-900/40"
              )}
            >
              Justificado
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
