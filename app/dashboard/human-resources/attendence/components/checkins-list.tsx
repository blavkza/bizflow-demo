"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { MapPin, UserCheck, QrCode, User, UserCog, Eye } from "lucide-react";
import { CheckInRecord } from "../types";
import { getCheckInMethodColor, safeDecimalToNumber } from "../utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CheckInsListProps {
  checkins: CheckInRecord[];
  loading: boolean;
}

export function CheckInsList({ checkins, loading }: CheckInsListProps) {
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckInRecord | null>(
    null
  );
  const [showMap, setShowMap] = useState(false);

  const handleShowMap = (checkin: CheckInRecord) => {
    setSelectedCheckIn(checkin);
    setShowMap(true);
  };

  const handleCloseMap = () => {
    setShowMap(false);
    setSelectedCheckIn(null);
  };

  // Helper function to safely convert coordinates to numbers
  const getSafeCoordinates = (coordinates: any) => {
    if (!coordinates) return null;

    const lat = safeDecimalToNumber(coordinates.lat);
    const lng = safeDecimalToNumber(coordinates.lng);

    // Check if coordinates are valid numbers
    if (isNaN(lat) || isNaN(lng)) return null;

    return { lat, lng };
  };

  // Helper function to format coordinates for display
  const formatCoordinate = (coord: any): string => {
    const num = safeDecimalToNumber(coord);
    return isNaN(num) ? "N/A" : num.toFixed(4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading check-in history...</div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Check-ins</CardTitle>
          <CardDescription>
            Complete history of check-ins by method (GPS, Manual, Barcode) for
            Employees & Freelancers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checkins.map((checkin) => {
              const isFreelancer = checkin.employeeId.startsWith("FRL");
              const CheckInMethodIcon =
                checkin.method === "GPS"
                  ? MapPin
                  : checkin.method === "MANUAL"
                    ? UserCheck
                    : QrCode;

              // Safe coordinate access
              const coordinates = getSafeCoordinates(checkin.coordinates);
              const hasCoordinates = coordinates !== null;

              return (
                <div
                  key={checkin.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage
                        src={checkin.employeeAvatar || "/placeholder.svg"}
                        alt={checkin.employeeName}
                      />
                      <AvatarFallback>
                        {checkin.employeeName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{checkin.employeeName}</h4>
                        <Badge variant="outline" className="text-xs">
                          {checkin.personType === "freelancer" ? (
                            <UserCog className="w-3 h-3 mr-1" />
                          ) : (
                            <User className="w-3 h-3 mr-1" />
                          )}
                          {checkin.personType === "freelancer"
                            ? "Freelancer"
                            : "Employee"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {checkin.employeeNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Method</p>
                      <Badge
                        variant="outline"
                        className={getCheckInMethodColor(checkin.method)}
                      >
                        <CheckInMethodIcon className="h-3 w-3 mr-1" />
                        <span className="ml-1">{checkin.method}</span>
                      </Badge>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <div className="flex items-center space-x-2">
                        {checkin.address ? (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center justify-center space-x-1 cursor-pointer overflow-hidden whitespace-nowrap text-ellipsis max-w-[200px]">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {checkin.address}
                                </span>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto max-w-xs">
                              {checkin.address}
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          <p className="text-sm">N/A</p>
                        )}
                        {hasCoordinates && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowMap(checkin)}
                            className="h-6 w-6 p-0 hover:bg-blue-50"
                            title="View on map"
                          >
                            <Eye className="h-3 w-3 text-blue-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="text-sm max-w-[200px] truncate">
                        {checkin.address || "N/A"}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium text-sm">
                        {new Date(checkin.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(checkin.timestamp).toLocaleDateString()}
                      </p>
                    </div>

                    {checkin.accuracy && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Accuracy
                        </p>
                        <p className="text-sm">{checkin.accuracy}m</p>
                      </div>
                    )}

                    {checkin.coordinates && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Coordinates
                        </p>
                        <p className="text-xs font-mono">
                          {formatCoordinate(checkin.coordinates.lat)},{" "}
                          {formatCoordinate(checkin.coordinates.lng)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Map Dialog */}
      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Check-in Location</DialogTitle>
            <DialogDescription>
              Viewing location for {selectedCheckIn?.employeeName}'s check-in
            </DialogDescription>
          </DialogHeader>

          {selectedCheckIn && (
            <div className="space-y-4">
              {/* Location Information */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Employee</p>
                  <p>{selectedCheckIn.employeeName}</p>
                </div>
                <div>
                  <p className="font-medium">Time</p>
                  <p>{new Date(selectedCheckIn.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium ">Location</p>
                  <p className="truncate">{selectedCheckIn.location}</p>
                </div>
                <div>
                  <p className="font-medium">Method</p>
                  <Badge
                    variant="outline"
                    className={getCheckInMethodColor(selectedCheckIn.method)}
                  >
                    {selectedCheckIn.method}
                  </Badge>
                </div>
                {selectedCheckIn.coordinates && (
                  <>
                    <div>
                      <p className="font-medium">Latitude</p>
                      <p className="font-mono">
                        {formatCoordinate(selectedCheckIn.coordinates.lat)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Longitude</p>
                      <p className="font-mono">
                        {formatCoordinate(selectedCheckIn.coordinates.lng)}
                      </p>
                    </div>
                  </>
                )}
                {selectedCheckIn.accuracy && (
                  <div>
                    <p className="font-medium">Accuracy</p>
                    <p>{selectedCheckIn.accuracy}m</p>
                  </div>
                )}
              </div>

              {/* Map */}
              <div className="w-full h-96 rounded-lg overflow-hidden border">
                {selectedCheckIn.coordinates ? (
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d500!2d${safeDecimalToNumber(selectedCheckIn.coordinates.lng)}!3d${safeDecimalToNumber(selectedCheckIn.coordinates.lat)}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sza!4v${Date.now()}!5m2!1sen!2sza`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Location of ${selectedCheckIn.employeeName}'s check-in`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        No coordinates available
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Location: {selectedCheckIn.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleCloseMap}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
