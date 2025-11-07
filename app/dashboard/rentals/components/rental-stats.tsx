import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Banknote,
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

  // Revenue calculations based on amountPaid (actual revenue received)
  const totalRevenue = rentals.reduce(
    (sum, r) => sum + formatDecimal(r.amountPaid),
    0
  );

  // Calculate revenue by status
  const activePaidRevenue = rentals
    .filter((r) => r.status === "ACTIVE")
    .reduce((sum, r) => sum + formatDecimal(r.amountPaid), 0);

  const completedPaidRevenue = rentals
    .filter((r) => r.status === "COMPLETED")
    .reduce((sum, r) => sum + formatDecimal(r.amountPaid), 0);

  // Calculate pending amounts (total cost minus amount already paid)
  const pendingRevenue = rentals
    .filter((r) => r.paymentStatus === "PENDING" && r.status !== "CANCELLED")
    .reduce((sum, r) => {
      const totalCost = formatDecimal(r.totalCost || 0);
      const amountPaid = formatDecimal(r.amountPaid);
      return sum + (totalCost - amountPaid);
    }, 0);

  // Calculate overdue amounts
  const overdueRevenue = rentals
    .filter((r) => r.paymentStatus === "OVERDUE")
    .reduce((sum, r) => {
      const totalCost = formatDecimal(r.totalCost || 0);
      const amountPaid = formatDecimal(r.amountPaid);
      return sum + (totalCost - amountPaid);
    }, 0);

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
      revenue: activePaidRevenue,
    },
    {
      title: "Pending Approval",
      value: pendingRentals,
      description: "Awaiting approval",
      icon: Clock,
    },
    {
      title: "Total Revenue",
      value: `R${totalRevenue.toFixed(2)}`,
      description: "Total received",
      icon: DollarSign,
      subtitle: `R${completedPaidRevenue.toFixed(2)} from completed`,
    },
    {
      title: "Pending Revenue",
      value: `R${pendingRevenue.toFixed(2)}`,
      description: "To be collected",
      icon: TrendingUp,
      className: "text-orange-600",
    },
    {
      title: "Paid Rentals",
      value: paidRentals,
      description: "Fully paid",
      icon: CheckCircle,
      iconClass: "text-green-600",
    },
    {
      title: "Overdue",
      value: overdueRentals,
      description: "Past due date",
      icon: AlertCircle,
      className: "text-red-600",
      subtitle: `R${overdueRevenue.toFixed(2)} overdue`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {stats.map((stat, index) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon
              className={`h-4 w-4 ${stat.iconClass || "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.className || ""}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            {stat.revenue !== undefined && stat.revenue > 0 && (
              <p className="text-xs text-green-600 mt-1">
                R{stat.revenue.toFixed(2)} received
              </p>
            )}
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.subtitle}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
