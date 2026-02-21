"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Calendar,
  User,
  UserCog,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  Eye,
} from "lucide-react";
import { EmergencyCallOut } from "../types";
import { formatTime } from "../utils";

interface CallOutListProps {
  records: EmergencyCallOut[];
  loading: boolean;
}

export function CallOutList({ records, loading }: CallOutListProps) {
  const [selectedRecord, setSelectedRecord] = useState<EmergencyCallOut | null>(
    null,
  );
  const [showMap, setShowMap] = useState(false);
  const [mapType, setMapType] = useState<"checkin" | "checkout">("checkin");

  const handleShowMap = (
    record: EmergencyCallOut,
    type: "checkin" | "checkout",
  ) => {
    setSelectedRecord(record);
    setMapType(type);
    setShowMap(true);
  };

  const handleCloseMap = () => {
    setShowMap(false);
    setSelectedRecord(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground text-sm">
          Loading call out records...
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No emergency call outs found
          </h3>
          <p className="text-muted-foreground text-center">
            There are no emergency call out records for the selected period.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Accepted
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Completed
          </Badge>
        );
      case "DECLINED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Declined
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Timer className="h-4 w-4 text-yellow-500" />;
      case "ACCEPTED":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "DECLINED":
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {records.map((record) => {
          const person = record.employee || record.freeLancer || record.trainee;
          const personType = record.employee
            ? "employee"
            : record.freeLancer
              ? "freelancer"
              : "trainee";
          const personName = person
            ? `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
              "Unknown"
            : "Unknown";
          const personNumber = record.employee
            ? record.employee.employeeNumber
            : record.freeLancer
              ? record.freeLancer.freeLancerNumber
              : record.trainee?.traineeNumber;

          return (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Left Side - Person Info */}
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar>
                      <AvatarImage
                        src={person?.avatar || "/placeholder.svg"}
                        alt={personName}
                      />
                      <AvatarFallback>
                        {personName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{personName}</h3>
                        <Badge variant="outline" className="text-[10px] h-4">
                          {personType === "employee" ? (
                            <User className="w-2.5 h-2.5 mr-1" />
                          ) : personType === "freelancer" ? (
                            <UserCog className="w-2.5 h-2.5 mr-1" />
                          ) : (
                            <Zap className="w-2.5 h-2.5 mr-1 text-amber-500" />
                          )}
                          {personType === "employee"
                            ? "EMP"
                            : personType === "freelancer"
                              ? "FL"
                              : "TRN"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {personNumber}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-destructive mt-0.5">
                        {record.title}
                      </p>
                      {record.message && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {record.message}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Requested:{" "}
                            {new Date(record.requestedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>
                            By: {record.requestedUser?.name || "System"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Status & Times */}
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusIcon(record.status)}
                        {getStatusBadge(record.status)}
                      </div>
                    </div>

                    <div className="text-center w-24">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Start Time
                      </p>
                      <p className="font-medium text-xs">
                        {new Date(record.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(record.startTime).toLocaleDateString([], {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>

                    <div className="text-center w-24">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-emerald-600">
                        Check In
                      </p>
                      <p className="font-medium text-xs">
                        {record.checkIn ? (
                          formatTime(record.checkIn)
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        {record.checkInAddress && (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center text-[10px] text-muted-foreground cursor-pointer">
                                <MapPin className="w-2.5 h-2.5 mr-0.5" />
                                <span className="truncate max-w-[60px]">
                                  {record.checkInAddress}
                                </span>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto max-w-xs text-xs">
                              {record.checkInAddress}
                            </HoverCardContent>
                          </HoverCard>
                        )}
                        {record.checkInLat && record.checkInLng && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowMap(record, "checkin")}
                            className="h-5 w-5 p-0 hover:bg-green-50"
                            title="View check-in map"
                          >
                            <Eye className="h-2.5 w-2.5 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="text-center w-24">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-emerald-600">
                        Check Out
                      </p>
                      <p className="font-medium text-xs">
                        {record.checkOut ? (
                          formatTime(record.checkOut)
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        {record.checkOutAddress && (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center text-[10px] text-muted-foreground cursor-pointer">
                                <MapPin className="w-2.5 h-2.5 mr-0.5" />
                                <span className="truncate max-w-[60px]">
                                  {record.checkOutAddress}
                                </span>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto max-w-xs text-xs">
                              {record.checkOutAddress}
                            </HoverCardContent>
                          </HoverCard>
                        )}
                        {record.checkOutLat && record.checkOutLng && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowMap(record, "checkout")}
                            className="h-5 w-5 p-0 hover:bg-blue-50"
                            title="View check-out map"
                          >
                            <Eye className="h-2.5 w-2.5 text-blue-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {record.duration && (
                      <div className="text-center w-20">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Duration
                        </p>
                        <p className="font-bold text-xs text-primary">
                          {record.duration.toFixed(1)}h
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Declined Reason */}
                {record.status === "DECLINED" && record.declinedReason && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-[10px] text-red-700 border border-red-100 italic">
                    <strong>Declined Reason:</strong> {record.declinedReason}
                  </div>
                )}

                {/* Notes */}
                {record.notes && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-[10px] text-muted-foreground border border-muted flex items-start gap-2">
                    <span className="font-semibold shrink-0">Notes:</span>
                    <span>{record.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Map Dialog */}
      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-4xl lg:min-w-[95vw] lg:min-h-[95vh] text-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {mapType === "checkin" ? "Check-in" : "Check-out"} Location
            </DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-medium">Person</p>
                  <p>
                    {selectedRecord.employee
                      ? `${selectedRecord.employee.firstName} ${selectedRecord.employee.lastName}`
                      : selectedRecord.freeLancer
                        ? `${selectedRecord.freeLancer.firstName} ${selectedRecord.freeLancer.lastName}`
                        : selectedRecord.trainee
                          ? `${selectedRecord.trainee.firstName} ${selectedRecord.trainee.lastName}`
                          : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Time</p>
                  <p>
                    {mapType === "checkin"
                      ? selectedRecord.checkIn
                        ? new Date(selectedRecord.checkIn).toLocaleString()
                        : "N/A"
                      : selectedRecord.checkOut
                        ? new Date(selectedRecord.checkOut).toLocaleString()
                        : "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium">Location</p>
                  <p className="truncate">
                    {mapType === "checkin"
                      ? selectedRecord.checkInAddress || "N/A"
                      : selectedRecord.checkOutAddress || "N/A"}
                  </p>
                </div>
                {mapType === "checkin" &&
                  selectedRecord.checkInLat &&
                  selectedRecord.checkInLng && (
                    <>
                      <div>
                        <p className="font-medium">Latitude</p>
                        <p className="font-mono">
                          {selectedRecord.checkInLat.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Longitude</p>
                        <p className="font-mono">
                          {selectedRecord.checkInLng.toFixed(6)}
                        </p>
                      </div>
                    </>
                  )}
                {mapType === "checkout" &&
                  selectedRecord.checkOutLat &&
                  selectedRecord.checkOutLng && (
                    <>
                      <div>
                        <p className="font-medium">Latitude</p>
                        <p className="font-mono">
                          {selectedRecord.checkOutLat.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Longitude</p>
                        <p className="font-mono">
                          {selectedRecord.checkOutLng.toFixed(6)}
                        </p>
                      </div>
                    </>
                  )}
              </div>

              <div className="w-full h-96 rounded-lg overflow-hidden border">
                {mapType === "checkin" &&
                selectedRecord.checkInLat &&
                selectedRecord.checkInLng ? (
                  <iframe
                    src={`https://maps.google.com/maps?q=${selectedRecord.checkInLat},${selectedRecord.checkInLng}&z=17&t=k&output=embed`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Check-in location`}
                  />
                ) : mapType === "checkout" &&
                  selectedRecord.checkOutLat &&
                  selectedRecord.checkOutLng ? (
                  <iframe
                    src={`https://maps.google.com/maps?q=${selectedRecord.checkOutLat},${selectedRecord.checkOutLng}&z=17&t=k&output=embed`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Check-out location`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                      <p className="text-muted-foreground text-xs">
                        No coordinates available
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

