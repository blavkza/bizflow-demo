"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  FileDigit,
} from "lucide-react";
import { Client } from "@prisma/client";

export interface Invoice {
  id: string;
  number: string;
  totalAmount: number;
  status: string;
  issueDate: Date;
  dueDate: Date;
  payments: {
    id: string;
    amount: number;
    method: string;
    description: string;
    paidAt: Date | null;
  }[];
}

interface OverviewTabProps {
  client: Client & {
    invoices?: Invoice[];
    documents?: any[];
  };
}

export function OverviewTab({ client }: OverviewTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "Active":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{client.address}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Client since {new Date(client.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax Number:</span>
              <span>{client.taxNumber || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Website:</span>
              <span>{client.website || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client Type:</span>
              <Badge variant="outline">{client.type}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge className={getStatusColor(client.status)}>
                {client.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileDigit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.invoices?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {client.invoices?.filter((i) => i.status === "PAID").length || 0}{" "}
              paid
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* <div className="text-2xl font-bold">
              R
              {(
                client.invoices?.reduce(
                  (sum, invoice) => sum + invoice.,
                  0
                ) || 0
              ).toLocaleString()}
            </div> */}
            <p className="text-xs text-muted-foreground">
              {(
                client.invoices
                  ?.flatMap((i) => i.payments)
                  .reduce((sum, payment) => sum + (payment?.amount || 0), 0) ||
                0
              ).toLocaleString()}{" "}
              received
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.documents?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {client.documents?.filter((d) => d.type === "CONTRACT").length ||
                0}{" "}
              contracts
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
