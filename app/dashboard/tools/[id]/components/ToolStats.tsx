import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, Wrench } from "lucide-react";
import { Tool } from "@/types/tool";
import { formatCurrency, formatCount } from "../../utils";

interface ToolStatsProps {
  tool: Tool;
  canBeRented: boolean;
  totalRentalRevenue: number;
  totalMaintenanceCost: number;
  purchasePrice: number;
  depreciation: number;
  remainingValue: number;
}

export function ToolStats({
  tool,
  canBeRented,
  totalRentalRevenue,
  totalMaintenanceCost,
  purchasePrice,
  depreciation,
  remainingValue,
}: ToolStatsProps) {
  return (
    <>
      {/* Asset Value */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Asset Value
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Purchase Price:</span>
            <span className="font-medium">
              {formatCurrency(tool.purchasePrice)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Depreciation:</span>
            <span className="font-medium text-red-600">
              -{formatCurrency(depreciation)}
            </span>
          </div>
          <div className="pt-2 border-t flex justify-between font-semibold">
            <span>Current Value:</span>
            <span className="text-green-600">
              {formatCurrency(remainingValue)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Rental Rates - Only show if tool can be rented */}
      {canBeRented && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rental Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily:</span>
              <span className="font-medium">
                {formatCurrency(tool.rentalRateDaily)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weekly:</span>
              <span className="font-medium">
                {formatCurrency(tool.rentalRateWeekly)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly:</span>
              <span className="font-medium">
                {formatCurrency(tool.rentalRateMonthly)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Rentals:</span>
            <span className="font-medium">
              {formatCount(tool.rentals?.length)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Internal Uses:</span>
            <span className="font-medium">
              {formatCount(tool.InterUse?.length)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Maintenance Records:</span>
            <span className="font-medium">
              {formatCount(tool.maintenanceLogs?.length)}
            </span>
          </div>
          {canBeRented && (
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total Revenue:</span>
              <span className="text-green-600">
                {formatCurrency(totalRentalRevenue)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Cost */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Cost:</span>
            <span className="font-medium">
              {formatCurrency(totalMaintenanceCost)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Maintenance:</span>
            <span className="font-medium">
              {tool.maintenanceLogs && tool.maintenanceLogs.length > 0
                ? new Date(
                    tool.maintenanceLogs[0].maintenanceDate
                  ).toLocaleDateString()
                : "Never"}
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
