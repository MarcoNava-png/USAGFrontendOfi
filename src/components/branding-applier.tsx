"use client";

import { useEffect } from "react";

import { useBranding } from "@/hooks/use-branding";
import { shadeColor } from "@/lib/color-utils";

export function BrandingApplier() {
  const branding = useBranding();

  useEffect(() => {
    const color = branding?.colorPrimario;
    if (!color) return;

    const root = document.documentElement;
    const vars: Record<string, string> = {
      "--primary": color,
      "--ring": color,
      "--sidebar-primary": color,
      "--usag-primary": color,
      "--usag-primary-light": shadeColor(color, 18),
      "--usag-primary-lighter": shadeColor(color, 32),
      "--usag-primary-dark": shadeColor(color, -22),
      "--usag-primary-darker": shadeColor(color, -40),
      "--usag-accent": shadeColor(color, 40),
    };

    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }
  }, [branding]);

  return null;
}
