"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Check, X, Clock } from "lucide-react";
import { CellAction } from "./cell-action";

export type ToolRequest = {
  id: string;
  toolName: string;
  toolImage?: string | null;
  quantity: number;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "WAITLIST";
  requestedDate: string;
  notes?: string;
  reason?: string;
  employee?: {
    firstName: string;
    lastName: string;
    department?: { name: string };
  };
  freelancer?: {
    firstName: string;
    lastName: string;
    department?: { name: string };
  };
};

export const columns: ColumnDef<ToolRequest>[] = [
  {
    accessorKey: "toolName",
    header: "Tool Name",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("toolName")}</div>
    ),
  },
  {
    accessorKey: "type",
    header: "Request Type",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("type")}</Badge>,
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("quantity")}</div>
    ),
  },
  {
    accessorKey: "requestedBy",
    header: "Requested By",
    cell: ({ row }) => {
      const emp = row.original.employee;
      const free = row.original.freelancer;
      const user = emp || free;
      const type = emp ? "Employee" : "Freelancer";
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {user ? `${user.firstName} ${user.lastName}` : "Unknown"}
          </span>
          <span className="text-xs text-muted-foreground">
            {type} • {user?.department?.name || "No Dept"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return <Badge variant="secondary">{priority}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{status}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "requestedDate",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-sm">
        {format(new Date(row.getValue("requestedDate")), "PPP")}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
