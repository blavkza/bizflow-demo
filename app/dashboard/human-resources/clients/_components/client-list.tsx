"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Archive,
  Building,
  Edit,
  Eye,
  Mail,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ClientWithInvoices {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  type: string;
  avatar: string | null;
  invoices?: {
    totalAmount: number;
    status: string;
    payments: {
      amount: number;
      createAt: Date | null;
    }[];
  }[];
}

interface ClientListProps {
  clients: ClientWithInvoices[];
  searchTerm: string;
  statusFilter: string;
}

export default function ClientList({
  clients,
  searchTerm,
  statusFilter,
}: ClientListProps) {
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company &&
        client.company.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ENTERPRISE":
        return "bg-purple-100 text-purple-800";
      case "BUSINESS":
        return "bg-blue-100 text-blue-800";
      case "SME":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateOutstanding = (client: ClientWithInvoices) => {
    if (!client.invoices) return 0;
    return client.invoices
      .filter((invoice) => invoice.status !== "PAID")
      .reduce((sum, invoice) => {
        const paidAmount = invoice.payments
          .filter((p) => p.createAt)
          .reduce((paidSum, payment) => paidSum + payment.amount, 0);
        return sum + (invoice.totalAmount - paidAmount);
      }, 0);
  };

  if (filteredClients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          No clients found matching your criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredClients.map((client) => {
        const outstandingBalance = calculateOutstanding(client);

        return (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage
                      src={client.avatar || "/placeholder.svg"}
                      alt={client.name}
                    />
                    <AvatarFallback>
                      {client.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {client.company ? client.company : client.name}
                    </CardTitle>
                    <CardDescription>{client.email}</CardDescription>
                  </div>
                </div>
                <Button variant={"outline"} size={"icon"}>
                  <Link
                    href={`/dashboard/human-resources/clients/${client.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge
                    variant="outline"
                    className={getTypeColor(client.type)}
                  >
                    {client.type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Outstanding
                  </span>
                  <span className="font-medium">
                    R{outstandingBalance.toLocaleString()}
                  </span>
                </div>
                {/*    <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Payment
                  </span>
                  <span className="text-sm">
                    {client.invoices?.[0]?.payments?.[0]?.createAt
                      ? new Date(
                          client.invoices[0].payments[0].createAt
                        ).toLocaleDateString()
                      : "None"}
                  </span>
                </div> */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Revenue
                  </span>
                  <span className="font-medium text-green-600">
                    R
                    {client.invoices
                      ?.reduce((sum, inv) => sum + inv.totalAmount, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
