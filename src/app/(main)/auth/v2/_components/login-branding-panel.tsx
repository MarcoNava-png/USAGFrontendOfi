"use client";

import { GraduationCap } from "lucide-react";

import { useBranding } from "@/hooks/use-branding";
import { shadeColor } from "@/lib/color-utils";

export function LoginBrandingPanel() {
  const branding = useBranding();
  const logoUrl = branding?.logoUrl;
  const nombre = branding?.nombre ?? "SACI";
  const color = branding?.colorPrimario || "#14356F";
  const esUsag = branding?.codigo?.toUpperCase() === "USAG";

  return (
    <div
      className="relative order-2 hidden h-full rounded-3xl lg:flex overflow-hidden"
      style={{
        background: `linear-gradient(to bottom right, ${color}, ${shadeColor(color, -25)}, ${shadeColor(color, -45)})`,
      }}
    >
      <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'rgba(90, 143, 212, 0.15)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'rgba(42, 95, 170, 0.1)' }}
      />

      <div className="relative z-10 flex flex-col justify-between w-full p-10">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div
            className="relative rounded-3xl p-6 shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300 flex items-center justify-center min-h-[180px] min-w-[180px]"
            style={{ background: `linear-gradient(135deg, ${color}, ${color})` }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={nombre}
                className="object-contain w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-white w-40 h-40 md:w-48 md:h-48">
                <GraduationCap className="h-20 w-20" />
                <span className="text-xl font-bold tracking-wide">SACI</span>
              </div>
            )}
          </div>
          <div className="text-center text-white space-y-3">
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
              {nombre}
            </h1>
            <p className="text-sm font-medium mt-4" style={{ color: '#5a8fd4' }}>
              Sistema de Gestión Escolar
            </p>
          </div>
        </div>

        <div className="text-white space-y-4 mt-8">
          <div className="grid gap-3">
            <div
              className="flex items-center gap-3 backdrop-blur-sm p-4 rounded-xl border"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: '#5a8fd4' }} />
              <h3 className="font-medium text-sm">Gestión Académica Integral</h3>
            </div>
            <div
              className="flex items-center gap-3 backdrop-blur-sm p-4 rounded-xl border"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: '#5a8fd4' }} />
              <h3 className="font-medium text-sm">Sistema de Cobros y Finanzas</h3>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-center text-sm mt-8 pt-6 border-t"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div className="text-center">
            <p className="text-xs" style={{ color: '#a3c4e8' }}>
              {esUsag ? "© Universidad San Andrés de Guanajuato" : `© ${nombre}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
