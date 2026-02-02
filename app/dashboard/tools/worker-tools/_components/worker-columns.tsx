"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

export type WorkerColumn = {
  id: string;
  name: string;
  toolsCount: number;
  totalValue: number;
  damageCost: number;
};

export const columns: ColumnDef<WorkerColumn>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const worker = row.original as any;
      const type = worker.type ? worker.type.toLowerCase() : "employee";
      return (
        <Link
          href={`/dashboard/tools/worker-tools/allocation/${type}/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
      );
    },
  },
  {
    accessorKey: "toolsCount",
    header: "Tools Count",
  },
  {
    accessorKey: "totalValue",
    header: "Total Value",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalValue"));
      const formatted = new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "damageCost",
    header: "Damage Cost",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("damageCost"));
      const formatted = new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
];
