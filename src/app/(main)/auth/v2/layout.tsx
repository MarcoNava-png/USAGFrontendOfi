import { ReactNode } from "react";

import { LoginBrandingPanel } from "./_components/login-branding-panel";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <LoginBrandingPanel />

        <div className="relative order-1 flex h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
          {children}
        </div>
      </div>
    </main>
  );
}
