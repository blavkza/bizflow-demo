"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, Plus, FileText, Eye, Send, Download } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ClientWithRelations } from "./types";
import { useRouter } from "next/navigation";

interface InvoicesTabProps {
  client: ClientWithRelations;
}

export function InvoicesTab({ client }: InvoicesTabProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredInvoices =
    client.invoices?.filter((invoice) => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      return (
        invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
        invoice.status?.toLowerCase().includes(searchLower) ||
        invoice.totalAmount?.toString().includes(searchTerm) ||
        (invoice.dueDate &&
          new Date(invoice.dueDate)
            .toLocaleDateString()
            .includes(searchTerm)) ||
        (invoice.issueDate &&
          new Date(invoice.issueDate).toLocaleDateString().includes(searchTerm))
      );
    }) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-80"
          />
        </div>
      </div>
      <Card>
        {filteredInvoices.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-8">
            {client.invoices?.length === 0 ? (
              <>
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No invoices created
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create invoices for this client to track their billing
                  history.
                </p>
                <Button onClick={() => router.push(`/dashboard/invoices/new`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Invoice
                </Button>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No invoices found
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  No invoices match your search criteria.
                </p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear search
                </Button>
              </>
            )}
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const dueDate = invoice.dueDate
                  ? new Date(invoice.dueDate)
                  : null;
                const issueDate = invoice.issueDate
                  ? new Date(invoice.issueDate)
                  : null;
                const isOverdue =
                  invoice.status !== "PAID" &&
                  dueDate !== null &&
                  dueDate < new Date();
                const status = isOverdue
                  ? "Overdue"
                  : invoice.status || "Pending";

                return (
                  <TableRow
                    key={invoice.id}
                    onClick={() =>
                      router.push(`/dashboard/invoices/${invoice.id}`)
                    }
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber || `INV-${invoice.id.slice(-6)}`}
                    </TableCell>
                    <TableCell>
                      {issueDate ? issueDate.toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      {dueDate ? dueDate.toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      R{Number(invoice.totalAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(status)}>{status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
