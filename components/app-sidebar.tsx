"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { SidebarItermsSkeleton } from "./SidebarItermsSkeleton";
import { useNotifications } from "@/contexts/notification-context";
import { SidebarItems } from "./sidebarItems";

export default function AppSidebar() {
  const { userId } = useAuth();
  const [role, setRole] = useState<string>("VIEWER");
  const [loading, setLoading] = useState(true);

  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (!userId) return;

    const fetchUserRole = async () => {
      try {
        const response = await fetch(`/api/users/role?userId=${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user role");
        }
        const data = await response.json();

        setRole(data.role);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("VIEWER");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [userId]);

  if (!userId && loading) {
    return <SidebarItermsSkeleton />;
  }

  if (!role) {
    return <div>NOT AUTHENTICATED</div>;
  }

  return (
    <div>
      <SidebarItems role={role} unreadCount={unreadCount} />
    </div>
  );
}
