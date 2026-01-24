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
import { useCompanyInfo } from "@/hooks/use-company-info";
import { cn } from "@/lib/utils";

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
  const [isReloading, setIsReloading] = useState(false);
  const [showSettingsTooltip, setSettingsShowTooltip] = useState(false);
  const companyInfo = useCompanyInfo();

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];

  const hasFullAccess = role ? hasRole(role, fullAccessRoles) : false;

  const canViewSettings = permissions?.includes(UserPermission.SETTINGS_VIEW);

  const handleReload = () => {
    setIsReloading(true);
    window.location.reload();
    setIsReloading(false);
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
          <div className=" w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex aspect-square size-8 p-1 items-center justify-center rounded-full">
                  {companyInfo.companyInfo?.logo ? (
                    <Link href="/">
                      <Image
                        src={companyInfo.companyInfo?.logo}
                        alt="Logo"
                        width={80}
                        height={80}
                        className="object-contain rounded-full"
                      />
                    </Link>
                  ) : (
                    <Link href="/">
                      <Image
                        src="/logo.png"
                        alt="Logo"
                        width={80}
                        height={80}
                        className="object-contain"
                      />
                    </Link>
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight select-none">
                  {companyInfo.companyInfo?.logo ? (
                    <>
                      <span className=" line-clamp-none text-xs font-semibold">
                        {companyInfo.companyInfo?.companyName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        BizFlow
                      </span>
                    </>
                  ) : (
                    <span className="truncate font-semibold">BizFlow</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 bg-zinc-200  dark:bg-zinc-800 rounded-3xl p-0  shadow-sm">
                <TooltipProvider>
                  <Tooltip open={showTooltip}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleReload}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="relative rounded-full hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80"
                      >
                        <IoReloadOutline
                          className={cn(
                            `h-4 w-4`,
                            isReloading && `animate-spin`
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <span className="text-xs font-thin">Ctrl + R</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
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
