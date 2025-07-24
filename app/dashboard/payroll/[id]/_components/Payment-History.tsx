"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Employee, PaymentType } from "@prisma/client";
import { useState } from "react";

interface PaymentHistoryProps {
  employee: Employee & {
    department?: {
      id: string;
      name: string;
      manager?: {
        name: string;
      } | null;
    } | null;
    payments?: {
      id: string;
      amount: number;
      payDate: Date;
      type: PaymentType;
      status: string;
      description?: string | null;
    }[];
  };
}

export default function PaymentHistory({ employee }: PaymentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<PaymentType | "all">("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Filter payments based on search and filters
  const filteredPayments = employee.payments?.filter((payment) => {
    // Search term filter (description or amount)
    const matchesSearch =
      searchTerm === "" ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.amount.toString().includes(searchTerm);

    // Payment type filter
    const matchesType = typeFilter === "all" || payment.type === typeFilter;

    // Year filter
    const paymentYear = new Date(payment.payDate).getFullYear().toString();
    const matchesYear = yearFilter === "all" || paymentYear === yearFilter;

    return matchesSearch && matchesType && matchesYear;
  });

  // Get unique years from payments for year filter
  const paymentYears = [
    ...new Set(
      employee.payments?.map((payment) =>
        new Date(payment.payDate).getFullYear().toString()
      ) || []
    ),
  ].sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Complete payment record for {employee.firstName} {employee.lastName}
          </CardDescription>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as PaymentType | "all")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(PaymentType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={yearFilter}
              onValueChange={(value) => setYearFilter(value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {paymentYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments?.length === 0 ? (
            <div className="flex items-center justify-center p-6">
              No payments found matching your criteria
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.payDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {payment.type.charAt(0).toUpperCase() +
                        payment.type.slice(1).toLowerCase()}
                    </TableCell>
                    <TableCell className=" truncate  ">
                      {payment.description || "No description"}
                    </TableCell>
                    <TableCell>R{payment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === "PAID" ? "default" : "secondary"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
