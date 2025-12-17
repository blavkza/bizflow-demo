"use client";

import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
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

interface Freelancer {
  id: string;
  freeLancerNumber: string;
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

interface FreelancersListProps {
  freelancers: Freelancer[];
  hasFullAccess: boolean;
  canViewFreelancers: boolean;
}

export default function FreelancersList({
  freelancers = [],
  hasFullAccess,
  canViewFreelancers,
}: FreelancersListProps) {
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

  // Safe function to get avatar fallback initials
  const getAvatarFallback = (freelancer: Freelancer) => {
    const firstName = freelancer?.firstName || "";
    const lastName = freelancer?.lastName || "";

    if (!firstName && !lastName) return "FL";

    const firstInitial = firstName.charAt(0) || "";
    const lastInitial = lastName.charAt(0) || "";

    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  // Safe function to get full name
  const getFullName = (freelancer: Freelancer) => {
    const firstName = freelancer?.firstName || "";
    const lastName = freelancer?.lastName || "";

    if (!firstName && !lastName) return "Unknown Freelancer";

    return `${firstName} ${lastName}`.trim();
  };

  if (!freelancers || freelancers.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No freelancers found</h3>
            <p className="text-muted-foreground">
              No freelancers match your current filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {freelancers.map((freelancer) => {
        if (!freelancer) return null;

        const fullName = getFullName(freelancer);
        const avatarFallback = getAvatarFallback(freelancer);

        return (
          <Card
            key={freelancer.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage
                      src={freelancer.avatar || "/placeholder.svg"}
                      alt={fullName}
                    />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-md">{fullName}</CardTitle>
                    <CardDescription>
                      {freelancer.position || "No Position"}
                    </CardDescription>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/dashboard/human-resources/freelancers/${freelancer.id}`
                    )
                  }
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(freelancer.status)}>
                  {freelancer.status
                    ? freelancer.status.replace("_", " ")
                    : "UNKNOWN"}
                </Badge>
                <Badge className={getReliableColor(freelancer.reliable)}>
                  {freelancer.reliable ? (
                    <Shield className="h-3 w-3 mr-1" />
                  ) : (
                    <ShieldOff className="h-3 w-3 mr-1" />
                  )}
                  {freelancer.reliable ? "Reliable" : "Not Reliable"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                {freelancer.email && (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{freelancer.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{freelancer.phone || "No Phone"}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{freelancer.department || "No Department"}</span>
                </div>

                {/*   <div className="flex items-center space-x-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    R{(freelancer.salary || 0).toLocaleString()} Per Day
                  </span>
                </div> */}
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    ID: {freelancer.freeLancerNumber || "N/A"}
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
