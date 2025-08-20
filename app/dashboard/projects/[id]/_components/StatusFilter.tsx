"use client";

import { Button } from "@/components/ui/button";

interface StatusFilterProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export function StatusFilter({
  statusFilter,
  setStatusFilter,
}: StatusFilterProps) {
  return (
    <div className="flex gap-2 mt-4">
      {["all", "todo", "in-progress", "completed"].map((status) => (
        <Button
          key={status}
          variant={statusFilter === status ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(status)}
          className="capitalize"
        >
          {status === "in-progress" ? "In Progress" : status}
        </Button>
      ))}
    </div>
  );
}
