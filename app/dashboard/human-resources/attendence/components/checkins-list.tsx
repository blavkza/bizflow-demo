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
  Zap,
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
    null,
  );
  const [showMap, setShowMap] = useState(false);
  const [mapType, setMapType] = useState<"checkin" | "checkout">("checkin");

  const handleShowMap = (
    checkin: CheckInRecord,
    type: "checkin" | "checkout",
  ) => {
    setSelectedRecord(checkin);
    setMapType(type);
    setShowMap(true);
  };

  const handleCloseMap = () => {
    setShowMap(false);
    setSelectedRecord(null);
  };

  const getSafeCoordinates = (coordinates: any) => {
    if (!coordinates) return null;
    const lat = safeDecimalToNumber(coordinates.lat);
    const lng = safeDecimalToNumber(coordinates.lng);
    return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
  };

  const formatCoordinate = (coord: any): string => {
    const num = safeDecimalToNumber(coord);
    return isNaN(num) ? "N/A" : num.toFixed(6);
  };

  // Function to get map URL with exact pin location
  const getMapUrl = (
    coordinates: { lat: number; lng: number } | null,
    type: "checkin" | "checkout",
  ): string => {
    if (!coordinates) return "";

    const { lat, lng } = coordinates;
    const markerColor = type === "checkin" ? "0x3B82F6" : "0x10B981"; // Blue for check-in, Green for check-out
    const label = type === "checkin" ? "I" : "O";

    // Using Google Maps embed with marker at exact location
    // Option 1: Using maps.google.com with q parameter (shows pin)
    return `https://maps.google.com/maps?q=${lat},${lng}&z=17&t=m&output=embed`;

    // Option 2: Using Google Maps embed API (requires API key)
    // return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${lat},${lng}&zoom=17`;

    // Option 3: Using static map with marker (no zoom/pan)
    // return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=17&size=600x300&markers=color:${markerColor}%7Clabel:${label}%7C${lat},${lng}&scale=2&key=YOUR_API_KEY`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Card className="text-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">All Check-ins & Check-outs</CardTitle>
          <CardDescription className="text-xs">
            Complete history of check-ins and check-outs
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {checkins.map((checkin) => {
              const CheckInMethodIcon =
                checkin.method === "GPS"
                  ? MapPin
                  : checkin.method === "MANUAL"
                    ? UserCheck
                    : QrCode;

              const checkInCoordinates = getSafeCoordinates(
                checkin.coordinates,
              );
              const checkOutCoordinates = getSafeCoordinates(
                checkin.checkOutCoordinates,
              );
              const hasCheckInCoordinates = checkInCoordinates !== null;
              const hasCheckOutCoordinates = checkOutCoordinates !== null;

              return (
                <div
                  key={checkin.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  {/* Left Side - Person Info */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={checkin.employeeAvatar || "/placeholder.svg"}
                        alt={checkin.employeeName}
                      />
                      <AvatarFallback className="text-xs">
                        {checkin.employeeName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium truncate text-xs">
                          {checkin.employeeName}
                        </h4>
                        <Badge variant="outline" className="text-[10px] h-4">
                          {checkin.personType === "freelancer" ? (
                            <UserCog className="w-2.5 h-2.5 mr-1" />
                          ) : checkin.personType === "trainee" ? (
                            <Zap className="w-2.5 h-2.5 mr-1 text-amber-500" />
                          ) : (
                            <User className="w-2.5 h-2.5 mr-1" />
                          )}
                          {checkin.personType === "freelancer"
                            ? "FL"
                            : checkin.personType === "trainee"
                              ? "TRN"
                              : "EMP"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground truncate text-[10px]">
                        {checkin.employeeNumber}
                      </p>
                    </div>
                  </div>

                  {/* Right Side - Details */}
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    {/* Method */}
                    <div className="text-center">
                      <p className="text-muted-foreground text-[10px]">
                        Method
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          getCheckInMethodColor(checkin.method) +
                          " text-[10px] h-4"
                        }
                      >
                        <CheckInMethodIcon className="h-2.5 w-2.5 mr-1" />
                        {checkin.method}
                      </Badge>
                    </div>

                    {/* Check-in */}
                    <div className="text-center">
                      <p className="text-muted-foreground text-[10px]">
                        Check-in
                      </p>
                      <div className="flex items-center space-x-1">
                        {checkin.address ? (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center cursor-pointer max-w-[80px]">
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate text-[10px] ml-0.5">
                                  {checkin.address.split(",")[0]}
                                </span>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto max-w-xs text-xs">
                              {checkin.address}
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          <span className="text-[10px]">N/A</span>
                        )}
                        {hasCheckInCoordinates && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowMap(checkin, "checkin")}
                            className="h-5 w-5 p-0 hover:bg-blue-50"
                            title="View check-in map"
                          >
                            <Eye className="h-2.5 w-2.5 text-blue-600" />
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] font-medium">
                        {new Date(checkin.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Check-out */}
                    <div className="text-center">
                      <p className="text-muted-foreground text-[10px]">
                        Check-out
                      </p>
                      <div className="flex items-center space-x-1">
                        {checkin.checkOutAddress ? (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center cursor-pointer max-w-[80px]">
                                <LogOut className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate text-[10px] ml-0.5">
                                  {checkin.checkOutAddress.split(",")[0]}
                                </span>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto max-w-xs text-xs">
                              {checkin.checkOutAddress}
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          <span className="text-[10px]">N/A</span>
                        )}
                        {hasCheckOutCoordinates && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowMap(checkin, "checkout")}
                            className="h-5 w-5 p-0 hover:bg-green-50"
                            title="View check-out map"
                          >
                            <Eye className="h-2.5 w-2.5 text-green-600" />
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] font-medium">
                        {checkin.checkOutTimestamp ? (
                          new Date(
                            checkin.checkOutTimestamp,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        ) : (
                          <span className="text-orange-500">-</span>
                        )}
                      </p>
                    </div>

                    {/* Coordinates */}
                    <div className="text-center">
                      <p className="text-muted-foreground text-[10px]">
                        Coords
                      </p>
                      <div className="space-y-0.5">
                        {checkin.coordinates && (
                          <p className="font-mono text-[9px] leading-none">
                            {formatCoordinate(checkin.coordinates.lat)},<br />
                            {formatCoordinate(checkin.coordinates.lng)}
                          </p>
                        )}
                        {checkin.checkOutCoordinates && (
                          <p className="font-mono text-[9px] leading-none text-green-600">
                            {formatCoordinate(checkin.checkOutCoordinates.lat)},
                            <br />
                            {formatCoordinate(checkin.checkOutCoordinates.lng)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                            selectedRecord.checkOutTimestamp,
                          ).toLocaleString()
                        : "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium">Location</p>
                  <p className="truncate">
                    {mapType === "checkin"
                      ? selectedRecord.address || selectedRecord.location
                      : selectedRecord.checkOutAddress || "N/A"}
                  </p>
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
                            selectedRecord.checkOutCoordinates.lat,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Longitude</p>
                        <p className="font-mono">
                          {formatCoordinate(
                            selectedRecord.checkOutCoordinates.lng,
                          )}
                        </p>
                      </div>
                    </>
                  )}
              </div>

              <div className="w-full h-96 rounded-lg overflow-hidden border">
                {mapType === "checkin" && selectedRecord.coordinates ? (
                  <iframe
                    src={`https://maps.google.com/maps?q=${safeDecimalToNumber(selectedRecord.coordinates.lat)},${safeDecimalToNumber(selectedRecord.coordinates.lng)}&z=17&t=k&output=embed`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${mapType} location of ${selectedRecord.employeeName}`}
                  />
                ) : mapType === "checkout" &&
                  selectedRecord.checkOutCoordinates ? (
                  <iframe
                    src={`https://maps.google.com/maps?q=${safeDecimalToNumber(selectedRecord.checkOutCoordinates.lat)},${safeDecimalToNumber(selectedRecord.checkOutCoordinates.lng)}&z=17&t=k&output=embed`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${mapType} location of ${selectedRecord.employeeName}`}
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

