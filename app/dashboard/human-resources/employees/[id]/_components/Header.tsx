"use client";
import { ArrowLeft, Camera, Edit, Mail, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { AvatarUploadDialog } from "@/components/AvatarUploadDialog";
import EmployeeForm from "../../_components/employee-Form";
import { useRouter } from "next/navigation";
import { Employee, EmployeeStatus } from "@prisma/client";
import { EmployeeWithDetails } from "@/types/employee";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import axios from "axios";
import { toast } from "sonner";

interface HeaderProps {
  employee: EmployeeWithDetails;
  hasFullAccess: boolean;
  canEditEmployees: boolean;
  fetchEmployee: () => void;
}

export default function Header({
  employee,
  canEditEmployees,
  hasFullAccess,
  fetchEmployee,
}: HeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    employee.avatar ?? null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingGPS, setIsUpdatingGPS] = useState(false);

  const router = useRouter();

  const name = employee.firstName + " " + employee.lastName;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const handleGPSChange = async (checked: boolean) => {
    if (!canEditEmployees && !hasFullAccess) return;

    setIsUpdatingGPS(true);
    try {
      await axios.patch(`/api/employees/${employee.id}/gps-ckeckin`, {
        canCheckByGPS: checked,
      });

      toast.success(
        checked
          ? "GPS check-in enabled for employee"
          : "GPS check-in disabled for employee"
      );

      // Refresh employee data
      fetchEmployee();
    } catch (error) {
      console.error("Error updating GPS check-in setting:", error);
      toast.error("Failed to update GPS check-in setting");
    } finally {
      setIsUpdatingGPS(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size={"icon"} onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="relative group">
            <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
              {employee.avatar ? (
                <AvatarImage src={employee.avatar} />
              ) : (
                <AvatarFallback className="text-2xl">
                  {getInitials(name)}
                </AvatarFallback>
              )}
            </Avatar>
            {(canEditEmployees || hasFullAccess) && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md opacity-90 hover:opacity-100"
                onClick={() => setIsDialogOpen(true)}
              >
                <Camera className="h-4 w-4" />
                <span className="sr-only">Change profile picture</span>
              </Button>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{name}</h1>
            <p className="text-muted-foreground">
              {employee.position} • {employee.department?.name}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getStatusColor(employee.status)}>
                {employee.status}
              </Badge>
              {(canEditEmployees || hasFullAccess) && (
                <div className="flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-lg">
                  <Label
                    htmlFor="canCheckByGPS"
                    className="text-sm font-medium"
                  >
                    Allow GPS Check-in
                  </Label>
                  <Switch
                    id="canCheckByGPS"
                    checked={employee.canCheckByGPS}
                    onCheckedChange={handleGPSChange}
                    disabled={isUpdatingGPS}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  {isUpdatingGPS && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {(canEditEmployees || hasFullAccess) && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-2xl">Edit Employee</DialogTitle>
                <DialogDescription className="text-base">
                  Update employee information below. All changes will be saved
                  immediately.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <EmployeeForm
                  type="update"
                  data={employee}
                  onCancel={() => setIsEditDialogOpen(false)}
                  onSubmitSuccess={() => {
                    setIsEditDialogOpen(false);
                    fetchEmployee();
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Button>
          <Mail className="mr-2 h-4 w-4" />
          Send Invoice
        </Button>
      </div>
      <AvatarUploadDialog
        type="employee"
        user={{
          id: employee.id,
          name: name,
          avatar: employee.avatar || null,
        }}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAvatarUpdate={setAvatarUrl}
        onSubmitSuccess={() => {
          setIsDialogOpen(false);
          fetchEmployee();
        }}
      />
    </div>
  );
}
