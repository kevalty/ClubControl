# Rediseño Visual Dark & Premium — GestorClub

**Fecha:** 2026-09-08
**Estado:** Aprobado por el usuario

---

## Decisiones de diseño aprobadas

| Pregunta | Decisión |
|---|---|
| Estilo visual | Dark & Premium (fondo oscuro, acentos violeta/índigo) |
| Navegación | Sidebar ancho — ícono + texto siempre visible |
| Tarjetas | Minimal con línea de color en la parte superior (sin blur, sin glow) |

---

## Paleta de colores (tokens CSS)

```css
/* Fondos */
--background: #08080f;       /* fondo raíz de la app */
--surface-1: #0d0d1a;        /* sidebar, topbar */
--surface-2: #111120;        /* cards, paneles */
--surface-3: #131325;        /* filas hover, inputs */
--border: #1a1a2e;           /* bordes sutiles */
--border-subtle: #0f0f1e;    /* separadores internos de tabla */

/* Acentos principales */
--accent-indigo: #6366f1;
--accent-violet: #8b5cf6;
--accent-indigo-muted: rgba(99,102,241,0.15);

/* Texto */
--text-primary: #ffffff;
--text-secondary: #d1d5db;
--text-muted: #6b7280;
--text-faint: #4b5563;
--text-label: #3d3d5c;      /* labels de nav no activos */

/* Estados semánticos */
--success: #22c55e;
--success-muted: rgba(34,197,94,0.12);
--warning: #fbbf24;
--warning-muted: rgba(251,191,36,0.12);
--danger: #ef4444;
--danger-muted: rgba(239,68,68,0.12);

/* Líneas de acento en KPI cards */
--kpi-indigo: linear-gradient(90deg, #6366f1, #8b5cf6);
--kpi-violet: linear-gradient(90deg, #8b5cf6, #a78bfa);
--kpi-green:  linear-gradient(90deg, #22c55e, #4ade80);
--kpi-red:    linear-gradient(90deg, #ef4444, #f87171);

/* Botón primario */
--btn-primary: linear-gradient(135deg, #6366f1, #8b5cf6);
```

---

## Componentes a modificar (por prioridad)

### Capa 1 — Tokens globales
- **`app/globals.css`**: reemplazar variables de color del sistema shadcn/ui (`:root` y `.dark`) con la paleta dark de arriba. Forzar dark mode por defecto en `<html>`.

### Capa 2 — Shell de layout (mayor impacto visual)
- **`components/responsive-nav.tsx`**: sidebar ancho (220px) con secciones "General" / "Operaciones", logo con gradiente, nav-items con ícono SVG + texto, badge de conteo en Pagos, item activo con fondo `--accent-indigo-muted` y texto `#818cf8`.
- **Layout topbar** (`app/[orgSlug]/dashboard/layout.tsx` o similar): fondo `--surface-1`, borde inferior `--border`, título de página, botón primario con gradiente, avatar del usuario.

### Capa 3 — Componentes clave del dashboard
- **KPI cards** (dashboard principal): `border-radius: 12px`, fondo `--surface-2`, línea de 2px arriba con el gradiente de color correspondiente, label uppercase pequeño, valor en `font-size: 26px font-weight: 800`, delta con color semántico.
- **Tablas**: cabecera en `--surface-1` con texto `--text-label` uppercase, filas alternadas con borde `--border-subtle`, hover con fondo `rgba(99,102,241,0.04)`.
- **Badges de estado**: `activo` verde, `pendiente/por_vencer` amarillo, `vencido/rechazado` rojo — todos con fondo muted y texto de color, `border-radius: 20px`.
- **Panel de alertas** (vencimientos próximos): fondo `--surface-2`, ítems separados por `--border-subtle`, badge de días con color urgente/warn.

### Capa 4 — Componentes de soporte (mejoran con tokens, ajuste fino)
- Botones: primario con gradiente, ghost con `border: 1px solid --border`.
- Inputs/formularios: fondo `--surface-3`, borde `--border`, foco con `--accent-indigo`.
- Modales/diálogos: fondo `--surface-2`, borde `--border`.
- Toasts (Sonner): tema dark.

---

## Estructura del sidebar

```
GESTORCLUB  [logo gradiente]

— GENERAL —
  Dashboard   [activo: fondo indigo-muted]
  Miembros
  Pagos       [badge: count pendientes]

— OPERACIONES —
  Asistencia
  Clases
  Equipo

— (bottom) —
  Configuración
```

Ancho: `220px` desktop. En mobile: drawer overlay (lógica existente en `responsive-nav.tsx`).

---

## Reglas de implementación

1. **No eliminar shadcn/ui** — solo sobreescribir sus tokens CSS. Los componentes siguen funcionando.
2. **`next-themes` o `class="dark"` en `<html>`** — asegurar que shadcn renderice en dark mode siempre (no hay toggle claro/oscuro en el MVP).
3. **`org.primary_color`** — el sidebar activo y el btn-primary usan `--accent-indigo` por defecto. En el futuro, este valor puede venir de la BD como variable CSS inline (`style="--accent: #hex"`). No implementar ahora, solo no hardcodear el color en JS.
4. **Recharts** — usar `fill="#6366f1"` / `fill="#8b5cf6"` en las gráficas, `stroke="#1a1a2e"` en la grilla, `background="#111120"` en tooltips.
5. **Mobile-first preservado** — el sidebar en mobile sigue siendo un drawer. No cambiar la lógica, solo el estilo.

---

## Archivos principales a tocar

| Archivo | Cambio |
|---|---|
| `app/globals.css` | Tokens CSS dark completos |
| `components/responsive-nav.tsx` | Sidebar rediseñado |
| `app/[orgSlug]/dashboard/layout.tsx` | Topbar con nuevo estilo |
| `app/[orgSlug]/dashboard/page.tsx` | KPI cards + tabla + panel alertas |
| `components/ui/badge.tsx` | Variantes de estado semántico |
| `components/ui/button.tsx` | Variante primaria con gradiente |

---

## Fuera de alcance de este rediseño

- Portal del miembro (`/portal`) — queda para una segunda pasada de diseño.
- Página de check-in kiosco — ya tiene fondo neutro funcional.
- Panel super-admin (`/admin`) — hereda tokens automáticamente.
- Modo claro — no se implementa en el MVP.
