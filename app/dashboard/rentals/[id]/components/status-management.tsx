import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Edit, CheckCircle, Package } from "lucide-react";
import { ToolRentalDetail } from "../types";
import { getStatusColor, formatDecimal } from "../utils";

interface StatusManagementProps {
  rental: ToolRentalDetail;
  onStatusDialogOpen: () => void;
}

export default function StatusManagement({
  rental,
  onStatusDialogOpen,
}: StatusManagementProps) {
  const paidAmount = formatDecimal(rental.amountPaid);
  const totalCost = formatDecimal(rental.totalCost);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Status</Label>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(rental.status)}>
              {rental.status.charAt(0).toUpperCase() +
                rental.status.slice(1).toLowerCase()}
            </Badge>
            <Button variant="outline" size="sm" onClick={onStatusDialogOpen}>
              <Edit className="h-3 w-3 mr-1" />
              Change
            </Button>
          </div>
        </div>

        {/* Status-specific actions */}
        {rental.status === "PENDING" && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">Actions:</p>
            <Button size="sm" className="w-full" onClick={onStatusDialogOpen}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate Rental
            </Button>
          </div>
        )}

        {rental.status === "ACTIVE" && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">Actions:</p>
            <Button size="sm" className="w-full" onClick={onStatusDialogOpen}>
              <Package className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
          </div>
        )}

        {/* Payment status info */}
        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-1">Payment Status</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid</span>
            <span className="font-medium">R{paidAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pending</span>
            <span className="font-medium text-orange-600">
              R{(totalCost - paidAmount).toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
