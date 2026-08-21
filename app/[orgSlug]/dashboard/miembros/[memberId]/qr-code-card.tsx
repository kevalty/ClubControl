import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Se genera server-side (evita otra dependencia client-side) y se envía
// como data URI. El miembro también podrá verlo desde su portal en Fase 5.
export async function QrCodeCard({ qrCode }: { qrCode: string }) {
  const dataUrl = await QRCode.toDataURL(qrCode, { width: 200, margin: 1 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Código QR de acceso</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="Código QR de acceso del miembro" width={200} height={200} />
        <p className="text-xs text-muted-foreground">
          Úsalo en el modo kiosco de la entrada para registrar asistencia.
        </p>
      </CardContent>
    </Card>
  );
}
