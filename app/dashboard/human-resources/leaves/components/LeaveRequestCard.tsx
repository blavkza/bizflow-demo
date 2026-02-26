import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaveRequest } from "../types";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  Loader2,
  FileWarning,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RejectLeaveDialog from "./RejectLeaveDialog";

interface LeaveRequestCardProps {
  canEditLeave: boolean;
  hasFullAccess: boolean;
  request: LeaveRequest;
  onApprove: () => void;
  onReject: (comments: string) => Promise<boolean>;
  onDocumentUpload: (id: string, documentUrl: string) => Promise<boolean>;
}

export default function LeaveRequestCard({
  request,
  onApprove,
  onReject,
  onDocumentUpload,
  canEditLeave,
  hasFullAccess,
}: LeaveRequestCardProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingDoc(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "leave-document");
      formData.append("leaveRequestId", request.id);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");

      await onDocumentUpload(request.id, data.url);
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
                {request.originalLeaveType && (
                  <div className="mt-1 flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className="text-xs text-amber-700 bg-amber-50 border-amber-200"
                    >
                      Intended: {request.originalLeaveType}
                    </Badge>
                    <span className="text-[10px] text-amber-600 italic flex items-center">
                      <FileWarning className="h-3 w-3 mr-1" /> Missing
                      Documentation
                    </span>
                  </div>
                )}
                <div className="mt-1">
                  {request.emergencyAvailability ? (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-50 text-green-700 border-green-200"
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Available for Emergency Call Out
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs bg-red-50 text-red-700 border-red-200"
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      Not Available for Emergency Call Out
                    </Badge>
                  )}
                </div>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Requested on:{" "}
                    {new Date(request.requestedDate).toLocaleString()}
                  </Badge>
                </div>
              </div>
            </div>
            {(canEditLeave || hasFullAccess) &&
              request.status === "PENDING" && (
                <div className="flex flex-col space-y-2">
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

                  {!request.documentUrl && (
                    <div className="flex flex-col items-end">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,image/*"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingDoc}
                      >
                        {isUploadingDoc ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Upload Document
                      </Button>
                      {request.submitToAdmin && (
                        <span className="text-[10px] text-amber-600 font-medium italic mt-1">
                          * Employee will submit to admin
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

            {(canEditLeave || hasFullAccess) &&
              request.status !== "PENDING" &&
              !request.documentUrl && (
                <div className="flex flex-col items-end space-y-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,image/*"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingDoc}
                  >
                    {isUploadingDoc ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Document
                  </Button>
                  {request.submitToAdmin && (
                    <span className="text-[10px] text-amber-600 font-medium italic">
                      * Employee will submit to admin
                    </span>
                  )}
                </div>
              )}

            {request.documentUrl && (
              <Button size="sm" variant="outline" asChild>
                <a
                  href={request.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Document
                </a>
              </Button>
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
