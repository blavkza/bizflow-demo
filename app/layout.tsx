import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/components/ui/sidebar";
import ClientWrapper from "@/components/ClientWrapper";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NotificationProvider } from "@/contexts/notification-context";
import FinancialCalculator from "@/components/FinancialCalculator";
import { OvertimeChecker } from "@/components/attendance/overtime-checker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BizFlow Management System",
  description:
    "Comprehensive financial tracking, projects tracking and management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClerkProvider
          appearance={{
            baseTheme: undefined,
          }}
        >
          <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider defaultOpen={true}>
              <ClientWrapper>
                <Providers>
                  <NotificationProvider>
                    {/*  <OvertimeChecker /> */}
                    {children}
                    <FinancialCalculator />
                  </NotificationProvider>
                </Providers>
              </ClientWrapper>
              <Toaster />
            </SidebarProvider>
          </NextThemesProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
