import { ReactNode } from "react";

import { cookies } from "next/headers";

import { getPreference } from "@/server/server-actions";
import {
  SIDEBAR_VARIANT_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  CONTENT_LAYOUT_VALUES,
  NAVBAR_STYLE_VALUES,
  type SidebarVariant,
  type SidebarCollapsible,
  type ContentLayout,
  type NavbarStyle,
} from "@/types/preferences/layout";

import { DashboardLayoutShell } from "./_components/dashboard-layout-shell";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const [sidebarVariant, sidebarCollapsible, contentLayout, navbarStyle] = await Promise.all([
    getPreference<SidebarVariant>("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference<SidebarCollapsible>("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    getPreference<ContentLayout>("content_layout", CONTENT_LAYOUT_VALUES, "centered"),
    getPreference<NavbarStyle>("navbar_style", NAVBAR_STYLE_VALUES, "scroll"),
  ]);

  return (
    <DashboardLayoutShell
      defaultOpen={defaultOpen}
      sidebarVariant={sidebarVariant}
      sidebarCollapsible={sidebarCollapsible}
      contentLayout={contentLayout}
      navbarStyle={navbarStyle}
    >
      {children}
    </DashboardLayoutShell>
  );
}
