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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Client } from "@prisma/client";

export interface Invoice {
  id: string;
  number: string;
  totalAmount: number;
  status?: string;
  issueDate?: Date | string;
  dueDate?: Date | string;
  payments?: {
    id: string;
    amount: number;
    method: string;
    description: string;
    paidAt: Date | null;
  }[];
}

interface PaymentsTabProps {
  client: Client & {
    invoices?: Invoice[];
  };
  fetchInvoices: () => Promise<void>;
}

export function PaymentsTab({ client, fetchInvoices }: PaymentsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [paymentDescription, setPaymentDescription] = useState("");

  // Flatten all payments from invoices and add invoice info
  const allPayments = (client.invoices || []).flatMap((invoice) =>
    (invoice.payments || []).map((payment) => ({
      ...payment,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      invoiceAmount: invoice.totalAmount,
      status: payment.paidAt ? "Paid" : "Pending",
      date: payment.paidAt
        ? new Date(payment.paidAt).toLocaleDateString()
        : "Pending",
    }))
  );

  const filteredPayments = allPayments.filter(
    (payment) =>
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRecordPayment = async () => {
    try {
      const amountNumber = parseFloat(paymentAmount);
      if (isNaN(amountNumber) || amountNumber <= 0) {
        toast.error("Please enter a valid payment amount");
        return;
      }
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountNumber,
          method: paymentMethod,
          description: paymentDescription,
          clientId: client.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Payment recording failed");
      }

      toast.success("Payment recorded successfully");
      setIsPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentMethod("bank");
      setPaymentDescription("");
      await fetchInvoices();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to record payment");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-80"
            />
          </div>
        </div>
        <Dialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
              <DialogDescription>
                Record a payment received from {client.name}.
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
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="method" className="text-right">
                  Method
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value)}
                >
                  <SelectTrigger id="method" className="col-span-3">
                    <SelectValue placeholder="Payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="card">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="Payment description"
                  className="col-span-3"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleRecordPayment}>Record Payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        {allPayments.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-8">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payments recorded</h3>
            <p className="text-muted-foreground text-center mb-4">
              Record payments received from this client to track their payment
              history.
            </p>
            <Button onClick={() => setIsPaymentDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record First Payment
            </Button>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{payment.invoiceNumber}</TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>R{payment.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
