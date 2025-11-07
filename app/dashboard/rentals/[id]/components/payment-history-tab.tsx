"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2 } from "lucide-react";
import { ToolRentalDetail } from "../types";
import { formatDecimal } from "../utils";

interface PaymentHistoryTabProps {
  rental: ToolRentalDetail;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  reference: string;
  notes: string | null;
  status: string;
}

export default function PaymentHistoryTab({ rental }: PaymentHistoryTabProps) {
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const response = await fetch(`/api/tool-rentals/${rental.id}/payments`);
        if (response.ok) {
          const data = await response.json();
          setPaymentHistory(data.invoicePayments || []);
        }
      } catch (error) {
        console.error("Error fetching payment history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (rental.id) {
      fetchPaymentHistory();
    }
  }, [rental.id]);

  const getPaymentMethodDisplay = (method: string) => {
    const methodMap: { [key: string]: string } = {
      BANK_TRANSFER: "Bank Transfer",
      CREDIT_CARD: "Credit Card",
      CASH: "Cash",
      CHECK: "Check",
      OTHER: "Other",
    };
    return methodMap[method] || method;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>All payments made for this rental</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {paymentHistory.length > 0 ? (
          paymentHistory.map((payment) => (
            <div key={payment.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {getPaymentMethodDisplay(payment.method)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  +R{formatDecimal(payment.amount).toFixed(2)}
                </Badge>
              </div>
              {payment.reference && (
                <p className="text-sm text-muted-foreground">
                  Reference: {payment.reference}
                </p>
              )}
              {payment.notes && (
                <p className="text-sm text-muted-foreground">{payment.notes}</p>
              )}
              {payment.status && (
                <Badge
                  className={
                    payment.status === "COMPLETED"
                      ? "bg-green-100 text-green-800"
                      : payment.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }
                >
                  {payment.status.toLowerCase()}
                </Badge>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-muted-foreground">No payment history recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
