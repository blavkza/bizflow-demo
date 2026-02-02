"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format, addMonths } from "date-fns";
import {
  Plus,
  Pencil,
  Trash,
  Wallet,
  CreditCard,
  Percent,
  Activity,
  Calculator,
  ArrowLeft,
  FileText,
  Paperclip,
  Download,
  ExternalLink,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserRole, UserPermission } from "@prisma/client";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { calculateLoan } from "@/lib/loan-calc";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "../../_components/document-upload";
import { FileUpload } from "../../_components/file-upload";
import { LenderModal } from "../../lenders/_components/lender-modal";
import { LoanModal } from "../../_components/loan-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import LoanDetailLoading from "../loading";

const paymentFormSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount is required"),
  date: z.string().min(1, "Date is required"),
  reference: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable().or(z.literal("")),
  type: z.enum(["REGULAR", "EXTRA", "INTEREST_ONLY", "EARLY_SETTLEMENT"]),
  attachments: z.array(z.any()).optional().default([]),
});

const loanFormSchema = z.object({
  lender: z.string().min(1, "Lender name is required"),
  lenderId: z.string().optional().nullable().or(z.literal("")),
  loanType: z.string().optional().nullable().or(z.literal("")),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  interestRate: z.coerce.number().min(0).max(100),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable().or(z.literal("")),
  termMonths: z.coerce.number().int().optional().nullable(),
  description: z.string().optional().nullable().or(z.literal("")),
  monthlyPayment: z.coerce.number().optional().nullable(),
  calculationMethod: z.enum(["AMORTIZED", "FLAT"]).default("AMORTIZED"),
  interestType: z.enum(["FIXED", "PRIME_LINKED"]).default("FIXED"),
  primeMargin: z.coerce.number().default(0),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;
type LoanFormValues = z.infer<typeof loanFormSchema>;

export const LoanDetailClient = ({ loanId }: { loanId: string }) => {
  const router = useRouter();
  const [openPayment, setOpenPayment] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openLenderModal, setOpenLenderModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    data: loan,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["loan", loanId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/loans/${loanId}`);
      return data;
    },
  });

  const { data: lenders } = useQuery({
    queryKey: ["lenders"],
    queryFn: async () => {
      const { data } = await axios.get("/api/lenders");
      return data;
    },
  });

  const { userId: authId } = useAuth();
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user", authId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/users/userId/${authId}`);
      return data;
    },
    enabled: !!authId,
  });

  const { data: financialSettings } = useQuery({
    queryKey: ["financial-settings"],
    queryFn: async () => {
      const { data } = await axios.get("/api/financial-settings");
      return data;
    },
  });

  const hasFullAccess =
    userData?.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
    userData?.role === UserRole.ADMIN_MANAGER;
  const canEditLoan =
    userData?.permissions?.includes(UserPermission.LOANS_EDIT) || hasFullAccess;
  const canDeleteLoan =
    userData?.permissions?.includes(UserPermission.LOANS_DELETE) ||
    hasFullAccess;
  const canRecordPayment =
    userData?.permissions?.includes(UserPermission.LOAN_PAYMENTS_CREATE) ||
    hasFullAccess;

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      type: "REGULAR",
      attachments: [],
    },
  });

  // Handled by LoanModal now

  const onPaymentSubmit = async (data: PaymentFormValues) => {
    try {
      setPaymentLoading(true);
      await axios.post(`/api/loans/${loanId}/payments`, data);
      toast.success(
        "Payment recorded with " +
          (data.attachments?.length || 0) +
          " attachments",
      );
      refetch();
      setOpenPayment(false);
      paymentForm.reset();
    } catch (error) {
      toast.error("Failed to record payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handled by LoanModal now

  const onDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this loan? This action cannot be undone.",
      )
    )
      return;
    try {
      setLoading(true);
      await axios.delete(`/api/loans/${loanId}`);
      toast.success("Loan deleted");
      router.push("/dashboard/loans");
    } catch (error) {
      toast.error("Failed to delete loan");
      setLoading(false);
    }
  };

  if (isLoading || userLoading) return <LoanDetailLoading />;
  if (!loan) return <div>Loan not found</div>;

  const totalPaid =
    loan.payments?.reduce((acc: number, curr: any) => acc + curr.amount, 0) ||
    0;

  // Prioritize stored persistent values, fallback to calc if missing
  let finalTotalPayable = loan.totalPayable;
  let storedInterest = loan.interestAmount;

  if (finalTotalPayable === null || finalTotalPayable === undefined) {
    const { totalPayable } = calculateLoan(
      loan.amount,
      loan.interestRate,
      loan.termMonths || 12,
      loan.calculationMethod || "AMORTIZED",
    );
    finalTotalPayable = totalPayable;
    if (loan.monthlyPayment && loan.termMonths) {
      finalTotalPayable = loan.monthlyPayment * loan.termMonths;
    }
    storedInterest = finalTotalPayable - loan.amount;
  }

  const interestAmount = storedInterest || 0;
  const balance = finalTotalPayable - totalPaid;
  const progress = Math.min(
    100,
    Math.max(0, (totalPaid / finalTotalPayable) * 100),
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {" "}
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-3 w-3" /> Back
          </Button>
          <Heading
            title={`Loan: ${loan.lender}`}
            description={`Details for ${loan.referenceNumber || "Unreferenced Loan"}`}
          />
        </div>

        <div className="flex gap-2">
          {canEditLoan && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpenEdit(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDeleteLoan && (
            <Button
              variant="destructive"
              size="icon"
              onClick={onDelete}
              disabled={loading}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
          {canRecordPayment && (
            <Button onClick={() => setOpenPayment(true)}>
              <Plus className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground bg-slate-50 w-fit px-2 py-1 rounded border">
        <User className="h-3 w-3" />
        <span>
          Created by:{" "}
          <span className="font-semibold text-slate-700">
            {loan.creator?.name || "System"}
          </span>
        </span>
      </div>
      <Separator className="my-4" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Original Amount
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{loan.amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Principal Loan Value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Calculated Interest
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{interestAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total cost of loan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${balance <= 0 ? "text-green-600" : "text-amber-600"}`}
            >
              R{Math.max(0, balance).toFixed(2)}
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full ${balance <= 0 ? "bg-green-500" : "bg-blue-600"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {progress.toFixed(1)}% of Total Payable
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Terms</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loan.interestRate}% Rate</div>
            <p className="text-xs text-muted-foreground mt-1">
              {loan.interestType === "PRIME_LINKED" ? (
                <span className="flex items-center text-blue-600 font-semibold">
                  <Activity className="h-3 w-3 mr-1" /> Prime Linked
                </span>
              ) : (
                "Fixed Interest Rate"
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {loan.monthlyPayment
                ? `Target: R${loan.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`
                : "No monthly target set"}
            </p>
            {loan.termMonths && (
              <p className="text-xs text-muted-foreground">
                Term: {loan.termMonths} Months
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                loan.status === "ACTIVE"
                  ? "default"
                  : loan.status === "PAID_OFF"
                    ? "secondary"
                    : "destructive"
              }
            >
              {loan.status.replace("_", " ")}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Started: {format(new Date(loan.startDate), "MMM do, yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Recent payments made to this loan account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-center w-10">
                      <Paperclip className="h-4 w-4 mx-auto" />
                    </TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-10">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loan.payments?.map((payment: any) => (
                    <TableRow
                      key={payment.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() =>
                        router.push(`/dashboard/loans/payments/${payment.id}`)
                      }
                    >
                      <TableCell>
                        {format(new Date(payment.date), "MMM do, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground italic">
                        {payment.creator?.name || "-"}
                      </TableCell>
                      <TableCell>{payment.reference || "-"}</TableCell>

                      <TableCell className="text-center">
                        {payment.documents && payment.documents.length > 0 ? (
                          <Badge variant="secondary" className="px-1 h-5">
                            {payment.documents.length}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-600">
                        R{payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell
                        onClick={() =>
                          router.push(`/dashboard/loans/payments/${payment.id}`)
                        }
                      >
                        View
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!loan.payments || loan.payments.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No payments recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Loan Documents</CardTitle>
                <CardDescription>
                  Contracts, agreements, and proof of payments.
                </CardDescription>
              </div>
              <div className="w-48">
                <DocumentUpload
                  entityId={loanId}
                  entityType="loan"
                  onSuccess={refetch}
                  label="Upload Doc"
                  showList={false}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loan.documents?.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center p-3 border rounded-lg gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center text-blue-600">
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
                        {format(new Date(doc.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
                {(!loan.documents || loan.documents.length === 0) && (
                  <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>No documents attached to this loan.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={openPayment} onOpenChange={setOpenPayment}>
        <DialogContent className="sm:max-w-[425px] lg:min-w-[800px] min-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment made towards this loan.
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form
              onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}
              className="space-y-4"
            >
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    Current Balance:
                  </span>
                  <span className="font-bold text-slate-900">
                    R
                    {balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {paymentForm.watch("amount") > 0 && (
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                    <span className="text-muted-foreground font-medium">
                      Resulting Balance:
                    </span>
                    <span
                      className={`font-bold ${balance - paymentForm.watch("amount") <= 0 ? "text-green-600" : "text-blue-600"}`}
                    >
                      R
                      {Math.max(
                        0,
                        balance - paymentForm.watch("amount"),
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={paymentForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                                R
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                className="pl-7"
                                placeholder="0.00"
                                {...field}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {loan.monthlyPayment && (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() =>
                                      paymentForm.setValue(
                                        "amount",
                                        Number(loan.monthlyPayment?.toFixed(2)),
                                      )
                                    }
                                  >
                                    Monthly (R{loan.monthlyPayment.toFixed(2)})
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() =>
                                      paymentForm.setValue(
                                        "amount",
                                        Number(
                                          (loan.monthlyPayment! / 4).toFixed(2),
                                        ),
                                      )
                                    }
                                  >
                                    Weekly (R
                                    {(loan.monthlyPayment! / 4).toFixed(2)})
                                  </Button>
                                </>
                              )}
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-7 text-xs font-semibold"
                                onClick={() =>
                                  paymentForm.setValue(
                                    "amount",
                                    Number(balance.toFixed(2)),
                                  )
                                }
                              >
                                Full Settlement (R{balance.toFixed(2)})
                              </Button>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="REGULAR">
                              Regular Installment
                            </SelectItem>
                            <SelectItem value="EXTRA">Extra Payment</SelectItem>
                            <SelectItem value="INTEREST_ONLY">
                              Interest Only
                            </SelectItem>
                            <SelectItem value="EARLY_SETTLEMENT">
                              Early Settlement
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <FormField
                    control={paymentForm.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ref #" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Payment details..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>Attachments</FormLabel>
                      {paymentForm.watch("attachments")?.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 text-[10px] animate-in fade-in zoom-in"
                        >
                          {paymentForm.watch("attachments").length} File(s)
                          Ready
                        </Badge>
                      )}
                    </div>
                    <FormField
                      control={paymentForm.control}
                      name="attachments"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <FileUpload
                              value={field.value}
                              onFilesUploaded={field.onChange}
                              label="Upload Proof of Payment"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button disabled={paymentLoading} type="submit">
                  {paymentLoading ? "Recording..." : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <LoanModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        onSuccess={refetch}
        initialData={loan}
        lenders={lenders || []}
        financialSettings={financialSettings}
      />
    </>
  );
};
