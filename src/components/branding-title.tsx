"use client";

import { useEffect } from "react";

import { useBranding } from "@/hooks/use-branding";

export function BrandingTitle() {
  const branding = useBranding();

  useEffect(() => {
    if (!branding) return;
    const nombre = branding.nombre?.trim() || "SACI";
    document.title = `${nombre} - Sistema Académico`;
  }, [branding]);

  return null;
}
