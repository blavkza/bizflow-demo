import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { Tool } from "@/types/tool";
import { getStatusColor, formatCurrency } from "../../utils";

interface RentalHistoryProps {
  tool: Tool;
  canBeRented: boolean;
}

export function RentalHistory({ tool, canBeRented }: RentalHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental History</CardTitle>
        <CardDescription>All rental records for this tool</CardDescription>
      </CardHeader>
      <CardContent>
        {(tool.rentals || []).length > 0 ? (
          <div className="space-y-4">
            {(tool.rentals || []).map((rental) => (
              <div key={rental.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{rental.businessName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(rental.rentalStartDate).toLocaleDateString()} -{" "}
                      {new Date(rental.rentalEndDate).toLocaleDateString()}
                    </p>
                    {rental.renterContact && (
                      <p className="text-sm text-muted-foreground">
                        Contact: {rental.renterContact}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(rental.status)}>
                      {rental.status.replace("_", " ").toLowerCase()}
                    </Badge>
                    <p className="text-sm font-medium mt-1">
                      {formatCurrency(rental.totalCost)}
                    </p>
                  </div>
                </div>
                {rental.notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {rental.notes}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(rental.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {canBeRented
                ? "No rental history found"
                : "This tool is not available for rental"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
