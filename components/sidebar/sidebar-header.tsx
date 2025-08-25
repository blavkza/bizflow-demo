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
import { UserPermission, UserRole } from "@prisma/client";
import { Settings, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SidebarHeaderProps {
  role: string;
  permissions: UserPermission[];
}

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

export default function SidebarHeaderComponent({
  role,
  permissions,
}: SidebarHeaderProps) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const [showSettingsTooltip, setSettingsShowTooltip] = useState(false);

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];

  const hasFullAccess = role ? hasRole(role, fullAccessRoles) : false;

  const canViewSettings = permissions?.includes(UserPermission.SETTINGS_VIEW);

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

    window.addEventListener("keydown", handleKeyDown);

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
                </div>
              </div>
              <div className="flex items-center gap-1">
                {(hasFullAccess || canViewSettings) && (
                  <TooltipProvider>
                    <Tooltip open={showSettingsTooltip}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push("/dashboard/settings")}
                          onMouseEnter={() => setSettingsShowTooltip(true)}
                          onMouseLeave={() => setSettingsShowTooltip(false)}
                          className="relative"
                        >
                          <Settings className="h-6 w-6" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <span className="text-xs font-thin">Settings</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

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
}
