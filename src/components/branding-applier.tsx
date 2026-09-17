"use client";

import { useEffect } from "react";

import { useBranding } from "@/hooks/use-branding";
import { ensureReadableSurface, readableInk, shadeColor } from "@/lib/color-utils";

export function BrandingApplier() {
  const branding = useBranding();

  useEffect(() => {
    const color = branding?.colorPrimario;
    if (!color) return;

    const surface = ensureReadableSurface(color, 4.5);
    const activeFrom = shadeColor(surface, 20);
    const activeTo = shadeColor(surface, 2);

    const root = document.documentElement;
    const vars: Record<string, string> = {
      "--primary": color,
      "--primary-foreground": readableInk(color),
      "--ring": color,
      "--sidebar-primary": color,
      "--usag-primary": color,
      "--usag-primary-light": shadeColor(color, 18),
      "--usag-primary-lighter": shadeColor(color, 32),
      "--usag-primary-dark": shadeColor(color, -22),
      "--usag-primary-darker": shadeColor(color, -40),
      "--usag-accent": shadeColor(color, 40),
      "--sidebar-surface-from": surface,
      "--sidebar-surface-to": shadeColor(surface, -25),
      "--sidebar-active-from": activeFrom,
      "--sidebar-active-to": activeTo,
      "--sidebar-active-ink": readableInk(activeFrom),
      "--brand-surface": surface,
      "--brand-surface-2": shadeColor(surface, 16),
      "--brand-surface-ink": readableInk(surface),
    };

    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }
  }, [branding]);

  return null;
}
