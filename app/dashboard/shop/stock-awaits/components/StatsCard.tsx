import { Card, CardContent } from "@/components/ui/card";
import { StockAwait } from "../types";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface StatsCardProps {
  stockAwaits: StockAwait[];
}

export function StatsCard({ stockAwaits }: StatsCardProps) {
  const totalAwaits = stockAwaits.length;
  const pendingAwaits = stockAwaits.filter(
    (item) => item.status === "PENDING"
  ).length;
  const resolvedAwaits = stockAwaits.filter(
    (item) => item.status === "RESOLVED"
  ).length;
  const cancelledAwaits = stockAwaits.filter(
    (item) => item.status === "CANCELLED"
  ).length;

  const totalPendingQuantity = stockAwaits
    .filter((item) => item.status === "PENDING")
    .reduce((sum, item) => sum + item.quantity, 0);

  function calculateAverageResolutionTime(stockAwaits: StockAwait[]): string {
    const resolvedItems = stockAwaits.filter(
      (item) => item.status === "RESOLVED" && item.resolvedAt && item.createdAt
    );

    if (resolvedItems.length === 0) {
      return "N/A";
    }

    const totalMs = resolvedItems.reduce((sum, item) => {
      const created = new Date(item.createdAt).getTime();
      const resolved = new Date(item.resolvedAt!).getTime();
      return sum + (resolved - created);
    }, 0);

    const avgMs = totalMs / resolvedItems.length;
    const avgDays = avgMs / (1000 * 60 * 60 * 24);

    if (avgDays >= 1) {
      return `${avgDays.toFixed(1)} days`;
    } else {
      const avgHours = avgMs / (1000 * 60 * 60);
      if (avgHours >= 1) {
        return `${avgHours.toFixed(1)} hours`;
      } else {
        const avgMinutes = avgMs / (1000 * 60);
        return `${avgMinutes.toFixed(0)} min`;
      }
    }
  }

  const averageResolutionTime = calculateAverageResolutionTime(stockAwaits);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Awaits */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold">{totalAwaits}</div>
            <div className="text-sm text-muted-foreground">Total Awaits</div>
            <div className="text-xs text-blue-600">
              {pendingAwaits} pending • {resolvedAwaits} resolved
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Pending Units */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {totalPendingQuantity}
            </div>
            <div className="text-sm text-muted-foreground">Units Pending</div>
            <div className="text-xs text-yellow-600">
              Across {pendingAwaits} pending items
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Resolution Rate */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {totalAwaits > 0
                ? `${Math.round((resolvedAwaits / totalAwaits) * 100)}%`
                : "0%"}
            </div>
            <div className="text-sm text-muted-foreground">Resolution Rate</div>
            <div className="text-xs text-green-600">
              {resolvedAwaits} resolved • {cancelledAwaits} cancelled
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Avg. Resolution Time */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {averageResolutionTime}
            </div>
            <div className="text-sm text-muted-foreground">
              Avg. Resolution Time
            </div>
            <div className="text-xs text-purple-600">
              For resolved items only
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
