import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualCheckInData } from "../types";
import { Loader2, MapPin } from "lucide-react";
import { LocationPicker } from "./location-picker";

interface ManualCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkInType: "in" | "out";
  setCheckInType: (type: "in" | "out") => void;
  onCheckIn: (data: ManualCheckInData) => void;
  isLoading: boolean;
}

export function ManualCheckInDialog({
  open,
  onOpenChange,
  checkInType,
  setCheckInType,
  onCheckIn,
  isLoading,
}: ManualCheckInDialogProps) {
  const [formData, setFormData] = useState<ManualCheckInData>({
    employeeId: "",
    freelancerId: "",
    location: "",
    notes: "",
    lat: undefined,
    lng: undefined,
  });
  const [personType, setPersonType] = useState<
    "employee" | "freelancer" | "trainer"
  >("employee");
  const [showMap, setShowMap] = useState(false);

  const handleSubmit = () => {
    const id =
      personType === "employee"
        ? formData.employeeId
        : personType === "freelancer"
          ? formData.freelancerId
          : formData.trainerId;

    if (!id || !formData.location) {
      return;
    }
    onCheckIn(formData);
    setFormData({
      employeeId: "",
      freelancerId: "",
      trainerId: "",
      location: "",
      notes: "",
      lat: undefined,
      lng: undefined,
    });
  };

  const handleLocationSelect = (location: {
    address: string;
    lat: number;
    lng: number;
  }) => {
    setFormData((prev) => ({
      ...prev,
      location: location.address,
      lat: location.lat,
      lng: location.lng,
    }));
    setShowMap(false);
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      freelancerId: "",
      trainerId: "",
      location: "",
      notes: "",
      lat: undefined,
      lng: undefined,
    });
    setPersonType("employee");
    setShowMap(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manual Check-In/Out</DialogTitle>
          <DialogDescription>
            Record attendance manually for employees, freelancers or trainers
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={personType}
          onValueChange={(value) => {
            if (
              value === "employee" ||
              value === "freelancer" ||
              value === "trainer"
            ) {
              setPersonType(value);
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employee">Employee</TabsTrigger>
            <TabsTrigger value="freelancer">Freelancer</TabsTrigger>
            <TabsTrigger value="trainer">Trainer</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Check-In Type</Label>
            <Select
              value={checkInType}
              onValueChange={(value: "in" | "out") => setCheckInType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Check In</SelectItem>
                <SelectItem value="out">Check Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id">
              {personType === "employee"
                ? "Employee ID"
                : personType === "freelancer"
                  ? "Freelancer ID"
                  : "Trainer ID"}{" "}
              *
            </Label>
            <Input
              id="id"
              placeholder={
                personType === "employee"
                  ? "EMP001"
                  : personType === "freelancer"
                    ? "FRL001"
                    : "TRN001"
              }
              value={
                personType === "employee"
                  ? formData.employeeId
                  : personType === "freelancer"
                    ? formData.freelancerId
                    : formData.trainerId
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [personType === "employee"
                    ? "employeeId"
                    : personType === "freelancer"
                      ? "freelancerId"
                      : "trainerId"]: e.target.value.toUpperCase(),
                })
              }
            />
          </div>

          {!showMap ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="location">Location *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMap(true)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Select on Map
                </Button>
              </div>
              <Input
                id="location"
                placeholder="Main Office, Client Site, etc."
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>
          ) : (
            <LocationPicker onLocationSelect={handleLocationSelect} />
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !formData.location ||
              !(
                formData.employeeId ||
                formData.freelancerId ||
                formData.trainerId
              )
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : checkInType === "in" ? (
              "Check In"
            ) : (
              "Check Out"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
