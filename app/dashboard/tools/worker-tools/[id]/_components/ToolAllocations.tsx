"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

interface ToolAllocationsProps {
  tool: any;
}

export function ToolAllocations({ tool }: ToolAllocationsProps) {
  const fleet = tool.fleet || [];
  const assignedTools = fleet.filter((t: any) => t.status === "ASSIGNED");

  if (assignedTools.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No current allocations found for this tool type.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assigned To</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Date Assigned</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignedTools.map((t: any) => {
            const assignedName = t.employee
              ? t.employee.name ||
                `${t.employee.firstName} ${t.employee.lastName}`
              : t.freelancer
                ? `${t.freelancer.firstName} ${t.freelancer.lastName}`
                : "Unknown";

            const workerId = t.employeeId || t.freelancerId;
            const workerTypePath = t.employeeId ? "employees" : "freelancers";

            return (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/human-resources/${workerTypePath}/${workerId}`}
                    className="hover:underline text-blue-600"
                  >
                    {assignedName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {t.employeeId ? "Employee" : "Freelancer"}
                  </Badge>
                </TableCell>
                <TableCell>{t.quantity}</TableCell>
                <TableCell>
                  {t.assignedDate
                    ? format(new Date(t.assignedDate), "PPP")
                    : "N/A"}
                </TableCell>
                <TableCell>{t.condition}</TableCell>
                <TableCell>
                  {/* Placeholder for Return/Report functionality */}
                  <Link
                    href={`/dashboard/tools/worker-tools/${t.id}`}
                    className="text-sm underline"
                  >
                    View Details
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
