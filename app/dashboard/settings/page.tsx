"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";
import GeneraleSettingsForm from "./_components/Generale-Settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { GeneralSetting, UserPermission, UserRole } from "@prisma/client";
import { AvatarUploadDialog } from "@/components/AvatarUploadDialog";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import HRSettingsForm from "./_components/hr-settings-form";
import POSSettingsForm from "./_components/pos-settings-form";

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

export default function SettingsPage() {
  const [generalSettings, setGeneralSettings] = useState<GeneralSetting | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const router = useRouter();
  const { userId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];

  const hasFullAccess = data?.role
    ? hasRole(data?.role, fullAccessRoles)
    : false;

  const canViewSettings = data?.permissions?.includes(
    UserPermission.SETTINGS_VIEW
  );

  const canManageSettings = data?.permissions?.includes(
    UserPermission.SETTINGS_MANAGE
  );

  useEffect(() => {
    if (!isLoading && canViewSettings === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewSettings, hasFullAccess]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/general");
        const { data } = await response.json();
        setGeneralSettings(data);
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };

    fetchSettings();
  }, []);

  const handleLogoUpdate = (url: string) => {
    if (generalSettings) {
      setGeneralSettings({
        ...generalSettings,
        logo: url,
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-36 mb-4 w-full shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
          </div>

          <div className="flex flex-1 items-center gap-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative group"
            >
              <Avatar className="h-16 w-16 border-2 border-background shadow-md md:h-24 md:w-24">
                {generalSettings?.logo ? (
                  <AvatarImage src={generalSettings.logo} />
                ) : (
                  <AvatarFallback className="text-sm md:text-base">
                    {getInitials(generalSettings?.companyName || "NA")}
                  </AvatarFallback>
                )}
              </Avatar>

              {(canManageSettings || hasFullAccess) && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full shadow-sm opacity-90 hover:opacity-100 md:h-7 md:w-7"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Camera className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="sr-only">Change company logo</span>
                </Button>
              )}
            </motion.div>

            <div>
              <h1 className="text-base font-semibold md:text-lg">Settings</h1>
              {generalSettings?.companyName && (
                <p className="text-xs text-muted-foreground md:text-sm">
                  {generalSettings.companyName}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-90 grid-cols-3">
            {" "}
            {/* Updated width and columns */}
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
            <TabsTrigger value="pos">POS</TabsTrigger> {/* Added POS tab */}
          </TabsList>

          <TabsContent value="company" className="space-y-4">
            <GeneraleSettingsForm
              canManageSettings={canManageSettings}
              hasFullAccess={hasFullAccess}
            />
          </TabsContent>
          <TabsContent value="hr" className="space-y-4">
            <HRSettingsForm
              canManageSettings={canManageSettings}
              hasFullAccess={hasFullAccess}
            />
          </TabsContent>
          <TabsContent value="pos" className="space-y-4">
            {" "}
            {/* Added POS tab content */}
            <POSSettingsForm
              canManageSettings={canManageSettings}
              hasFullAccess={hasFullAccess}
            />
          </TabsContent>
        </Tabs>
      </div>
      <AvatarUploadDialog
        type="settings"
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAvatarUpdate={handleLogoUpdate}
        user={{
          id: generalSettings?.id || "",
          name: generalSettings?.companyName || "Company",
          avatar: generalSettings?.logo || null,
        }}
      />
    </SidebarInset>
  );
}
