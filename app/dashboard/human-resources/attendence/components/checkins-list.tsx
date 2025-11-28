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
import {
  MapPin,
  UserCheck,
  QrCode,
  User,
  UserCog,
  Eye,
  LogOut,
} from "lucide-react";
import { CheckInRecord } from "../types";
import { getCheckInMethodColor, safeDecimalToNumber } from "../utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CheckInsListProps {
  checkins: CheckInRecord[];
  loading: boolean;
}

export function CheckInsList({ checkins, loading }: CheckInsListProps) {
  const [selectedRecord, setSelectedRecord] = useState<CheckInRecord | null>(
    null
  );
  const [showMap, setShowMap] = useState(false);
  const [mapType, setMapType] = useState<"checkin" | "checkout">("checkin");

  const handleShowMap = (
    checkin: CheckInRecord,
    type: "checkin" | "checkout"
  ) => {
    setSelectedRecord(checkin);
    setMapType(type);
    setShowMap(true);
  };

  const handleCloseMap = () => {
    setShowMap(false);
    setSelectedRecord(null);
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
          <CardTitle>All Check-ins & Check-outs</CardTitle>
          <CardDescription>
            Complete history of check-ins and check-outs by method (GPS, Manual,
            Barcode) for Employees & Freelancers
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
              const checkInCoordinates = getSafeCoordinates(
                checkin.coordinates
              );
              const checkOutCoordinates = getSafeCoordinates(
                checkin.checkOutCoordinates
              );
              const hasCheckInCoordinates = checkInCoordinates !== null;
              const hasCheckOutCoordinates = checkOutCoordinates !== null;

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
                    {/* Check-in Method */}
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

                    {/* Check-in Location */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Check-in Location
                      </p>
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
                        {hasCheckInCoordinates && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowMap(checkin, "checkin")}
                            className="h-6 w-6 p-0 hover:bg-blue-50"
                            title="View check-in on map"
                          >
                            <Eye className="h-3 w-3 text-blue-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Check-out Location */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Check-out Location
                      </p>
                      <div className="flex items-center space-x-2">
                        {checkin.checkOutAddress ? (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center justify-center space-x-1 cursor-pointer overflow-hidden whitespace-nowrap text-ellipsis max-w-[200px]">
                                <LogOut className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {checkin.checkOutAddress}
                                </span>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto max-w-xs">
                              {checkin.checkOutAddress}
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          <p className="text-sm">N/A</p>
                        )}
                        {hasCheckOutCoordinates && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowMap(checkin, "checkout")}
                            className="h-6 w-6 p-0 hover:bg-green-50"
                            title="View check-out on map"
                          >
                            <Eye className="h-3 w-3 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Check-in Time */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Check-in Time
                      </p>
                      <p className="font-medium text-sm">
                        {new Date(checkin.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(checkin.timestamp).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Check-out Time */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Check-out Time
                      </p>
                      <p className="font-medium text-sm">
                        {checkin.checkOutTimestamp ? (
                          new Date(
                            checkin.checkOutTimestamp
                          ).toLocaleTimeString()
                        ) : (
                          <span className="text-orange-500">-</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {checkin.checkOutTimestamp ? (
                          new Date(
                            checkin.checkOutTimestamp
                          ).toLocaleDateString()
                        ) : (
                          <span className="text-orange-500">-</span>
                        )}
                      </p>
                    </div>

                    {/* Check-in Coordinates */}
                    {checkin.coordinates && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Check-in Coords
                        </p>
                        <p className="text-xs font-mono">
                          {formatCoordinate(checkin.coordinates.lat)},{" "}
                          {formatCoordinate(checkin.coordinates.lng)}
                        </p>
                      </div>
                    )}

                    {/* Check-out Coordinates */}
                    {checkin.checkOutCoordinates && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Check-out Coords
                        </p>
                        <p className="text-xs font-mono">
                          {formatCoordinate(checkin.checkOutCoordinates.lat)},{" "}
                          {formatCoordinate(checkin.checkOutCoordinates.lng)}
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
            <DialogTitle>
              {mapType === "checkin" ? "Check-in" : "Check-out"} Location
            </DialogTitle>
            <DialogDescription>
              Viewing {mapType} location for {selectedRecord?.employeeName}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              {/* Location Information */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Employee</p>
                  <p>{selectedRecord.employeeName}</p>
                </div>
                <div>
                  <p className="font-medium">Time</p>
                  <p>
                    {mapType === "checkin"
                      ? new Date(selectedRecord.timestamp).toLocaleString()
                      : selectedRecord.checkOutTimestamp
                        ? new Date(
                            selectedRecord.checkOutTimestamp
                          ).toLocaleString()
                        : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="truncate">
                    {mapType === "checkin"
                      ? selectedRecord.location
                      : selectedRecord.checkOutAddress || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Method</p>
                  <Badge
                    variant="outline"
                    className={getCheckInMethodColor(selectedRecord.method)}
                  >
                    {selectedRecord.method}
                  </Badge>
                </div>
                {mapType === "checkin" && selectedRecord.coordinates && (
                  <>
                    <div>
                      <p className="font-medium">Latitude</p>
                      <p className="font-mono">
                        {formatCoordinate(selectedRecord.coordinates.lat)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Longitude</p>
                      <p className="font-mono">
                        {formatCoordinate(selectedRecord.coordinates.lng)}
                      </p>
                    </div>
                  </>
                )}
                {mapType === "checkout" &&
                  selectedRecord.checkOutCoordinates && (
                    <>
                      <div>
                        <p className="font-medium">Latitude</p>
                        <p className="font-mono">
                          {formatCoordinate(
                            selectedRecord.checkOutCoordinates.lat
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Longitude</p>
                        <p className="font-mono">
                          {formatCoordinate(
                            selectedRecord.checkOutCoordinates.lng
                          )}
                        </p>
                      </div>
                    </>
                  )}
                {selectedRecord.accuracy && mapType === "checkin" && (
                  <div>
                    <p className="font-medium">Accuracy</p>
                    <p>{selectedRecord.accuracy}m</p>
                  </div>
                )}
              </div>

              {/* Map */}
              <div className="w-full h-96 rounded-lg overflow-hidden border">
                {mapType === "checkin" && selectedRecord.coordinates ? (
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d500!2d${safeDecimalToNumber(selectedRecord.coordinates.lng)}!3d${safeDecimalToNumber(selectedRecord.coordinates.lat)}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sza!4v${Date.now()}!5m2!1sen!2sza`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Check-in location of ${selectedRecord.employeeName}`}
                  />
                ) : mapType === "checkout" &&
                  selectedRecord.checkOutCoordinates ? (
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d500!2d${safeDecimalToNumber(selectedRecord.checkOutCoordinates.lng)}!3d${safeDecimalToNumber(selectedRecord.checkOutCoordinates.lat)}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sza!4v${Date.now()}!5m2!1sen!2sza`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Check-out location of ${selectedRecord.employeeName}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        No coordinates available
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Location:{" "}
                        {mapType === "checkin"
                          ? selectedRecord.location
                          : selectedRecord.checkOutAddress || "N/A"}
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
