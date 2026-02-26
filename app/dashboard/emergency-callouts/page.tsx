"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  Loader2,
  Search,
  Filter,
  Eye,
  Siren,
  Clock,
  Activity,
  CheckCircle,
} from "lucide-react";
import { CallOutStatus, CallOutType } from "@prisma/client";
import { AdminCreateCallOutDialog } from "./_components/AdminCreateCallOutDialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface CallOut {
  id: string;
  type: CallOutType;
  status: CallOutStatus;
  startTime: string; // ISO string
  destination: string;
  checkIn?: string;
  checkInTime?: string; // Added to match mobile app usage and resolve TS errors
  checkInAddress?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkOut?: string;
  checkOutTime?: string;
  checkOutAddress?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  requestedUser: {
    name: string;
    email: string;
    role: string;
    userType: string;
  };
  leaders: {
    id: string;
    status: string;
    user: { name: string; avatar?: string };
  }[];
  assistants: { user: { name: string; avatar?: string } }[];
}

const ADMIN_ROLES = [
  "CHIEF_EXECUTIVE_OFFICER",
  "ADMIN_MANAGER",
  "GENERAL_MANAGER",
];

export default function EmergencyCallOutsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedCallOut, setSelectedCallOut] = useState<CallOut | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapType, setMapType] = useState<"checkin" | "checkout">("checkin");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: callOuts = [],
    isLoading: loading,
    refetch: fetchCallOuts,
  } = useQuery<CallOut[]>({
    queryKey: ["emergency-callouts-admin"],
    queryFn: async () => {
      const response = await fetch("/api/emergency-callouts");
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch call-outs");
      }
      return response.json();
    },
    refetchInterval: 30000, // auto-refresh every 30 seconds
    onError: (error: any) => {
      toast.error(error?.message || "Failed to load emergency call-outs");
    },
  } as any);

  const filteredCallOuts = callOuts.filter((item) => {
    const matchesSearch =
      item.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requestedUser?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: CallOutStatus) => {
    switch (status) {
      case CallOutStatus.PENDING:
        return "bg-yellow-500 hover:bg-yellow-600";
      case CallOutStatus.ACCEPTED:
        return "bg-blue-500 hover:bg-blue-600";
      case "AWAITING_APPROVAL" as any:
        return "bg-orange-500 hover:bg-orange-600 animate-pulse";
      case CallOutStatus.IN_PROGRESS:
      case CallOutStatus.ASSISTANT_CONFIRMED:
        return "bg-cyan-500 hover:bg-cyan-600";
      case CallOutStatus.COMPLETED:
        return "bg-green-500 hover:bg-green-600";
      case CallOutStatus.DECLINED:
      case CallOutStatus.CANCELLED:
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  const handleShowMap = (callOut: CallOut, type: "checkin" | "checkout") => {
    setSelectedCallOut(callOut);
    setMapType(type);
    setShowMap(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm">
          Loading call-outs...
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Emergency Call-Outs
        </h1>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className=" flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Call-Out
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <Siren className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callOuts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {
                callOuts.filter((c) => c.status === CallOutStatus.PENDING)
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                callOuts.filter((c) => c.status === CallOutStatus.IN_PROGRESS)
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                callOuts.filter((c) => c.status === CallOutStatus.COMPLETED)
                  .length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by requester or location..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="AWAITING_APPROVAL">Awaiting Approval</SelectItem>
            <SelectItem value="ACCEPTED">Accepted / Approved</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DECLINED">Declined</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>
            Manage emergency call-out requests from employees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Requested For</TableHead>
                <TableHead>Check In/Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCallOuts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No call-outs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCallOuts.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() =>
                      router.push(`/dashboard/emergency-callouts/${item.id}`)
                    }
                  >
                    <TableCell>
                      {format(new Date(item.startTime), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.requestedUser.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.type?.replace("_", " ") || "Standard"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate"
                      title={item.destination}
                    >
                      {item.destination}
                    </TableCell>
                    <TableCell>
                      {item.leaders.length > 0 ? (
                        // If leaders exist (dispatched), show them (priority to SELECTED)
                        <div className="flex -space-x-2">
                          {(item.leaders.find((l) => l.status === "SELECTED")
                            ? [
                                item.leaders.find(
                                  (l) => l.status === "SELECTED",
                                )!,
                              ]
                            : item.leaders
                          )
                            .slice(0, 3)
                            .map((leader, i) => (
                              <div
                                key={i}
                                className="relative"
                                title={`${leader.user.name} (${leader.status})`}
                              >
                                {leader.user.avatar ? (
                                  <img
                                    src={leader.user.avatar}
                                    alt={leader.user.name}
                                    className="w-7 h-7 rounded-full border-2 border-black dark:border-white object-cover"
                                  />
                                ) : (
                                  <div className="bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white shadow-sm">
                                    {leader.user.name.charAt(0)}
                                  </div>
                                )}
                                {leader.status === "SELECTED" && (
                                  <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border border-white">
                                    <CheckCircle className="w-2 h-2" />
                                  </div>
                                )}
                              </div>
                            ))}
                          {!item.leaders.find((l) => l.status === "SELECTED") &&
                            item.leaders.length > 3 && (
                              <span className="bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white shadow-sm">
                                +{item.leaders.length - 3}
                              </span>
                            )}
                        </div>
                      ) : item.assistants.length > 0 ? (
                        // No leaders but has assistants (employee self-request)
                        <div className="flex -space-x-2">
                          {item.assistants.slice(0, 3).map((a, i) => (
                            <div key={i} title={a.user.name}>
                              {a.user.avatar ? (
                                <img
                                  src={a.user.avatar}
                                  alt={a.user.name}
                                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                                />
                              ) : (
                                <div className="bg-gray-200 text-gray-600 text-[10px] font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white shadow-sm">
                                  {a.user.name.charAt(0)}
                                </div>
                              )}
                            </div>
                          ))}
                          {item.assistants.length > 3 && (
                            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white shadow-sm">
                              +{item.assistants.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[10px] italic">
                          None
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          {item.checkInLat && item.checkInLng ? (
                            <div className="flex items-center gap-2">
                              {(item.checkInTime || item.checkIn) && (
                                <span className="text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                  {format(
                                    new Date(
                                      (item.checkInTime || item.checkIn)!,
                                    ),
                                    "HH:mm",
                                  )}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowMap(item, "checkin")}
                                className="h-6 w-6 p-0 hover:bg-green-100"
                                title="View check-in location"
                              >
                                <Eye className="h-3 w-3 text-green-600" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              -
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {item.checkOutLat && item.checkOutLng ? (
                            <div className="flex items-center gap-2">
                              {(item.checkOutTime || item.checkOut) && (
                                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                  {format(
                                    new Date(
                                      (item.checkOutTime || item.checkOut)!,
                                    ),
                                    "HH:mm",
                                  )}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowMap(item, "checkout")}
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                title="View check-out location"
                              >
                                <Eye className="h-3 w-3 text-blue-600" />
                              </Button>
                            </div>
                          ) : item.checkInLat && item.checkInLng ? (
                            <span className="text-muted-foreground text-xs">
                              -
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status?.replace("_", " ") || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/dashboard/emergency-callouts/${item.id}`,
                          )
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdminCreateCallOutDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => fetchCallOuts()}
      />
    </div>
  );
}
