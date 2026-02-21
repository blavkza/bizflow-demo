"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Clock, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface OvertimeRequestsListProps {
  selectedDate?: string;
  searchTerm?: string;
  selectedDepartment?: string;
}

export function OvertimeRequestsList({
  selectedDate,
  searchTerm = "",
  selectedDepartment = "All Departments",
}: OvertimeRequestsListProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["overtime-requests", selectedDate],
    queryFn: async () => {
      const url = selectedDate
        ? `/api/attendance/overtime?all=true&date=${selectedDate}`
        : "/api/attendance/overtime?all=true";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch overtime requests");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: {
      requestId: string;
      status: string;
    }) => {
      const res = await fetch("/api/attendance/overtime", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-requests"] });
      toast.success("Overtime request updated successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    },
  });

  const requests = data?.requests || [];

  const filteredRequests = requests.filter((request: any) => {
    const person = request.employee || request.freeLancer || request.trainee;
    if (!person) return false;

    // Search filter
    const name = `${person.firstName} ${person.lastName}`.toLowerCase();
    const id = (
      person.employeeNumber ||
      person.freeLancerNumber ||
      person.traineeNumber ||
      ""
    ).toLowerCase();
    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) ||
      id.includes(searchTerm.toLowerCase());

    // Department filter
    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      person.department?.name === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground animate-pulse">
          Loading overtime requests...
        </div>
      </div>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <Clock className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-medium text-slate-900">
          No overtime requests
        </h3>
        <p className="text-slate-500">
          {searchTerm
            ? "No requests found matching your search."
            : "There are no pending or past overtime requests to show."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredRequests.map((request: any) => {
        const person =
          request.employee || request.freeLancer || request.trainee;
        const name = `${person.firstName} ${person.lastName}`;
        const statusColor =
          {
            PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
            APPROVED: "bg-green-100 text-green-800 border-green-200",
            REJECTED: "bg-red-100 text-red-800 border-red-200",
            CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
          }[request.status as string] || "bg-gray-100 text-gray-800";

        return (
          <Card
            key={request.id}
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback>
                      {person.firstName[0]}
                      {person.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{name}</h4>
                      <Badge variant="outline" className={statusColor}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {person.position} • {person.department?.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(request.date), "dd MMM yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Requested at{" "}
                        {format(new Date(request.requestedAt), "HH:mm")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {request.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 gap-1"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            requestId: request.id,
                            status: "REJECTED",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white h-8 gap-1"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            requestId: request.id,
                            status: "APPROVED",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                    </>
                  )}
                  {request.status !== "PENDING" && (
                    <div className="text-right text-[11px] text-muted-foreground italic">
                      {request.status === "APPROVED" ? "Approved" : "Rejected"}{" "}
                      on{" "}
                      {format(
                        new Date(request.approvedAt || request.requestedAt),
                        "dd MMM HH:mm",
                      )}
                    </div>
                  )}
                </div>
              </div>
              {request.reason && (
                <div className="bg-slate-50 px-4 py-2 text-xs border-t border-slate-100 flex gap-2 italic text-slate-600">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>Reason: {request.reason}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

