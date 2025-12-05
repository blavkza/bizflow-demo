import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UserCheck, QrCode, Download, Settings } from "lucide-react";
import { SettingsDialog } from "./settingsDialog";
import { toast } from "sonner";

interface AttendanceHeaderProps {
  onManualCheckIn: () => void;
  onBarcodeCheckIn: () => void;
  canCreateAttendance: boolean;
  hasFullAccess: boolean;
}

export function AttendanceHeader({
  onManualCheckIn,
  onBarcodeCheckIn,
  canCreateAttendance,
  hasFullAccess,
}: AttendanceHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleOpenSettings = () => {
    if (!hasFullAccess) {
      toast.error("You don't have permission to access settings");
      return;
    }
    setSettingsOpen(true);
  };

  const handleSaveRules = (rules: any[]) => {
    // This callback can be used to refresh the parent component
    // or update local state if needed
    console.log("Rules saved:", rules.length);
    toast.success(`${rules.length} bypass rules active`);
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">
              Attendance Tracking
            </h1>
            <p className="text-muted-foreground">
              View and Manage Attendance information for Employees & Freelancers
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {(hasFullAccess || canCreateAttendance) && (
            <>
              <Button variant="outline" onClick={onManualCheckIn}>
                <UserCheck className="mr-2 h-4 w-4" />
                Manual Check-In
              </Button>
              <Button variant="outline" onClick={onBarcodeCheckIn}>
                <QrCode className="mr-2 h-4 w-4" />
                Barcode Check-In
              </Button>
            </>
          )}

          {/* Settings Button - Only show for users with full access */}
          {hasFullAccess && (
            <Button
              variant="outline"
              onClick={handleOpenSettings}
              title="Configure attendance settings"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          )}

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSaveRules={handleSaveRules}
      />
    </>
  );
}
