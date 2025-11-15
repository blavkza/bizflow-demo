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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { Search, Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { ClientWithRelations } from "./types";
import InvoicePaymentForm from "./PaymentForm";

interface PaymentsTabProps {
  client: ClientWithRelations;
  fetchClient: () => void;
  hasFullAccess: boolean;
  canEditClient: boolean;
  canCreateTransation: boolean;
}

export function PaymentsTab({
  client,
  fetchClient,
  hasFullAccess,
  canCreateTransation,
  canEditClient,
}: PaymentsTabProps) {
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
      invoiceNumber: invoice.invoiceNumber,
      invoiceAmount: invoice.totalAmount,
      status: payment.paidAt ? "Paid" : "Pending",
      date: payment.paidAt
        ? new Date(payment.paidAt).toLocaleDateString()
        : "Pending",
    }))
  );

  const filteredPayments = allPayments.filter((payment) =>
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
        {((canCreateTransation && canEditClient) || hasFullAccess) && (
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
            <DialogContent className="sm:max-w-[425px] md:min-w-[800px] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
                <DialogDescription>
                  Record a payment received from {client.name}.
                </DialogDescription>
              </DialogHeader>
              <InvoicePaymentForm
                type="create"
                clientId={client.id}
                onCancel={() => setIsPaymentDialogOpen(false)}
                onSubmitSuccess={() => {
                  setIsPaymentDialogOpen(false);
                  if (fetchClient) fetchClient();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
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
