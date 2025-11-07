import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { ToolRentalDetail } from "../types";
import { formatDecimal } from "../utils";

interface RentalPeriodProps {
  rental: ToolRentalDetail;
}

export default function RentalPeriod({ rental }: RentalPeriodProps) {
  const isOverdue =
    new Date(rental.rentalEndDate) < new Date() &&
    rental.status !== "COMPLETED";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental Period</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="font-medium">
              {new Date(rental.rentalStartDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">End Date</p>
            <p className="font-medium">
              {new Date(rental.rentalEndDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">{rental.rentalDays || 0} days</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Daily Rate</p>
            <p className="font-medium">
              R{formatDecimal(rental.rentalRate).toFixed(2)}
            </p>
          </div>
        </div>
        {isOverdue && (
          <div className="pt-4 border-t">
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-700 border-orange-200"
            >
              <Clock className="h-3 w-3 mr-1" />
              Rental period has ended
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
