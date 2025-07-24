"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  User,
  Bell,
  Shield,
  Database,
  Download,
  Camera,
} from "lucide-react";
import { motion } from "framer-motion";
import GeneraleSettingsForm from "./_components/Generale-Settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { GeneralSetting } from "@prisma/client";
import { AvatarUploadDialog } from "@/components/AvatarUploadDialog";

export default function SettingsPage() {
  const [generalSettings, setGeneralSettings] = useState<GeneralSetting | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  console.log(generalSettings);

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

              <Button
                variant="secondary"
                size="icon"
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full shadow-sm opacity-90 hover:opacity-100 md:h-7 md:w-7"
                onClick={() => setIsDialogOpen(true)}
              >
                <Camera className="h-3 w-3 md:h-4 md:w-4" />
                <span className="sr-only">Change company logo</span>
              </Button>
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="company">Company</TabsTrigger>
            {/*  <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger> */}
          </TabsList>

          <TabsContent value="company" className="space-y-4">
            <GeneraleSettingsForm />
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Settings</CardTitle>
                <CardDescription>
                  Configure your financial preferences and accounting settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscal-year">Fiscal Year Start</Label>
                    <Select defaultValue="january">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">January</SelectItem>
                        <SelectItem value="april">April</SelectItem>
                        <SelectItem value="july">July</SelectItem>
                        <SelectItem value="october">October</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                  <Input id="tax-rate" type="number" defaultValue="8.5" />
                </div>
                <Button>Save Financial Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts and permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Admin Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Full system access
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Financial Reports</h4>
                    <p className="text-sm text-muted-foreground">
                      Access to financial reports
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Worker Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage worker accounts
                    </p>
                  </div>
                  <Switch />
                </div>
                <Button>Update Permissions</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Payment Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Alerts for payment processing
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Monthly Reports</h4>
                    <p className="text-sm text-muted-foreground">
                      Automated monthly summaries
                    </p>
                  </div>
                  <Switch />
                </div>
                <Button>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and access controls.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Add extra security to your account
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input id="session-timeout" type="number" defaultValue="30" />
                </div>
                <Button>Update Security</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Backup, export, and manage your financial data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Automatic Backups</h4>
                    <p className="text-sm text-muted-foreground">
                      Daily automated backups
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Export Data</h4>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
                <Button>Create Backup</Button>
              </CardContent>
            </Card>
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
