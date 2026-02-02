"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Plus,
  Wallet,
  CreditCard,
  Banknote,
  CalendarClock,
  Percent,
  Calculator,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserRole, UserPermission } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoanTotals } from "@/lib/loan-calc";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import LoansFilterTable from "./Loans-Filter-Table";
import { LoanColumn } from "./loan-columns";

import { LoanModal } from "./loan-modal";
import LoansLoading from "../loading";

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

type LoanFormValues = z.infer<typeof loanFormSchema>;

export const LoanClient = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const {
    data: loans,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const { data } = await axios.get("/api/loans");
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

  const hasFullAccess = userData?.role === UserRole.CHIEF_EXECUTIVE_OFFICER;
  const canCreateLoans =
    userData?.permissions?.includes(UserPermission.LOANS_CREATE) ||
    hasFullAccess;
  const canViewLenders =
    userData?.permissions?.includes(UserPermission.LENDERS_VIEW) ||
    hasFullAccess;
  const canManageLenders =
    userData?.permissions?.includes(UserPermission.LENDERS_CREATE) ||
    hasFullAccess;
  const canEditLoans =
    userData?.permissions?.includes(UserPermission.LOANS_EDIT) || hasFullAccess;

  // Handled by LoanModal components now

  if (isLoading || userLoading) {
    return <LoansLoading />;
  }

  const formattedLoans: LoanColumn[] = (loans || []).map((item: any) => ({
    id: item.id,
    lender: item.lender,
    loanType: item.loanType,
    amount: item.amount,
    interestRate: item.interestRate,
    startDate: item.startDate,
    status: item.status,
    monthlyPayment: item.monthlyPayment,
    termMonths: item.termMonths,
    interestAmount: item.interestAmount,
    totalPayable: item.totalPayable,
    calculationMethod: item.calculationMethod,
    interestType: item.interestType,
    primeMargin: item.primeMargin,
    payments: item.payments || [],
  }));

  const totals = getLoanTotals(loans || []);
  const outstanding = Math.max(0, totals.payable - totals.paid);

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Business Loans (${(loans || []).length})`}
          description="Manage and track your business loans."
        />
        <div className="flex gap-2">
          {canViewLenders && (
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/loans/lenders")}
            >
              <Building2 className="mr-2 h-4 w-4" /> Manage Lenders
            </Button>
          )}
          {canCreateLoans && (
            <Button
              onClick={() => {
                setEditingLoan(null);
                setOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Loan
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Borrowed
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R
              {totals.borrowed.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {(loans || []).length} loans
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Interest
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R
              {totals.interest.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Projected cost of credit
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
            <div className="text-2xl font-bold">
              R
              {outstanding.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Principal + Interest remaining
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Commitment
            </CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R
              {totals.monthly.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              In monthly installments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(loans || []).filter((l: any) => l.status === "ACTIVE").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active accounts
            </p>
          </CardContent>
        </Card>
      </div>

      <LoansFilterTable
        loans={formattedLoans}
        onEdit={
          canEditLoans
            ? (loan) => {
                setEditingLoan(loan);
                setOpen(true);
              }
            : undefined
        }
      />

      <LoanModal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setEditingLoan(null);
        }}
        initialData={editingLoan}
        onSuccess={(data) => {
          refetch();
          if (data && data.id) {
            router.push(`/dashboard/loans/${data.id}`);
          }
        }}
        lenders={lenders || []}
        financialSettings={financialSettings}
      />
    </>
  );
};
