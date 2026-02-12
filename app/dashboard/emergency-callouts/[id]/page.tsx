"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Car,
  AlertTriangle,
  FileText,
  Users,
  Briefcase,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CallOutDetail {
  id: string;
  type: string;
  status: string;
  startTime: string;
  destination: string;
  vehicle: string;
  description: string;
  requestedBy: string;
  isTeamLeader: boolean;
  notes?: string;
  declinedReason?: string;
  checkIn?: string;
  checkInAddress?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkOut?: string;
  checkOutAddress?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  duration?: number;
  earnings?: number;
  hourlyRateUsed?: number;
  requestedUser: {
    name: string;
    email: string;
    employee?: { position: string; phone: string };
    freeLancer?: { position: string; phone: string };
  };
  assistants: {
    id: string;
    status: string;
    earnings?: number;
    hourlyRateUsed?: number;
    user: { name: string; email: string };
  }[];
  client: {
    name: string;
    company?: string;
    clientNumber: string;
  } | null;
}

export default function CallOutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [callOut, setCallOut] = useState<CallOutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const response = await fetch(`/api/emergency-callouts/${id}`);
      if (!response.ok) throw new Error("Failed to fetch details");
      const data = await response.json();
      setCallOut(data);
      if (data.notes) setNotes(data.notes);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load call-out details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string, reason?: string) => {
    try {
      setActionLoading(true);
      const payload: any = { status };
      if (reason) payload.declinedReason = reason;
      if (notes) payload.notes = notes;

      const response = await fetch(`/api/emergency-callouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast.success(`Call-Out marked as ${status}`);
      fetchDetail();
      setIsRejectOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!callOut) return <div className="p-8">Call-Out not found</div>;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      ASSISTANT_CONFIRMED: "bg-cyan-100 text-cyan-800",
      COMPLETED: "bg-green-100 text-green-800",
      DECLINED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${
          styles[status] || "bg-gray-100"
        }`}
      >
        {status?.replace("_", " ") || "UNKNOWN"}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Emergency Call-Out Details</h1>
          <p className="text-muted-foreground text-sm">ID: {callOut.id}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {getStatusBadge(callOut.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Request Time
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>
                      {format(
                        new Date(callOut.startTime),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Type
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <AlertTriangle className="w-4 h-4 text-gray-500" />
                    <span>{callOut.type}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Vehicle
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span>{callOut.vehicle?.replace("_", " ") || "N/A"}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Location
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{callOut.destination}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="mt-2 text-sm leading-relaxed">
                  {callOut.description}
                </p>
              </div>

              {(callOut.checkIn || callOut.checkOut) && (
                <div className="pt-4 border-t space-y-4">
                  {callOut.checkIn && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <label className="text-xs font-bold text-green-700 uppercase block mb-2">
                        Check-In
                      </label>
                      <p className="text-sm font-semibold mb-2">
                        {format(new Date(callOut.checkIn), "MMM dd, HH:mm")}
                      </p>

                      {/* Check-In Map */}
                      {callOut.checkInLat && callOut.checkInLng && (
                        <div className="mt-3">
                          <div className="h-64 rounded-lg overflow-hidden border border-green-200 mb-2">
                            <iframe
                              src={`https://maps.google.com/maps?q=${callOut.checkInLat},${callOut.checkInLng}&z=17&t=k&output=embed`}
                              className="w-full h-full border-0"
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Check-in location"
                            />
                          </div>
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{" "}
                            {callOut.checkInAddress ||
                              `${callOut.checkInLat.toFixed(6)}, ${callOut.checkInLng.toFixed(6)}`}
                          </p>
                        </div>
                      )}

                      {!callOut.checkInLat &&
                        !callOut.checkInLng &&
                        callOut.checkInAddress && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{" "}
                            {callOut.checkInAddress}
                          </p>
                        )}
                    </div>
                  )}

                  {callOut.checkOut && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <label className="text-xs font-bold text-blue-700 uppercase block mb-2">
                        Check-Out
                      </label>
                      <p className="text-sm font-semibold mb-2">
                        {format(new Date(callOut.checkOut), "MMM dd, HH:mm")}
                      </p>

                      {/* Check-Out Map */}
                      {callOut.checkOutLat && callOut.checkOutLng && (
                        <div className="mt-3">
                          <div className="h-64 rounded-lg overflow-hidden border border-blue-200 mb-2">
                            <iframe
                              src={`https://maps.google.com/maps?q=${callOut.checkOutLat},${callOut.checkOutLng}&z=17&t=k&output=embed`}
                              className="w-full h-full border-0"
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Check-out location"
                            />
                          </div>
                          <p className="text-xs text-blue-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{" "}
                            {callOut.checkOutAddress ||
                              `${callOut.checkOutLat.toFixed(6)}, ${callOut.checkOutLng.toFixed(6)}`}
                          </p>
                        </div>
                      )}

                      {!callOut.checkOutLat &&
                        !callOut.checkOutLng &&
                        callOut.checkOutAddress && (
                          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{" "}
                            {callOut.checkOutAddress}
                          </p>
                        )}
                    </div>
                  )}
                </div>
              )}

              {callOut.earnings !== undefined && (
                <div className="pt-4 border-t flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block">
                      Mission Duration
                    </label>
                    <p className="text-lg font-bold text-indigo-700">
                      {callOut.duration?.toFixed(2)} hours
                    </p>
                  </div>
                  <div className="text-right">
                    <label className="text-sm font-medium text-muted-foreground block">
                      Requester Earnings
                    </label>
                    <p className="text-lg font-bold text-green-700">
                      ZAR {Number(callOut.earnings).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rate: ZAR {callOut.hourlyRateUsed}/hr
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Info */}
          {callOut.client && (
            <Card>
              <CardHeader>
                <CardTitle>Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-fuchsia-600" />
                  <div>
                    <p className="font-semibold">
                      {callOut.client.company || callOut.client.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      #{callOut.client.clientNumber}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assistants */}
          {callOut.assistants && callOut.assistants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team / Assistants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {callOut.assistants.map((assistant) => (
                    <div
                      key={assistant.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {assistant.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {assistant.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assistant.user.email}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            assistant.status === "ACCEPTED"
                              ? "default"
                              : assistant.status === "DECLINED"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {assistant.status}
                        </Badge>
                      </div>
                      {assistant.earnings !== undefined && (
                        <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-medium">
                            Mission Contribution
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-green-700 block">
                              ZAR {Number(assistant.earnings).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {assistant.hourlyRateUsed}/hr •{" "}
                              {callOut.duration?.toFixed(2)} hrs
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requester</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                  {callOut.requestedUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{callOut.requestedUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {callOut.requestedUser.employee?.position ||
                      callOut.requestedUser.freeLancer?.position ||
                      "Unknown Position"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {callOut.status === "PENDING" && (
                <>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusUpdate("ACCEPTED")}
                    disabled={actionLoading}
                  >
                    Approve / Accept
                  </Button>
                  <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        Reject / Decline
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Request</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for declining this request.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsRejectOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            handleStatusUpdate("DECLINED", rejectionReason)
                          }
                          disabled={!rejectionReason}
                        >
                          Confirm Reject
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {(callOut.status === "ACCEPTED" ||
                callOut.status === "ASSISTANT_CONFIRMED") && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusUpdate("IN_PROGRESS")}
                  disabled={actionLoading}
                >
                  Mark In Progress
                </Button>
              )}

              {callOut.status === "IN_PROGRESS" && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleStatusUpdate("COMPLETED")}
                  disabled={actionLoading}
                >
                  Mark Completed
                </Button>
              )}

              <div className="pt-4 border-t">
                <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                  Admin Notes
                </label>
                <Textarea
                  placeholder="Internal notes..."
                  className="h-24 resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => handleStatusUpdate(callOut.status)} // Auto-save notes on blur
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
