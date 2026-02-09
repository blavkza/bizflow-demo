import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Database, DollarSign, Wrench } from "lucide-react";
import { Tool } from "@/types/tool";
import { safeNumber, formatCurrency, formatCount } from "../utils";

interface ToolsSummaryProps {
  tools: Tool[];
}

export function ToolsSummary({ tools }: ToolsSummaryProps) {
  const totalTools = tools.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const availableTools = tools.reduce(
    (sum, t) => (t.status === "AVAILABLE" ? sum + (t.quantity || 0) : sum),
    0,
  );
  const toolsInMaintenance = tools.reduce(
    (sum, t) => (t.status === "MAINTENANCE" ? sum + (t.quantity || 0) : sum),
    0,
  );
  const toolsRented = tools.reduce(
    (sum, t) => (t.status === "RENTED" ? sum + (t.quantity || 0) : sum),
    0,
  );
  const rentableTools = tools.reduce(
    (sum, t) => (canToolBeRented(t) ? sum + (t.quantity || 0) : sum),
    0,
  );

  const totalRentalRevenue = tools.reduce((sum, tool) => {
    const toolRevenue =
      tool.rentals?.reduce((rentalSum, rental) => {
        return rentalSum + safeNumber(rental.totalCost);
      }, 0) || 0;
    return sum + toolRevenue;
  }, 0);

  const totalMaintenanceCost = tools.reduce((sum, tool) => {
    const maintenanceCost =
      tool.maintenanceLogs?.reduce((maintenanceSum, log) => {
        return maintenanceSum + safeNumber(log.cost);
      }, 0) || 0;
    return sum + maintenanceCost;
  }, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCount(totalTools)}</div>
          <p className="text-xs text-muted-foreground">
            {formatCount(rentableTools)} rentable
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tool Status</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCount(availableTools)} available
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCount(toolsRented)} rented •{" "}
            {formatCount(toolsInMaintenance)} maintenance
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rental Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalRentalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">Total rental income</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Maintenance Cost
          </CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalMaintenanceCost)}
          </div>
          <p className="text-xs text-muted-foreground">Total maintenance</p>
        </CardContent>
      </Card>
    </div>
  );
}

function canToolBeRented(tool: Tool): boolean {
  return (
    tool.canBeRented !== false &&
    tool.rentalRateDaily !== null &&
    tool.rentalRateDaily !== undefined
  );
}
