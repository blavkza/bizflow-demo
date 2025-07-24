"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Eye, FileText } from "lucide-react";

export const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "VIEWED":
        return "bg-yellow-100 text-yellow-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "EXPIRED":
        return <Clock className="h-4 w-4" />;
      case "VIEWED":
        return <Eye className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Badge className={getStatusColor()}>
      {getStatusIcon()}
      <span className="ml-1">{status}</span>
    </Badge>
  );
};
