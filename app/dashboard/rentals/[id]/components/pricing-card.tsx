import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolRentalDetail } from "../types";
import { formatDecimal } from "../utils";

interface PricingCardProps {
  rental: ToolRentalDetail;
}

export default function PricingCard({ rental }: PricingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-medium">{rental.rentalDays || 0} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Daily Rate</span>
          <span className="font-medium">
            R{formatDecimal(rental.rentalRate).toFixed(2)}
          </span>
        </div>
        <div className="border-t pt-3 flex justify-between font-semibold">
          <span>Total Cost</span>
          <span>R{formatDecimal(rental.totalCost).toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
