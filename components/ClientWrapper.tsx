"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "./app-sidebar";
import { NotificationProvider } from "@/contexts/notification-context";
import { Providers } from "@/app/providers";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isSignIn = pathname === "/sign-in";

  return (
    <div className="flex min-h-screen w-full">
      <NotificationProvider>
        {!isHome && !isSignIn && (
          <Providers>
            <AppSidebar />
          </Providers>
        )}
        <main className="flex-1 overflow-auto">{children}</main>
      </NotificationProvider>
    </div>
  );
}
