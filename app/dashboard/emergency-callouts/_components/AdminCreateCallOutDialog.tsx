"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Loader2,
  AlertCircle,
  Siren,
  Users,
  MapPin,
  Car,
  FileText,
  User as UserIcon,
  Briefcase,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { CallOutType, VehicleType } from "@prisma/client";

interface AdminCreateCallOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdminCreateCallOutDialog({
  open,
  onOpenChange,
  onSuccess,
}: AdminCreateCallOutDialogProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leaderIds: [] as string[],
    type: "MAINTENANCE" as CallOutType,
    address: "",
    vehicle: "COMPANY_VEHICLE" as VehicleType,
    description: "",
    clientId: "",
    startTime: "",
    allowAssistants: true, // Whether the selected leader can add their own assistants
  });

  useEffect(() => {
    if (open) {
      fetchData();
      if (!formData.startTime) {
        setFormData((prev) => ({
          ...prev,
          startTime: new Date().toISOString().slice(0, 16),
        }));
      }
    }
  }, [open]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [empRes, freeRes, trainRes, clientRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/freelancers"),
        fetch("/api/trainees"),
        fetch("/api/clients"),
      ]);

      const [empData, freeData, trainData, clientData] = await Promise.all([
        empRes.ok ? empRes.json() : { employees: [] },
        freeRes.ok ? freeRes.json() : { freelancers: [] },
        trainRes.ok ? trainRes.json() : { trainees: [] },
        clientRes.ok ? clientRes.json() : [],
      ]);

      setEmployees(Array.isArray(empData.employees) ? empData.employees : []);
      setFreelancers(
        Array.isArray(freeData.freelancers) ? freeData.freelancers : [],
      );
      setTrainees(Array.isArray(trainData.trainees) ? trainData.trainees : []);
      setClients(Array.isArray(clientData) ? clientData : []);
    } catch (error) {
      toast.error("Failed to load necessary data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (
      formData.leaderIds.length === 0 ||
      !formData.address ||
      !formData.description ||
      !formData.startTime
    ) {
      toast.error(
        "Please fill in all required fields (Leaders, Address, Description, Start Time)",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Apply timezone offset to the start time
      const timezoneOffset = -new Date().getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset >= 0 ? "+" : "-";
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;
      const startTimeWithTZ = `${formData.startTime}:00${offsetString}`;

      const payload = {
        leaderIds: formData.leaderIds,
        type: formData.type,
        address: formData.address,
        vehicle: formData.vehicle,
        description: formData.description,
        clientId: formData.clientId || null,
        startTime: startTimeWithTZ,
        allowAssistants: formData.allowAssistants,
      };

      const res = await fetch("/api/emergency-callouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create call-out");
      }

      toast.success(
        formData.leaderIds.length > 1
          ? `Emergency call-out sent to ${formData.leaderIds.length} potential leaders. First to accept gets priority.`
          : "Emergency call-out dispatched successfully",
      );

      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setFormData({
        leaderIds: [],
        type: "MAINTENANCE",
        address: "",
        vehicle: "COMPANY_VEHICLE",
        description: "",
        clientId: "",
        startTime: new Date().toISOString().slice(0, 16),
        allowAssistants: true,
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // All user types can be dispatched as leaders
  const leaderOptions = [
    ...(employees || []).map((e) => ({
      label: `[${e.employeeNumber}] ${e.name || `${e.firstName} ${e.lastName}`}`,
      value: e.userId,
    })),
    ...(freelancers || []).map((f) => ({
      label: `[${f.freeLancerNumber || f.employeeNumber}] ${f.firstName} ${f.lastName}`,
      value: f.userId,
    })),
    ...(trainees || []).map((t) => ({
      label: `[${t.traineeNumber || t.employeeNumber}] ${t.firstName} ${t.lastName}`,
      value: t.userId,
    })),
  ].filter((opt) => opt.value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] lg:min-w-[70vw] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-clip-text">
            <Siren className="h-7 w-7" />
            Create Emergency Call-Out
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Dispatch to one or more potential leaders. All will be notified and
            can accept. You will then choose who takes the mission.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column: Personnel & Client */}
            <div className="space-y-5">
              {/* Potential Leaders */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold">
                  <UserIcon className="h-4 w-4 text-indigo-500" />
                  Potential Leaders *
                </Label>
                <DialogDescription className="text-[10px] -mt-1 mb-1">
                  All selected workers will be notified. You'll choose who takes
                  the job after they accept.
                </DialogDescription>
                <MultiSelect
                  options={leaderOptions}
                  selected={formData.leaderIds}
                  onChange={(vals) =>
                    setFormData({ ...formData, leaderIds: vals })
                  }
                  placeholder="Choose potential leaders..."
                  loading={isLoading}
                />
              </div>

              {/* Allow Assistants toggle */}
              <div className="rounded-lg border p-4 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <Users className="h-4 w-4 text-blue-500" />
                    Allow Assistants
                  </Label>
                  <Switch
                    checked={formData.allowAssistants}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allowAssistants: checked })
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  {formData.allowAssistants
                    ? "The selected leader can add their own assistants after accepting."
                    : "This job requires only the leader — no assistants allowed."}
                </p>
              </div>

              {/* Client */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold">
                  <Briefcase className="h-4 w-4 text-purple-500" />
                  Client (Optional)
                </Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, clientId: val })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column: Mission Details */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Mission Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) =>
                      setFormData({ ...formData, type: val as CallOutType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="INVOICE">Invoice Related</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">
                    <Car className="inline h-4 w-4 mr-1 text-gray-500" />
                    Vehicle *
                  </Label>
                  <Select
                    value={formData.vehicle}
                    onValueChange={(val) =>
                      setFormData({ ...formData, vehicle: val as VehicleType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPANY_VEHICLE">
                        Company Vehicle
                      </SelectItem>
                      <SelectItem value="PERSONAL_VEHICLE">
                        Personal Vehicle
                      </SelectItem>
                      <SelectItem value="PUBLIC_TRANSPORT">
                        Public Transport
                      </SelectItem>
                      <SelectItem value="E_HAILING">E-Hailing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4 text-red-500" />
                  Destination / Address *
                </Label>
                <Input
                  placeholder="Work site address..."
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Expected Start Time *
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-semibold">
              <FileText className="h-4 w-4 text-green-600" />
              Mission Description *
            </Label>
            <Textarea
              placeholder="Detailed instructions for the team..."
              className="min-h-[100px] bg-gray-50/50"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dispatching...
              </>
            ) : formData.leaderIds.length > 1 ? (
              `Dispatch to ${formData.leaderIds.length} Leaders`
            ) : (
              "Send Dispatch"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
