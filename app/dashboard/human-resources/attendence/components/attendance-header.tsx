import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { 
  UserCheck, 
  QrCode, 
  Download, 
  Settings, 
  UserPlus, 
  MoreVertical,
  Plus,
  FileText,
  PhoneForwarded
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { SettingsDialog } from "./settingsDialog";
import { toast } from "sonner";

interface AttendanceHeaderProps {
  onManualCheckIn: () => void;
  onBarcodeCheckIn: () => void;
  onBulkPastAttendance: () => void;
  onEmergencyCallOut: () => void;
  canCreateAttendance: boolean;
  hasFullAccess: boolean;
}

export function AttendanceHeader({
  onManualCheckIn,
  onBarcodeCheckIn,
  onBulkPastAttendance,
  onEmergencyCallOut,
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
    console.log("Rules saved:", rules.length);
    toast.success(`${rules.length} bypass rules active`);
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2 px-4 shadow-sm py-2 rounded-xl bg-background/50 backdrop-blur-sm border">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Attendance Tracking
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Management & Operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shadow-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-2 shadow-xl border-primary/10">
              <DropdownMenuLabel className="flex items-center gap-2 mb-1 px-2 py-1.5 text-xs text-muted-foreground">
                <Plus className="h-3 w-3" />
                Quick Actions
              </DropdownMenuLabel>
              
              {(hasFullAccess || canCreateAttendance) && (
                <>
                  <DropdownMenuItem onClick={onManualCheckIn} className="gap-3 py-2.5 cursor-pointer rounded-md">
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                    <span>Manual Check-In</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={onBulkPastAttendance} className="gap-3 py-2.5 cursor-pointer rounded-md">
                    <UserPlus className="h-4 w-4 text-blue-500" />
                    <span>Bulk Past Attendance</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={onBarcodeCheckIn} className="gap-3 py-2.5 cursor-pointer rounded-md">
                    <QrCode className="h-4 w-4 text-purple-500" />
                    <span>Barcode Check-In</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={onEmergencyCallOut} className="gap-3 py-2.5 cursor-pointer rounded-md">
                    <PhoneForwarded className="h-4 w-4 text-red-500" />
                    <span>Emergency Call Out</span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator className="my-1" />
              
              <DropdownMenuLabel className="flex items-center gap-2 mb-1 px-2 py-1.5 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                Management & Tools
              </DropdownMenuLabel>

              {hasFullAccess && (
                <DropdownMenuItem onClick={handleOpenSettings} className="gap-3 py-2.5 cursor-pointer rounded-md">
                  <Settings className="h-4 w-4 text-orange-500" />
                  <span>Attendance Settings</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem className="gap-3 py-2.5 cursor-pointer rounded-md">
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export Monthly Report</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SettingsDialog
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSaveRules={handleSaveRules}
      />
    </>
  );
}
