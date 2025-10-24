import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, UserCheck, QrCode } from "lucide-react";
import { CheckInRecord } from "../types";
import { getCheckInMethodColor } from "../utils";
import { CheckInMethodIcon } from "../icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface CheckInsListProps {
  checkins: CheckInRecord[];
  loading: boolean;
}

export function CheckInsList({ checkins, loading }: CheckInsListProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading check-in history...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Check-ins</CardTitle>
        <CardDescription>
          Complete history of check-ins by method (GPS, Manual, Barcode)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checkins.map((checkin) => (
            <div
              key={checkin.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div
                onClick={() =>
                  router.push(
                    `/dashboard/human-resources/employees/${checkin.employeeId}`
                  )
                }
                className="flex items-center space-x-4 cursor-pointer "
              >
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
                  <h4 className="font-medium">{checkin.employeeName}</h4>
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
                    <CheckInMethodIcon method={checkin.method} />
                    <span className="ml-1">{checkin.method}</span>
                  </Badge>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{checkin.location}</p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="text-sm">{checkin.address}</p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {new Date(checkin.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                {checkin.accuracy && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-sm">{checkin.accuracy}m</p>
                  </div>
                )}

                {checkin.coordinates && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Coordinates</p>
                    <p className="text-xs font-mono">
                      {checkin.coordinates.lat.toFixed(4)},{" "}
                      {checkin.coordinates.lng.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
