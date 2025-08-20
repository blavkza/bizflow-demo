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
import Image from "next/image";
import { Button } from "./ui/button";
import { IoReloadOutline } from "react-icons/io5";

export function SidebarItermsSkeleton() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-100">
                    <Link href="/">
                      <Image
                        src="/logo.png"
                        alt="Logo"
                        width={80}
                        height={80}
                        className="object-contain"
                      />
                    </Link>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight select-none">
                    <span className="truncate font-semibold">FinanceFlow</span>
                    <span className="truncate text-xs">Management System</span>
                  </div>
                </div>
                <Button variant={"ghost"} size={"icon"}>
                  <IoReloadOutline size={24} />
                </Button>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {[...Array(2)].map((_, i) => (
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
