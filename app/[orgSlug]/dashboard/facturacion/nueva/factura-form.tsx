"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Miembro = { id: string; full_name: string; document_id: string | null };

export function FacturaForm({
  action,
  miembros,
}: {
  action: (prev: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string } | undefined>;
  miembros: Miembro[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [subtotal, setSubtotal] = useState(0);
  const [recipientName, setRecipientName] = useState("");
  const [recipientDocument, setRecipientDocument] = useState("");
  const tax = Number((subtotal * 0.15).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  function handleMiembroChange(memberId: string | null) {
    if (!memberId || memberId === "none") {
      setRecipientName("");
      setRecipientDocument("");
      return;
    }
    const m = miembros.find((x) => x.id === memberId);
    if (m) {
      setRecipientName(m.full_name);
      setRecipientDocument(m.document_id ?? "");
    }
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {/* Selector opcional de miembro para auto-llenar datos */}
      {miembros.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="miembro_selector">Miembro (opcional — auto-llena los datos)</Label>
          <Select onValueChange={handleMiembroChange} defaultValue="none">
            <SelectTrigger id="miembro_selector" className="w-full">
              <SelectValue placeholder="Seleccionar miembro..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Ingresar manualmente —</SelectItem>
              {miembros.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                  {m.document_id ? ` (${m.document_id})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="recipient_name">Nombre / Razón social del receptor *</Label>
        <Input
          id="recipient_name"
          name="recipient_name"
          required
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="recipient_document">Cédula / RUC *</Label>
          <Input
            id="recipient_document"
            name="recipient_document"
            required
            value={recipientDocument}
            onChange={(e) => setRecipientDocument(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipient_address">Dirección</Label>
          <Input id="recipient_address" name="recipient_address" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="concept">Concepto *</Label>
        <Textarea
          id="concept"
          name="concept"
          required
          placeholder="Ej: Mensualidad octubre 2026, Matrícula, Pack 10 clases"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subtotal">Subtotal (USD) *</Label>
        <Input
          id="subtotal"
          name="subtotal"
          type="number"
          min="0.01"
          step="0.01"
          required
          onChange={(e) => setSubtotal(Number(e.target.value) || 0)}
        />
      </div>
      <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA 15%</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Generando..." : "Generar recibo"}
      </Button>
    </form>
  );
}
