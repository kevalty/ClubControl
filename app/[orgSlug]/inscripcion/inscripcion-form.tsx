"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitInscripcion } from "./actions";

type Location = { id: string; name: string };
type FeeType = { id: string; name: string; discount_percent: number };

type Tab = "personales" | "medico" | "representante";

const TABS: Tab[] = ["personales", "medico", "representante"];
const TAB_LABELS: Record<Tab, string> = {
  personales: "Datos del estudiante",
  medico: "Información médica",
  representante: "Representante",
};

function getErrorTab(error: string): Tab {
  if (
    error.includes("médica") ||
    error.includes("sangre") ||
    error.includes("lergias") ||
    error.includes("ondiciones")
  )
    return "medico";
  if (
    error.includes("Representante") ||
    error.includes("representante") ||
    error.includes("arentesco") ||
    error.includes("eléfono del")
  )
    return "representante";
  return "personales";
}

type FormVals = {
  fullName: string;
  birthDate: string;
  documentId: string;
  school: string;
  grade: string;
  locationId: string;
  feeTypeId: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  medications: string;
  repFullName: string;
  repRelationship: string;
  repPhone: string;
  repEmail: string;
  repDocumentId: string;
};

export function InscripcionForm({
  orgSlug,
  orgId,
  locations,
  feeTypes,
  studentName,
}: {
  orgSlug: string;
  orgId: string;
  locations: Location[];
  feeTypes: FeeType[];
  studentName?: string;
}) {
  const action = submitInscripcion.bind(null, orgSlug, orgId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [activeTab, setActiveTab] = useState<Tab>("personales");
  const [errorTab, setErrorTab] = useState<Tab | null>(null);

  // Controlled state — prevents React 19 form reset from clearing field values on error.
  const [vals, setVals] = useState<FormVals>({
    fullName: studentName ?? "",
    birthDate: "",
    documentId: "",
    school: "",
    grade: "",
    locationId: "",
    feeTypeId: "",
    bloodType: "",
    allergies: "",
    conditions: "",
    medications: "",
    repFullName: "",
    repRelationship: "",
    repPhone: "",
    repEmail: "",
    repDocumentId: "",
  });

  const set =
    (k: keyof FormVals) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setVals((p) => ({ ...p, [k]: e.target.value }));

  const setSel = (k: keyof FormVals) => (v: string) =>
    setVals((p) => ({ ...p, [k]: v }));

  // Auto-switch to the tab that contains the error field.
  const handleError = (error: string) => {
    const tab = getErrorTab(error);
    setErrorTab(tab);
    setActiveTab(tab);
  };

  if (state?.success) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center space-y-3">
        <div className="text-5xl text-green-500">✓</div>
        <h2 className="text-xl font-semibold">¡Solicitud enviada correctamente!</h2>
        <p className="text-muted-foreground">
          Recibimos la solicitud de inscripción
          {studentName ? (
            <>
              {" "}
              para <span className="font-semibold">{studentName}</span>
            </>
          ) : null}
          . El equipo la revisará y se pondrán en contacto contigo pronto.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <form
        action={formAction}
        className="space-y-5"
        suppressHydrationWarning
        onSubmit={() => {
          if (state?.error) {
            handleError(state.error);
          }
        }}
      >
        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription className="space-y-1">
              <p className="font-medium">
                Por favor completa lo siguiente antes de enviar:
              </p>
              <p>{state.error}</p>
              <button
                type="button"
                className="underline text-xs"
                onClick={() => {
                  const tab = getErrorTab(state.error!);
                  setErrorTab(tab);
                  setActiveTab(tab);
                }}
              >
                Ir al campo →
              </button>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Tab navigation bar — visual only, content panels are plain divs below */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <TabsList className="grid w-full grid-cols-3">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="relative text-xs sm:text-sm"
              >
                {TAB_LABELS[tab]}
                {errorTab === tab ? (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* ===== TAB 1: DATOS DEL ESTUDIANTE ===== */}
        <div className={activeTab === "personales" ? "space-y-4" : "hidden"}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo del estudiante *</Label>
            <Input
              id="fullName"
              name="fullName"
              value={vals.fullName}
              onChange={set("fullName")}
              required
              placeholder="Nombres y apellidos completos"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                value={vals.birthDate}
                onChange={set("birthDate")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentId">Cédula del estudiante</Label>
              <Input
                id="documentId"
                name="documentId"
                value={vals.documentId}
                onChange={set("documentId")}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="school">Unidad educativa *</Label>
              <Input
                id="school"
                name="school"
                value={vals.school}
                onChange={set("school")}
                required
                placeholder="Nombre del colegio o escuela"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Curso / Año *</Label>
              <Input
                id="grade"
                name="grade"
                value={vals.grade}
                onChange={set("grade")}
                required
                placeholder="Ej: 8vo A"
              />
            </div>
          </div>
          {locations.length > 0 ? (
            <div className="space-y-2">
              <Label>Sede de entrenamiento</Label>
              <Select
                name="locationId"
                value={vals.locationId}
                onValueChange={setSel("locationId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sede (opcional)" />
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
          ) : null}
          {feeTypes.length > 0 ? (
            <div className="space-y-2">
              <Label>Tipo de tarifa</Label>
              <Select
                name="feeTypeId"
                value={vals.feeTypeId}
                onValueChange={setSel("feeTypeId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tarifa (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {feeTypes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                      {f.discount_percent > 0
                        ? ` (${f.discount_percent}% desc.)`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex justify-end pt-2">
            <Button type="button" onClick={() => setActiveTab("medico")}>
              Siguiente: Información médica →
            </Button>
          </div>
        </div>

        {/* ===== TAB 2: INFORMACIÓN MÉDICA ===== */}
        <div className={activeTab === "medico" ? "space-y-4" : "hidden"}>
          <p className="text-xs text-muted-foreground">
            Esta información es necesaria para la seguridad del estudiante
            durante los entrenamientos.
          </p>
          <div className="space-y-2">
            <Label htmlFor="bloodType">Tipo de sangre *</Label>
            <Select
              name="bloodType"
              value={vals.bloodType}
              onValueChange={setSel("bloodType")}
            >
              <SelectTrigger id="bloodType">
                <SelectValue placeholder="Selecciona el tipo de sangre" />
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
            <Label htmlFor="allergies">Alergias *</Label>
            <Textarea
              id="allergies"
              name="allergies"
              value={vals.allergies}
              onChange={set("allergies")}
              required
              placeholder="Escribe 'Ninguna' si no tiene alergias conocidas"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conditions">Condiciones médicas *</Label>
            <Textarea
              id="conditions"
              name="conditions"
              value={vals.conditions}
              onChange={set("conditions")}
              required
              placeholder="Escribe 'Ninguna' si no tiene condiciones médicas"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medications">Medicamentos que toma</Label>
            <Textarea
              id="medications"
              name="medications"
              value={vals.medications}
              onChange={set("medications")}
              placeholder="Escribe 'Ninguno' si no toma medicamentos"
            />
          </div>
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("personales")}
            >
              ← Anterior
            </Button>
            <Button
              type="button"
              onClick={() => setActiveTab("representante")}
            >
              Siguiente: Representante →
            </Button>
          </div>
        </div>

        {/* ===== TAB 3: REPRESENTANTE ===== */}
        <div className={activeTab === "representante" ? "space-y-4" : "hidden"}>
          <p className="text-xs text-muted-foreground">
            Datos de la persona responsable del estudiante (padre, madre o
            tutor).
          </p>
          <div className="space-y-2">
            <Label htmlFor="repFullName">
              Nombre completo del representante *
            </Label>
            <Input
              id="repFullName"
              name="repFullName"
              value={vals.repFullName}
              onChange={set("repFullName")}
              required
              placeholder="Nombres y apellidos"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repRelationship">Parentesco *</Label>
              <Input
                id="repRelationship"
                name="repRelationship"
                value={vals.repRelationship}
                onChange={set("repRelationship")}
                required
                placeholder="Padre / Madre / Tutor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repPhone">Teléfono / WhatsApp *</Label>
              <Input
                id="repPhone"
                name="repPhone"
                type="tel"
                value={vals.repPhone}
                onChange={set("repPhone")}
                required
                placeholder="0991234567"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repEmail">Correo electrónico</Label>
              <Input
                id="repEmail"
                name="repEmail"
                type="email"
                value={vals.repEmail}
                onChange={set("repEmail")}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repDocumentId">Cédula del representante</Label>
              <Input
                id="repDocumentId"
                name="repDocumentId"
                value={vals.repDocumentId}
                onChange={set("repDocumentId")}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("medico")}
            >
              ← Anterior
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {TABS.map((tab, i) => (
            <span key={tab} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  activeTab === tab
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
              />
              {i < TABS.length - 1 && (
                <span className="h-px w-6 bg-muted-foreground/20" />
              )}
            </span>
          ))}
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-full"
          size="lg"
        >
          {pending ? "Enviando solicitud..." : "Enviar solicitud de inscripción"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Al enviar confirmas que los datos proporcionados son correctos. Un
          miembro del equipo revisará tu solicitud y se pondrá en contacto
          contigo.
        </p>
      </form>
    </div>
  );
}
