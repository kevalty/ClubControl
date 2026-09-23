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
};

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
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEnroll = () => {
    if (!selectedMemberId) return;
    setError(null);
    startTransition(async () => {
      const result = await enrollMember(orgSlug, orgId, classId, selectedMemberId);
      if (result.error) {
        setError(result.error);
      } else {
        setSelectedMemberId("");
      }
    });
  };

  const handleUnenroll = (memberId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await unenrollMember(orgSlug, orgId, classId, memberId);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Agregar miembro */}
      <div className="rounded-xl bg-[#111120] p-5">
        <h2 className="mb-4 text-sm font-bold text-[#e5e7eb]">Agregar miembro</h2>
        {availableMembers.length === 0 ? (
          <p className="text-sm text-[#6b7280]">Todos los miembros activos ya están inscritos.</p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar miembro…" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name} — {m.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleEnroll}
              disabled={!selectedMemberId || isPending}
            >
              Agregar
            </Button>
          </div>
        )}
        {error && (
          <p className="mt-2 text-sm text-[#f87171]">{error}</p>
        )}
      </div>

      {/* Lista de inscritos */}
      <div className="rounded-xl bg-[#111120] p-5">
        <h2 className="mb-4 text-sm font-bold text-[#e5e7eb]">
          Inscritos ({enrolledMembers.length})
        </h2>
        {enrolledMembers.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#6b7280]">
            Ningún miembro inscrito aún.
          </p>
        ) : (
          <div className="divide-y divide-[#0f0f1e]">
            {enrolledMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{m.full_name}</p>
                  <p className="text-xs text-[#6b7280]">{m.phone}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleUnenroll(m.id)}
                  className="border-[#ef4444]/30 text-[#f87171] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#f87171]"
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
