import { ToolRentalDetail, TimelineEvent, StatusOption } from "./types";

export function formatDecimal(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  if (typeof value === "object" && "toNumber" in value) {
    return value.toNumber();
  }
  return parseFloat(value.toString());
}

export function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-blue-100 text-blue-800";
    case "PENDING":
      return "bg-purple-100 text-purple-800";
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    case "OVERDUE":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getPaymentStatusColor(status: string) {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800";
    case "PARTIAL":
      return "bg-yellow-100 text-yellow-800";
    case "PENDING":
      return "bg-orange-100 text-orange-800";
    case "OVERDUE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getConditionColor(condition: string) {
  switch (condition) {
    case "EXCELLENT":
      return "bg-green-50 text-green-700 border-green-200";
    case "GOOD":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "FAIR":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "POOR":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export function calculateTimeline(rental: ToolRentalDetail): TimelineEvent[] {
  const {
    FileText,
    Calendar,
    DollarSign,
    Package,
    CheckCircle,
  } = require("lucide-react");

  const timeline: TimelineEvent[] = [
    {
      id: 1,
      date: rental.createdAt,
      event: "Rental Agreement Created",
      description: "Rental agreement signed and confirmed",
      status: "completed",
      icon: FileText,
    },
    {
      id: 2,
      date: rental.rentalStartDate,
      event: "Rental Period Starts",
      description: "Tool rental period begins",
      status:
        new Date(rental.rentalStartDate) <= new Date()
          ? "completed"
          : "pending",
      icon: Calendar,
    },
    {
      id: 3,
      date: rental.rentalEndDate,
      event: "Rental Period Ends",
      description: "Scheduled return date",
      status:
        new Date(rental.rentalEndDate) < new Date() ? "completed" : "pending",
      icon: Calendar,
    },
  ];

  if (rental.quotation) {
    timeline.splice(1, 0, {
      id: 4,
      date: rental.createdAt,
      event: "Quotation Created",
      description: "Rental quotation generated",
      status: "completed",
      icon: FileText,
    });
  }

  if (rental.invoice) {
    timeline.push({
      id: 5,
      date: rental.createdAt,
      event: "Invoice Generated",
      description: "Payment invoice created",
      status: "completed",
      icon: DollarSign,
    });
  }

  if (rental.status === "ACTIVE") {
    timeline.push({
      id: 6,
      date: new Date().toISOString(),
      event: "Tool in Use",
      description: "Tool is currently with customer",
      status: "completed",
      icon: Package,
    });
  }

  if (rental.status === "COMPLETED") {
    timeline.push({
      id: 7,
      date: new Date().toISOString(),
      event: "Rental Completed",
      description: "Tool returned and rental completed",
      status: "completed",
      icon: CheckCircle,
    });
  }

  return timeline.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function getAvailableStatusOptions(
  rental: ToolRentalDetail
): StatusOption[] {
  const baseOptions: StatusOption[] = [
    {
      value: "PENDING",
      label: "Pending",
      description: "Rental is awaiting confirmation",
    },
    {
      value: "ACTIVE",
      label: "Active",
      description: "Tool is currently rented",
    },
    {
      value: "COMPLETED",
      label: "Completed",
      description: "Rental has been completed",
    },
    {
      value: "CANCELLED",
      label: "Cancelled",
      description: "Rental was cancelled",
    },
  ];

  return baseOptions.filter((option) => {
    if (option.value === rental.status) return false;

    switch (rental.status) {
      case "PENDING":
        return option.value === "ACTIVE" || option.value === "CANCELLED";
      case "ACTIVE":
        return option.value === "COMPLETED" || option.value === "CANCELLED";
      case "COMPLETED":
        return false;
      case "CANCELLED":
        return false;
      default:
        return true;
    }
  });
}

export function getToolImage(tool: any): string | null {
  if (tool.primaryImage) return tool.primaryImage;
  if (tool.images && typeof tool.images === "string") return tool.images;
  if (tool.images && Array.isArray(tool.images) && tool.images.length > 0) {
    return tool.images[0];
  }
  return null;
}
