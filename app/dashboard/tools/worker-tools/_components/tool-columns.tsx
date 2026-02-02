"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ToolColumn = {
  id: string;
  name: string;
  serialNumber: string;
  status: string;
  condition: string;
  assignedTo: string;
  purchasePrice: number;
  quantity: number;
  images: string[];
  description?: string;
  employeeId?: string | null;
  freelancerId?: string | null;
};

import { CellAction } from "./cell-action";

import Link from "next/link";
import Image from "next/image";

export const columns: ColumnDef<ToolColumn>[] = [
  {
    accessorKey: "images",
    header: "Image",
    cell: ({ row }) => {
      const images = row.original.images;
      const image = images && images.length > 0 ? images[0] : null;

      return (
        <div className="relative h-12 w-12 rounded-md overflow-hidden border border-gray-200">
          {image ? (
            <Image
              src={image}
              alt={row.original.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-secondary text-secondary-foreground text-xs">
              No Img
            </div>
          )}
        </div>
      );
    },
  },
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
    cell: ({ row }) => (
      <Link
        href={`/dashboard/tools/worker-tools/${row.original.id}`}
        className="hover:underline font-medium"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Qty",
  },
  {
    accessorKey: "serialNumber",
    header: "Serial/Code",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant="outline">{status}</Badge>;
    },
  },
  {
    accessorKey: "condition",
    header: "Condition",
    cell: ({ row }) => {
      const condition = row.getValue("condition") as string;
      return <Badge variant="secondary">{condition}</Badge>;
    },
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
