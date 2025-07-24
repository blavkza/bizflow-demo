import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InvoiceStatus } from "@/types/invoice";
import { CANCELLED } from "dns";

interface StatusBadgeProps {
  status: InvoiceStatus;
}

const getStatusIcon = (status: InvoiceStatus) => {
  const iconConfig = {
    PAID: <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />,
    SENT: <Clock className="h-4 w-4 text-blue-600" aria-hidden="true" />,
    OVERDUE: (
      <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
    ),
    DRAFT: <FileText className="h-4 w-4 text-gray-600" aria-hidden="true" />,
    CANCELLED: <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />,
  };
  return iconConfig[status] || iconConfig.DRAFT;
};

const getStatusColor = (status: InvoiceStatus) => {
  const colorConfig = {
    PAID: "bg-green-100 text-green-800",
    SENT: "bg-blue-100 text-blue-800",
    OVERDUE: "bg-red-100 text-red-800",
    DRAFT: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colorConfig[status] || colorConfig.DRAFT;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={getStatusColor(status)}>
      {getStatusIcon(status)}
      <span className="ml-1">{status}</span>
    </Badge>
  );
}
