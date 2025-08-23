"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IoReloadOutline } from "react-icons/io5";
import { GlobalSearch } from "@/components/GlobalSearch";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarHeaderProps {
  // Add any props if needed
}

export const SidebarHeaderComponent: React.FC<SidebarHeaderProps> = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleReload = () => {
    window.location.reload();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+R or Cmd+R (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault();
        handleReload();
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
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
                  <span className="truncate font-semibold">BizFlow</span>
                  <span className="truncate text-xs">Management System</span>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip open={showTooltip}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleReload}
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className="relative"
                    >
                      <IoReloadOutline className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <span className="text-xs font-thin">Ctrl + R</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <div className="py-1">
            <GlobalSearch />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};
