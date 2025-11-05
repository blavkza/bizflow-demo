import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { ToolRental, formatDecimal } from "../types";

interface RentalStatsProps {
  rentals: ToolRental[];
}

export default function RentalStats({ rentals }: RentalStatsProps) {
  // Calculate statistics
  const activeRentals = rentals.filter((r) => r.status === "ACTIVE").length;
  const pendingRentals = rentals.filter((r) => r.status === "PENDING").length;
  const completedRentals = rentals.filter(
    (r) => r.status === "COMPLETED"
  ).length;

  // Revenue calculations
  const totalRevenue = rentals.reduce(
    (sum, r) => sum + formatDecimal(r.totalCost),
    0
  );

  const paidRevenue = rentals
    .filter((r) => r.paymentStatus === "PAID")
    .reduce((sum, r) => sum + formatDecimal(r.totalCost), 0);

  const pendingRevenue = rentals
    .filter((r) => r.paymentStatus === "PENDING" && r.status !== "CANCELLED")
    .reduce((sum, r) => sum + formatDecimal(r.totalCost), 0);

  const activeRevenue = rentals
    .filter((r) => r.status === "ACTIVE")
    .reduce((sum, r) => sum + formatDecimal(r.totalCost), 0);

  const paidRentals = rentals.filter((r) => r.paymentStatus === "PAID").length;
  const pendingPayments = rentals.filter(
    (r) => r.paymentStatus === "PENDING"
  ).length;
  const overdueRentals = rentals.filter(
    (r) => r.paymentStatus === "OVERDUE"
  ).length;

  const stats = [
    {
      title: "Active Rentals",
      value: activeRentals,
      description: "Currently rented",
      icon: Calendar,
      revenue: activeRevenue,
    },
    {
      title: "Pending Approval",
      value: pendingRentals,
      description: "Awaiting approval",
      icon: Clock,
    },
    {
      title: "Total Revenue",
      value: `R${(totalRevenue / 1000).toFixed(1)}k`,
      description: "All time revenue",
      icon: DollarSign,
    },
    {
      title: "Pending Revenue",
      value: `R${(pendingRevenue / 1000).toFixed(1)}k`,
      description: "To be collected",
      icon: TrendingUp,
      className: "text-orange-600",
    },
    {
      title: "Paid Rentals",
      value: paidRentals,
      description: "Payments received",
      icon: CheckCircle,
      revenue: paidRevenue,
    },
    {
      title: "Overdue",
      value: overdueRentals,
      description: "Past due date",
      icon: AlertCircle,
      className: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {stats.map((stat, index) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.className || ""}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            {stat.revenue !== undefined && (
              <p className="text-xs text-green-600 mt-1">
                R{stat.revenue.toFixed(2)} revenue
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
