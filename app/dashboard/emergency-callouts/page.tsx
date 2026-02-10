"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

interface CallOut {
  id: string;
  type: CallOutType;
  status: CallOutStatus;
  startTime: string; // ISO string
  destination: string;
  checkIn?: string;
  checkInAddress?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkOut?: string;
  checkOutAddress?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  requestedUser: {
    name: string;
    email: string;
  };
  assistants: { user: { name: string } }[];
}

export default function EmergencyCallOutsPage() {
  const router = useRouter();
  const [callOuts, setCallOuts] = useState<CallOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedCallOut, setSelectedCallOut] = useState<CallOut | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapType, setMapType] = useState<"checkin" | "checkout">("checkin");

  useEffect(() => {
    fetchCallOuts();
  }, []);

  const fetchCallOuts = async () => {
    try {
      const response = await fetch("/api/emergency-callouts");
      if (!response.ok) throw new Error("Failed to fetch call-outs");
      const data = await response.json();
      setCallOuts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
      case CallOutStatus.IN_PROGRESS:
        return "bg-purple-500 hover:bg-purple-600";
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Emergency Call-Outs
        </h1>
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
            <div className="text-2xl font-bold">
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
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DECLINED">Declined</SelectItem>
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
                <TableHead>Assistants</TableHead>
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
                  <TableRow key={item.id}>
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
                      {item.assistants.length > 0 ? (
                        <div className="flex -space-x-2">
                          {item.assistants.slice(0, 3).map((a, i) => (
                            <span
                              key={i}
                              className="bg-gray-200 text-xs rounded-full w-6 h-6 flex items-center justify-center border border-white"
                              title={a.user.name}
                            >
                              {a.user.name.charAt(0)}
                            </span>
                          ))}
                          {item.assistants.length > 3 && (
                            <span className="bg-gray-100 text-xs rounded-full w-6 h-6 flex items-center justify-center border border-white">
                              +{item.assistants.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          None
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {item.checkInLat && item.checkInLng ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowMap(item, "checkin")}
                            className="h-7 w-7 p-0 hover:bg-green-50"
                            title="View check-in location"
                          >
                            <Eye className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            -
                          </span>
                        )}
                        {item.checkOutLat && item.checkOutLng ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowMap(item, "checkout")}
                            className="h-7 w-7 p-0 hover:bg-blue-50"
                            title="View check-out location"
                          >
                            <Eye className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                        ) : item.checkInLat && item.checkInLng ? (
                          <span className="text-muted-foreground text-xs">
                            -
                          </span>
                        ) : null}
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
    </div>
  );
}
