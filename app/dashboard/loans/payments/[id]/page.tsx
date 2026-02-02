"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  Paperclip,
  User,
  ExternalLink,
  Banknote,
  BadgeCheck,
  Download,
  Trash,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRole, UserPermission } from "@prisma/client";

export default function LoanPaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id as string;
  const { userId: authId } = useAuth();
  const [loading, setLoading] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ["user", authId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/users/userId/${authId}`);
      return data;
    },
    enabled: !!authId,
  });

  const {
    data: payment,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["loan-payment", paymentId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/loans/payments/${paymentId}`);
      return data;
    },
    enabled: !!paymentId,
  });

  const hasFullAccess =
    userData?.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
    userData?.role === UserRole.ADMIN_MANAGER;
  const canDeletePayment =
    userData?.permissions?.includes(UserPermission.LOAN_PAYMENTS_DELETE) ||
    hasFullAccess;

  const onDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this payment? This will also remove the associated transaction record.",
      )
    )
      return;
    try {
      setLoading(true);
      await axios.delete(`/api/loans/payments/${paymentId}`);
      toast.success("Payment deleted successfully");
      router.back();
    } catch (error) {
      toast.error("Failed to delete payment");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading payment details...
      </div>
    );
  if (!payment)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Payment not found
      </div>
    );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Heading
            title={`Payment Receipt`}
            description={`Ref: ${payment.reference || "N/A"}`}
          />
        </div>
        {canDeletePayment && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={loading}
          >
            <Trash className="h-4 w-4 mr-2" /> Delete Payment
          </Button>
        )}
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="text-2xl font-bold">
                R{payment.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Payment Date</span>
              <span className="font-medium">
                {format(new Date(payment.date), "MMMM do, yyyy")}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline">{payment.type.replace("_", " ")}</Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm">
                {payment.reference || "NO-REF"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Audit Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Created By</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {payment.creator?.name || "System / Unspecified"}
                </span>
                {payment.creator && (
                  <BadgeCheck className="h-4 w-4 text-blue-500" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Lender</span>
              <span className="font-medium">{payment.loan?.lender}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm font-medium">
                Internal Notes
              </span>
              <p className="text-sm bg-slate-50 p-3 rounded-lg border italic">
                {payment.notes || "No notes provided for this transaction."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-slate-600" />
              Attachments & Documents
            </CardTitle>
            <CardDescription>
              Uploaded proof of payments or related correspondence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {payment.documents?.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center p-3 border rounded-lg gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      title={doc.name}
                    >
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(doc.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
              {(!payment.documents || payment.documents.length === 0) && (
                <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                  <Paperclip className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium italic">
                    No attachments found for this payment.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
