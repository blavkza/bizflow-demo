"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Clock,
  User,
  MapPin,
  Car,
  AlertTriangle,
  FileText,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Timer,
  Star,
  Shield,
  Banknote,
  Phone,
  Medal,
  Trophy,
  UserCheck,
  Info,
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";

type LeaderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "SELECTED"
  | "NOT_ACCEPTED";

interface Leader {
  id: string;
  userId?: string;
  status: LeaderStatus;
  acceptedAt?: string;
  declinedAt?: string;
  declinedReason?: string;
  responseReason?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string; avatar?: string };
  employee?: { position: string; emergencyCallOutRate: number };
  freelancer?: { position: string; emergencyCallOutRate: number };
  trainee?: { position: string; emergencyCallOutRate: number };
}

interface Assistant {
  id: string;
  userId?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "SELECTED" | "NOT_ACCEPTED";
  earnings?: number;
  hourlyRateUsed?: number;
  user?: { id: string; name: string; email: string; avatar?: string };
  employee?: { emergencyCallOutRate: number };
  freelancer?: { emergencyCallOutRate: number };
  trainee?: { emergencyCallOutRate: number };
}

interface CallOutDetail {
  id: string;
  title: string;
  type?: string;
  status: string;
  startTime: string;
  requestedAt: string;
  destination?: string;
  vehicle?: string;
  description?: string;
  requestedBy: string;
  selectedLeaderId?: string;
  allowAssistants: boolean;
  workerCount?: number;
  notes?: string;
  declinedReason?: string;
  checkIn?: string;
  checkInTime?: string;
  checkInAddress?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkOut?: string;
  checkOutTime?: string;
  checkOutAddress?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  duration?: number;
  earnings?: number;
  hourlyRateUsed?: number;
  requestedUser: {
    name: string;
    email: string;
    phone?: string;
    employee?: { position: string };
    freeLancer?: { position: string };
    trainee?: { position: string };
  };
  leaders: Leader[];
  assistants: Assistant[];
  client?: { name: string; company?: string; clientNumber: string } | null;
  reportDiagnosis?: string;
  reportProposal?: string;
  reportSolution?: string;
  reportProgress?: string;
  reportPendingTasks?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDING: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  DECLINED: {
    label: "Declined",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
  AWAITING_APPROVAL: {
    label: "Awaiting Approval",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  ASSISTANT_CONFIRMED: {
    label: "Team Confirmed",
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
  },
};

const LEADER_STATUS_CONFIG: Record<
  LeaderStatus,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
  }
> = {
  PENDING: {
    label: "Awaiting Response",
    icon: <Clock className="w-3.5 h-3.5" />,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  ACCEPTED: {
    label: "Accepted",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  DECLINED: {
    label: "Declined",
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  SELECTED: {
    label: "Selected ★",
    icon: <Star className="w-3.5 h-3.5 fill-current" />,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  NOT_ACCEPTED: {
    label: "Not Responded",
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
};

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
  const [selectingLeaderId, setSelectingLeaderId] = useState<string | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isSelectConfirmOpen, setIsSelectConfirmOpen] = useState(false);
  const [pendingSelectLeader, setPendingSelectLeader] = useState<Leader | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      toast.error("Failed to load call-out details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string, reason?: string) => {
    try {
      setActionLoading(true);
      const payload: any = { status };
      if (reason) payload.rejectionReason = reason;
      if (notes) payload.notes = notes;

      const response = await fetch(`/api/emergency-callouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast.success(`Call-Out status updated to ${status.replace(/_/g, " ")}`);
      fetchDetail();
      setIsRejectOpen(false);
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectLeader = async (leader: Leader) => {
    setPendingSelectLeader(leader);
    setIsSelectConfirmOpen(true);
  };

  const confirmSelectLeader = async () => {
    if (!pendingSelectLeader) return;
    try {
      setSelectingLeaderId(pendingSelectLeader.id);
      const response = await fetch(`/api/emergency-callouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedLeaderId: pendingSelectLeader.id }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to select leader");
      }

      toast.success(
        `✅ ${pendingSelectLeader.user?.name} has been selected as the mission leader!`,
      );
      setIsSelectConfirmOpen(false);
      setPendingSelectLeader(null);
      fetchDetail();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSelectingLeaderId(null);
    }
  };

  const handleSelectAssistant = async (assistantId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/emergency-callouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedAssistantId: assistantId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to approve assistant");
      }

      toast.success("Assistant approved for mission");
      fetchDetail();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAssistant = async (assistantId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/emergency-callouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectedAssistantId: assistantId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to reject assistant");
      }

      toast.success("Assistant request declined");
      fetchDetail();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!callOut) return;
    try {
      await fetch(`/api/emergency-callouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!callOut) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <XCircle className="w-16 h-16 text-red-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-600">Call-Out Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          This call-out may have been deleted or doesn't exist.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  // Sort leaders: SELECTED → ACCEPTED (by acceptedAt asc) → PENDING → DECLINED
  const sortedLeaders = [...callOut.leaders].sort((a, b) => {
    const order = {
      SELECTED: 0,
      ACCEPTED: 1,
      PENDING: 2,
      NOT_ACCEPTED: 3,
      DECLINED: 4,
    };
    if (order[a.status] !== order[b.status])
      return order[a.status] - order[b.status];
    if (a.status === "ACCEPTED" && b.status === "ACCEPTED") {
      const aT = a.acceptedAt ? new Date(a.acceptedAt).getTime() : Infinity;
      const bT = b.acceptedAt ? new Date(b.acceptedAt).getTime() : Infinity;
      return aT - bT;
    }
    return 0;
  });

  const acceptedLeaders = sortedLeaders.filter((l) => l.status === "ACCEPTED");
  const selectedLeader = sortedLeaders.find((l) => l.status === "SELECTED");
  const statusCfg = STATUS_CONFIG[callOut.status] || STATUS_CONFIG.PENDING;
  const canSelectLeader =
    callOut.status === "PENDING" && acceptedLeaders.length > 0;

  const getPosition = (l: Leader) =>
    l.employee?.position || l.freelancer?.position || l.trainee?.position;
  const getRate = (l: Leader) =>
    l.employee?.emergencyCallOutRate ||
    l.freelancer?.emergencyCallOutRate ||
    l.trainee?.emergencyCallOutRate;

  const getAssistantRate = (a: Assistant) =>
    a.employee?.emergencyCallOutRate ||
    a.freelancer?.emergencyCallOutRate ||
    a.trainee?.emergencyCallOutRate ||
    0;

  const isLive =
    callOut?.status === "IN_PROGRESS" && callOut.checkIn && !callOut.checkOut;

  let displayDuration = Number(callOut?.duration || 0);
  let displayLeaderEarnings = Number(callOut?.earnings || 0);
  let displayHourlyRate = Number(callOut?.hourlyRateUsed || 0);

  if (isLive && callOut?.checkIn) {
    const start = new Date(callOut.checkIn).getTime();
    const now = currentTime.getTime();
    displayDuration = Math.max(0, (now - start) / (1000 * 60 * 60));

    if (!displayHourlyRate && selectedLeader) {
      displayHourlyRate = Number(getRate(selectedLeader) || 0);
    }
    displayLeaderEarnings = displayDuration * displayHourlyRate;
  }

  // Calculate total assistants earnings
  const totalAssistantsEarnings = (callOut?.assistants || []).reduce(
    (acc, a) => {
      if (isLive) {
        if (a.status === "SELECTED") {
          return acc + displayDuration * Number(getAssistantRate(a));
        }
      } else {
        return acc + (Number(a.earnings) || 0);
      }
      return acc;
    },
    0,
  );

  const totalMissionEarnings = displayLeaderEarnings + totalAssistantsEarnings;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mt-0.5 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Emergency Call-Out
            </h1>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-sm font-semibold border",
                statusCfg.color,
                statusCfg.bg,
                statusCfg.border,
              )}
            >
              {statusCfg.label}
            </span>
            {canSelectLeader && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 animate-pulse">
                ⚡ {acceptedLeaders.length} leader(s) ready — select one!
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            ID: {callOut.id}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Created{" "}
            {formatDistanceToNow(new Date(callOut.requestedAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── MAIN COLUMN ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mission Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Mission Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  {
                    label: "Scheduled Time",
                    value: format(
                      new Date(callOut.startTime),
                      "MMM dd, yyyy 'at' HH:mm",
                    ),
                  },
                  {
                    label: "Type",
                    value: callOut.type?.replace(/_/g, " ") || "—",
                  },
                  {
                    label: "Vehicle",
                    value: callOut.vehicle?.replace(/_/g, " ") || "—",
                  },
                  {
                    label: "Destination",
                    value: callOut.destination || "—",
                  },
                  {
                    label: "Total Workers",
                    value: `${callOut.workerCount || 1} person(s)`,
                  },
                  {
                    label: "Assistants Allowed",
                    value: callOut.allowAssistants ? "Yes" : "No",
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-1">
                      {label}
                    </p>
                    <p className="text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              {callOut.description && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
                      <FileText className="w-4 h-4" />
                      Description
                    </p>
                    <p className="text-sm leading-relaxed text-gray-700">
                      {callOut.description}
                    </p>
                  </div>
                </>
              )}

              {/* Earnings summary */}
              {(callOut.earnings !== undefined || isLive) && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-4 border border-emerald-100 relative overflow-hidden">
                    {isLive && (
                      <div className="absolute top-0 right-0 p-1">
                        <span
                          className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                          title="Live Tracking"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                        Mission Duration{" "}
                        {isLive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 animate-pulse">
                            (Live)
                          </span>
                        )}
                      </p>
                      <p className="text-xl font-bold text-emerald-700">
                        {displayDuration.toFixed(2)} hrs
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-emerald-600">
                        Leader Earnings {isLive && "(Live Est.)"}
                      </p>
                      <p className="text-xl font-bold text-emerald-700">
                        ZAR {Number(displayLeaderEarnings).toFixed(2)}
                      </p>
                      <p className="text-xs text-emerald-500">
                        @ ZAR {displayHourlyRate}/hr
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Check-In / Out blocks */}
              {(callOut.checkIn || callOut.checkOut) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    {callOut.checkIn && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Check-In
                        </p>
                        <p className="text-sm font-semibold mb-2">
                          {format(new Date(callOut.checkIn), "MMM dd, HH:mm")}
                        </p>
                        {callOut.checkInLat && callOut.checkInLng && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-emerald-200">
                            <iframe
                              src={`https://maps.google.com/maps?q=${callOut.checkInLat},${callOut.checkInLng}&z=17&t=k&output=embed`}
                              className="w-full h-56 border-0"
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Check-in location"
                            />
                            {callOut.checkInAddress && (
                              <p className="text-xs p-2 text-emerald-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {callOut.checkInAddress}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {callOut.checkOut && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5" />
                          Check-Out
                        </p>
                        <p className="text-sm font-semibold mb-2">
                          {format(new Date(callOut.checkOut), "MMM dd, HH:mm")}
                        </p>
                        {callOut.checkOutLat && callOut.checkOutLng && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-blue-200">
                            <iframe
                              src={`https://maps.google.com/maps?q=${callOut.checkOutLat},${callOut.checkOutLng}&z=17&t=k&output=embed`}
                              className="w-full h-56 border-0"
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Check-out location"
                            />
                            {callOut.checkOutAddress && (
                              <p className="text-xs p-2 text-blue-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {callOut.checkOutAddress}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Work Report Section */}
                    {callOut.reportDiagnosis && (
                      <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50/30 p-4">
                        <p className="text-xs font-bold text-purple-700 uppercase mb-4 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Work Report
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              label: "Diagnosis",
                              value: callOut.reportDiagnosis,
                            },
                            {
                              label: "Proposal",
                              value: callOut.reportProposal,
                            },
                            {
                              label: "Solution",
                              value: callOut.reportSolution,
                            },
                            {
                              label: "Progress",
                              value: callOut.reportProgress,
                            },
                            {
                              label: "Pending Tasks",
                              value: callOut.reportPendingTasks,
                            },
                          ].map(
                            (item) =>
                              item.value && (
                                <div key={item.label} className="space-y-1">
                                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                                    {item.label}
                                  </p>
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {item.value}
                                  </p>
                                </div>
                              ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── POTENTIAL LEADERS CARD ────────────────────────────────── */}
          {callOut.leaders.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Potential Leaders
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({callOut.leaders.length} dispatched)
                  </span>
                </CardTitle>
                <CardDescription>
                  {selectedLeader
                    ? `${selectedLeader.user?.name} has been selected as the mission leader.`
                    : acceptedLeaders.length > 0
                      ? `${acceptedLeaders.length} leader(s) accepted. Select who takes the mission.`
                      : "Waiting for leaders to respond to the dispatch."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sortedLeaders.map((leader, index) => {
                  const cfg = LEADER_STATUS_CONFIG[leader.status];
                  const position = getPosition(leader);
                  const rate = getRate(leader);
                  const isFirstAccepted =
                    leader.status === "ACCEPTED" &&
                    leader.id === acceptedLeaders[0]?.id;

                  return (
                    <div
                      key={leader.id}
                      className={cn(
                        "rounded-xl border p-4 transition-all",
                        leader.status === "SELECTED"
                          ? "border-emerald-300 bg-emerald-50/60 shadow-sm"
                          : leader.status === "ACCEPTED"
                            ? "border-blue-200 bg-blue-50/40"
                            : leader.status === "DECLINED"
                              ? "border-gray-100 bg-gray-50/60 opacity-60"
                              : "border-gray-200 bg-white",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Rank badge */}
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                            leader.status === "SELECTED"
                              ? "bg-emerald-500 text-white"
                              : leader.status === "ACCEPTED"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-400",
                          )}
                        >
                          {leader.status === "SELECTED" ? (
                            <Star className="w-4 h-4 fill-current" />
                          ) : leader.status === "ACCEPTED" ? (
                            `#${acceptedLeaders.findIndex((l) => l.id === leader.id) + 1}`
                          ) : (
                            "—"
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden border-2 border-white shadow-sm">
                          {leader.user?.avatar ? (
                            <img
                              src={leader.user.avatar}
                              alt={leader.user?.name || "Leader"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-base">
                              {leader.user?.name?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm">
                              {leader.user?.name || "Unknown"}
                            </span>
                            {isFirstAccepted && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                                FIRST TO ACCEPT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {leader.user?.email}
                          </p>
                          {position && (
                            <p className="text-xs text-muted-foreground">
                              {position}
                            </p>
                          )}
                          {leader.status === "ACCEPTED" &&
                            leader.acceptedAt && (
                              <div className="mt-1">
                                <p className="text-xs text-blue-600 font-medium">
                                  ✅ Accepted{" "}
                                  {formatDistanceToNow(
                                    new Date(leader.acceptedAt),
                                    { addSuffix: true },
                                  )}
                                </p>
                                {leader.responseReason && (
                                  <span className="block text-blue-600/70 italic text-xs mt-0.5">
                                    "{leader.responseReason}"
                                  </span>
                                )}
                              </div>
                            )}
                          {leader.status === "DECLINED" &&
                            leader.declinedAt && (
                              <div className="mt-1">
                                <p className="text-xs text-red-500 font-medium">
                                  ❌ Declined{" "}
                                  {formatDistanceToNow(
                                    new Date(leader.declinedAt),
                                    { addSuffix: true },
                                  )}
                                </p>
                                {(leader.responseReason ||
                                  leader.declinedReason) && (
                                  <span className="block text-red-500/70 italic text-xs mt-0.5">
                                    "
                                    {leader.responseReason ||
                                      leader.declinedReason}
                                    "
                                  </span>
                                )}
                              </div>
                            )}
                          {leader.status === "SELECTED" && (
                            <p className="text-xs text-emerald-600 font-semibold mt-1">
                              ⭐ Mission Leader — has full operations access
                            </p>
                          )}
                          {rate !== undefined && rate > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Banknote className="w-3 h-3" />
                              ZAR {rate}/hr
                            </p>
                          )}
                        </div>

                        {/* Right: status badge + action */}
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
                              cfg.color,
                              cfg.bg,
                              cfg.border,
                            )}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </span>

                          {/* SELECT LEADER button — only for ACCEPTED leaders when not yet selected */}
                          {leader.status === "ACCEPTED" && !selectedLeader && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs px-3 shadow"
                              onClick={() => handleSelectLeader(leader)}
                              disabled={!!selectingLeaderId}
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              Select Leader
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* ── ASSISTANTS CARD ───────────────────────────────────────── */}
          {callOut.assistants && callOut.assistants.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4 text-blue-500" />
                  Team Assistants
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({callOut.assistants.length})
                  </span>
                </CardTitle>
                <CardDescription>
                  Added by the selected leader after accepting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {callOut.assistants.map((assistant) => (
                    <div
                      key={assistant.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                        {assistant.user?.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {assistant.user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {assistant.user?.email}
                        </p>
                        {(assistant.earnings !== undefined ||
                          (isLive && assistant.status === "SELECTED")) && (
                          <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                            ZAR{" "}
                            {Number(
                              assistant.earnings ??
                                displayDuration * getAssistantRate(assistant),
                            ).toFixed(2)}{" "}
                            earned
                            <span className="text-muted-foreground font-normal ml-1">
                              @ ZAR{" "}
                              {assistant.hourlyRateUsed ||
                                getAssistantRate(assistant)}
                              /hr
                            </span>
                            {isLive && assistant.status === "SELECTED" && (
                              <span className="ml-1.5 text-[10px] text-emerald-500 font-bold uppercase animate-pulse">
                                (Live)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          assistant.status === "SELECTED"
                            ? "bg-emerald-100 text-emerald-700"
                            : assistant.status === "ACCEPTED"
                              ? "bg-blue-100 text-blue-700"
                              : assistant.status === "DECLINED"
                                ? "bg-red-100 text-red-700"
                                : assistant.status === "NOT_ACCEPTED"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {assistant.status === "SELECTED"
                          ? "Approved ★"
                          : assistant.status}
                      </span>
                      {assistant.status === "ACCEPTED" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full flex items-center gap-2"
                            onClick={() => handleSelectAssistant(assistant.id)}
                            disabled={actionLoading}
                            title="Approve Assistant"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full flex items-center gap-2"
                            onClick={() => handleRejectAssistant(assistant.id)}
                            disabled={actionLoading}
                            title="Reject Assistant"
                          >
                            <XCircle className="h-5 w-5" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── CLIENT CARD ───────────────────────────────────────────── */}
          {callOut.client && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="w-4 h-4 text-fuchsia-500" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
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
        </div>

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Requested By */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Dispatched By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                  {callOut.requestedUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {callOut.requestedUser.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {callOut.requestedUser.employee?.position ||
                      callOut.requestedUser.freeLancer?.position ||
                      callOut.requestedUser.trainee?.position ||
                      "Administrator"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {callOut.requestedUser.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Leader summary */}
          {selectedLeader && (
            <Card className="border-emerald-300 bg-emerald-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                  <Medal className="w-4 h-4" />
                  Selected Mission Leader
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-base">
                    {selectedLeader.user?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-emerald-800">
                      {selectedLeader.user?.name}
                    </p>
                    <p className="text-xs text-emerald-600">
                      {getPosition(selectedLeader) || "Field Leader"}
                    </p>
                    {selectedLeader.acceptedAt && (
                      <p className="text-xs text-emerald-500 mt-0.5">
                        Accepted{" "}
                        {format(
                          new Date(selectedLeader.acceptedAt),
                          "MMM dd, HH:mm",
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* PENDING: can decline */}
              {callOut.status === "PENDING" && (
                <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full" size="sm">
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline Call-Out
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Decline this Call-Out</DialogTitle>
                      <DialogDescription>
                        All leaders will be notified. Please provide a reason.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Reason for declining..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="min-h-[100px]"
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
                        disabled={!rejectionReason || actionLoading}
                      >
                        Confirm Decline
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* ACCEPTED: can mark in progress */}
              {(callOut.status === "ACCEPTED" ||
                callOut.status === "ASSISTANT_CONFIRMED") && (
                <>
                  {callOut.status === "ACCEPTED" && (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="sm"
                      onClick={() => handleStatusUpdate("ASSISTANT_CONFIRMED")}
                      disabled={actionLoading}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      {callOut.assistants.length > 0
                        ? "Finalize Team & Confirm"
                        : "Confirm Solo Mission"}
                    </Button>
                  )}
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="sm"
                    onClick={() => handleStatusUpdate("IN_PROGRESS")}
                    disabled={actionLoading}
                  >
                    <Timer className="w-4 h-4 mr-2" />
                    Mark In Progress
                  </Button>
                </>
              )}

              {/* IN_PROGRESS: can mark completed */}
              {callOut.status === "IN_PROGRESS" && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                    <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1">
                      Active Call Out
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Timer className="w-4 h-4 text-purple-600 animate-spin-slow" />
                      <span className="text-lg font-bold text-purple-900 font-mono">
                        {displayDuration.toFixed(2)}h
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-600 mt-1">
                      Total Est: ZAR {totalMissionEarnings.toFixed(2)}
                    </p>
                    <p className="text-[9px] text-purple-500/70">
                      Leader: {displayLeaderEarnings.toFixed(0)} | Team:{" "}
                      {totalAssistantsEarnings.toFixed(0)}
                    </p>
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    size="sm"
                    onClick={() => handleStatusUpdate("COMPLETED")}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete Mission
                  </Button>
                </div>
              )}

              {/* COMPLETED: show summary */}
              {callOut.status === "COMPLETED" && (
                <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-emerald-700">
                    Mission Complete
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 font-bold">
                    Total Combined: ZAR {totalMissionEarnings.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-emerald-500/70">
                    Leader: ZAR {displayLeaderEarnings.toFixed(2)} | Team: ZAR{" "}
                    {totalAssistantsEarnings.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Decline summary */}
              {(callOut.status === "DECLINED" ||
                callOut.status === "CANCELLED") && (
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <XCircle className="w-8 h-8 text-red-400 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-red-600">
                    {callOut.status}
                  </p>
                  {callOut.declinedReason && (
                    <p className="text-xs text-red-500 mt-1 italic">
                      "{callOut.declinedReason}"
                    </p>
                  )}
                </div>
              )}

              <Separator />

              {/* Admin Notes */}
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">
                  Internal Notes
                </label>
                <Textarea
                  placeholder="Admin notes (auto-saved on blur)..."
                  className="h-24 resize-none text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={saveNotes}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                Response Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {[
                {
                  label: "Total Dispatched",
                  value: callOut.leaders.length,
                  color: "text-gray-700",
                },
                {
                  label: "Accepted",
                  value: callOut.leaders.filter(
                    (l) => l.status !== "DECLINED" && l.status !== "PENDING",
                  ).length,
                  color: "text-blue-600",
                },
                {
                  label: "Declined",
                  value: callOut.leaders.filter((l) => l.status === "DECLINED")
                    .length,
                  color: "text-red-600",
                },
                {
                  label: "Pending",
                  value: callOut.leaders.filter((l) => l.status === "PENDING")
                    .length,
                  color: "text-amber-600",
                },
                {
                  label: "Assistants",
                  value: callOut.assistants.length,
                  color: "text-purple-600",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0"
                >
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── SELECT LEADER CONFIRM DIALOG ─────────────────────────────────── */}
      <Dialog open={isSelectConfirmOpen} onOpenChange={setIsSelectConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Confirm Leader Selection
            </DialogTitle>
            <DialogDescription>
              You are about to assign{" "}
              <strong className="text-foreground">
                {pendingSelectLeader?.user?.name}
              </strong>{" "}
              as the official mission leader. They will receive full operations
              access (check-in/out){" "}
              {callOut.allowAssistants ? "and may add assistants" : ""}.
            </DialogDescription>
          </DialogHeader>

          {pendingSelectLeader && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-lg">
                {pendingSelectLeader.user?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-emerald-800">
                  {pendingSelectLeader.user?.name}
                </p>
                <p className="text-sm text-emerald-600">
                  {getPosition(pendingSelectLeader) || "Field Worker"}
                </p>
                {pendingSelectLeader.acceptedAt && (
                  <p className="text-xs text-emerald-500">
                    Accepted{" "}
                    {format(
                      new Date(pendingSelectLeader.acceptedAt),
                      "MMM dd, HH:mm",
                    )}
                    {pendingSelectLeader.id === acceptedLeaders[0]?.id &&
                      " — First to respond ⚡"}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSelectConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={confirmSelectLeader}
              disabled={!!selectingLeaderId}
            >
              {selectingLeaderId ? (
                "Selecting..."
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Yes, Select as Leader
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
