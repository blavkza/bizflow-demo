import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import ClientWrapper from "@/components/ClientWrapper";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Financial Management System (MPJ)",
  description: "Comprehensive financial tracking and management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      {" "}
      <html lang="en">
        <body className={inter.className}>
          <SidebarProvider defaultOpen={true}>
            <ClientWrapper>
              <Providers>{children}</Providers>
            </ClientWrapper>
            <Toaster />
          </SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
