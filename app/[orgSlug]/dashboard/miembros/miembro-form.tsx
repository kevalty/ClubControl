"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Location = { id: string; name: string };
type FeeType = { id: string; name: string; discount_percent: number };

export type ExtendedMemberValues = {
  full_name: string;
  email: string | null;
  phone: string;
  document_id: string | null;
  birth_date: string | null;
  school: string | null;
  grade: string | null;
  location_id: string | null;
  fee_type_id: string | null;
  notes: string | null;
  // médico
  blood_type: string | null;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  medical_notes: string | null;
  // representante principal
  rep_full_name: string | null;
  rep_relationship: string | null;
  rep_phone: string | null;
  rep_email: string | null;
  rep_document_id: string | null;
};

export function MiembroForm({
  action,
  initialValues,
  submitLabel,
  locations,
  feeTypes,
}: {
  action: (
    prev: { error?: string } | undefined,
    fd: FormData
  ) => Promise<{ error?: string } | undefined>;
  initialValues?: Partial<ExtendedMemberValues>;
  submitLabel: string;
  locations: Location[];
  feeTypes: FeeType[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [activeTab, setActiveTab] = useState("personales");

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {/* Barra de tabs — solo visual, no controla el montaje del contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personales">Personales</TabsTrigger>
          <TabsTrigger value="medico">Médico</TabsTrigger>
          <TabsTrigger value="representante">Representante</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ===== TAB: PERSONALES ===== */}
      {/* Usamos div con hidden en lugar de TabsContent — Base UI agrega inert a los */}
      {/* paneles inactivos, lo cual excluye sus inputs del FormData al hacer submit. */}
      <div className={activeTab === "personales" ? "space-y-4" : "hidden"}>
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre completo *</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={initialValues?.full_name ?? ""}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={initialValues?.phone ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialValues?.email ?? ""}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="documentId">Cédula</Label>
            <Input
              id="documentId"
              name="documentId"
              defaultValue={initialValues?.document_id ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">Fecha de nacimiento</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              defaultValue={initialValues?.birth_date ?? ""}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="school">Unidad educativa</Label>
            <Input
              id="school"
              name="school"
              defaultValue={initialValues?.school ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade">Curso / Año</Label>
            <Input
              id="grade"
              name="grade"
              defaultValue={initialValues?.grade ?? ""}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {locations.length > 0 && (
            <div className="space-y-2">
              <Label>Sede</Label>
              <Select
                name="locationId"
                defaultValue={initialValues?.location_id ?? undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sede" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {feeTypes.length > 0 && (
            <div className="space-y-2">
              <Label>Rubro / Tarifa</Label>
              <Select
                name="feeTypeId"
                defaultValue={initialValues?.fee_type_id ?? undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tarifa normal" />
                </SelectTrigger>
                <SelectContent>
                  {feeTypes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.discount_percent}% desc.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={initialValues?.notes ?? ""}
          />
        </div>
      </div>

      {/* ===== TAB: MÉDICO ===== */}
      <div className={activeTab === "medico" ? "space-y-4" : "hidden"}>
        <div className="space-y-2">
          <Label htmlFor="bloodType">Tipo de sangre</Label>
          <Select
            name="bloodType"
            defaultValue={initialValues?.blood_type ?? undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                (t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="allergies">Alergias</Label>
          <Textarea
            id="allergies"
            name="allergies"
            defaultValue={initialValues?.allergies ?? ""}
            placeholder="Ninguna / Penicilina / Polen..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conditions">Condiciones médicas</Label>
          <Textarea
            id="conditions"
            name="conditions"
            defaultValue={initialValues?.conditions ?? ""}
            placeholder="Asma, diabetes, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="medications">Medicamentos</Label>
          <Textarea
            id="medications"
            name="medications"
            defaultValue={initialValues?.medications ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="medicalNotes">Notas médicas adicionales</Label>
          <Textarea
            id="medicalNotes"
            name="medicalNotes"
            defaultValue={initialValues?.medical_notes ?? ""}
          />
        </div>
      </div>

      {/* ===== TAB: REPRESENTANTE ===== */}
      <div className={activeTab === "representante" ? "space-y-4" : "hidden"}>
        <div className="space-y-2">
          <Label htmlFor="repFullName">Nombre completo del representante *</Label>
          <Input
            id="repFullName"
            name="repFullName"
            defaultValue={initialValues?.rep_full_name ?? ""}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="repRelationship">Parentesco *</Label>
            <Input
              id="repRelationship"
              name="repRelationship"
              defaultValue={initialValues?.rep_relationship ?? ""}
              placeholder="Padre, Madre, Tutor..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repPhone">Teléfono del representante *</Label>
            <Input
              id="repPhone"
              name="repPhone"
              type="tel"
              defaultValue={initialValues?.rep_phone ?? ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="repEmail">Correo del representante</Label>
            <Input
              id="repEmail"
              name="repEmail"
              type="email"
              defaultValue={initialValues?.rep_email ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repDocumentId">Cédula del representante</Label>
            <Input
              id="repDocumentId"
              name="repDocumentId"
              defaultValue={initialValues?.rep_document_id ?? ""}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
