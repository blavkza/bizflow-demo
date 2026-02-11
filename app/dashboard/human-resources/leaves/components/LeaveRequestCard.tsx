import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaveRequest } from "../types";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import RejectLeaveDialog from "./RejectLeaveDialog";

interface LeaveRequestCardProps {
  canEditLeave: boolean;
  hasFullAccess: boolean;
  request: LeaveRequest;
  onApprove: () => void;
  onReject: (comments: string) => Promise<boolean>;
}

export default function LeaveRequestCard({
  request,
  onApprove,
  onReject,
  canEditLeave,
  hasFullAccess,
}: LeaveRequestCardProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "ANNUAL":
        return "bg-blue-100 text-blue-800";
      case "SICK":
        return "bg-orange-100 text-orange-800";
      case "MATERNITY":
      case "PATERNITY":
        return "bg-purple-100 text-purple-800";
      case "STUDY":
        return "bg-cyan-100 text-cyan-800";
      case "UNPAID":
        return "bg-gray-100 text-gray-800";
      case "COMPASSIONATE":
        return "bg-pink-100 text-pink-800";
      case "DAYOFF":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRejectWithReason = async (comments: string) => {
    return await onReject(comments);
  };

  return (
    <>
      <Card key={request.id}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={
                    request.employeeAvatar ||
                    "/placeholder.svg?height=40&width=40"
                  }
                />
                <AvatarFallback>
                  {request.employeeName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold">{request.employeeName}</h4>
                  <Badge variant="outline">{request.employeeId}</Badge>
                  <Badge variant="outline">{request.department}</Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(request.startDate).toLocaleDateString()} -{" "}
                      {new Date(request.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{request.days} days</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getLeaveTypeColor(request.leaveType)}>
                    {request.leaveType.replace("_", " ")}
                  </Badge>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1">{request.status}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {request.reason}
                </p>
                {request.comments && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-sm">
                      <strong>Comments:</strong> {request.comments}
                    </p>
                  </div>
                )}
                {request.requestedBy && (
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Requested by: {request.requestedBy}
                    </Badge>
                  </div>
                )}
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Requested on:{" "}
                    {new Date(request.requestedDate).toLocaleString()}
                  </Badge>
                </div>
              </div>
            </div>
            {/* ALWAYS SHOW APPROVE/REJECT BUTTONS FOR PENDING REQUESTS */}

            {(canEditLeave || hasFullAccess) &&
              request.status === "PENDING" && (
                <div className="flex space-x-2">
                  <Button size="sm" onClick={onApprove}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      <RejectLeaveDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onReject={handleRejectWithReason}
        employeeName={request.employeeName}
        leaveType={request.leaveType}
      />
    </>
  );
}
