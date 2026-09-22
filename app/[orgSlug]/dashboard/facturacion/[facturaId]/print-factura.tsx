"use client";

import { Button } from "@/components/ui/button";

type Org = {
  name: string;
  address: string | null;
  email: string | null;
  logo_url: string | null;
};

type Factura = {
  sequential_number: number;
  recipient_name: string;
  recipient_document: string;
  recipient_address: string | null;
  concept: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  created_at: string;
};

export function PrintFactura({ org, factura }: { org: Org; factura: Factura }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <style>{`
        @media print {
          body { background: white !important; }
          #factura-content { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
      <div className="flex gap-2 print:hidden">
        <Button onClick={() => window.print()}>Imprimir / Guardar PDF</Button>
      </div>
      <div
        className="rounded-lg border bg-white p-8 text-sm print:border-none print:p-0 print:shadow-none"
        id="factura-content"
        style={{
          WebkitPrintColorAdjust: "exact",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          printColorAdjust: "exact" as any,
        }}
      >
        <div className="mb-4 rounded bg-amber-50 border border-amber-200 p-2 text-center text-xs text-amber-700 print:hidden">
          SIMULADOR — Esta factura no tiene validez ante el SRI del Ecuador
        </div>
        <div className="flex justify-between mb-6">
          <div>
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="h-12 mb-1" />
            ) : null}
            <p className="font-bold text-lg">{org.name}</p>
            {org.address ? (
              <p className="text-gray-500">{org.address}</p>
            ) : null}
            {org.email ? (
              <p className="text-gray-500">{org.email}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">FACTURA</p>
            <p>Nro: {String(factura.sequential_number).padStart(9, "0")}</p>
            <p>
              Fecha:{" "}
              {new Date(factura.created_at).toLocaleDateString("es-EC")}
            </p>
          </div>
        </div>
        <div className="mb-6 rounded border p-3">
          <p>
            <span className="font-medium">Señor(es):</span> {factura.recipient_name}
          </p>
          <p>
            <span className="font-medium">C.I./RUC:</span>{" "}
            {factura.recipient_document}
          </p>
          {factura.recipient_address ? (
            <p>
              <span className="font-medium">Dirección:</span>{" "}
              {factura.recipient_address}
            </p>
          ) : null}
        </div>
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Descripción</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">{factura.concept}</td>
              <td className="py-2 text-right">
                ${Number(factura.subtotal).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${Number(factura.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA {factura.tax_rate}%</span>
            <span>${Number(factura.tax_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-1">
            <span>Total</span>
            <span>${Number(factura.total).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
