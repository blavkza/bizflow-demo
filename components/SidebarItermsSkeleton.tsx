"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { DollarSign } from "lucide-react";

export function SidebarItermsSkeleton() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <DollarSign className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">FinanceFlow</span>
                  <span className="truncate text-xs">Management System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {[...Array(3)].map((_, i) => (
          <SidebarGroup key={i}>
            <SidebarGroupLabel>
              <Skeleton className="h-4 w-1/2" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[...Array(i === 1 ? 7 : 4)].map((_, j) => (
                  <SidebarMenuItem key={j}>
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-3/4" />
                      {j === 1 && (
                        <Skeleton className="ml-auto h-5 w-5 rounded-full" />
                      )}
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="py-0 my-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-3 py-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-3 py-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
