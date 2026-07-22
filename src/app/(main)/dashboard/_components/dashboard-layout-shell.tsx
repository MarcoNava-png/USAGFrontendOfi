"use client";

import { ReactNode } from "react";

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { NotificationBell } from "@/components/notification-bell";
import { SessionExpirationModal } from "@/components/session-expiration-modal";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  type SidebarVariant,
  type SidebarCollapsible,
  type ContentLayout,
  type NavbarStyle,
} from "@/types/preferences/layout";

import { AccountSwitcher } from "./sidebar/account-switcher";

interface DashboardLayoutShellProps {
  children: ReactNode;
  defaultOpen: boolean;
  sidebarVariant: SidebarVariant;
  sidebarCollapsible: SidebarCollapsible;
  contentLayout: ContentLayout;
  navbarStyle: NavbarStyle;
}

export function DashboardLayoutShell({
  children,
  defaultOpen,
  sidebarVariant,
  sidebarCollapsible,
  contentLayout,
  navbarStyle,
}: DashboardLayoutShellProps) {
  const pathname = usePathname();

  if (pathname?.startsWith("/dashboard/super-admin")) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar variant={sidebarVariant} collapsible={sidebarCollapsible} />
      <SidebarInset data-content-layout={contentLayout} className="min-w-0">
        <header
          data-navbar-style={navbarStyle}
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
            "data-[navbar-style=sticky]:bg-background/50 data-[navbar-style=sticky]:sticky data-[navbar-style=sticky]:top-0 data-[navbar-style=sticky]:z-50 data-[navbar-style=sticky]:overflow-hidden data-[navbar-style=sticky]:rounded-t-[inherit] data-[navbar-style=sticky]:backdrop-blur-md",
          )}
        >
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <SidebarTrigger className="-ml-1" />
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <AccountSwitcher />
            </div>
          </div>
        </header>
        <ErrorBoundary>
          <div className="h-full w-full p-4 md:p-6">{children}</div>
        </ErrorBoundary>
      </SidebarInset>
      <SessionExpirationModal />
    </SidebarProvider>
  );
}
