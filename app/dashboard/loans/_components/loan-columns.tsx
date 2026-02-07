"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Eye, Trash, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { calculateLoan } from "@/lib/loan-calc";

export type LoanColumn = {
  id: string;
  lender: string;
  loanType: string | null;
  amount: number;
  interestRate: number;
  startDate: string; // ISO string
  status: "ACTIVE" | "PAID_OFF" | "DEFAULTED" | "PENDING";
  monthlyPayment: number | null;
  termMonths: number | null;
  interestAmount: number | null;
  totalPayable: number | null;
  calculationMethod:
    | "AMORTIZED"
    | "FLAT"
    | "COMPOUND_INTEREST"
    | "FIXED_INTEREST";
  interestType?: "FIXED" | "PRIME_LINKED";
  primeMargin?: number;
  payments: { amount: number }[];
};

export const columns: ColumnDef<LoanColumn>[] = [
  {
    accessorKey: "lender",
    header: "Lender",
  },
  {
    accessorKey: "loanType",
    header: "Type",
    cell: ({ row }) => row.original.loanType || "N/A",
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const loan = row.original;
      let finalTotalPayable =
        loan.calculationMethod === "COMPOUND_INTEREST"
          ? null
          : loan.totalPayable;

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
      }
      return `R${(finalTotalPayable || loan.amount).toFixed(2)}`;
    },
  },
  {
    accessorKey: "balance",
    header: "Balance & Progress",
    cell: ({ row }) => {
      const loan = row.original;
      const totalPaid = (loan.payments || []).reduce(
        (acc: number, curr: any) => acc + curr.amount,
        0,
      );

      // Prioritize stored values, fallback to theoretical calculation
      // Force recalculation for COMPOUND_INTEREST as in detail view
      let finalTotalPayable =
        loan.calculationMethod === "COMPOUND_INTEREST"
          ? null
          : loan.totalPayable;

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
      }

      const balance = finalTotalPayable - totalPaid;
      const progress = Math.min(
        100,
        Math.max(0, (totalPaid / finalTotalPayable) * 100),
      );

      return (
        <div className="w-[120px]">
          <div className="flex justify-between text-sm mb-1">
            <span
              className={
                balance <= 0 ? "text-green-600 font-bold" : "font-medium"
              }
            >
              R{Math.max(0, balance).toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${balance <= 0 ? "bg-green-500" : "bg-blue-600"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "interestRate",
    header: "Rate",
    cell: ({ row }) => `${row.original.interestRate}%`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const variant =
        status === "ACTIVE"
          ? "default"
          : status === "PAID_OFF"
            ? "outline" // Was success/green in mind but outline is safe
            : status === "DEFAULTED"
              ? "destructive"
              : "secondary";

      const colorClass =
        status === "ACTIVE"
          ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
          : status === "PAID_OFF"
            ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
            : status === "DEFAULTED"
              ? "bg-red-100 text-red-800 hover:bg-red-100"
              : "bg-gray-100 text-gray-800";

      return (
        <Badge className={colorClass} variant="outline">
          {status.replace("_", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => format(new Date(row.original.startDate), "MMM do, yyyy"),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const loan = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/loans/${loan.id}`}
                className="flex items-center cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/loans/${loan.id}?edit=true`}
                className="flex items-center cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
