"use client";
import { ArrowLeft, Camera, Edit, Mail, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
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
import TraineeForm from "../../_components/trainee-Form";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import { TraineeWithDetails } from "../../type";
import { SendEmailDialog } from "@/components/SendEmailDialog";

interface HeaderProps {
  trainee: TraineeWithDetails;
  hasFullAccess: boolean;
  canEditTrainees: boolean;
  fetchTrainee: () => void;
}

export default function Header({
  trainee,
  canEditTrainees,
  hasFullAccess,
  fetchTrainee,
}: HeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    trainee.avatar ?? null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReliable, setIsReliable] = useState(trainee.reliable);
  const [isUpdatingReliable, setIsUpdatingReliable] = useState(false);

  const router = useRouter();

  const name = `${trainee.firstName} ${trainee.lastName}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "ON_LEAVE":
        return "bg-yellow-100 text-yellow-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReliableColor = (reliable: boolean) => {
    return reliable
      ? "bg-blue-100 text-blue-800"
      : "bg-orange-100 text-orange-800";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleReliableToggle = async (checked: boolean) => {
    if (!canEditTrainees && !hasFullAccess) {
      toast.error("You don't have permission to update reliability status");
      return;
    }

    setIsUpdatingReliable(true);
    try {
      await axios.put(`/api/trainees/${trainee.id}/reliable`, {
        reliable: checked,
      });

      setIsReliable(checked);
      fetchTrainee(); // Refresh the data
      toast.success(
        `Trainee marked as ${checked ? "reliable" : "not reliable"}`,
      );
    } catch (error) {
      console.error("Error updating reliability status:", error);
      toast.error("Failed to update reliability status");
      // Revert the switch on error
      setIsReliable(!checked);
    } finally {
      setIsUpdatingReliable(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size={"icon"} onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 " />
          </Button>
          <div className="relative group">
            <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
              {trainee.avatar ? (
                <AvatarImage src={trainee.avatar} />
              ) : (
                <AvatarFallback className="text-2xl">
                  {getInitials(name)}
                </AvatarFallback>
              )}
            </Avatar>
            {(canEditTrainees || hasFullAccess) && (
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
              {trainee.position} • {trainee.department?.name || "No Department"}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getStatusColor(trainee.status)}>
                {trainee.status.replace("_", " ")}
              </Badge>
              <Badge className={getReliableColor(trainee.reliable)}>
                {trainee.reliable ? "Reliable" : "Not Reliable"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Reliability Toggle Switch */}
        {(canEditTrainees || hasFullAccess) && (
          <div className="flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-lg">
            <Label htmlFor="reliable-switch" className="text-sm font-medium">
              Mark as Reliable
            </Label>
            <Switch
              id="reliable-switch"
              checked={isReliable}
              onCheckedChange={handleReliableToggle}
              disabled={isUpdatingReliable}
              className="data-[state=checked]:bg-blue-600"
            />
            {isUpdatingReliable && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            )}
          </div>
        )}

        {/* Edit Button */}
        {(canEditTrainees || hasFullAccess) && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-2xl">Edit Trainee</DialogTitle>
                <DialogDescription className="text-base">
                  Update trainee information below. All changes will be saved
                  immediately.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <TraineeForm
                  type="update"
                  data={trainee as any}
                  onCancel={() => setIsEditDialogOpen(false)}
                  onSubmitSuccess={() => {
                    setIsEditDialogOpen(false);
                    fetchTrainee();
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Send Email Button */}
        <SendEmailDialog
          recipientName={name}
          recipientEmail={trainee.email || ""}
        />
      </div>

      <AvatarUploadDialog
        type="trainee"
        user={{
          id: trainee.id,
          name: name,
          avatar: trainee.avatar || null,
        }}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAvatarUpdate={setAvatarUrl}
        onSubmitSuccess={() => {
          setIsDialogOpen(false);
          fetchTrainee();
        }}
      />
    </div>
  );
}
