"use client";

import { useMemo } from "react";

import Link from "next/link";

import { GraduationCap } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useBranding } from "@/hooks/use-branding";
import { shadeColor } from "@/lib/color-utils";
import { usePermissions } from "@/hooks/use-permissions";
import { sidebarItems, filterSidebarByModules, type NavGroup } from "@/navigation/sidebar/sidebar-items";
import type { TenantBranding } from "@/services/branding-service";

import { NavMain } from "./nav-main";

function filtrarPorFeatures(groups: NavGroup[], branding: TenantBranding | null): NavGroup[] {
  if (!branding) return groups;

  const bloqueadas = new Set<string>();
  if (branding.incluyeReportes === false) {
    ["/dashboard/reportes-academicos", "/dashboard/reports", "/dashboard/plantillas-reporte", "/dashboard/reportes-builder"].forEach((u) =>
      bloqueadas.add(u),
    );
  }

  if (bloqueadas.size === 0) return groups;

  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => !item.url || !bloqueadas.has(item.url))
        .map((item) =>
          item.subItems
            ? { ...item, subItems: item.subItems.filter((sub) => !bloqueadas.has(sub.url)) }
            : item,
        ),
    }))
    .filter((group) => group.items.length > 0);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { accessibleModules, isLoading, isAdmin, isSuperAdmin, primaryRole } = usePermissions();
  const branding = useBranding();

  const filteredItems = useMemo(() => {
    let base;
    if (isAdmin || isSuperAdmin) {
      // "Agremiados" (requiredModule: "SuperAdmin") solo lo ve el rol superadmin, no cualquier admin.
      base = sidebarItems.filter(
        (group) => !group.requiredRole && (group.requiredModule !== "SuperAdmin" || isSuperAdmin),
      );
    } else if (isLoading) {
      base = filterSidebarByModules(["Dashboard"], primaryRole ?? undefined);
    } else {
      base = filterSidebarByModules(accessibleModules, primaryRole ?? undefined);
    }
    return filtrarPorFeatures(base, branding);
  }, [accessibleModules, isLoading, isAdmin, isSuperAdmin, primaryRole, branding]);

  const logoUrl = branding?.logoUrl;
  const nombreCorto = branding?.nombreCorto ?? "SACI";
  const color = branding?.colorPrimario || "#14356F";

  return (
    <Sidebar
      {...props}
      className="border-r-0"
      style={{
        background: `linear-gradient(to bottom, ${color}, ${shadeColor(color, -25)})`,
      }}
    >
      <SidebarHeader className="border-b border-white/10 p-4">
        <Link
          href="/dashboard/default"
          className="block w-full rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
          style={{ background: `linear-gradient(135deg, ${color}, ${color})` }}
        >
          <div className="p-4 flex items-center justify-center min-h-[88px]">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={nombreCorto}
                className="object-contain w-full h-auto max-h-20"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 py-2 text-white">
                <GraduationCap className="h-9 w-9" />
                <span className="text-sm font-semibold tracking-wide">{nombreCorto}</span>
              </div>
            )}
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <NavMain items={filteredItems} />
      </SidebarContent>
    </Sidebar>
  );
}
