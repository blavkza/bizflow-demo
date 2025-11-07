import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { ToolRentalDetail } from "../types";
import {
  getStatusColor,
  getPaymentStatusColor,
  getConditionColor,
} from "../utils";

interface StatusBadgesProps {
  rental: ToolRentalDetail;
}

export default function StatusBadges({ rental }: StatusBadgesProps) {
  const isOverdue =
    new Date(rental.rentalEndDate) < new Date() &&
    rental.status !== "COMPLETED";

  return (
    <div className="flex flex-wrap gap-2">
      <Badge className={getStatusColor(rental.status)}>
        {rental.status.charAt(0).toUpperCase() +
          rental.status.slice(1).toLowerCase()}
      </Badge>
      <Badge className={getPaymentStatusColor(rental.paymentStatus)}>
        {rental.paymentStatus === "PARTIAL"
          ? "Partially Paid"
          : rental.paymentStatus.charAt(0).toUpperCase() +
            rental.paymentStatus.slice(1).toLowerCase()}
      </Badge>
      <Badge
        variant="outline"
        className={getConditionColor(rental.tool.condition)}
      >
        {rental.tool.condition.charAt(0).toUpperCase() +
          rental.tool.condition.slice(1).toLowerCase()}{" "}
        Condition
      </Badge>
      {rental.damageReported && (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Damage Reported
        </Badge>
      )}
      {isOverdue && (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          <Clock className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      )}
    </div>
  );
}
