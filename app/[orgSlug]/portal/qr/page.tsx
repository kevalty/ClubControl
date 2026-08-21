import QRCode from "qrcode";
import { getCurrentMember } from "@/lib/portal/get-current-member";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PortalQrPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { member } = await getCurrentMember(orgSlug);
  const dataUrl = await QRCode.toDataURL(member.qr_code, { width: 260, margin: 1 });

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Mi código QR</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Muéstralo en la entrada</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="Tu código QR de acceso"
            width={260}
            height={260}
            className="rounded-lg border"
          />
          <a
            href={dataUrl}
            download={`qr-${member.full_name.replace(/\s+/g, "-").toLowerCase()}.png`}
            className="text-sm text-primary hover:underline"
          >
            Descargar imagen
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
