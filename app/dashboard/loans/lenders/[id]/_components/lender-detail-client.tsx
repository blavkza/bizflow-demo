"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import {
  Building2,
  Users,
  Mail,
  Phone,
  Globe,
  MapPin,
  Pencil,
  Trash,
  ChevronLeft,
  Briefcase,
  Wallet,
  Landmark,
  CreditCard,
  Plus,
  Paperclip,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { DocumentUpload } from "../../../_components/document-upload";
import { LenderModal } from "../../_components/lender-modal";
import { LoanModal } from "../../../_components/loan-modal";

export const LenderDetailClient = ({ lenderId }: { lenderId: string }) => {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [openLoanModal, setOpenLoanModal] = useState(false);

  const {
    data: lender,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["lender", lenderId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/lenders/${lenderId}`);
      return data;
    },
  });

  const onDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this lender? This cannot be undone.",
      )
    )
      return;
    try {
      await axios.delete(`/api/lenders/${lenderId}`);
      toast.success("Lender deleted");
      router.push("/dashboard/loans/lenders");
    } catch (error: any) {
      toast.error(error.response?.data || "Failed to delete lender");
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!lender)
    return <div className="p-8 text-red-500 font-bold">Lender not found</div>;

  const loans = lender.loans || [];
  const totalBorrowed = loans.reduce(
    (acc: number, loan: any) => acc + (loan.amount || 0),
    0,
  );

  let totalPayable = 0;
  let totalPaid = 0;

  loans.forEach((loan: any) => {
    totalPayable += loan.totalPayable || loan.amount || 0;
    totalPaid += (loan.payments || []).reduce(
      (acc: number, p: any) => acc + (p.amount || 0),
      0,
    );
  });

  const outstanding = Math.max(0, totalPayable - totalPaid);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/loans/lenders")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{lender.name}</h2>
            <p className="text-sm text-muted-foreground">
              Financial partner since{" "}
              {format(new Date(lender.createdAt), "MMMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenEdit(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
          <Button variant="destructive" size="icon" onClick={onDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Portfolio Size
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loans.length} Loans</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total active & completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Borrowed
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBorrowed)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Principal amount only
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(outstanding)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Incl. projected interest
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Capital Repaid
            </CardTitle>
            <Landmark className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total payments made
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Details */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Contact Person</p>
                <p className="text-sm text-slate-600">
                  {lender.contactPerson || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Email Address</p>
                <p className="text-sm text-slate-600">
                  {lender.email || "No email provided"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-sm text-slate-600">
                  {lender.phone || "No phone number"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Website</p>
                {lender.website ? (
                  <a
                    href={lender.website}
                    target="_blank"
                    rel="noopener"
                    className="text-sm text-blue-600 underline"
                  >
                    {lender.website.replace(/(^\w+:|^)\/\//, "")}
                  </a>
                ) : (
                  <p className="text-sm text-slate-600">None</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {lender.address || "No address on file"}
                </p>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Calculation Methods</span>
                <div className="flex flex-wrap gap-2">
                  {(
                    lender.loanCalculationMethods || [
                      lender.loanCalculationMethod,
                    ]
                  ).includes("COMPOUND_INTEREST") && (
                    <Badge variant="secondary">Compound Interest</Badge>
                  )}
                  {(
                    lender.loanCalculationMethods || [
                      lender.loanCalculationMethod,
                    ]
                  ).includes("FIXED_INTEREST") && (
                    <Badge variant="secondary">Fixed Interest (Tiered)</Badge>
                  )}
                  {(!lender.loanCalculationMethods ||
                    lender.loanCalculationMethods.length === 0) &&
                    !lender.loanCalculationMethod && (
                      <Badge variant="outline">Not Set</Badge>
                    )}
                </div>
              </div>

              {((lender.loanCalculationMethods || []).includes(
                "FIXED_INTEREST",
              ) ||
                lender.loanCalculationMethod === "FIXED_INTEREST") && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Tiered Interest Rates
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(lender.interestTiers && lender.interestTiers.length > 0
                      ? lender.interestTiers
                      : [
                          lender.interestRate3Months
                            ? {
                                termMonths: 3,
                                interestRate: lender.interestRate3Months,
                              }
                            : null,
                          lender.interestRate6Months
                            ? {
                                termMonths: 6,
                                interestRate: lender.interestRate6Months,
                              }
                            : null,
                          lender.interestRate9Months
                            ? {
                                termMonths: 9,
                                interestRate: lender.interestRate9Months,
                              }
                            : null,
                          lender.interestRate12Months
                            ? {
                                termMonths: 12,
                                interestRate: lender.interestRate12Months,
                              }
                            : null,
                        ].filter(Boolean)
                    ).map((tier: any) => (
                      <div
                        key={tier.termMonths}
                        className="flex justify-between items-center"
                      >
                        <span className="text-xs">
                          {tier.termMonths} Months
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {tier.interestRate}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {((lender.loanCalculationMethods || []).includes(
                "COMPOUND_INTEREST",
              ) ||
                lender.loanCalculationMethod === "COMPOUND_INTEREST") && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Default Term</span>
                    <Badge variant="outline">
                      {lender.termMonths || 0} Months
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Default Rate</span>
                    <Badge variant="secondary">
                      {lender.interestRate || 0}% p.a
                    </Badge>
                  </div>
                </div>
              )}

              {!lender.loanCalculationMethod && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Default Term</span>
                    <Badge variant="outline">
                      {lender.termMonths || 0} Months
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Default Rate</span>
                    <Badge variant="secondary">
                      {lender.interestRate || 0}% p.a
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Loans from this Lender</CardTitle>
              <CardDescription>
                Track every business loan active with {lender.name}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setOpenLoanModal(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Loan
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Total Payable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan: any) => (
                  <TableRow
                    key={loan.id}
                    onClick={() => router.push(`/dashboard/loans/${loan.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      {loan.loanType || "Business Loan"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(loan.startDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{formatCurrency(loan.amount)}</TableCell>
                    <TableCell>{formatCurrency(loan.totalPayable)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          loan.status === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/loans/${loan.id}`)
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {loans.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-24 text-muted-foreground"
                    >
                      No loans recorded for this lender.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>KYC, contracts & agreements</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DocumentUpload
              entityId={lenderId}
              entityType="lender"
              onSuccess={refetch}
              label="Upload Document"
              showList={false}
            />
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {lender.documents?.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center p-2 border rounded hover:bg-slate-50 transition-colors gap-2"
                >
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  <span
                    className="text-xs font-medium truncate flex-1"
                    title={doc.name}
                  >
                    {doc.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    asChild
                  >
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              ))}
              {(!lender.documents || lender.documents.length === 0) && (
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded italic text-xs">
                  No documents uploaded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <LenderModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        onSuccess={() => {
          refetch();
          setOpenEdit(false);
        }}
        initialData={lender}
      />

      {/* New Loan Modal */}
      <LoanModal
        isOpen={openLoanModal}
        onClose={() => setOpenLoanModal(false)}
        onSuccess={() => {
          refetch();
          setOpenLoanModal(false);
        }}
        lenders={[lender]}
        initialData={{
          lenderId: lender.id,
          lender: lender.name,
          interestRate: lender.interestRate || 0,
          termMonths: lender.termMonths || 12,
          calculationMethod:
            lender.loanCalculationMethod || "COMPOUND_INTEREST",
        }}
      />
    </>
  );
};
