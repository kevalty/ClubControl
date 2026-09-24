"use client";

import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Sun, Moon, Upload } from "lucide-react";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#0ea5e9",
];

export function ClubSettingsForm({
  orgSlug,
  action,
  defaultName,
  defaultColor,
  defaultLogoUrl,
}: {
  orgSlug: string;
  action: (
    prev: { error?: string; ok?: boolean } | undefined,
    formData: FormData
  ) => Promise<{ error?: string; ok?: boolean }>;
  defaultName: string;
  defaultColor: string;
  defaultLogoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [color, setColor] = useState(defaultColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(defaultLogoUrl);
  const [isDark, setIsDark] = useState(true);

  // Restore dark-mode preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("gc-theme");
    if (stored === "light") {
      setIsDark(false);
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("gc-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("gc-theme", "light");
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  return (
    <div className="space-y-8">
      {/* Apariencia del dashboard */}
      <div className="rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#3d3d5c]">Apariencia</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Modo {isDark ? "oscuro" : "claro"}</p>
            <p className="text-xs text-[#6b7280]">Cambia el tema visual del dashboard</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-16 items-center rounded-full border border-[#1a1a2e] bg-[#14142a] px-1 transition-all"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform ${
                isDark
                  ? "translate-x-0 bg-[#6366f1]"
                  : "translate-x-7 bg-amber-400"
              }`}
            >
              {isDark ? (
                <Moon className="size-3.5 text-white" />
              ) : (
                <Sun className="size-3.5 text-[#08080f]" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Datos del club */}
      <form action={formAction} className="space-y-6">
        <div className="rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#3d3d5c]">Datos del club</p>

          {state?.error && (
            <p className="mb-4 rounded-lg bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#f87171]">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#4ade80]/5 px-4 py-3 text-sm text-[#4ade80]">
              <CheckCircle2 className="size-4" />
              Configuración guardada correctamente.
            </div>
          )}

          <div className="space-y-5">
            {/* Logo */}
            <div className="space-y-3">
              <Label className="text-sm text-[#9ca3af]">Logo del club</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-16 w-16 rounded-xl object-contain border border-[#1a1a2e] bg-[#14142a] p-1"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-[#1a1a2e] bg-[#14142a]">
                    <Upload className="size-5 text-[#3d3d5c]" />
                  </div>
                )}
                <div>
                  <label
                    htmlFor="logo"
                    className="cursor-pointer rounded-lg border border-[#1a1a2e] bg-[#14142a] px-4 py-2 text-sm text-[#9ca3af] hover:bg-[#1a1a2e] hover:text-white transition-colors"
                  >
                    {logoPreview ? "Cambiar logo" : "Subir logo"}
                  </label>
                  <input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleLogoChange}
                  />
                  <p className="mt-1.5 text-xs text-[#3d3d5c]">PNG, JPG o SVG. Máx. 2 MB.</p>
                </div>
              </div>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-[#9ca3af]">Nombre del club</Label>
              <Input
                id="name"
                name="name"
                defaultValue={defaultName}
                required
                minLength={2}
                className="border-[#1a1a2e] bg-[#14142a] text-white placeholder:text-[#3d3d5c]"
              />
            </div>

            {/* Color primario */}
            <div className="space-y-3">
              <Label className="text-sm text-[#9ca3af]">Color primario</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "white" : "transparent",
                    }}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-full border border-[#1a1a2e] bg-transparent"
                  />
                  <span className="text-xs text-[#6b7280]">Personalizado</span>
                </div>
              </div>
              <input type="hidden" name="primaryColor" value={color} />
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: color }}
              >
                <span>Vista previa del color</span>
              </div>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="bg-[#6366f1] text-white hover:bg-[#5254cc]"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}
