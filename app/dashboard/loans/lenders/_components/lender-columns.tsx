"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type LenderColumn = {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  interestRate: number | null;
  termMonths: number | null;
  createdAt: string;
};

export const columns: ColumnDef<LenderColumn>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Company Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
        const router = useRouter();
        return (
            <div 
                className="font-medium cursor-pointer hover:underline text-blue-600"
                onClick={() => router.push(`/dashboard/loans/lenders/${row.original.id}`)}
            >
                {row.original.name}
            </div>
        );
    }
  },
  {
    accessorKey: "interestRate",
    header: "Interest Rate",
    cell: ({ row }) => row.original.interestRate ? `${row.original.interestRate}%` : "-",
  },
  {
    accessorKey: "termMonths",
    header: "Terms",
    cell: ({ row }) => row.original.termMonths ? `${row.original.termMonths} Mo` : "-",
  },
  {
    accessorKey: "contactPerson",
    header: "Contact Person",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "createdAt",
    header: "Registered",
    cell: ({ row }) => format(new Date(row.original.createdAt), "MMM do, yyyy"),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lender = row.original;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();

      const onDelete = async () => {
        try {
          if (!confirm("Are you sure you want to delete this lender?")) return;
          await axios.delete(`/api/lenders/${lender.id}`);
          toast.success("Lender deleted");
          router.refresh();
        } catch (error: any) {
          toast.error(error.response?.data || "Failed to delete lender");
        }
      };

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
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/loans/lenders/${lender.id}`)}
            >
              <Users className="mr-2 h-4 w-4" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
