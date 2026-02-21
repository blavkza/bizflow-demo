"use client";

import {
  Mail,
  Phone,
  Building,
  Eye,
  Shield,
  ShieldOff,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Trainee {
  id: string;
  traineeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  position: string;
  department: string;
  status: string;
  salary: number;
  address: string;
  hireDate: string;
  reliable: boolean;
  avatar?: string;
}

interface TraineesListProps {
  trainees: Trainee[];
  hasFullAccess: boolean;
  canViewTrainees: boolean;
}

export default function TraineesList({
  trainees = [],
  hasFullAccess,
  canViewTrainees,
}: TraineesListProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      case "ON_LEAVE":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReliableColor = (reliable: boolean) => {
    return reliable
      ? "bg-blue-100 text-blue-800"
      : "bg-orange-100 text-orange-800";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  const getAvatarFallback = (trainee: Trainee) => {
    const firstName = trainee?.firstName || "";
    const lastName = trainee?.lastName || "";
    if (!firstName && !lastName) return "TR";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getFullName = (trainee: Trainee) => {
    const firstName = trainee?.firstName || "";
    const lastName = trainee?.lastName || "";
    if (!firstName && !lastName) return "Unknown Trainee";
    return `${firstName} ${lastName}`.trim();
  };

  if (!trainees || trainees.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No trainees found</h3>
            <p className="text-muted-foreground">
              No trainees match your current filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trainees.map((trainee) => {
        if (!trainee) return null;

        const fullName = getFullName(trainee);
        const avatarFallback = getAvatarFallback(trainee);

        return (
          <Card key={trainee.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage
                      src={trainee.avatar || "/placeholder.svg"}
                      alt={fullName}
                    />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-md">{fullName}</CardTitle>
                    <CardDescription>
                      {trainee.position || "No Position"}
                    </CardDescription>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/dashboard/human-resources/trainees/${trainee.id}`,
                    )
                  }
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(trainee.status)}>
                  {trainee.status
                    ? trainee.status.replace("_", " ")
                    : "UNKNOWN"}
                </Badge>
                <Badge className={getReliableColor(trainee.reliable)}>
                  {trainee.reliable ? (
                    <Shield className="h-3 w-3 mr-1" />
                  ) : (
                    <ShieldOff className="h-3 w-3 mr-1" />
                  )}
                  {trainee.reliable ? "Reliable" : "Not Reliable"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                {trainee.email && (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{trainee.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{trainee.phone || "No Phone"}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{trainee.department || "No Department"}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    ID: {trainee.traineeNumber || "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
