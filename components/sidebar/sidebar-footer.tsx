"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";
import { Settings } from "lucide-react";
import Profile from "@/components/profile";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { isActive } from "./utils/sidebar-helpers";

interface SidebarFooterProps {
  pathname: string;
}

export const SidebarFooterComponent: React.FC<SidebarFooterProps> = ({
  pathname,
}) => {
  return (
    <SidebarFooter className="py-0 my-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Profile />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};
