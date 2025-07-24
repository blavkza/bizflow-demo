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
import { Client } from "@prisma/client";
import Link from "next/link";

export interface Invoice {
  id: string;
  invoiceNumber: string; // changed from `number`
  clientId: string;
  amount: string | number; // amount can be string or number from your data
  status?: string;
  issueDate?: string | Date;
  dueDate?: string | Date;
  payments?: {
    id: string;
    amount: number;
    method: string;
    description: string;
    paidAt: Date | null;
  }[];
}

interface InvoicesTabProps {
  client: Client & {
    invoices?: Invoice[];
  };
  fetchInvoices: () => Promise<void>;
}

export function InvoicesTab({ client, fetchInvoices }: InvoicesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");

  const filteredInvoices = (client.invoices || []).filter((invoice) =>
    invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleCreateInvoice = async () => {
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(invoiceAmount),
          description: invoiceDescription,
          dueDate: invoiceDueDate,
          clientId: client.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Invoice creation failed");
      }

      toast.success("Invoice created successfully");
      setIsInvoiceDialogOpen(false);
      setInvoiceAmount("");
      setInvoiceDescription("");
      setInvoiceDueDate("");
      await fetchInvoices();
    } catch (error) {
      console.error("Invoice error:", error);
      toast.error("Failed to create invoice");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-80"
            />
          </div>
        </div>
        <Dialog
          open={isInvoiceDialogOpen}
          onOpenChange={setIsInvoiceDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create an invoice for {client.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  placeholder="0.00"
                  className="col-span-3"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="Invoice description"
                  className="col-span-3"
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  className="col-span-3"
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateInvoice}>Create Invoice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        {filteredInvoices.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices created</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create invoices for this client to track their billing history.
            </p>
            <Button onClick={() => setIsInvoiceDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Invoice
            </Button>
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
                // Safely parse dates and status
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
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {issueDate ? issueDate.toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      {dueDate ? dueDate.toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      R{Number(invoice.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(status)}>{status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            {" "}
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
